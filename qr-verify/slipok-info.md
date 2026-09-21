# SlipOK API Standard Specification (เอกสารอ้างอิง API รูปแบบ SlipOK)

เอกสารอ้างอิงและจำลองโครงสร้าง **Slip Verification API Standard** (สเปก SlipOK) สำหรับใช้ในระบบตรวจสอบสลิปโอนเงิน (อ้างอิงจาก [SlipOK API Documentation](https://slipok.com/api-documentation/check-slip/))

---

## 1. Endpoint Overview (ภาพรวมระบบ API)

### 1.1 Check Slip (ตรวจสอบสลิปโอนเงิน)
* **Method:** `POST`
* **URL:** `https://api.slipok.com/api/line/apikey/{BRANCH_ID}`
* **Headers:**
  - `x-authorization`: `<YOUR_SLIPOK_API_KEY>`
  - `Content-Type`: `application/json` หรือ `multipart/form-data`

---

## 2. Request Parameters (พารามิเตอร์ที่ส่งไป)

### Option A: ส่งด้วยไฟล์ภาพ (Multipart / FormData)
| Field | Type | Required | Description |
| :--- | :---: | :---: | :--- |
| **`files`** | File | Yes* | ไฟล์รูปภาพสลิป (JPG, PNG, WEBP) |
| **`log`** | Boolean | No | บันทึกประวัติการตรวจสอบใน Dashboard (`true` / `false`) |
| **`amount`** | Number | No | จำนวนเงินที่คาดหวัง เพื่อให้ระบบช่วยเปรียบเทียบ |

### Option B: ส่งด้วย QR Code Data / URL (JSON Payload)
```json
{
  "data": "00020101021230...",
  "log": true,
  "amount": 150.00
}
```
* **`data`**: สายอักขระ QR Code Raw String หรือ Data Base64 / Image URL
* **`url`**: ลิงก์ URL ของรูปภาพสลิปที่อัปโหลดไว้

---

## 3. Response Structure (รูปแบบการตอบกลับ)

### 3.1 Success Response (`200 OK`)

```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "✅",
    "language": "TH",
    "receivingBank": "006",
    "sendingBank": "004",
    "transRef": "010092101507665143",
    "transDate": "20200401",
    "transTime": "10:15:07",
    "transTimestamp": "2020-04-01T03:15:07.000Z",
    "sender": {
      "displayName": "นาย กสิกร ร",
      "name": "Mr. Kasikorn R",
      "proxy": {
        "type": "MSISDN",
        "value": "086xxx7894"
      },
      "account": {
        "type": "BANKAC",
        "value": "xxx-x-x0209-x"
      }
    },
    "receiver": {
      "displayName": "ธนาทร ร",
      "name": "THANATORN R",
      "proxy": {
        "type": "MSISDN",
        "value": "086xxx0000"
      },
      "account": {
        "type": "BANKAC",
        "value": "xxx-x-x3109-x"
      }
    },
    "amount": 50,
    "paidLocalAmount": 50,
    "paidLocalCurrency": "THB",
    "countryCode": "TH",
    "transFeeAmount": "0",
    "ref1": "",
    "ref2": "",
    "ref3": "",
    "toMerchantId": ""
  }
}
```

### 3.2 Error Response Examples

#### 1) ไม่พบ QR Code ในรูปภาพ (`400 Bad Request`)
```json
{
  "success": false,
  "code": 1001,
  "message": "QR Code not found in the uploaded image"
}
```

#### 2) สลิปซ้ำ (Duplicate Slip (`400 Bad Request`))
```json
{
  "success": false,
  "code": 1002,
  "message": "This slip transaction reference has already been checked"
}
```

#### 3) จำนวนเงินไม่ตรงกัน (Amount Mismatch (`400 Bad Request`))
```json
{
  "success": false,
  "code": 1003,
  "message": "Amount mismatch: expected 200.00 THB but found 150.00 THB"
}
```

---

## 4. Bank Codes Table (ตารางรหัสธนาคารมาตรฐาน SlipOK / BOT)

| Bank Code (3 หลัก) | ชื่อธนาคาร (Bank Name) | ชื่อย่อ (Abbreviation) |
| :---: | :--- | :---: |
| **`002`** | ธนาคารกรุงเทพ (Bangkok Bank) | BBL |
| **`004`** | ธนาคารกสิกรไทย (Kasikornbank) | KBANK |
| **`006`** | ธนาคารกรุงไทย (Krungthai Bank) | KTB |
| **`011`** | ธนาคารทหารไทยธนชาต (TMBThanachart Bank) | TTB |
| **`014`** | ธนาคารไทยพาณิชย์ (Siam Commercial Bank) | SCB |
| **`017`** | ธนาคารซิตี้แบงก์ (Citibank) | CITIBANK |
| **`022`** | ธนาคารซีไอเอ็มบี ไทย (CIMB Thai Bank) | CIMBT |
| **`024`** | ธนาคารยูโอบี (UOB Bank) | UOB |
| **`025`** | ธนาคารกรุงศรีอยุธยา (Bank of Ayudhya) | BAY / KRUNGSRI |
| **`030`** | ธนาคารออมสิน (Government Savings Bank) | GSB |
| **`033`** | ธนาคารอาคารสงเคราะห์ (GH Bank) | GHB |
| **`034`** | ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร | BAAC |
| **`065`** | ธนาคารไทยเครดิต (Thai Credit Bank) | TCB |
| **`067`** | ธนาคารทิสโก้ (TISCO Bank) | TISCO |
| **`069`** | ธนาคารเกียรตินาคินภัทร (Kiatnakin Phatra Bank) | KKP |
| **`073`** | ธนาคารแลนด์ แอนด์ เฮ้าส์ (LH Bank) | LHBANK |
| **`098`** | ทรูมันนี่ วอลเล็ท (TrueMoney Wallet) | TRUEMONEY |

---

## 5. การจำลอง Slip Verification Service Mock ใน `qr-verify` (Mock Endpoint)

เพื่อทดสอบระบบจำลอง API ให้ได้ Response โครงสร้างเดียวกับ SlipOK ในโปรเจกต์ `qr-verify` สามารถใช้ Endpoint:

* **Endpoint:** `POST /api/v1/slipok/check-slip`
* **Response Example:**
```javascript
{
  success: true,
  data: {
    transRef: scannedRef || "20260921REF998877",
    sendingBank: "014", // SCB
    receivingBank: "004", // KBANK
    transDate: "20260921",
    transTime: "12:00:00",
    sender: { displayName: "ผู้โอนเงิน", account: { type: "BANKAC", value: "xxx-x-x1234-x" } },
    receiver: { displayName: "ผู้รับเงิน (เกษตรแฟร์)", account: { type: "PROMPTPAY", value: expectedTarget } },
    amount: scannedAmount || expectedAmount,
    paidLocalCurrency: "THB"
  }
}
```

---

## 6. Root TLV Tags Specification (อ้างอิง EMVCo & BOT Thai QR Payment Standard)

อ้างอิงตารางเปรียบเทียบ **Root TLV (Tag-Length-Value) Tags** ตามมาตรฐาน [EMVCo & Bank of Thailand Thai QR Payment Specification](https://thai-qr-payment.js.org/th/reference/spec/):

| Tag ID | ชื่อโครงสร้าง (Root TLV Tag Name) | รายละเอียด & ตัวอย่างค่าใน QR Raw String |
| :---: | :--- | :--- |
| **`00`** | Payload Format Indicator | เวอร์ชันของ payload เช่น `01` (EMVCo Standard) |
| **`01`** | Point of Initiation Method | ประเภท QR Code (`11` = Static, `12` = Dynamic) |
| **`29`** | Merchant Info - Credit Transfer | โครงสร้างบัญชีพร้อมเพย์โอนเงิน (Mobile / Tax ID) |
| **`30`** | Merchant Info - Bill Payment / MiniQR | โครงสร้าง Biller ID / MiniQR สลิปโอนเงิน |
| **`31`** | Merchant Info - PromptPay Additional | ข้อมูลบัญชีผู้รับเงินเพิ่มเติม |
| **`52`** | Merchant Category Code (MCC) | รหัสประเภทธุรกิจ/ร้านค้า (4 หลัก) เช่น `0000` |
| **`53`** | Transaction Currency Code | รหัสสกุลเงิน เช่น `764` (THB - บาทไทย) |
| **`54`** | Transaction Amount | จำนวนเงินชำระ เช่น `150.00` |
| **`55`** | Tip or Value Indicator | ดัชนีทิป/ค่าธรรมเนียม |
| **`58`** | Country Code | รหัสประเทศ 2 อักขระ เช่น `TH` |
| **`59`** | Merchant Name | ชื่อร้านค้า/ผู้รับเงิน เช่น `KASET FAIR SHOP` |
| **`60`** | Merchant City | เมืองหรือจังหวัด เช่น `BANGKOK` |
| **`62`** | Additional Data Field Template | ข้อมูลเพิ่มเติม (Subtag `05` Bill/Ref ID, Subtag `07` Timestamp) |
| **`63`** | CRC Checksum | รหัสตรวจสอบความถูกต้อง 4 อักขระ Hexadecimal |

---

*อ้างอิงข้อมูลสเปกจาก: [EMVCo & BOT Thai QR Payment Spec](https://thai-qr-payment.js.org/th/reference/spec/)*

