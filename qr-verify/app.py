import io
import re
import json
import base64
import time
import os
import cv2
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import easyocr

from dotenv import load_dotenv

# Load root .env file
root_env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
if os.path.exists(root_env_path):
    load_dotenv(root_env_path)
else:
    load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)

PORT = int(os.environ.get("QR_VERIFY_PORT") or os.environ.get("PORT") or "8586")

print("[EasyOCR] Initializing EasyOCR Reader (th, en)...")
reader = easyocr.Reader(['th', 'en'], gpu=False)
print("[EasyOCR] Model loaded successfully!")

# Load bank mapping
BANK_CODES = {}
try:
    bank_code_path = os.path.join(os.path.dirname(__file__), "bank_code.json")
    with open(bank_code_path, "r", encoding="utf-8") as f:
        BANK_CODES = json.load(f)
except Exception as e:
    print(f"[Warning] Could not load bank_code.json: {e}")

# ==============================================================================
# EMVCo / Thai PromptPay QR Parser
# ==============================================================================

def compute_crc16(s: str) -> str:
    crc = 0xFFFF
    for char in s:
        crc ^= ord(char) << 8
        for _ in range(8):
            if (crc & 0x8000) != 0:
                crc = ((crc << 1) ^ 0x1021) & 0xFFFF
            else:
                crc = (crc << 1) & 0xFFFF
    return f"{crc:04X}"

def parse_emvco(qr_raw: str) -> dict:
    tags = {}
    i = 0
    while i < len(qr_raw):
        if i + 4 > len(qr_raw):
            break
        tag = qr_raw[i:i+2]
        try:
            length = int(qr_raw[i+2:i+4])
        except ValueError:
            break
        val = qr_raw[i+4:i+4+length]
        tags[tag] = val
        i += 4 + length
    return tags

def parse_nested_tlv(sub_str: str) -> dict:
    if not sub_str or not isinstance(sub_str, str):
        return {}
    res = {}
    i = 0
    while i < len(sub_str):
        if i + 4 > len(sub_str):
            break
        tag = sub_str[i:i+2]
        try:
            length = int(sub_str[i+2:i+4])
        except ValueError:
            break
        val = sub_str[i+4:i+4+length]
        res[tag] = val
        i += 4 + length
    return res

def decode_qr_payload(qr_raw: str) -> dict:
    tags = parse_emvco(qr_raw)
    parsed = {
        "raw_qr": qr_raw,
        "is_emvco": False,
        "crc_valid": None,
        "amount": None,
        "merchant_name": None,
        "transaction_ref": None,
        "sender_bank_code": None,
        "sender_bank": None,
    }

    # Validate CRC (Tag 63 or Tag 91)
    if "63" in qr_raw or "91" in qr_raw:
        parsed["is_emvco"] = True
        # Check Tag 63 (4 chars)
        idx63 = qr_raw.rfind("6304")
        if idx63 != -1:
            data_str = qr_raw[:idx63+4]
            given_crc = qr_raw[idx63+4:idx63+8]
            calc_crc = compute_crc16(data_str)
            parsed["crc_valid"] = (given_crc.upper() == calc_crc.upper())
        else:
            idx91 = qr_raw.rfind("9104")
            if idx91 != -1:
                data_str = qr_raw[:idx91+4]
                given_crc = qr_raw[idx91+4:idx91+8]
                calc_crc = compute_crc16(data_str)
                parsed["crc_valid"] = (given_crc.upper() == calc_crc.upper())

    # Tag 54: Amount
    if "54" in tags:
        try:
            parsed["amount"] = float(tags["54"])
        except ValueError:
            pass

    # Tag 59: Merchant Name
    if "59" in tags:
        parsed["merchant_name"] = tags["59"]

    # Tag 00, 29, 30, 31, 05 (Transaction Ref / Sending Bank)
    # Check Tag 00 inside 29 or 30 or 31
    for t in ["29", "30", "31", "00"]:
        if t in tags:
            nested = parse_nested_tlv(tags[t])
            if "01" in nested and not parsed["transaction_ref"]:
                parsed["transaction_ref"] = nested["01"]
            if "05" in nested and not parsed["transaction_ref"]:
                parsed["transaction_ref"] = nested["05"]
            if "02" in nested and len(nested["02"]) == 3 and not parsed["sender_bank_code"]:
                parsed["sender_bank_code"] = nested["02"]

    if parsed["sender_bank_code"] and parsed["sender_bank_code"] in BANK_CODES:
        parsed["sender_bank"] = BANK_CODES[parsed["sender_bank_code"]]

    return parsed

