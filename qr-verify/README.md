# 🔍 QR Code Slip Verification Web App (`qr-verify`)

เว็บแอปพลิเคชันและบริการ API สำหรับอ่าน **QR Code สลิปพร้อมเพย์ (Mini QR)**, ดึงข้อมูลจากสลิปด้วย OCR และตรวจสอบความถูกต้องของสลิปโอนเงิน

---

## 🎨 ความสามารถ (Features)
1. **Frontend Web UI (Single Service):** หน้าจอทดสอบสแกน QR Code / อัปโหลดสลิปผ่านพอร์ต `8586`
2. **EMVCo & Thai MiniQR Parser:** ถอดรหัส EMVCo TLV Payload และคำนวณ CRC16 Checksum (Tag 91/63)
3. **OCR Data Integration:** รองรับการดึงข้อมูลจากสลิป (ยอดเงิน, ชื่อผู้โอน-ผู้รับ, ธนาคารต้นทาง, Transaction Ref, วันเวลา)
4. **Verification Logic:** ตรวจสอบความถูกต้องและเปรียบเทียบข้อมูล QR vs OCR vs Frontend Input

---

## 🎯 กฎการตรวจสอบ (Verification Rules)

| ผลการตรวจสอบ | วิธีการเช็ค (Verification Logic) | หมายเหตุ |
| :--- | :--- | :--- |
| **`is_bank_match`** | เช็คชื่อธนาคารต้นทางจาก **OCR** เทียบกับธนาคารต้นทางจาก **QR Code** (`qr_data.sender_bank`) | ตรงกันเป็น `true` (อ้างอิงจาก `bank_code.json`) |
| **`is_trans_ref_match`** | เช็คหมายเลขอ้างอิงรายการจาก **OCR** เทียบกับ **QR Code** (`qr_data.transaction_ref`) | Case-Insensitive (ตัวพิมพ์เล็ก-ใหญ่เทียบเท่ากัน) |
| **`is_amount_match`** | เช็คจำนวนเงินจากค่าที่กำหนดใน **Frontend (`ocr_expected.amount`)** เทียบกับ **OCR** (`ocr_data.amount`) | ยอดเงินตรงกันเป็น `true` (แก้ปัญหา OCR สับสน `O` กับ `0`) |
| **`is_receiver_match`** | เช็คชื่อผู้รับเงินจาก **Frontend (`ocr_expected.receiver_name`)** เทียบกับ **OCR** (`ocr_data.receiver_name`) | **Strict Exact Match:** ต้องสะกดตรงกันเป๊ะทุกพยัญชนะ สระ และการันต์ |
| **`is_slip_edited`** | เช็คว่ารูปสลิปถูกตัดต่อ/ดัดแปลงหรือไม่ | สามารถเปิด-ปิดการเช็คผ่านพารามิเตอร์ `check_slip_edited: true/false` ได้ |

---

## 📡 API Specification (`POST /api/v1/qr-verify/scan`)

### Request Body Format
```json
{
  "image": "data:image/png;base64,...",
  "ocr_expected": {
    "amount": 100.00,
    "target_account": "0067834507"
  },
  "check_slip_edited": false
}
```

### Response Standard JSON Format
```json
{
  "success": true,
  "found_qr": true,
  "elapsed_seconds": 1.15,
  "elapsed_ms": 1150,
  "qr_data": {
    "raw_qr": "004600060000010103069022062641160876063499104DD2D",
    "qr_type": {
      "raw_value": "000001",
      "name": "Slip Verification",
      "description": "สลิปโอนเงิน (Mini QR)"
    },
    "sender_bank": {
      "code": "069",
      "abbr": "KKP",
      "name_th": "ธนาคารเกียรตินาคินภัทร",
      "name_en": "Kiatnakin Phatra Bank"
    },
    "transaction_ref": "626411608760",
    "date_time": "2026-09-21 11:49 น. (UTC +7)",
    "country": "TH"
  },
  "ocr_data": {
    "amount": 1.00,
    "sender_name": "จิตรภาณุกรณ์ หวังอาษา",
    "receiver_name": "จิตรภาณุกรณ์ หวังอาษา",
    "sender_bank": {
      "code": "069",
      "abbr": "KKP",
      "name_th": "ธนาคารเกียรตินาคินภัทร",
      "name_en": "Kiatnakin Phatra Bank"
    },
    "transaction_ref": "626411608760",
    "date_time": "21 ก.ย. 2569 11:49 น."
  },
  "verification_results": {
    "crc16_checksum": {
      "is_valid": true,
      "metadata": {
        "tag_used": "91",
        "found_tag": true,
        "standard": "CRC-16/CCITT-FALSE"
      },
      "computation": {
        "data_for_checksum": "004600060000010103069022062641160876063499104",
        "expected_crc": "DD2D",
        "calculated_crc": "DD2D"
      }
    },
    "is_bank_match": true,
    "is_trans_ref_match": true,
    "is_amount_match": true,
    "is_receiver_match": true,
    "is_slip_edited": false
  }
}
```

---

## 🚀 วิธีการใช้งาน (How to Run)

ระบบประกอบไปด้วย **2 Service** ที่ต้องรันคู่กันเพื่อการทำงานที่สมบูรณ์:

### 1. ติดตั้ง Dependencies (ครั้งแรก)

**Node.js Dependencies:**
```bash
cd qr-verify
npm install
```

**Python OCR Dependencies (EasyOCR, PyTorch, Pillow, Flask):**
```bash
pip3 install easyocr Pillow flask
```

---

### 2. รันระบบ (Run Services)

#### Terminal 1: รัน EasyOCR Python Microservice (Port `8587`)
ทำหน้าที่ถอดข้อความภาษาไทยและอ่านข้อมูลจากสลิป (ยอดเงิน, ผู้โอน, ผู้รับ, วันที่, หมายเลขอ้างอิง)
```bash
cd qr-verify
python3 ocr_service.py
```
> *เมื่อรันสำเร็จจะขึ้นข้อความ `[EasyOCR Microservice] Running on port 8587...`*

#### Terminal 2: รัน Main Server & Web UI (Port `8586`)
ทำหน้าที่เป็น Web UI, API สแกน/ถอดรหัส Mini QR Code, คำนวณ CRC16 Checksum, และประสานงานกับ OCR Service
```bash
cd qr-verify
npm run dev
```

---

## 🌐 ช่องทางการเข้าใช้งาน (Endpoints)

| ช่องทาง | URL | รายละเอียด |
| :--- | :--- | :--- |
| **Web UI (หน้าทดสอบสแกนสลิป)** | **`http://localhost:8586`** | หน้าเว็บสำหรับอัปโหลด/ทดสอบสแกน QR และดูผล OCR |
| **API สแกน/ตรวจสอบสลิป** | **`http://localhost:8586/api/v1/qr-verify/scan`** | Endpoint หลักสำหรับส่ง Base64 รูปภาพเข้ามาตรวจสอบ |
| **EasyOCR Microservice (Direct)** | **`http://localhost:8587/ocr`** | Service สำหรับประมวลผล OCR สลิปภาษาไทยโดยเฉพาะ |
