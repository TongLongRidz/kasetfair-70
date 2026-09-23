"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import {
  ArrowLeft,
  QrCode,
  Banknote,
  UploadCloud,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  FileText,
  Sparkles,
  RefreshCw,
  Code2,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { getStoredToken } from "@/lib/auth";

export type PaymentVerificationStatus = "verified" | "pending" | "fraud";
export type PaymentMethod = "promptpay_qr" | "cash";

export interface SlipOrderItem {
  id: number;
  orderNo: string;
  queueNo: string;
  customerName: string;
  customerPhone?: string;
  channel: "ออนไลน์" | "หน้าร้าน" | "Nisit Shop";
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentVerificationStatus;
  statusNote?: string;
  orderedAt: string;
  createdAtRaw?: string;
  slipVerifiedAt?: string;
  verifiedByName?: string;
  slipImageUrl?: string;
  itemsSummary: string;
  itemsDetail?: Array<{
    productName: string;
    sweetness?: string;
    quantity: number;
    toppings?: string[];
  }>;
}

export interface QRScanResult {
  found_qr: boolean;
  elapsed_seconds?: number;
  elapsed_ms?: number;
  expected_result?: {
    amount?: number | null;
    receiver_name?: string | null;
  };
  qr_data?: {
    raw_qr?: string;
    cropped_qr_image?: string | null;
    qr_type?: any;
    sender_bank?: any;
    transaction_ref?: string | null;
    date_time?: string | null;
    country?: string;
  };
  ocr_data?: {
    amount?: number | null;
    sender_name?: string | null;
    receiver_name?: string | null;
    sender_bank?: {
      name_th?: string | null;
      name_en?: string | null;
    };
    transaction_ref?: string | null;
    date_time?: string | null;
  };
  verification_results?: {
    crc16_checksum?: any;
    is_bank_match?: boolean | null;
    is_trans_ref_match?: boolean | null;
    is_ref_match_expected?: boolean;
    ref_notes?: string | null;
    is_amount_match?: boolean | null;
    is_receiver_match?: boolean | null;
    is_slip_edited?: boolean | null;
  };
  message?: string;
  error?: string;
}