# ==============================================================================
# Slip Text & OCR Parsing Logic
# ==============================================================================

def clean_name(name_str):
    if not name_str:
        return None
    cleaned = re.sub(r'[\d.,;:_|*~`!@#$%^&()=+\-\\/\[\]{}]', '', name_str)
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    return cleaned if len(cleaned) >= 2 else None

def parse_slip_fields(text_list, full_text):
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

    # 1. Detect Bank
    matched_bank = None
    for code, binfo in BANK_CODES.items():
        name_th = binfo.get("name_th", "")
        name_en = binfo.get("name_en", "")
        abbr = binfo.get("abbr", "")

        patterns = []
        if name_th:
            patterns.append(re.escape(name_th))
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

    # 2. Detect Transaction Ref
    for i, line in enumerate(text_list):
        cleaned_l = line.strip()
        ref_match = re.search(r'\b([A-Za-z0-9]{15,35})\b', cleaned_l)
        if ref_match:
            candidate = ref_match.group(1)
            if any(c.isdigit() for c in candidate) and any(c.isalpha() for c in candidate):
                res["transaction_ref"] = candidate
                break

    # 3. Detect Amount
    amount_matches = re.findall(r'(?:จำนวนเงิน|จำนวน|ยอดเงิน|Amount)?\s*:?\s*([\d,]+\.\d{2})\s*(?:บาท|THB)?', full_text, flags=re.IGNORECASE)
    if amount_matches:
        try:
            res["amount"] = float(amount_matches[0].replace(',', ''))
        except ValueError:
            pass

    # 4. Detect Names
    for line in text_list:
        l = line.strip()
        if not res["sender_name"] and ("นาย" in l or "นาง" in l or "Ms." in l or "Mr." in l):
            c_name = clean_name(l)
            if c_name:
                res["sender_name"] = c_name
        elif not res["receiver_name"] and ("บริษัท" in l or "ร้าน" in l or "Store" in l or "Shop" in l):
            c_name = clean_name(l)
            if c_name:
                res["receiver_name"] = c_name

    return res

# ==============================================================================
# API Endpoints
# ==============================================================================

@app.route("/health", methods=["GET"])
@app.route("/api/v1/qr-verify/config", methods=["GET"])
def health_check():
    return jsonify({
        "status": "ok",
        "service": "qr-verify (Python Microservice)",
        "port": PORT,
        "ocr_engine": "EasyOCR",
        "qr_engine": "OpenCV QRCodeDetector"
    })

@app.route("/ocr", methods=["POST"])
def do_ocr():
    t0 = time.time()
    try:
        data = request.json or {}
        image_data = data.get("image")
        if not image_data:
            return jsonify({"success": False, "error": "No image provided"}), 400

        if "base64," in image_data:
            image_data = image_data.split("base64,")[1]

        img_bytes = base64.b64decode(image_data)
        img = Image.open(io.BytesIO(img_bytes)).convert("RGB")

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

        np_img = np.array(img)

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

