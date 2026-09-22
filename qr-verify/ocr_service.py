import io
import re
import json
import base64
import time
import os
import torch
import numpy as np
from flask import Flask, request, jsonify
from PIL import Image
import easyocr

# Set PyTorch thread allocation to maximize CPU throughput
try:
    cpu_count = os.cpu_count() or 4
    torch.set_num_threads(max(4, cpu_count))
except Exception:
    pass

app = Flask(__name__)

print("[EasyOCR] Initializing EasyOCR Reader (th, en)...")
# Initialize reader
reader = easyocr.Reader(['th', 'en'], gpu=False)
print("[EasyOCR] Model loaded successfully!")

# Load bank mapping
try:
    with open("bank_code.json", "r", encoding="utf-8") as f:
        BANK_CODES = json.load(f)
except Exception as e:
    BANK_CODES = {}

def parse_slip_fields(text_list, full_text):
    """
    Extract key slip fields:
    - ธนาคาร (sender_bank)
    - ผู้โอน (sender_name)
    - ผู้รับ (receiver_name)
    - ยอดเงิน (amount)
    - วันเวลา (date_time)
    - เลขอ้างอิง (transaction_ref)
    """
    res = {
        "amount": None,
        "sender_name": None,
        "receiver_name": None,
        "sender_bank": {
            "name_th": None,
            "name_en": None,
        },
        "transaction_ref": None,
        "date_time": None,
        "raw_lines": text_list
    }

    # 1. Detect Bank according to bank_code.json
    # Matches name_th, name_en, abbr, and variations like "ธ. <name>" or short bank name without "ธนาคาร"
    matched_bank = None
    for code, binfo in BANK_CODES.items():
        name_th = binfo.get("name_th", "")
        name_en = binfo.get("name_en", "")
        abbr = binfo.get("abbr", "")

        # Generate search patterns
        patterns = []
        if name_th:
            patterns.append(re.escape(name_th))
            # If name_th starts with "ธนาคาร", create "ธ. <name>" and pure name patterns
            if name_th.startswith("ธนาคาร"):
                short_name = name_th.replace("ธนาคาร", "").strip()
                if short_name:
                    patterns.append(r'ธ\.?\s*' + re.escape(short_name))
                    patterns.append(re.escape(short_name))
        if name_en:
            patterns.append(re.escape(name_en))
        if abbr:
            patterns.append(r'\b' + re.escape(abbr) + r'\b')

        bank_regex = r'(?:' + '|'.join(patterns) + r')'
        if re.search(bank_regex, full_text, flags=re.IGNORECASE):
            matched_bank = {
                "name_th": name_th,
                "name_en": name_en,
                "abbr": abbr,
                "code": code
            }
            break

    if matched_bank:
        res["sender_bank"] = matched_bank

    # 2. Detect Transaction Ref / Slip No. (Preserve original casing: e.g. KSA00000000847867569944ab)
    # Search line by line and lookahead next lines for proximity matching
    ref_cand = None
    REF_LABEL_REGEX = r'^(?:รหัสอ้างอิง|เลขที่รายการ|เลขที่สลิป|Transaction\s*ID|Ref\s*No\.?|Ref\.?|no\.?)$'

    for i, line in enumerate(text_list):
        cleaned_l = line.strip()
        # Case A: Label + Value on same line (e.g., "รหัสอ้างอิง: 202211022XMj8r6IIId6H8WNs")
        m = re.search(r'(?:รหัสอ้างอิง|เลขที่รายการ|เลขที่สลิป|Transaction\s*ID|Ref\s*No\.?|Ref\.?)[\s:]*([A-Za-z0-9]{8,35})', cleaned_l, re.IGNORECASE)
        if m:
            val = m.group(1).strip()
            if not re.match(r'^(?:no|no\.|no:)$', val, re.IGNORECASE):
                ref_cand = val
                break

        # Case B: Proximity search - Label is on current line, value is on next 1-2 lines (e.g. "Ref No." \n "KSA0000...")
        if re.search(REF_LABEL_REGEX, cleaned_l, re.IGNORECASE) or cleaned_l.lower() in ["ref no.", "ref no", "ref.", "ref", "รหัสอ้างอิง", "เลขที่รายการ", "เลขที่สลิป", "no."]:
            for offset in range(1, 3):
                if i + offset < len(text_list):
                    next_line = text_list[i + offset].strip()
                    # Look for alphanumeric string in next line
                    m_next = re.search(r'\b([A-Za-z0-9]{8,35})\b', next_line)
                    if m_next:
                        cand_val = m_next.group(1).strip()
                        if not re.match(r'^(?:no|no\.|no:)$', cand_val, re.IGNORECASE) and not cand_val.startswith("08") and not cand_val.startswith("09"):
                            ref_cand = cand_val
                            break
            if ref_cand:
                break

        # Case C: Direct pattern match in current line (e.g., MiniQR standard 025... or Krungsri KSA...)
        m2 = re.search(r'\b(0[0-9]{2}[A-Za-z0-9]{12,25})\b', cleaned_l)
        if m2:
            ref_cand = m2.group(1).strip()
            break
        m3 = re.search(r'\b(KSA[A-Za-z0-9]{15,30})\b', cleaned_l, re.IGNORECASE)
        if m3:
            ref_cand = m3.group(1).strip()
            break

    if not ref_cand:
        # Fallback: Match standalone slip number string (10-30 digits/alphanumeric)
        for line in text_list:
            digits_matches = re.findall(r'\b([A-Za-z0-9]{12,30})\b', line)
            for cand in digits_matches:
                if not cand.startswith("08") and not cand.startswith("09") and not cand.startswith("06") and cand.lower() != "no":
                    ref_cand = cand
                    break
            if ref_cand:
                break

    if ref_cand:
        # Strip leading "no", "no.", "no:" prefixes if attached to the reference string
        ref_cand = re.sub(r'^(?:no|no\.|no:)[\s:]*', '', ref_cand, flags=re.IGNORECASE).strip()

    res["transaction_ref"] = ref_cand

    # 3. Detect Amount (Handle OCR letter O / o misread as digit 0, e.g. "o.0o" -> "0.00")
    # First, fix common Thai/English OCR digit misreads in numbers (e.g. "1.oo" -> "1.00", "o.0o" -> "0.00")
    sanitized_full_text = re.sub(r'(?<=\d)[oO](?=\d)', '0', full_text)
    sanitized_full_text = re.sub(r'(?<=\d)\.[oO]{1,2}\b', lambda m: m.group(0).replace('o', '0').replace('O', '0'), sanitized_full_text)

    amt_match = re.search(r'(?:จำนวนเงิน|จำนวน|ยอดโอน|โอนสำเร็จ|amount)[\s:]*([0-9]{1,3}(?:,[0-9]{3})*\.[0-9]{2})', sanitized_full_text, re.IGNORECASE)
    if not amt_match:
        floats = re.findall(r'\b([0-9]{1,3}(?:,[0-9]{3})*\.[0-9]{2})\b', sanitized_full_text)
        if floats:
            res["amount"] = float(floats[0].replace(",", ""))
    else:
        res["amount"] = float(amt_match.group(1).replace(",", ""))

    # 4. Detect Date Time
    # Case A: Combined Date & Time on same or consecutive lines (e.g. "21 ก.ย. 2569 \n 11:49 น.")
    date_part = None
    time_part = None

    d_match = re.search(r'(\d{1,2}\s+(?:ม\.ค\.|ก\.พ\.|มี\.ค\.|เม\.ย\.|พ\.ค\.|มิ\.ย\.|ก\.ค\.|ส\.ค\.|ก\.ย\.|ต\.ค\.|พ\.ย\.|ธ\.ค\.|มกราคม|กุมภาพันธ์|มีนาคม|เมษายน|พฤษภาคม|มิถุนายน|กรกฎาคม|สิงหาคม|กันยายน|ตุลาคม|พฤศจิกายน|ธันวาคม|[A-Za-z]{3,9})\s+\d{2,4}|\d{1,2}[/\.-]\d{1,2}[/\.-]\d{2,4})', full_text)
    if d_match:
        date_part = d_match.group(1).strip()

    t_match = re.search(r'(\d{1,2}:\d{2}(?::\d{2})?(?:\s*น\.)?)', full_text)
    if t_match:
        time_part = t_match.group(1).strip()
        if not time_part.endswith("น.") and not time_part.endswith("น"):
            time_part = f"{time_part} น."
        elif time_part.endswith("น"):
            time_part = f"{time_part}."

    if date_part and time_part:
        res["date_time"] = f"{date_part} {time_part}"
    elif date_part:
        res["date_time"] = date_part
    elif time_part:
        res["date_time"] = time_part

    # Prefix regex pattern (optional whitespace after prefix)
    PREFIX_REGEX = r'(?:นาย|นางสาว|นาง|น\.ส\.|นส\.|ด\.ช\.|ด\.ญ\.|Mr\.?|Mrs\.?|Miss|Ms\.?)'

    # Non-name noise words to ignore
    NOISE_WORDS = r'(?:สแกน|ตรวจสอบ|พร้อมเพย์|PromptPay|บัญชี|ออมทรัพย์|กระแสรายวัน|ธนาคาร|โอนเงิน|ค่าธรรมเนียม|บาท|THB|สำเร็จ|วันที|วันที่|เวลา|รหัส|เลขที|เลขที่|ผู้รับเงินสามารถ|เพื่อ|สแกนคิวอาร์|สแกนคิวอาร์โค้ด|Fund|Transfer|Successful|scan|verify|account|transfer|fee|\bno\b)'

    # Helper to strip Thai/English prefixes and noise
    def clean_name(name_str):
        if not name_str:
            return None
        text = name_str.strip()
        # Remove keyword prefixes if attached (e.g. "จาก นาย ...", "ไปยัง นาย ...")
        text = re.sub(r'^(?:จาก|ผู้โอน|from|sender|ไปยัง|ถึง|ผู้รับ|to|receiver|โอนเข้าบัญชี)[\s:]*', '', text, flags=re.IGNORECASE)
        # Remove title prefix (นาย, นาง, นางสาว, etc.)
        text = re.sub(r'^(?:' + PREFIX_REGEX + r')\s*', '', text, flags=re.IGNORECASE)
        # Remove non-name artifacts like bank account masking (x-xxxx, xxx-xxxxxx-x), numbers
        text = re.sub(r'\b[xX*]+[-\d]+\b', '', text).strip()
        text = re.sub(r'\b\d{3,}[-\d]*\b', '', text).strip()
        # Clean rogue noise symbols (quotes, degree, dashes, etc.)
        text = re.sub(r'[\'"`~^°|•\-_/\\:]+', '', text)
        # Convert nikhahit (ํ U+0E4D) which OCR often misreads as thanthakhat (์ U+0E4C)
        text = text.replace('\u0E4D', '\u0E4C')
        # Fix duplicate or misplaced thanthakhat / karan (e.g. ์์ -> ์)
        text = re.sub(r'\u0E4C+', '\u0E4C', text)
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text).strip()

        # If what's left is too short, equals 'no', or contains footer noise text, reject
        if len(text) < 2 or text.lower() == 'no' or re.search(NOISE_WORDS, text, flags=re.IGNORECASE):
            return None
        return text or None

    def is_valid_name_candidate(line_str):
        if not line_str:
            return False
        cleaned = line_str.strip()
        if cleaned.lower() == 'no':
            return False
        # Skip if purely numbers or masking
        if re.match(r'^[xX*\d\s\-\.:,]+$', cleaned):
            return False
        # Skip if pure noise line (e.g. "สแกนเพือ", "Fund Transfer Successful", "1.00 บาท")
        if re.search(r'(?:สแกน|ตรวจสอบ|โอนเงิน|ค่าธรรมเนียม|วันที่|เวลา|เลขที่|ผู้รับเงินสามารถ|คิวอาร์โค้ด|บาท|THB|fee|scan|Fund|Transfer|Successful|\bno\b)', cleaned, flags=re.IGNORECASE):
            return False
        return True

    # 5. Detect Sender & Receiver
    # Priority:
    # "จาก / From" -> sender
    # "ไปยัง / ถึง / To / ผู้รับ" -> receiver
    for i, line in enumerate(text_list):
        cleaned_line = line.strip()

        # Sender detection
        if re.search(r'^(จาก|จาก:|ผู้โอน|from|sender)', cleaned_line, re.IGNORECASE):
            # Check if name is on same line
            inline = re.sub(r'^(จาก|จาก:|ผู้โอน|from|sender)[\s:]*', '', cleaned_line, flags=re.IGNORECASE).strip()
            if inline and is_valid_name_candidate(inline):
                res["sender_name"] = clean_name(inline)
            else:
                # Look ahead up to 3 lines for a valid name candidate
                for offset in range(1, 4):
                    if i + offset < len(text_list):
                        cand = text_list[i + offset].strip()
                        if is_valid_name_candidate(cand):
                            res["sender_name"] = clean_name(cand)
                            break

        # Receiver detection (Keyword "ไปยัง", "ถึง", "ผู้รับ")
        elif re.search(r'^(ไปยัง|ถึง|ผู้รับ|to|receiver|โอนเข้าบัญชี)', cleaned_line, re.IGNORECASE):
            # Check if name is on same line
            inline = re.sub(r'^(ไปยัง|ถึง|ผู้รับ|to|receiver|โอนเข้าบัญชี)[\s:]*', '', cleaned_line, flags=re.IGNORECASE).strip()
            c_inline = clean_name(inline) if inline else None
            if c_inline and is_valid_name_candidate(c_inline):
                res["receiver_name"] = c_inline
            else:
                # Strictly look at the immediate next 1-2 lines only for receiver name
                for offset in range(1, 3):
                    if i + offset < len(text_list):
                        cand = text_list[i + offset].strip()
                        # Stop if encountering next section headers (e.g. จำนวนเงิน, บันทึกช่วยจำ, จาก)
                        if re.search(r'^(?:จำนวนเงิน|จำนวน|ยอดโอน|บันทึกช่วยจำ|จาก|โอนสำเร็จ)', cand, re.IGNORECASE):
                            break
                        c_cand = clean_name(cand)
                        if c_cand and is_valid_name_candidate(c_cand):
                            res["receiver_name"] = c_cand
                            break

    # Fallback if sender_name or receiver_name not found via line index
    if not res["receiver_name"] and "ไปยัง" in full_text:
        after_payang = full_text.split("ไปยัง", 1)[1]
        for sub_line in after_payang.split("\n")[:3]:  # Check only first 3 lines right after "ไปยัง"
            sub_cleaned = sub_line.strip()
            if re.search(r'^(?:จำนวนเงิน|จำนวน|ยอดโอน|บันทึกช่วยจำ|จาก|โอนสำเร็จ)', sub_cleaned, re.IGNORECASE):
                break
            if sub_cleaned and is_valid_name_candidate(sub_cleaned):
                c_sub = clean_name(sub_cleaned)
                if c_sub:
                    res["receiver_name"] = c_sub
                    break

    if not res["sender_name"] and "จาก" in full_text:
        after_jak = full_text.split("จาก", 1)[1]
        for sub_line in after_jak.split("\n")[:3]:
            sub_cleaned = sub_line.strip()
            if re.search(r'^(?:ไปยัง|จำนวนเงิน|จำนวน|ยอดโอน|บันทึกช่วยจำ|โอนสำเร็จ)', sub_cleaned, re.IGNORECASE):
                break
            if sub_cleaned and is_valid_name_candidate(sub_cleaned):
                c_sub = clean_name(sub_cleaned)
                if c_sub:
                    res["sender_name"] = c_sub
                    break

    # Final sanitization
    if res["sender_name"]:
        res["sender_name"] = clean_name(res["sender_name"])
    if res["receiver_name"]:
        res["receiver_name"] = clean_name(res["receiver_name"])

    return res

