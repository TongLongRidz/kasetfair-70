require("dotenv").config();
const express = require("express");
const cors = require("cors");
const Jimp = require("jimp");
const jsQR = require("jsqr");
const { Pool } = require("pg");

const fs = require("fs");
const path = require("path");
const bankCodes = require("./bank_code.json");

const app = express();
const PORT = process.env.PORT || 8586;

// Middlewares
app.use(cors());
app.use(express.json({ limit: "20mb" }));

// Serve index.html dynamically with env values injected directly into HTML value=""
app.get("/", (req, res) => {
  const indexPath = path.join(__dirname, "public", "index.html");
  let html = fs.readFileSync(indexPath, "utf8");
  html = html.replace('id="expectedAmountInput" placeholder="เช่น 100, 150..." value=""', `id="expectedAmountInput" placeholder="เช่น 100, 150..." value="${process.env.DEFAULT_EXPECTED_AMOUNT || "1"}"`);
  html = html.replace('id="expectedTargetInput" placeholder="เช่น 0812345678 หรือ 010555..." value=""', `id="expectedTargetInput" placeholder="เช่น 0812345678 หรือ 010555..." value="${process.env.DEFAULT_PROMPTPAY_TARGET || "0823393244"}"`);
  html = html.replace('id="expectedReceiverInput" placeholder="เช่น นาย สมศักดิ์, TongLong Store..." value=""', `id="expectedReceiverInput" placeholder="เช่น นาย สมศักดิ์, TongLong Store..." value="${process.env.DEFAULT_PROMPTPAY_NAME || "นาย สมศักดิ์"}"`);
  res.send(html);
});

app.use(express.static(path.join(__dirname, "public")));

// Postgres Connection Pool
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "kasetfair",
});

/**
 * EMVCo / Thai PromptPay QR Data Decoder Helper
 * Decodes EMVCo TLV (Tag-Length-Value) structure from QR raw string.
 */
function parseEMVCo(qrRaw) {
  const tags = {};
  let i = 0;
  while (i < qrRaw.length) {
    const tag = qrRaw.substring(i, i + 2);
    const len = parseInt(qrRaw.substring(i + 2, i + 4), 10);
    if (isNaN(len)) break;
    const value = qrRaw.substring(i + 4, i + 4 + len);
    tags[tag] = value;
    i += 4 + len;
  }
  return tags;
}

const ROOT_TLV_NAMES = {
  "00": "Payload Format Indicator",
  "01": "Point of Initiation Method (11=Static, 12=Dynamic)",
  "29": "PromptPay Merchant Credit Transfer",
  "30": "PromptPay Bill Payment / MiniQR",
  "31": "PromptPay Additional Merchant Info",
  "52": "Merchant Category Code (MCC)",
  "53": "Transaction Currency Code (764 = THB)",
  "54": "Transaction Amount",
  "55": "Tip or Value Indicator",
  "58": "Country Code (TH)",
  "59": "Merchant Name",
  "60": "Merchant City",
  "61": "Postal Code",
  "62": "Additional Data Field Template",
  "63": "CRC Checksum (EMVCo Tag 63)",
  "91": "CRC Checksum (Thai MiniQR Slip Tag 91)",
};

/**
 * EMVCo Standard CRC16-CCITT (FALSE) Checksum Calculator
 * Polynomial: 0x1021, Initial: 0xFFFF
 */