@app.route("/api/v1/qr-verify/scan", methods=["POST"])
def scan_slip():
    t0 = time.time()
    try:
        data = request.json or {}
        image_data = data.get("image")
        expected_amount = data.get("expected_amount")
        expected_receiver = data.get("expected_receiver") or data.get("expected_receiver_name")

        if expected_amount is not None:
            try:
                expected_amount = float(expected_amount)
            except ValueError:
                expected_amount = None

        if not image_data:
            return jsonify({"found_qr": False, "error": "No image provided"}), 400

        if "base64," in image_data:
            image_data = image_data.split("base64,")[1]

        img_bytes = base64.b64decode(image_data)
        pil_img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        np_img = np.array(pil_img)

        # 1. QR Code Scanning via OpenCV
        detector = cv2.QRCodeDetector()
        qr_raw, _, _ = detector.detectAndDecode(cv2.cvtColor(np_img, cv2.COLOR_RGB2BGR))

        found_qr = bool(qr_raw and len(qr_raw) > 5)
        decoded_qr = decode_qr_payload(qr_raw) if found_qr else None

        # 2. EasyOCR Slip Scanning
        max_dim = 900
        w, h = pil_img.size
        if max(w, h) > max_dim:
            if w > h:
                new_w = max_dim
                new_h = int(h * (max_dim / w))
            else:
                new_h = max_dim
                new_w = int(w * (max_dim / h))
            pil_img_resized = pil_img.resize((new_w, new_h), Image.Resampling.BILINEAR)
        else:
            pil_img_resized = pil_img

        ocr_results = reader.readtext(
            np.array(pil_img_resized),
            detail=0,
            batch_size=8,
            canvas_size=900,
            mag_ratio=1.0,
            low_text=0.3,
            text_threshold=0.5
        )
        full_text = " \n ".join(ocr_results)
        ocr_parsed = parse_slip_fields(ocr_results, full_text)

        elapsed_ms = round((time.time() - t0) * 1000, 2)
        elapsed_seconds = round(elapsed_ms / 1000.0, 2)

        # 3. Verification evaluation
        is_amount_match = None
        detected_amount = (decoded_qr.get("amount") if decoded_qr else None) or ocr_parsed.get("amount")
        if expected_amount is not None and detected_amount is not None:
            is_amount_match = abs(expected_amount - detected_amount) < 0.01

        is_receiver_match = None
        detected_receiver = ocr_parsed.get("receiver_name") or (decoded_qr.get("merchant_name") if decoded_qr else None)
        if expected_receiver and detected_receiver:
            is_receiver_match = (expected_receiver.strip().lower() in detected_receiver.strip().lower() or
                                 detected_receiver.strip().lower() in expected_receiver.strip().lower())

        is_ref_match = None
        if decoded_qr and decoded_qr.get("transaction_ref") and ocr_parsed.get("transaction_ref"):
            is_ref_match = (decoded_qr["transaction_ref"].lower() == ocr_parsed["transaction_ref"].lower())

        res = {
            "found_qr": found_qr,
            "elapsed_seconds": elapsed_seconds,
            "elapsed_ms": elapsed_ms,
            "expected_result": {
                "amount": expected_amount,
                "receiver_name": expected_receiver
            },
            "qr_data": {
                "raw_qr": qr_raw if found_qr else None,
                "transaction_ref": decoded_qr.get("transaction_ref") if decoded_qr else None,
                "amount": decoded_qr.get("amount") if decoded_qr else None,
                "merchant_name": decoded_qr.get("merchant_name") if decoded_qr else None,
                "sender_bank": decoded_qr.get("sender_bank") if decoded_qr else None
            },
            "ocr_data": ocr_parsed,
            "verification_results": {
                "crc16_checksum": decoded_qr.get("crc_valid") if decoded_qr else None,
                "is_trans_ref_match": is_ref_match,
                "is_amount_match": is_amount_match,
                "is_receiver_match": is_receiver_match,
                "is_slip_edited": False
            },
            "message": "ตรวจสอบสลิปสำเร็จ" if found_qr else "สแกนข้อความบนสลิปสำเร็จ (ไม่พบ QR Code)"
        }

        return jsonify(res)

    except Exception as e:
        return jsonify({"found_qr": False, "error": str(e)}), 500

if __name__ == "__main__":
    print(f"[QR Verify Microservice] Running Python service on port {PORT}...")
    app.run(host="0.0.0.0", port=PORT, debug=False)