export default function OrderInspectionPage() {
  const params = useParams();
  const router = useRouter();
  const { success, error: toastError, info } = useToast();

  const orderIdParam = (params?.uuid || params?.id) as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [order, setOrder] = useState<SlipOrderItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isVerifyingQR, setIsVerifyingQR] = useState(false);

  const [selectedStatus, setSelectedStatus] = useState<PaymentVerificationStatus>("pending");
  const [fraudNote, setFraudNote] = useState<string>("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showJsonModal, setShowJsonModal] = useState<boolean>(false);

  const [qrVerifyResult, setQrVerifyResult] = useState<QRScanResult | null>(null);

  // Fetch Order details
  const fetchOrderDetails = async () => {
    if (!orderIdParam) return;
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585";
      const token = getStoredToken();
      const res = await fetch(`${apiUrl}/api/v1/orders/${orderIdParam}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        const json = await res.json();
        const o = json.data || json;
        let channel: "ออนไลน์" | "หน้าร้าน" | "Nisit Shop" = "หน้าร้าน";
        if (o.method === "online") channel = "ออนไลน์";
        else if (o.method === "nisit-shop") channel = "Nisit Shop";

        const paymentMethod: PaymentMethod =
          o.payment_method === "promptpay" || o.payment_method === "promptpay_qr"
            ? "promptpay_qr"
            : "cash";

        let paymentStatus: PaymentVerificationStatus = "pending";
        if (o.slip_verification_status === "verified" || o.slip_verification_status === "fraud") {
          paymentStatus = o.slip_verification_status;
        }

        const itemsSummary =
          o.order_items && o.order_items.length > 0
            ? o.order_items
                .map((item: any) => {
                  const pName = item.product?.name_th || "สินค้า";
                  const sweet = item.sweetness_level ? ` (${item.sweetness_level})` : "";
                  return `${pName}${sweet} x${item.quantity}`;
                })
                .join(", ")
            : "ไม่ระบุรายการ";

        const itemsDetail =
          o.order_items && o.order_items.length > 0
            ? o.order_items.map((item: any) => {
                const pName = item.product?.name_th || item.product_name || "สินค้า";
                const sweet = item.sweetness_level || undefined;
                const toppings = (item.order_item_toppings || item.toppings || [])
                  .map((t: any) => t.topping?.name_th || t.name_th || t.topping_name || t.name)
                  .filter(Boolean);
                return {
                  productName: pName,
                  sweetness: sweet,
                  quantity: item.quantity || 1,
                  toppings,
                };
              })
            : undefined;

        const slipImgUrl = o.slip_url
          ? o.slip_url.startsWith("http")
            ? o.slip_url
            : `${apiUrl}${o.slip_url.startsWith("/") ? "" : "/"}${o.slip_url}`
          : undefined;

        const orderData: SlipOrderItem = {
          id: o.id,
          orderNo: `#${o.id}`,
          queueNo: o.queue_no || `#${o.id}`,
          customerName: o.customer_name || (o.method === "walk-in" ? "ลูกค้าหน้าร้าน" : "ลูกค้าออนไลน์"),
          customerPhone: o.customer_phone || "",
          channel,
          total: o.total_amount || 0,
          paymentMethod,
          paymentStatus,
          statusNote: o.check_note || o.note || "",
          orderedAt: o.created_at,
          createdAtRaw: o.created_at,
          slipVerifiedAt: o.slip_verified_at || undefined,
          verifiedByName:
            o.slip_admin?.name || o.slip_admin?.username || (o.slip_verified_by ? `Admin #${o.slip_verified_by}` : "-"),
          slipImageUrl: slipImgUrl,
          itemsSummary,
          itemsDetail,
        };

        setOrder(orderData);
        setSelectedStatus(paymentStatus);
        setFraudNote(orderData.statusNote || "");

        // If slip image exists and payment method is promptpay_qr, auto trigger QR Scan check
        if (slipImgUrl && paymentMethod === "promptpay_qr") {
          runQRVerifyScan(slipImgUrl, orderData.total);
        }
      } else {
        toastError("ไม่พบข้อมูลออเดอร์ดังกล่าว", "เกิดข้อผิดพลาด");
      }
    } catch (err) {
      console.error("Failed to fetch order detail:", err);
      toastError("เกิดข้อผิดพลาดในการโหลดข้อมูลออเดอร์", "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [orderIdParam]);

  // Run QR Code + EasyOCR scan service against qr-verify API (:8586)
  const runQRVerifyScan = async (imageUrl: string | File, expectedAmount: number) => {
    // ⚠️ ถ้าเป็นเงินสด ไม่ต้องทำอะไรกับ qr-verify
    if (order && order.paymentMethod === "cash") {
      return;
    }

    setIsVerifyingQR(true);
    setQrVerifyResult(null);

    try {
      const qrVerifyUrl = process.env.NEXT_PUBLIC_QR_VERIFY_URL || "http://localhost:8586";
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585";
      let base64Image = "";

      // Fetch ocr_name setting from backend system_settings
      let expectedReceiverName = "";
      try {
        const ocrSettingRes = await fetch(`${apiUrl}/api/v1/settings/ocr_name`);
        if (ocrSettingRes.ok) {
          const settingData = await ocrSettingRes.json();
          if (settingData.value) {
            expectedReceiverName = settingData.value;
          }
        }
      } catch (ocrErr) {
        console.warn("Could not fetch ocr_name setting:", ocrErr);
      }

      // Helper function to read file/blob/url and draw on canvas to get clean PNG base64
      const convertToPngBase64 = async (src: string | File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            if (!ctx) return reject("Canvas 2D context not available");
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL("image/png"));
          };
          img.onerror = (e) => reject(e);

          if (typeof src === "string") {
            img.src = src;
          } else {
            const reader = new FileReader();
            reader.onload = (e) => {
              img.src = e.target?.result as string;
            };
            reader.onerror = reject;
            reader.readAsDataURL(src);
          }
        });
      };

      try {
        base64Image = await convertToPngBase64(imageUrl);
      } catch (convErr) {
        console.warn("Failed to convert image to PNG via canvas, fallback to direct format:", convErr);
        if (typeof imageUrl === "string") {
          base64Image = imageUrl;
        } else {
          base64Image = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(imageUrl);
          });
        }
      }

      const scanRes = await fetch(`${qrVerifyUrl}/api/v1/qr-verify/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: base64Image,
          expected_amount: expectedAmount,
          expected_receiver: expectedReceiverName,
          expected_receiver_name: expectedReceiverName,
        }),
      });

      if (scanRes.ok) {
        const data: QRScanResult = await scanRes.json();
        setQrVerifyResult(data);

        // Auto verify status evaluation (Only set result data, do not override user selectedStatus dropdown)
      } else if (scanRes.status === 404) {
        // QR-verify returns 404 when no QR code is found in the image
        const data = await scanRes.json();
        setQrVerifyResult({
          found_qr: false,
          elapsed_seconds: data.elapsed_seconds || 0,
          elapsed_ms: data.elapsed_ms || 0,
          message: data.message || "ไม่พบ QR Code ในรูปภาพ",
        } as QRScanResult);
      } else {
        const errBody = await scanRes.text().catch(() => "");
        console.warn("QR Verify service returned non-200 status:", scanRes.status, errBody);
      }
    } catch (err) {
      console.error("QR Verify scan error:", err);
    } finally {
      setIsVerifyingQR(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) {
      alert("กรุณาเลือกไฟล์รูปภาพเท่านั้น");
      return;
    }
    setPendingFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // ⚡ เช็คสลิปทันทีตอนอัปโหลดรูปภาพ (เฉพาะเมื่อไม่ใช่เงินสด)
    if (order && order.paymentMethod !== "cash") {
      runQRVerifyScan(file, order.total);
    }
  };

  const handleSave = async () => {
    if (!order) return;
    if (selectedStatus === "fraud" && !fraudNote.trim()) {
      alert("กรุณาระบุข้อสงสัย/เหตุผลที่เลือก 'เนียนเลยนะครับ'");
      return;
    }

    setIsSaving(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585";
      const token = getStoredToken();
      const authHeader: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      let savedSlipUrl = order.slipImageUrl;

      // 1. Upload new image if file is pending
      if (pendingFile) {
        const queueNoStr = order.queueNo || `ORDER${order.id}`;
        const now = new Date();
        const dd = String(now.getDate()).padStart(2, "0");
        const mm = String(now.getMonth() + 1).padStart(2, "0");
        const yyyy = now.getFullYear();
        const customFilename = `${dd}${mm}${yyyy}-${queueNoStr}.jpg`;

        const formData = new FormData();
        formData.append("file", pendingFile);
        formData.append("folder", "slips");
        formData.append("custom_filename", customFilename);

        const uploadRes = await fetch(`${apiUrl}/api/v1/upload`, {
          method: "POST",
          headers: authHeader,
          body: formData,
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          const rawUrl: string = uploadData.url || "";

          // Update order slip_url
          await fetch(`${apiUrl}/api/v1/orders/${order.id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              ...authHeader,
            },
            body: JSON.stringify({ slip_url: rawUrl }),
          });

          savedSlipUrl = rawUrl.startsWith("http") ? rawUrl : `${apiUrl}${rawUrl.startsWith("/") ? "" : "/"}${rawUrl}`;
        }
      }

      // 2. Update status & note
      const verifyRes = await fetch(`${apiUrl}/api/v1/orders/${order.id}/verify-slip`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
        },
        body: JSON.stringify({
          status: selectedStatus,
          check_note: selectedStatus === "fraud" ? fraudNote.trim() : "",
          note: selectedStatus === "fraud" ? fraudNote.trim() : "",
        }),
      });

      if (verifyRes.ok) {
        success("บันทึกการตรวจสอบเรียบร้อยแล้ว", "สำเร็จ");
        router.push("/admin/management/slip-check");
      } else {
        toastError("ไม่สามารถบันทึกสถานะได้", "เกิดข้อผิดพลาด");
      }
    } catch (err) {
      console.error("Failed to save changes:", err);
      toastError("เกิดข้อผิดพลาดในการบันทึกข้อมูล", "เกิดข้อผิดพลาด");
    } finally {
      setIsSaving(false);
    }
  };

  const initialStatus = order?.paymentStatus || "pending";
  const initialNote = order?.statusNote || "";
  const isStatusOrNoteChanged =
    selectedStatus !== initialStatus || (selectedStatus === "fraud" && fraudNote.trim() !== initialNote.trim());
  const isChanged = pendingFile !== null || isStatusOrNoteChanged;

  if (loading) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--cream)", fontFamily: "'Kanit', sans-serif" }}>
        <AdminSidebar />
        <main style={{ flex: 1, padding: "2rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center", color: "var(--ink-soft)" }}>
            <Loader2 size={36} className="animate-spin" style={{ margin: "0 auto 1rem auto" }} />
            <p style={{ fontWeight: 600 }}>กำลังโหลดข้อมูลออเดอร์ #{orderIdParam}...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--cream)", fontFamily: "'Kanit', sans-serif" }}>
        <AdminSidebar />
        <main style={{ flex: 1, padding: "2rem" }}>
          <button
            type="button"
            onClick={() => router.push("/admin/management/slip-check")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              border: "1px solid rgba(50,55,65,0.2)",
              backgroundColor: "#fff",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            <ArrowLeft size={16} />
            <span>ย้อนกลับไปหน้าตรวจสอบชำระเงิน</span>
          </button>
          <div style={{ marginTop: "2rem", color: "#dc2626", fontWeight: 700 }}>
            ไม่พบข้อมูลออเดอร์หมายเลข #{orderIdParam}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--cream)", fontFamily: "'Kanit', sans-serif" }}>
      <AdminSidebar />

      <main className="admin-main-wrapper" style={{ flex: 1, overflowY: "auto", minWidth: 0 }}>
        {/* Top Navigation & Header */}
        <div className="inspection-top-header">
          <div className="inspection-header-left" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <button
              type="button"
              onClick={() => router.push("/admin/management/slip-check")}
              style={{
                width: "2.5rem",
                height: "2.5rem",
                borderRadius: "50%",
                border: "1px solid rgba(50, 55, 65, 0.15)",
                backgroundColor: "#fff",
                color: "var(--ink)",
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                flexShrink: 0,
              }}
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 style={{ fontSize: "1.6rem", fontWeight: 800, margin: 0, color: "var(--ink)", lineHeight: 1.2 }}>
                ตรวจสอบหลักฐานการชำระเงิน
              </h1>
              <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)", margin: 0 }}>
                ออเดอร์ {order.orderNo} (คิว {order.queueNo})
              </p>
            </div>
          </div>

          <div className="inspection-header-right" style={{ display: "flex", gap: "0.75rem" }}>
            <button
              type="button"
              disabled={!isChanged || isSaving}
              onClick={handleSave}
              style={{
                padding: "0.65rem 1.75rem",
                borderRadius: "0.75rem",
                border: "none",
                backgroundColor: isChanged && !isSaving ? "var(--teal)" : "#cbd5e1",
                color: isChanged && !isSaving ? "#fff" : "#64748b",
                fontWeight: 700,
                fontSize: "0.875rem",
                cursor: isChanged && !isSaving ? "pointer" : "not-allowed",
                boxShadow: isChanged && !isSaving ? "0 4px 12px rgba(75, 155, 140, 0.35)" : "none",
                transition: "all 0.15s ease",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <span>บันทึกผลการตรวจสอบ</span>
              )}
            </button>
          </div>
        </div>

        {/* Main Grid: Left Column (Order Summary & Slip Image), Right Column (QR & OCR System Analysis) */}
        <div className="inspection-main-grid">
          {/* LEFT COLUMN */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {/* Order Details Card */}
            <div
              style={{
                backgroundColor: "var(--card)",
                borderRadius: "1.25rem",
                padding: "1.5rem",
                border: "1px solid rgba(50, 55, 65, 0.1)",
                boxShadow: "0 2px 12px rgba(0,0,0,0.03)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                  marginBottom: "1.25rem",
                  paddingBottom: "1.25rem",
                  borderBottom: "1px dashed rgba(50, 55, 65, 0.12)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "var(--ink-soft)", fontSize: "0.875rem", fontWeight: 600 }}>หมายเลขคิว</span>
                  <span style={{ fontSize: "1.5rem", color: "var(--ink)", fontWeight: 800 }}>
                    {order.queueNo}
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "var(--ink-soft)", fontSize: "0.875rem", fontWeight: 600 }}>วิธีชำระเงิน</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontWeight: 700, color: "var(--ink)", fontSize: "0.95rem" }}>
                    {order.paymentMethod === "promptpay_qr" ? (
                      <>
                        <QrCode size={18} color="var(--teal)" />
                        <span>พร้อมเพย์ QR</span>
                      </>
                    ) : (
                      <>
                        <Banknote size={18} color="#b45309" />
                        <span>เงินสด</span>
                      </>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "var(--ink-soft)", fontSize: "0.875rem", fontWeight: 600 }}>ยอดที่ต้องชำระ</span>
                  <span style={{ fontSize: "1.5rem", color: "var(--ink)", fontWeight: 800 }}>
                    ฿{order.total}
                  </span>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <span style={{ color: "var(--ink-soft)", fontSize: "0.8rem", fontWeight: 700, display: "block", marginBottom: "0.5rem" }}>
                  รายการสินค้าในออเดอร์
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {order.itemsDetail && order.itemsDetail.length > 0 ? (
                    order.itemsDetail.map((item, idx) => (
                      <div key={idx} style={{ fontSize: "0.9rem", color: "var(--ink)", padding: "0.4rem 0.6rem", backgroundColor: "var(--cream)", borderRadius: "0.5rem" }}>
                        <div style={{ fontWeight: 600, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                          <span>{item.productName}{item.sweetness ? ` (${item.sweetness})` : ""}</span>
                          <span style={{ fontWeight: 700, color: "var(--ink-soft)", fontSize: "0.85rem", marginLeft: "0.5rem" }}>x{item.quantity}</span>
                        </div>
                        {item.toppings && item.toppings.length > 0 && (
                          <div style={{ paddingLeft: "0.75rem", color: "var(--ink-soft)", fontSize: "0.8rem", marginTop: "2px" }}>
                            + {item.toppings.join(", ")}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--ink)", fontWeight: 500 }}>{order.itemsSummary}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Slip Image Upload & Preview Box */}
            <div
              style={{
                backgroundColor: "var(--card)",
                borderRadius: "1.25rem",
                padding: "1.5rem",
                border: "1px solid rgba(50, 55, 65, 0.1)",
                boxShadow: "0 2px 12px rgba(0,0,0,0.03)",
              }}
            >
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--ink)", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <FileText size={18} color="var(--teal)" />
                <span>รูปหลักฐานการโอนเงิน / เงินสด</span>
              </h3>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />

              <div
                style={{
                  width: "100%",
                  minHeight: "260px",
                  borderRadius: "1rem",
                  backgroundColor: "#f1f0ea",
                  border: "2px dashed rgba(50, 55, 65, 0.2)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  overflow: "hidden",
                  padding: "0.5rem",
                }}
              >
                {previewUrl || order.slipImageUrl ? (
                  <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <img
                      src={previewUrl || order.slipImageUrl}
                      alt="หลักฐานการชำระเงิน"
                      style={{
                        maxWidth: "100%",
                        maxHeight: "380px",
                        objectFit: "contain",
                        borderRadius: "0.5rem",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        position: "absolute",
                        bottom: "0.75rem",
                        right: "0.75rem",
                        backgroundColor: "rgba(0, 0, 0, 0.75)",
                        backdropFilter: "blur(4px)",
                        color: "#fff",
                        border: "none",
                        borderRadius: "0.5rem",
                        padding: "0.45rem 0.85rem",
                        fontSize: "0.775rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                      }}
                    >
                      <UploadCloud size={15} />
                      <span>{pendingFile ? "เปลี่ยนรูปใหม่" : "เปลี่ยนรูปสลิป"}</span>
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{ textAlign: "center", color: "var(--ink-soft)", padding: "2rem", cursor: "pointer", width: "100%" }}
                  >
                    <AlertTriangle size={36} color="#f59e0b" style={{ margin: "0 auto 0.5rem auto" }} />
                    <p style={{ fontSize: "1rem", fontWeight: 700, margin: 0, color: "var(--ink)" }}>ไม่มีรูปหลักฐาน/สลิปแนบ</p>
                    <p style={{ fontSize: "0.85rem", margin: "0.35rem 0 0 0", color: "var(--teal)", fontWeight: 600 }}>
                      คลิกตรงนี้เพื่ออัปโหลดรูปภาพหลักฐาน
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Admin Manual Status Change Form */}
            <div
              style={{
                backgroundColor: "var(--card)",
                borderRadius: "1.25rem",
                padding: "1.5rem",
                border: "1px solid rgba(50, 55, 65, 0.1)",
                boxShadow: "0 2px 12px rgba(0,0,0,0.03)",
              }}
            >
              <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 700, marginBottom: "0.5rem", color: "var(--ink)" }}>
                สถานะการตรวจสอบ (ปรับโดย Admin):
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as PaymentVerificationStatus)}
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  borderRadius: "0.75rem",
                  border: "1.5px solid rgba(50, 55, 65, 0.2)",
                  backgroundColor: "#fff",
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  color: "var(--ink)",
                  outline: "none",
                  marginBottom: selectedStatus === "fraud" ? "1rem" : "0",
                  cursor: "pointer",
                }}
              >
                <option value="pending">ยังไม่ยืนยัน (รอตรวจสอบ)</option>
                <option value="verified">ยืนยันแล้ว (ถูกต้อง)</option>
                <option value="fraud">เนียนเลยนะครับ (ปฏิเสธ)</option>
              </select>

              {selectedStatus === "fraud" && (
                <div>
                  <label style={{ display: "block", fontSize: "0.825rem", fontWeight: 600, color: "#991b1b", marginBottom: "0.4rem" }}>
                    เหตุผลที่ปฏิเสธ:
                  </label>
                  <textarea
                    value={fraudNote}
                    onChange={(e) => setFraudNote(e.target.value)}
                    placeholder="ระบุเหตุผลที่ปฏิเสธ เช่น สลิปปลอม, ยอดเงินไม่ตรง, สลิปซ้ำ..."
                    rows={3}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      borderRadius: "0.75rem",
                      border: "1.5px solid rgba(239, 68, 68, 0.4)",
                      backgroundColor: "rgba(254, 242, 242, 0.6)",
                      fontSize: "0.875rem",
                      color: "var(--ink)",
                      outline: "none",
                      resize: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: QR-Verify Engine Analysis Results */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div
              style={{
                backgroundColor: "var(--card)",
                borderRadius: "1.25rem",
                padding: "1.5rem",
                border: "1px solid rgba(50, 55, 65, 0.1)",
                boxShadow: "0 2px 12px rgba(0,0,0,0.03)",
                height: "100%",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Sparkles size={20} color="var(--teal)" />
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--ink)", margin: 0 }}>
                    ผลวิเคราะห์อัตโนมัติ (QR-Verify Service)
                  </h3>
                </div>

                {qrVerifyResult && (
                  <button
                    type="button"
                    onClick={() => setShowJsonModal(!showJsonModal)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      padding: "0.35rem 0.65rem",
                      borderRadius: "0.5rem",
                      border: "1px solid rgba(50, 55, 65, 0.15)",
                      backgroundColor: showJsonModal ? "var(--teal)" : "var(--cream)",
                      color: showJsonModal ? "#fff" : "var(--ink)",
                      fontSize: "0.775rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <Code2 size={14} />
                    <span>{showJsonModal ? "ซ่อน JSON" : "ดู JSON Response"}</span>
                  </button>
                )}
              </div>

              {/* JSON Response View Container */}
              {showJsonModal && qrVerifyResult && (
                <div
                  style={{
                    marginBottom: "1.25rem",
                    backgroundColor: "#1e293b",
                    borderRadius: "0.75rem",
                    padding: "1rem",
                    overflow: "hidden",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#94a3b8", fontFamily: "monospace" }}>
                      JSON RESPONSE (API :8586)
                    </span>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(JSON.stringify(qrVerifyResult, null, 2))}
                      style={{
                        fontSize: "0.7rem",
                        padding: "0.15rem 0.45rem",
                        borderRadius: "0.3rem",
                        backgroundColor: "rgba(255,255,255,0.1)",
                        color: "#e2e8f0",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      คัดลอก JSON
                    </button>
                  </div>
                  <pre
                    style={{
                      margin: 0,
                      maxHeight: "260px",
                      overflowY: "auto",
                      fontSize: "0.775rem",
                      color: "#38bdf8",
                      fontFamily: "monospace",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-all",
                    }}
                  >
                    {JSON.stringify(qrVerifyResult, null, 2)}
                  </pre>
                </div>
              )}

              {/* 🛑 Case 1: วิธีชำระเงินเป็น "เงินสด" */}
              {order.paymentMethod === "cash" ? (
                <div
                  style={{
                    backgroundColor: "rgba(245, 158, 11, 0.08)",
                    border: "1px solid rgba(245, 158, 11, 0.25)",
                    borderRadius: "0.85rem",
                    padding: "1.25rem",
                    textAlign: "center",
                    color: "#b45309",
                  }}
                >
                  <Banknote size={32} style={{ margin: "0 auto 0.5rem auto" }} />
                  <p style={{ fontWeight: 700, fontSize: "0.95rem", margin: 0 }}>วิธีชำระเงินนี้คือ "เงินสด"</p>
                  <p style={{ fontSize: "0.825rem", margin: "0.35rem 0 0 0", color: "var(--ink-soft)" }}>
                    ระบบ QR-Verify จะข้ามการสแกนอัตโนมัติ (ไม่ต้องตรวจสอบ QR Code / OCR)
                  </p>
                </div>
              ) : isVerifyingQR ? (
                /* ⏳ Case 2: Loading Analysis */
                <div style={{ padding: "3rem 1rem", textAlign: "center", color: "var(--ink-soft)" }}>
                  <Loader2
                    size={32}
                    style={{
                      margin: "0 auto 0.75rem auto",
                      color: "var(--teal)",
                      animation: "spin 1s linear infinite",
                    }}
                  />
                  <p style={{ fontWeight: 700, fontSize: "0.95rem", margin: 0, color: "var(--ink)" }}>
                    กำลังอ่าน QR Code และ OCR สลิปโอนเงิน...
                  </p>
                  <p style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>ใช้เวลาประมวลผลประมาณ 4-6 วินาที</p>
                </div>
              ) : qrVerifyResult ? (
                /* ✅ Case 3: Display Results */
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {/* Status Summary Banner */}
                  <div
                    style={{
                      padding: "0.85rem 1rem",
                      borderRadius: "0.75rem",
                      backgroundColor: qrVerifyResult.found_qr ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)",
                      border: `1px solid ${qrVerifyResult.found_qr ? "rgba(34, 197, 94, 0.25)" : "rgba(239, 68, 68, 0.25)"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      {qrVerifyResult.found_qr ? (
                        <CheckCircle2 size={20} color="#16a34a" />
                      ) : (
                        <AlertTriangle size={20} color="#dc2626" />
                      )}
                      <div>
                        <span style={{ fontWeight: 700, fontSize: "0.9rem", color: qrVerifyResult.found_qr ? "#15803d" : "#b91c1c" }}>
                          {qrVerifyResult.found_qr ? "พบข้อมูล QR Code สลิปโอนเงิน" : "ไม่พบ QR Code ในภาพสลิป"}
                        </span>
                        {qrVerifyResult.elapsed_seconds && (
                          <div style={{ fontSize: "0.75rem", color: "var(--ink-soft)" }}>
                            ประมวลผลเสร็จใน {qrVerifyResult.elapsed_seconds} วินาที
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* QR Data Summary */}
                  {qrVerifyResult.qr_data && (
                    <div
                      style={{
                        backgroundColor: "var(--cream)",
                        borderRadius: "0.75rem",
                        padding: "1rem",
                        fontSize: "0.85rem",
                        border: "1px solid rgba(50, 55, 65, 0.08)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.75rem",
                      }}
                    >
                      <h4 style={{ fontSize: "0.825rem", fontWeight: 700, color: "var(--ink-soft)", margin: 0, textTransform: "uppercase" }}>
                        ข้อมูลหลักจาก Mini QR
                      </h4>

                      <div style={{ display: "flex", gap: "1rem", alignItems: "center", justifyContent: "space-between" }}>
                        {/* Left Column: Text Info (60% width) */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", width: "58%", flexShrink: 0 }}>
                          <div>
                            <span style={{ color: "var(--ink-soft)", fontSize: "0.75rem" }}>ธนาคารผู้โอน:</span>
                            <p style={{ fontWeight: 600, margin: 0 }}>
                              {qrVerifyResult.qr_data.sender_bank?.name_th || qrVerifyResult.qr_data.sender_bank?.code || "-"}
                            </p>
                          </div>
                          <div>
                            <span style={{ color: "var(--ink-soft)", fontSize: "0.75rem" }}>เลขที่รายการ (Trans Ref):</span>
                            <p className="font-mono" style={{ fontWeight: 600, margin: 0, wordBreak: "break-all" }}>
                              {qrVerifyResult.qr_data.transaction_ref || "-"}
                            </p>
                          </div>
                          <div>
                            <span style={{ color: "var(--ink-soft)", fontSize: "0.75rem" }}>วัน-เวลาในสลิป:</span>
                            <p style={{ fontWeight: 600, margin: 0 }}>{qrVerifyResult.qr_data.date_time || "-"}</p>
                          </div>
                        </div>

                        {/* Right Column: Cropped QR Code Thumbnail (40% width) */}
                        {qrVerifyResult.qr_data.cropped_qr_image && (
                          <div
                            style={{
                              width: "38%",
                              maxWidth: "140px",
                              aspectRatio: "1 / 1",
                              borderRadius: "0.6rem",
                              overflow: "hidden",
                              border: "1px solid rgba(50, 55, 65, 0.15)",
                              backgroundColor: "#fff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
                              padding: "0.25rem",
                            }}
                          >
                            <img
                              src={qrVerifyResult.qr_data.cropped_qr_image}
                              alt="Cropped Mini QR Code"
                              style={{ width: "100%", height: "100%", objectFit: "contain" }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 3. ข้อมูลที่แกะได้จากสลิป (OCR) */}
                  <div
                    style={{
                      backgroundColor: "var(--cream)",
                      borderRadius: "0.75rem",
                      padding: "1.1rem",
                      fontSize: "0.85rem",
                      border: "1px solid rgba(50, 55, 65, 0.08)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                    }}
                  >
                    <div style={{ marginBottom: "0.25rem" }}>
                      <h4 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--ink)", margin: 0 }}>
                        ข้อมูลสลิป (OCR)
                      </h4>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", fontSize: "0.825rem" }}>
                      {/* Left Column */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <span style={{ color: "var(--ink-soft)", minWidth: "60px" }}>ธนาคาร:</span>
                          <span style={{ fontWeight: 600, color: "var(--ink)" }}>
                            {qrVerifyResult.ocr_data?.sender_bank?.name_th || qrVerifyResult.qr_data?.sender_bank?.name_th || "-"}
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <span style={{ color: "var(--ink-soft)", minWidth: "60px" }}>ผู้โอน:</span>
                          <span style={{ fontWeight: 600, color: "var(--ink)" }}>
                            {qrVerifyResult.ocr_data?.sender_name || "-"}
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <span style={{ color: "var(--ink-soft)", minWidth: "60px" }}>ผู้รับ:</span>
                          <span style={{ fontWeight: 600, color: "var(--ink)" }}>
                            {qrVerifyResult.ocr_data?.receiver_name || "-"}
                          </span>
                        </div>
                      </div>

                      {/* Right Column */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <span style={{ color: "var(--ink-soft)", minWidth: "75px" }}>ยอดเงิน:</span>
                          <span style={{ fontWeight: 700, color: "var(--ink)" }}>
                            {qrVerifyResult.ocr_data?.amount !== null && qrVerifyResult.ocr_data?.amount !== undefined
                              ? `฿${qrVerifyResult.ocr_data.amount}`
                              : "-"}
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <span style={{ color: "var(--ink-soft)", minWidth: "75px" }}>วันเวลา:</span>
                          <span style={{ fontWeight: 600, color: "var(--ink)" }}>
                            {qrVerifyResult.ocr_data?.date_time || qrVerifyResult.qr_data?.date_time || "-"}
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <span style={{ color: "var(--ink-soft)", minWidth: "75px" }}>เลขอ้างอิง:</span>
                          <span className="font-mono" style={{ fontWeight: 600, color: "var(--ink)", wordBreak: "break-all" }}>
                            {qrVerifyResult.ocr_data?.transaction_ref || qrVerifyResult.qr_data?.transaction_ref || "-"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ผลการตรวจสอบ (Verification) */}
                  {qrVerifyResult.verification_results && (
                    <div
                      style={{
                        backgroundColor: "var(--cream)",
                        borderRadius: "0.75rem",
                        padding: "1.1rem",
                        border: "1px solid rgba(50, 55, 65, 0.08)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.6rem",
                      }}
                    >
                      <h4 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--ink)", margin: 0 }}>
                        ผลการตรวจสอบ (Verification)
                      </h4>

                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.825rem", marginTop: "0.25rem" }}>
                        {/* 1. ธนาคารผู้โอน */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <div style={{ fontWeight: 600, color: "var(--ink)" }}>ธนาคารผู้โอน:</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--ink-soft)" }}>(QR Code ↔ OCR)</div>
                          </div>
                          <span
                            style={{
                              fontWeight: 700,
                              color: qrVerifyResult.verification_results.is_bank_match === true ? "#16a34a" : qrVerifyResult.verification_results.is_bank_match === false ? "#dc2626" : "var(--ink-soft)",
                            }}
                          >
                            {qrVerifyResult.verification_results.is_bank_match === true ? "ตรงกัน ✓" : qrVerifyResult.verification_results.is_bank_match === false ? "ไม่ตรงกัน ✗" : "ไม่ได้ระบุ"}
                          </span>
                        </div>

                        {/* 2. หมายเลขอ้างอิง */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                          <div style={{ flexShrink: 0 }}>
                            <div style={{ fontWeight: 600, color: "var(--ink)" }}>หมายเลขอ้างอิง:</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--ink-soft)" }}>(QR Code ↔ OCR)</div>
                          </div>
                          <span
                            style={{
                              fontWeight: 700,
                              textAlign: "right",
                              wordBreak: "break-word",
                              color: qrVerifyResult.verification_results.is_ref_match_expected === false
                                ? "#0284c7"
                                : qrVerifyResult.verification_results.is_trans_ref_match === true
                                ? "#16a34a"
                                : qrVerifyResult.verification_results.is_trans_ref_match === false
                                ? "#dc2626"
                                : "var(--ink-soft)",
                            }}
                          >
                            {qrVerifyResult.verification_results.is_ref_match_expected === false
                              ? "ไม่ต้องตรงกัน (ยกเว้น) ✓"
                              : qrVerifyResult.verification_results.is_trans_ref_match === true
                              ? "ตรงกัน ✓"
                              : qrVerifyResult.verification_results.is_trans_ref_match === false
                              ? "ไม่ตรงกัน ✗"
                              : "ไม่ได้ระบุ"}
                          </span>
                        </div>

                        {/* 3. ยอดเงินโอน */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <div style={{ fontWeight: 600, color: "var(--ink)" }}>ยอดเงินโอน:</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--ink-soft)" }}>(OCR ↔ ยอดที่ระบุ)</div>
                          </div>
                          <span
                            style={{
                              fontWeight: 700,
                              color: qrVerifyResult.verification_results.is_amount_match === true ? "#16a34a" : "#dc2626",
                            }}
                          >
                            {qrVerifyResult.verification_results.is_amount_match === true ? "ตรงกัน ✓" : "ไม่ตรงกัน ✗"}
                          </span>
                        </div>

                        {/* 4. ชื่อผู้รับเงิน */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <div style={{ fontWeight: 600, color: "var(--ink)" }}>ชื่อผู้รับเงิน:</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--ink-soft)" }}>(OCR ↔ ชื่อที่ระบุ)</div>
                          </div>
                          <span
                            style={{
                              fontWeight: 700,
                              color: qrVerifyResult.verification_results.is_receiver_match === true ? "#16a34a" : qrVerifyResult.verification_results.is_receiver_match === false ? "#dc2626" : "var(--ink-soft)",
                            }}
                          >
                            {qrVerifyResult.verification_results.is_receiver_match === true ? "ตรงกัน ✓" : qrVerifyResult.verification_results.is_receiver_match === false ? "ไม่ตรงกัน ✗" : "ไม่ได้ระบุ"}
                          </span>
                        </div>

                        {/* 5. การตัดต่อภาพ */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <div style={{ fontWeight: 600, color: "var(--ink)" }}>การตัดต่อภาพ:</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--ink-soft)" }}>(วิเคราะห์ภาพสลิป)</div>
                          </div>
                          <span
                            style={{
                              fontWeight: 700,
                              color: qrVerifyResult.verification_results.is_slip_edited === true ? "#dc2626" : qrVerifyResult.verification_results.is_slip_edited === false ? "#16a34a" : "var(--ink-soft)",
                            }}
                          >
                            {qrVerifyResult.verification_results.is_slip_edited === true ? "พบรอยตัดต่อ ✗" : qrVerifyResult.verification_results.is_slip_edited === false ? "ปกติ ✓" : "ไม่ได้ระบุ"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 📊 5. ประเมินความเสี่ยงสลิปปลอม (Fraud Risk Assessment) */}
                  {(() => {
                    const vr = qrVerifyResult?.verification_results;
                    const foundQr = qrVerifyResult?.found_qr;

                    // Weights for each risk check factor (Total = 100 points)
                    // Higher score = Higher risk of fraud
                    let totalRiskScore = 0;

                    // 1. Missing / Unreadable QR Code (+35 risk score)
                    const qrScore = !foundQr ? 35 : (vr?.crc16_checksum?.is_valid === false ? 35 : 0);
                    // 2. Amount Mismatch (+30 risk score)
                    const amountScore = vr?.is_amount_match === false ? 30 : 0;
                    // 3. Receiver Name Mismatch (+15 risk score)
                    const receiverScore = vr?.is_receiver_match === false ? 15 : 0;
                    // 4. Ref / Bank Mismatch (+10 risk score, except when is_ref_match_expected is false for that bank)
                    const isRefExpected = vr?.is_ref_match_expected !== false;
                    const refPenalty = isRefExpected && vr?.is_trans_ref_match === false;
                    const bankPenalty = vr?.is_bank_match === false;
                    const refScore = (refPenalty || bankPenalty) ? 10 : 0;
                    // 5. Image Tampering / Editing (+10 risk score)
                    const editScore = vr?.is_slip_edited === true ? 10 : 0;

                    totalRiskScore = qrScore + amountScore + receiverScore + refScore + editScore;

                    // Risk Levels:
                    // 0-15%: โอกาสเป็นสลิปปลอมต่ำ
                    // 16-45%: โอกาสเป็นสลิปปลอมสูง
                    // 46-100%: โอกาสเป็นสลิปปลอมสูงมาก !
                    let riskLevelLabel = "โอกาสเป็นสลิปปลอมต่ำ";
                    let riskColor = "#16a34a"; // Green
                    let riskBg = "rgba(34, 197, 94, 0.1)";
                    let riskBorder = "rgba(34, 197, 94, 0.25)";

                    if (totalRiskScore >= 45) {
                      riskLevelLabel = "โอกาสเป็นสลิปปลอมสูงมาก !";
                      riskColor = "#dc2626"; // Red
                      riskBg = "rgba(239, 68, 68, 0.1)";
                      riskBorder = "rgba(239, 68, 68, 0.25)";
                    } else if (totalRiskScore > 15) {
                      riskLevelLabel = "โอกาสเป็นสลิปปลอมสูง";
                      riskColor = "#d97706"; // Amber
                      riskBg = "rgba(245, 158, 11, 0.1)";
                      riskBorder = "rgba(245, 158, 11, 0.25)";
                    }

                    return (
                      <div
                        style={{
                          backgroundColor: "var(--cream)",
                          borderRadius: "0.75rem",
                          padding: "1.1rem",
                          border: "1px solid rgba(50, 55, 65, 0.08)",
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.75rem",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <h4 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--ink)", margin: 0 }}>
                            การประเมินความเสี่ยงสลิปปลอม (Fraud Risk Assessment)
                          </h4>
                          <span
                            style={{
                              fontSize: "0.775rem",
                              fontWeight: 700,
                              padding: "0.25rem 0.65rem",
                              borderRadius: "0.4rem",
                              backgroundColor: riskBg,
                              color: riskColor,
                              border: `1px solid ${riskBorder}`,
                            }}
                          >
                            {riskLevelLabel}
                          </span>
                        </div>

                        {/* Progress / Risk Bar */}
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.775rem", marginBottom: "0.35rem", fontWeight: 600 }}>
                            <span style={{ color: "var(--ink-soft)" }}>ระดับความเสี่ยงสะสม:</span>
                            <span style={{ color: riskColor, fontWeight: 700 }}>{totalRiskScore}%</span>
                          </div>
                          <div
                            style={{
                              width: "100%",
                              height: "10px",
                              backgroundColor: "rgba(50, 55, 65, 0.1)",
                              borderRadius: "5px",
                              overflow: "hidden",
                              position: "relative",
                            }}
                          >
                            <div
                              style={{
                                width: `${Math.min(Math.max(totalRiskScore, 5), 100)}%`,
                                height: "100%",
                                backgroundColor: riskColor,
                                borderRadius: "5px",
                                transition: "width 0.4s ease, background-color 0.4s ease",
                              }}
                            />
                          </div>
                        </div>

                        {/* Weight Breakdown Chips */}
                        <div style={{ fontSize: "0.75rem", color: "var(--ink-soft)", display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.1rem" }}>
                          <span style={{ padding: "0.15rem 0.45rem", borderRadius: "0.3rem", backgroundColor: qrScore > 0 ? "rgba(239,68,68,0.12)" : "rgba(34,197,94,0.12)", color: qrScore > 0 ? "#dc2626" : "#16a34a" }}>
                            QR Code / CRC: {qrScore > 0 ? `+${qrScore}%` : "0% ✓"}
                          </span>
                          <span style={{ padding: "0.15rem 0.45rem", borderRadius: "0.3rem", backgroundColor: amountScore > 0 ? "rgba(239,68,68,0.12)" : "rgba(34,197,94,0.12)", color: amountScore > 0 ? "#dc2626" : "#16a34a" }}>
                            ยอดเงิน: {amountScore > 0 ? `+${amountScore}%` : "0% ✓"}
                          </span>
                          <span style={{ padding: "0.15rem 0.45rem", borderRadius: "0.3rem", backgroundColor: receiverScore > 0 ? "rgba(239,68,68,0.12)" : "rgba(34,197,94,0.12)", color: receiverScore > 0 ? "#dc2626" : "#16a34a" }}>
                            ชื่อผู้รับ: {receiverScore > 0 ? `+${receiverScore}%` : "0% ✓"}
                          </span>
                          <span style={{ padding: "0.15rem 0.45rem", borderRadius: "0.3rem", backgroundColor: refScore > 0 ? "rgba(239,68,68,0.12)" : "rgba(34,197,94,0.12)", color: refScore > 0 ? "#dc2626" : "#16a34a" }}>
                            เลขอ้างอิง/ธนาคาร: {refScore > 0 ? `+${refScore}%` : "0% ✓"}
                          </span>
                          <span style={{ padding: "0.15rem 0.45rem", borderRadius: "0.3rem", backgroundColor: editScore > 0 ? "rgba(239,68,68,0.12)" : "rgba(34,197,94,0.12)", color: editScore > 0 ? "#dc2626" : "#16a34a" }}>
                            รอยตัดต่อ: {editScore > 0 ? `+${editScore}%` : "0% ✓"}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                /* Case 4: Initial empty state prior to scanning */
                <div style={{ textAlign: "center", color: "var(--ink-soft)", padding: "3rem 1rem" }}>
                  <ShieldCheck size={36} color="var(--teal)" style={{ margin: "0 auto 0.5rem auto" }} />
                  <p style={{ fontWeight: 700, fontSize: "0.95rem", margin: 0, color: "var(--ink)" }}>
                    ยังไม่มีรูปสลิปเพื่อทำการวิเคราะห์
                  </p>
                  <p style={{ fontSize: "0.825rem", margin: "0.35rem 0 0 0" }}>
                    อัปโหลดรูปภาพสลิปที่ด้านซ้ายเพื่อสแกน QR Code อัตโนมัติ
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <style jsx>{`
          .admin-main-wrapper {
            padding: 1.75rem 2.5rem;
          }
          .inspection-main-grid {
            display: grid;
            grid-template-columns: 1fr 1.1fr;
            gap: 1.5rem;
          }
          .inspection-top-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 1.5rem;
            gap: 1rem;
          }
          .qr-data-subgrid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.5rem;
          }

          @media (max-width: 1024px) {
            .admin-main-wrapper {
              padding: 1.25rem 1.5rem;
            }
            .inspection-main-grid {
              grid-template-columns: 1fr !important;
            }
          }

          @media (max-width: 640px) {
            .admin-main-wrapper {
              padding: 1rem;
            }
            .inspection-top-header {
              flex-direction: column;
              align-items: stretch;
            }
            .inspection-header-right {
              width: 100%;
            }
            .inspection-header-right button {
              width: 100%;
              justify-content: center;
            }
          }

          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </main>
    </div>
  );
}