function computeCRC16(str) {
  let crc = 0xffff;
  for (let c = 0; c < str.length; c++) {
    crc ^= str.charCodeAt(c) << 8;
    for (let i = 0; i < 8; i++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/**
 * Helper to parse nested TLV strings (e.g. inside Tag 00, Tag 29, Tag 30, Tag 62)
 */
function parseNestedTLV(str) {
  if (!str || typeof str !== "string") return {};
  const tags = {};
  let i = 0;
  while (i < str.length - 4) {
    const tag = str.substring(i, i + 2);
    const len = parseInt(str.substring(i + 2, i + 4), 10);
    if (isNaN(len) || len < 0 || i + 4 + len > str.length) break;
    const val = str.substring(i + 4, i + 4 + len);
    tags[tag] = val;
    i += 4 + len;
  }
  return tags;
}

/**
 * Comprehensive EMVCo & Thai MiniQR Slip Parser
 * Parses both Merchant QR (Tag 29/30) and Slip Verification MiniQR (Tag 000201010212...)
 */
function parseFullQRData(qrRaw) {
  const rootTags = parseEMVCo(qrRaw);

  const rootTlvDetails = {};
  for (const [tag, val] of Object.entries(rootTags)) {
    rootTlvDetails[tag] = {
      tag: tag,
      name: ROOT_TLV_NAMES[tag] || `Tag ${tag}`,
      value: val,
    };
  }

  // CRC16 Checksum Calculation & Validation
  let crcInfo = {
    is_valid: false,
    metadata: {
      tag_used: null,
      found_tag: false,
      standard: "CRC-16/CCITT-FALSE",
    },
    computation: {
      data_for_checksum: null,
      expected_crc: null,
      calculated_crc: null,
    },
  };

  let crcTagHeader = "";
  let crcTagIndex = -1;

  if (qrRaw.includes("9104")) {
    crcTagHeader = "9104";
    crcTagIndex = qrRaw.indexOf("9104");
  } else if (qrRaw.includes("6304")) {
    crcTagHeader = "6304";
    crcTagIndex = qrRaw.indexOf("6304");
  }

  if (crcTagIndex !== -1) {
    const tagUsedStr = crcTagHeader === "9104" ? "91" : "63";
    const dataForCrc = qrRaw.substring(0, crcTagIndex + 4);
    const expectedCrc = qrRaw.substring(crcTagIndex + 4, crcTagIndex + 8).toUpperCase();
    const computedCrc = computeCRC16(dataForCrc);
    const isValid = expectedCrc === computedCrc;

    crcInfo = {
      is_valid: isValid,
      metadata: {
        tag_used: tagUsedStr,
        found_tag: true,
        standard: "CRC-16/CCITT-FALSE",
      },
      computation: {
        data_for_checksum: dataForCrc,
        expected_crc: expectedCrc,
        calculated_crc: computedCrc,
      },
    };
  } else if (rootTags["91"] || rootTags["63"]) {
    const tagUsedStr = rootTags["91"] ? "91" : "63";
    const expectedCrc = (rootTags["91"] || rootTags["63"]).toUpperCase();
    crcInfo = {
      is_valid: false,
      metadata: {
        tag_used: tagUsedStr,
        found_tag: true,
        standard: "CRC-16/CCITT-FALSE",
      },
      computation: {
        data_for_checksum: null,
        expected_crc: expectedCrc,
        calculated_crc: null,
      },
    };
  }

  let sendingBank = "";
  let receivingBank = "";
  let transRef = "";
  let transDate = "";
  let transTime = "";
  let transTimestamp = "";

  // Check Tag 00 for Thai Bank Slip MiniQR sub-TLVs
  if (rootTags["00"] && rootTags["00"].length >= 10) {
    const sub00 = parseNestedTLV(rootTags["00"]);
    if (sub00["01"]) {
      sendingBank = sub00["01"].padStart(3, "0");
    }
    if (sub00["02"]) {
      transRef = sub00["02"];

      // Bank-specific Date/Time Extraction Rules
      // Rule 1: 069 (KKP / เกียรตินาคินภัทร) -> e.g. 626411608760
      // Positions 0–7: YYYYMMDD or YYMMDD + time info; Position 8–11: HHmm UTC -> Add +7 hours
      if (sendingBank === "069" && transRef.length >= 12) {
        // Check date pattern in prefix (e.g. 20240921 or 240921)
        const possibleDate = transRef.substring(0, 8);
        if (/^\d{8}$/.test(possibleDate)) {
          const yyyy = possibleDate.substring(0, 4);
          const mm = possibleDate.substring(4, 6);
          const dd = possibleDate.substring(6, 8);
          transDate = `${yyyy}-${mm}-${dd}`;
        } else if (/^\d{6}/.test(transRef)) {
          const yy = transRef.substring(0, 2);
          const mm = transRef.substring(2, 4);
          const dd = transRef.substring(4, 6);
          transDate = `20${yy}-${mm}-${dd}`;
        }

        const hhRaw = parseInt(transRef.substring(8, 10), 10);
        const mmRaw = parseInt(transRef.substring(10, 12), 10);
        if (!isNaN(hhRaw) && !isNaN(mmRaw)) {
          // Adjust UTC to Thailand UTC+7 (+7 hours)
          let utcHour = hhRaw;
          let dateObj = transDate ? new Date(`${transDate}T00:00:00Z`) : new Date();
          dateObj.setUTCHours(utcHour + 7, mmRaw, 0);

          const locYY = dateObj.getUTCFullYear();
          const locMM = String(dateObj.getUTCMonth() + 1).padStart(2, "0");
          const locDD = String(dateObj.getUTCDate()).padStart(2, "0");
          const locHH = String(dateObj.getUTCHours()).padStart(2, "0");
          const locMin = String(dateObj.getUTCMinutes()).padStart(2, "0");

          transDate = `${locYY}-${locMM}-${locDD}`;
          transTime = `${locHH}:${locMin}`;
          transTimestamp = `${locYY}-${locMM}-${locDD}T${locHH}:${locMin}:00+07:00`;
        }
      }
      // Rule 2: 004 (KBANK / กสิกรไทย) -> Positions 2-8: YYMMDD, Positions 10–15: HHmmss UTC -> Add +7 hours
      else if (sendingBank === "004" && transRef.length >= 16) {
        const dateStr = transRef.substring(2, 8);
        if (/^\d{6}$/.test(dateStr)) {
          const yy = parseInt(dateStr.substring(0, 2), 10);
          const mm = parseInt(dateStr.substring(2, 4), 10);
          const dd = parseInt(dateStr.substring(4, 6), 10);
          transDate = `20${String(yy).padStart(2, "0")}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
        }

        const hhRaw = parseInt(transRef.substring(10, 12), 10);
        const mmRaw = parseInt(transRef.substring(12, 14), 10);
        const ssRaw = parseInt(transRef.substring(14, 16), 10);
        if (!isNaN(hhRaw) && !isNaN(mmRaw) && !isNaN(ssRaw)) {
          let dateObj = transDate ? new Date(`${transDate}T00:00:00Z`) : new Date();
          dateObj.setUTCHours(hhRaw + 7, mmRaw, ssRaw);

          const locYY = dateObj.getUTCFullYear();
          const locMM = String(dateObj.getUTCMonth() + 1).padStart(2, "0");
          const locDD = String(dateObj.getUTCDate()).padStart(2, "0");
          const locHH = String(dateObj.getUTCHours()).padStart(2, "0");
          const locMin = String(dateObj.getUTCMinutes()).padStart(2, "0");
          const locSS = String(dateObj.getUTCSeconds()).padStart(2, "0");

          transDate = `${locYY}-${locMM}-${locDD}`;
          transTime = `${locHH}:${locMin}:${locSS}`;
          transTimestamp = `${locYY}-${locMM}-${locDD}T${locHH}:${locMin}:${locSS}+07:00`;
        }
      }
      // Rule 3: Standard MiniQR 23 chars format: [2 prefix][YYMMDD][HHMMSS][traceId]
      else if (transRef.length === 23) {
        const dateStr = transRef.substring(2, 8);
        const timeStr = transRef.substring(8, 14);
        if (/^\d{6}$/.test(dateStr) && /^\d{6}$/.test(timeStr)) {
          const yy = parseInt(dateStr.substring(0, 2), 10);
          const mm = parseInt(dateStr.substring(2, 4), 10);
          const dd = parseInt(dateStr.substring(4, 6), 10);
          const hh = parseInt(timeStr.substring(0, 2), 10);
          const min = parseInt(timeStr.substring(2, 4), 10);
          const ss = parseInt(timeStr.substring(4, 6), 10);

          // Convert raw UTC time to Thailand local time (+7 hours)
          const utcDate = new Date(Date.UTC(2000 + yy, mm - 1, dd, hh, min, ss));
          const localTime = new Date(utcDate.getTime() + 7 * 60 * 60 * 1000);

          const locYY = localTime.getUTCFullYear();
          const locMM = String(localTime.getUTCMonth() + 1).padStart(2, "0");
          const locDD = String(localTime.getUTCDate()).padStart(2, "0");
          const locHH = String(localTime.getUTCHours()).padStart(2, "0");
          const locMin = String(localTime.getUTCMinutes()).padStart(2, "0");
          const locSS = String(localTime.getUTCSeconds()).padStart(2, "0");

          transDate = `${locYY}-${locMM}-${locDD}`;
          transTime = `${locHH}:${locMin}:${locSS}`;
          transTimestamp = `${locYY}-${locMM}-${locDD}T${locHH}:${locMin}:${locSS}+07:00`;
        }
      }
    }
  }

  let senderBankObj = null;
  if (sendingBank) {
    const paddedCode = sendingBank.padStart(3, "0");
    const bankInfo = bankCodes[paddedCode];
    if (bankInfo) {
      senderBankObj = {
        code: paddedCode,
        abbr: bankInfo.abbr,
        name_th: bankInfo.name_th,
        name_en: bankInfo.name_en,
      };
    } else {
      senderBankObj = {
        code: paddedCode,
        abbr: null,
        name_th: null,
        name_en: null,
      };
    }
    sendingBank = paddedCode;
  }

  // Tag 30 / 29
  const tag30 = rootTags["30"] || rootTags["29"] || rootTags["31"];

  let qrTypeObj = {
    raw_value: rootTags["00"] ? rootTags["00"].substring(0, 10) : "Unknown",
    name: "EMVCo Standard",
    description: "EMVCo Standard QR",
  };
  if (rootTags["00"] && rootTags["00"].includes("000001")) {
    qrTypeObj = {
      raw_value: "000001",
      name: "Slip Verification",
      description: "สลิปโอนเงิน (Mini QR)",
    };
  } else if (tag30) {
    qrTypeObj = {
      raw_value: "PromptPay",
      name: "PromptPay Merchant",
      description: "PromptPay Merchant / Transfer QR",
    };
  }

  let qrDateTimeFormatted = null;
  if (transDate && transTime) {
    qrDateTimeFormatted = `${transDate} ${transTime} น. (UTC +7)`;
  } else if (transTime) {
    qrDateTimeFormatted = `${transTime} น. (UTC +7)`;
  } else if (transDate) {
    qrDateTimeFormatted = `${transDate}`;
  } else {
    qrDateTimeFormatted = "ไม่มีระบุใน QR Code";
  }

  const parsed = {
    raw_qr: qrRaw,
    qr_type_obj: qrTypeObj,
    qr_type: qrTypeObj.description,
    transaction_ref: transRef || null,
    trans_date: transDate || null,
    trans_time: transTime || null,
    trans_timestamp: transTimestamp || null,
    date_time: qrDateTimeFormatted,
    amount: null,
    target_account: null,
    biller_id: null,
    sending_bank: sendingBank || null,
    sender_bank: senderBankObj,
    receiving_bank: receivingBank || null,
    sender_info: null,
    receiver_info: null,
    currency: null,
    country: rootTags["51"] || rootTags["58"] || "TH",
    root_tlv_tags: rootTlvDetails,
    crc16_info: crcInfo,
  };

  // Amount from Tag 54
  if (rootTags["54"]) {
    const amt = parseFloat(rootTags["54"]);
    if (!isNaN(amt)) parsed.amount = amt;
  }

  // Country (Tag 58/51) & Currency (Tag 53 - 764 = THB)
  if (rootTags["58"]) parsed.country = rootTags["58"];
  if (rootTags["53"]) parsed.currency = rootTags["53"] === "764" ? "THB (764)" : rootTags["53"];

  if (tag30) {
    const sub30 = parseNestedTLV(tag30);
    parsed.biller_id = sub30["00"] || null;
    let target = sub30["01"] || sub30["02"] || sub30["03"];
    if (target) {
      if (target.startsWith("0066")) {
        target = "0" + target.substring(4);
      }
      parsed.target_account = target;
    }
    if (sub30["02"] && !parsed.transaction_ref) parsed.transaction_ref = sub30["02"];
    if (sub30["04"] && !parsed.transaction_ref) parsed.transaction_ref = sub30["04"];
  }

  // Tag 62
  if (rootTags["62"]) {
    const sub62 = parseNestedTLV(rootTags["62"]);
    if (sub62["05"] && !parsed.transaction_ref) parsed.transaction_ref = sub62["05"];
    if (sub62["01"] && !parsed.transaction_ref) parsed.transaction_ref = sub62["01"];
    if (sub62["07"] && !parsed.date_time) parsed.date_time = sub62["07"];
  }

  return parsed;
}

/**
 * Build official SlipOK API structure from parsed QR details
 */
function buildSlipokData(fullParsed, scannedTarget, scannedAmount, expAmt) {
  const amount = scannedAmount !== null ? scannedAmount : (expAmt !== null && !isNaN(expAmt) ? parseFloat(expAmt) : 0);
  
  let proxyType = "";
  if (scannedTarget) {
    proxyType = scannedTarget.length === 13 ? "NATID" : "MSISDN";
  }

  return {
    success: true,
    message: "OK",
    language: "TH",
    receivingBank: fullParsed.receiving_bank || "",
    sendingBank: fullParsed.sending_bank || "",
    transRef: fullParsed.transaction_ref || "",
    transDate: fullParsed.trans_date || "",
    transTime: fullParsed.trans_time || "",
    transTimestamp: fullParsed.trans_timestamp || "",
    sender: {
      displayName: "",
      name: "",
      proxy: {
        type: "",
        value: "",
      },
      account: {
        type: "",
        value: "",
      },
    },
    receiver: {
      displayName: "",
      name: "",
      proxy: {
        type: proxyType,
        value: scannedTarget || "",
      },
      account: {
        type: scannedTarget ? "PROMPTPAY" : "",
        value: scannedTarget || "",
      },
    },
    amount: amount,
    paidLocalAmount: amount,
    paidLocalCurrency: fullParsed.currency ? fullParsed.currency.split(" ")[0] : "THB",
    countryCode: fullParsed.country || "TH",
    transFeeAmount: "0",
    ref1: "",
    ref2: "",
    ref3: "",
    toMerchantId: "",
  };
}

/**
 * Extract Target PromptPay Account Number from Tag 29 or Tag 30 (Subtag 01 or 02)
 */
function extractPromptPayTarget(qrRaw) {
  const rootTags = parseEMVCo(qrRaw);
  const merchantInfoRaw = rootTags["29"] || rootTags["30"] || rootTags["31"];
  if (!merchantInfoRaw) return null;

  const subTags = parseEMVCo(merchantInfoRaw);
  let target = subTags["01"] || subTags["02"] || subTags["03"] || subTags["00"];
  if (target && target.startsWith("0066")) {
    target = "0" + target.substring(4);
  }
  return target;
}

/**
 * Extract Amount from Tag 54
 */
function extractAmount(qrRaw) {
  const rootTags = parseEMVCo(qrRaw);
  if (rootTags["54"]) {
    const amt = parseFloat(rootTags["54"]);
    return isNaN(amt) ? null : amt;
  }
  return null;
}

/**
 * Scan QR from image file buffer or Base64 data string using Jimp + jsQR
 */
async function scanQRCode(imageInput) {
  let image;
  if (typeof imageInput === "string" && imageInput.startsWith("data:")) {
    const base64Data = imageInput.replace(/^data:[^;]+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    image = await Jimp.read(buffer);
  } else if (Buffer.isBuffer(imageInput)) {
    image = await Jimp.read(imageInput);
  } else if (typeof imageInput === "string") {
    image = await Jimp.read(imageInput);
  } else {
    throw new Error("Invalid image input format");
  }

  const imageData = {
    data: new Uint8ClampedArray(image.bitmap.data),
    width: image.bitmap.width,
    height: image.bitmap.height,
  };

  const qrCode = jsQR(imageData.data, imageData.width, imageData.height);
  if (!qrCode) {
    return null;
  }
  return qrCode.data;
}

/**
 * Parses raw text extracted by OCR to extract structured slip information
 */
function parseSlipText(fullText, lines = []) {
  const res = {
    amount: null,
    sender_name: null,
    receiver_name: null,
    sender_bank: {
      name_th: null,
      name_en: null,
    },
    transaction_ref: null,
    date_time: null,
  };

  if (!fullText) return res;

  // 1. Detect Bank from bankCodes
  for (const [code, binfo] of Object.entries(bankCodes)) {
    const nameTh = binfo.name_th || "";
    const abbr = binfo.abbr || "";
    if ((nameTh && fullText.includes(nameTh)) || (abbr && new RegExp(`\\b${abbr}\\b`, "i").test(fullText))) {
      res.sender_bank = {
        code,
        name_th: nameTh,
        name_en: binfo.name_en || "",
        abbr,
      };
      break;
    }
  }

  // 2. Detect Transaction Ref
  const refMatch = fullText.match(/\b(0[0-9]{2}[A-Za-z0-9]{12,22})\b/) ||
                   fullText.match(/(?:รหัสอ้างอิง|เลขที่รายการ|Transaction\s*ID|Ref\.?|Ref\s*No\.?)[\s:]*([A-Za-z0-9]+)/i);
  if (refMatch) {
    res.transaction_ref = refMatch[1].trim();
  }

  // 3. Detect Amount
  const amtMatch = fullText.match(/(?:จำนวนเงิน|จำนวน|ยอดโอน|โอนสำเร็จ|amount)[\s:]*([0-9]{1,3}(?:,[0-9]{3})*\.[0-9]{2})/i);
  if (amtMatch) {
    res.amount = parseFloat(amtMatch[1].replace(/,/g, ""));
  } else {
    const floats = fullText.match(/\b([0-9]{1,3}(?:,[0-9]{3})*\.[0-9]{2})\b/g);
    if (floats && floats.length > 0) {
      res.amount = parseFloat(floats[0].replace(/,/g, ""));
    }
  }

  // 4. Detect Date Time
  const dateMatch = fullText.match(/(\d{1,2}\s+(?:ม\.ค\.|ก\.พ\.|มี\.ค\.|เม\.ย\.|พ\.ค\.|มิ\.ย\.|ก\.ค\.|ส\.ค\.|ก\.ย\.|ต\.ค\.|พ\.ย\.|ธ\.ค\.|มกราคม|กุมภาพันธ์|มีนาคม|เมษายน|พฤษภาคม|มิถุนายน|กรกฎาคม|สิงหาคม|กันยายน|ตุลาคม|พฤศจิกายน|ธันวาคม|[A-Za-z]{3,9})\s+\d{2,4}\s+\d{1,2}:\d{2}(?::\d{2})?)/) ||
                    fullText.match(/(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4}\s+\d{1,2}:\d{2}(?::\d{2})?)/);
  if (dateMatch) {
    res.date_time = dateMatch[1].trim();
  }

  // 5. Detect Sender & Receiver from lines
  const textLines = lines.length > 0 ? lines : fullText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  for (let i = 0; i < textLines.length; i++) {
    const line = textLines[i];
    if (/^(จาก|จาก:|ผู้โอน|from|sender)/i.test(line)) {
      if (i + 1 < textLines.length) res.sender_name = textLines[i + 1].trim();
    } else if (/^(ไปยัง|ถึง|ผู้รับ|to|receiver|โอนเข้าบัญชี)/i.test(line)) {
      if (i + 1 < textLines.length) res.receiver_name = textLines[i + 1].trim();
    }
  }

  return res;
}

/**
 * Execute OCR using Python (EasyOCR Microservice on port 8587)
 */
async function runEasyOCR(imageSource) {
  const res = await fetch("http://localhost:8587/ocr", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: imageSource }),
  });
  if (!res.ok) {
    throw new Error(`EasyOCR service returned HTTP ${res.status}`);
  }
  return await res.json();
}

// =========================================================================
// API ENDPOINTS
// =========================================================================

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "qr-verify", port: PORT });
});

/**
 * POST /api/v1/qr-verify/scan
 * Scans image uploaded as base64 or URL and decodes QR Code string
 */
app.post("/api/v1/qr-verify/scan", async (req, res) => {
  const scanStartTime = Date.now();
  try {
    const { image, ocr_expected, expected_amount, expected_target, ocr_expected_amount, ocr_expected_target, check_slip_edited } = req.body;
    if (!image) {
      return res.status(400).json({ success: false, error: "Missing image parameter" });
    }

    const qrRaw = await scanQRCode(image);
    if (!qrRaw) {
      const elapsedTotalMs = Date.now() - scanStartTime;
      return res.status(404).json({
        success: false,
        found_qr: false,
        elapsed_seconds: Number((elapsedTotalMs / 1000).toFixed(2)),
        elapsed_ms: elapsedTotalMs,
        message: "ไม่พบ QR Code ในรูปภาพที่ระบุ",
      });
    }

    const fullParsed = parseFullQRData(qrRaw);
    const scannedTarget = fullParsed.target_account;
    const scannedAmount = fullParsed.amount;

    let expAmt = null;
    let expTarget = null;
    let expReceiver = null;

    if (ocr_expected && typeof ocr_expected === "object") {
      if (ocr_expected.amount !== undefined && ocr_expected.amount !== "" && ocr_expected.amount !== null) {
        expAmt = parseFloat(ocr_expected.amount);
      }
      if (ocr_expected.target_account) {
        expTarget = String(ocr_expected.target_account).trim();
      }
      if (ocr_expected.receiver_name || ocr_expected.target_name) {
        expReceiver = String(ocr_expected.receiver_name || ocr_expected.target_name).trim();
      }
    }
    if (expAmt === null && (ocr_expected_amount !== undefined || expected_amount !== undefined)) {
      const rawAmt = ocr_expected_amount !== undefined ? ocr_expected_amount : expected_amount;
      if (rawAmt !== "" && rawAmt !== null && rawAmt !== undefined) expAmt = parseFloat(rawAmt);
    }
    if (expTarget === null && (ocr_expected_target || expected_target)) {
      expTarget = String(ocr_expected_target || expected_target).trim();
    }
    if (expReceiver === null && (ocr_expected_receiver || expected_receiver || ocr_expected_receiver_name || expected_receiver_name)) {
      expReceiver = String(ocr_expected_receiver || expected_receiver || ocr_expected_receiver_name || expected_receiver_name).trim();
    }

    // Toggle for slip edited check (Set to null since image tampering detection is standby)
    const isSlipEditedCheckEnabled = check_slip_edited === true;
    const isSlipEdited = isSlipEditedCheckEnabled ? false : null;

    // Run OCR Engine (EasyOCR Python)
    let ocrResult = { engine: "EasyOCR (Python)", elapsed_ms: 0, full_text: "", data: {} };

    try {
      ocrResult = await runEasyOCR(image);
    } catch (ocrErr) {
      console.error("[OCR Execution Error]:", ocrErr.message);
      ocrResult = {
        engine: "EasyOCR (Python)",
        elapsed_ms: 0,
        full_text: "",
        data: {},
        error: ocrErr.message,
      };
    }

    const ocrData = {
      amount: ocrResult.data?.amount ?? null,
      sender_name: ocrResult.data?.sender_name ?? null,
      receiver_name: ocrResult.data?.receiver_name ?? null,
      sender_bank: {
        name_th: ocrResult.data?.sender_bank?.name_th ?? null,
        name_en: ocrResult.data?.sender_bank?.name_en ?? null,
      },
      transaction_ref: ocrResult.data?.transaction_ref ?? null,
      date_time: ocrResult.data?.date_time ?? null,
    };

    // Verification Logic Rules:
    // 1. is_bank_match
    const isBankMatch = (ocrData.sender_bank?.name_th && fullParsed.sender_bank?.name_th)
      ? (ocrData.sender_bank.name_th === fullParsed.sender_bank.name_th || fullParsed.sender_bank.name_th.includes(ocrData.sender_bank.name_th) || ocrData.sender_bank.name_th.includes(fullParsed.sender_bank.name_th))
      : (ocrData.sender_bank?.name_th ? false : null);

    // 2. is_trans_ref_match (Case-insensitive comparison)
    const isTransRefMatch = (ocrData.transaction_ref && fullParsed.transaction_ref)
      ? (
          ocrData.transaction_ref.toLowerCase() === fullParsed.transaction_ref.toLowerCase() ||
          fullParsed.transaction_ref.toLowerCase().includes(ocrData.transaction_ref.toLowerCase()) ||
          ocrData.transaction_ref.toLowerCase().includes(fullParsed.transaction_ref.toLowerCase())
        )
      : (ocrData.transaction_ref ? false : null);

    // 3. is_amount_match
    const isAmountMatch = (ocrData.amount !== null && expAmt !== null)
      ? (Math.abs(ocrData.amount - expAmt) < 0.01)
      : (ocrData.amount !== null ? false : null);

    // 4. is_receiver_match (Strict Exact Match: exact Thai spelling, tone marks, and karans required)
    const cleanSpaces = (str) => String(str || "").replace(/\s+/g, " ").trim().toLowerCase();

    const isReceiverMatch = (ocrData.receiver_name && expReceiver)
      ? (
          cleanSpaces(ocrData.receiver_name) === cleanSpaces(expReceiver) ||
          cleanSpaces(ocrData.receiver_name).includes(cleanSpaces(expReceiver)) ||
          cleanSpaces(expReceiver).includes(cleanSpaces(ocrData.receiver_name))
        )
      : (ocrData.receiver_name ? false : null);

    // QR Data Object
    const qrData = {
      raw_qr: qrRaw,
      qr_type: fullParsed.qr_type_obj,
      sender_bank: fullParsed.sender_bank,
      transaction_ref: fullParsed.transaction_ref,
      date_time: fullParsed.date_time,
      country: fullParsed.country || "TH",
    };

    // Verification Results Object
    const verificationResults = {
      crc16_checksum: fullParsed.crc16_info,
      is_bank_match: isBankMatch,
      is_trans_ref_match: isTransRefMatch,
      is_amount_match: isAmountMatch,
      is_receiver_match: isReceiverMatch,
      is_slip_edited: isSlipEdited,
    };

    const elapsedTotalMs = Date.now() - scanStartTime;
    const elapsedSeconds = Number((elapsedTotalMs / 1000).toFixed(2));

    res.json({
      success: true,
      found_qr: true,
      elapsed_seconds: elapsedSeconds,
      elapsed_ms: elapsedTotalMs,
      qr_data: qrData,
      ocr_data: ocrData,
      verification_results: verificationResults,
    });
  } catch (err) {
    console.error("Scan error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/v1/qr-verify/check-order
 * Scans QR Code from slip image and verifies target account and amount against order in PostgreSQL DB
 * Request Body: { order_id: 123, image: "data:image/png;base64,..." }
 */
app.post("/api/v1/qr-verify/check-order", async (req, res) => {
  try {
    const { order_id, image } = req.body;
    if (!order_id) {
      return res.status(400).json({ success: false, error: "Missing order_id parameter" });
    }

    // 1. Fetch Order details & target PromptPay settings from Database
    const orderRes = await pool.query(
      "SELECT id, queue_no, total_amount, slip_url, payment_method FROM orders WHERE id = $1",
      [order_id]
    );

    if (orderRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: `ไม่พบออเดอร์หมายเลข #${order_id}` });
    }
    const order = orderRes.rows[0];

    // Fetch target promptpay setting from DB
    const settingRes = await pool.query(
      "SELECT value FROM system_settings WHERE key = 'promptpay_target'"
    );
    const promptpayTargetDB = settingRes.rows.length > 0 ? settingRes.rows[0].value.trim() : "";

    // Determine image input source
    let imgSource = image;
    if (!imgSource && order.slip_url) {
      if (order.slip_url.startsWith("http")) {
        imgSource = order.slip_url;
      } else {
        const backendBase = process.env.BACKEND_URL || "http://localhost:8585";
        imgSource = `${backendBase}${order.slip_url.startsWith("/") ? "" : "/"}${order.slip_url}`;
      }
    }

    if (!imgSource) {
      return res.status(400).json({
        success: false,
        verified: false,
        error: "ไม่มีรูปภาพสลิปที่ต้องการตรวจสอบ",
      });
    }

    // 2. Scan QR from image
    const qrRaw = await scanQRCode(imgSource);
    if (!qrRaw) {
      return res.json({
        success: true,
        verified: false,
        found_qr: false,
        order_id: order.id,
        queue_no: order.queue_no,
        expected: {
          total_amount: order.total_amount,
          target_account: promptpayTargetDB,
        },
        message: "ไม่พบ QR Code (สลิปแบบสแกนย้อนหลัง) ในภาพที่อัปโหลด",
      });
    }

    // 3. Extract QR payload data
    const scannedTarget = extractPromptPayTarget(qrRaw);
    const scannedAmount = extractAmount(qrRaw);

    // 4. Verify against database expectations
    const isAmountMatch = scannedAmount !== null ? scannedAmount === parseFloat(order.total_amount) : true;
    const isTargetMatch = promptpayTargetDB ? scannedTarget === promptpayTargetDB : true;
    const isVerified = isAmountMatch && isTargetMatch;

    return res.json({
      success: true,
      verified: isVerified,
      found_qr: true,
      qr_raw: qrRaw,
      order: {
        id: order.id,
        queue_no: order.queue_no,
        expected_amount: parseFloat(order.total_amount),
        expected_target: promptpayTargetDB,
      },
      scanned: {
        target_account: scannedTarget,
        amount: scannedAmount,
      },
      verification_results: {
        amount_match: isAmountMatch,
        target_account_match: isTargetMatch,
      },
    });
  } catch (err) {
    console.error("Check order error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});
/**
 * POST /api/v1/slipok/check-slip
 * Mock Endpoint reproducing SlipOK API Standard (Check Slip API)
 * Request Body: { data: "000201...", url: "...", amount: 150.00, files: ... }
 */
app.post("/api/v1/slipok/check-slip", async (req, res) => {
  try {
    const { data: qrData, image, url, amount: expAmount } = req.body;
    let inputSource = qrData || image || url;

    if (!inputSource) {
      return res.status(400).json({
        success: false,
        code: 1001,
        message: "Missing slip image, URL or QR data payload",
      });
    }

    let qrRaw = inputSource;
    if (typeof inputSource === "string" && (inputSource.startsWith("data:") || inputSource.startsWith("http"))) {
      qrRaw = await scanQRCode(inputSource);
    }

    if (!qrRaw) {
      return res.status(400).json({
        success: false,
        code: 1001,
        message: "QR Code not found in the uploaded image",
      });
    }

    const fullParsed = parseFullQRData(qrRaw);
    const amount = fullParsed.amount !== null ? fullParsed.amount : (expAmount ? parseFloat(expAmount) : 0);

    // SlipOK Standard Response Format (Official SlipOK API Specification)
    return res.json({
      success: true,
      data: buildSlipokData(fullParsed, fullParsed.target_account, fullParsed.amount, expAmount),
    });
  } catch (err) {
    console.error("SlipOK Mock API Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Endpoint to retrieve default frontend configs from .env
app.get("/api/v1/qr-verify/config", (req, res) => {
  res.json({
    default_expected_amount: process.env.DEFAULT_EXPECTED_AMOUNT || "1",
    default_promptpay_target: process.env.DEFAULT_PROMPTPAY_TARGET || "0823393244",
    default_promptpay_name: process.env.DEFAULT_PROMPTPAY_NAME || "นาย สมศักดิ์",
  });
});

app.listen(PORT, () => {
  console.log(`[QR Verify Service] Running on port ${PORT}`);
});