@app.route("/ocr", methods=["POST"])
def do_ocr():
    t0 = time.time()
    try:
        data = request.json or {}
        image_data = data.get("image")
        if not image_data:
            return jsonify({"success": False, "error": "No image provided"}), 400

        # Decode base64
        if "base64," in image_data:
            image_data = image_data.split("base64,")[1]
        
        img_bytes = base64.b64decode(image_data)
        img = Image.open(io.BytesIO(img_bytes)).convert("RGB")

        # ⚡ OPTIMIZATION 1: Downscale high-resolution slips to max 900px
        # Slip text is already large & crisp; resizing from 2000px -> 900px speeds up OCR by 4x-6x
        max_dim = 900
        w, h = img.size
        if max(w, h) > max_dim:
            if w > h:
                new_w = max_dim
                new_h = int(h * (max_dim / w))
            else:
                new_h = max_dim
                new_w = int(w * (max_dim / h))
            img = img.resize((new_w, new_h), Image.Resampling.BILINEAR)

        # Convert to numpy array directly (avoids JPEG encode/decode bottleneck)
        np_img = np.array(img)

        # ⚡ OPTIMIZATION 2: Tune EasyOCR parameters for speed
        # - batch_size=8: parallelizes recognition batches
        # - canvas_size=900: prevents CRAFT text detector from upsampling
        # - mag_ratio=1.0: avoids artificial magnification
        # - paragraph=False, detail=0
        ocr_results = reader.readtext(
            np_img,
            detail=0,
            batch_size=8,
            canvas_size=900,
            mag_ratio=1.0,
            low_text=0.3,
            text_threshold=0.5
        )
        ocr_results = [line.replace('\u0E4D', '\u0E4C') for line in ocr_results]
        full_text = " \n ".join(ocr_results)
        
        parsed = parse_slip_fields(ocr_results, full_text)
        elapsed = round((time.time() - t0) * 1000, 2)

        return jsonify({
            "success": True,
            "engine": "EasyOCR (Python)",
            "elapsed_ms": elapsed,
            "full_text": full_text,
            "data": parsed
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == "__main__":
    print("[EasyOCR Microservice] Running on port 8587...")
    app.run(host="0.0.0.0", port=8587, debug=False)

