"use client";

import React, { useRef, useState } from "react";
import { X, CheckCircle2, Clock, AlertTriangle, UploadCloud, Loader2, QrCode, Banknote } from "lucide-react";
import { SlipOrderItem, PaymentVerificationStatus } from "../page";

interface OrderInspectionModalProps {
  order: SlipOrderItem;
  onClose: () => void;
  onSetStatus: (orderId: number, status: PaymentVerificationStatus, note?: string) => void;
  onUploadSlip: (orderId: number, file: File) => Promise<void>;
}

export default function OrderInspectionModal({
  order,
  onClose,
  onSetStatus,
  onUploadSlip,
}: OrderInspectionModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<PaymentVerificationStatus>(order.paymentStatus || "pending");
  const [fraudNote, setFraudNote] = useState<string>(order.statusNote || "");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const initialStatus = order.paymentStatus || "pending";
  const initialNote = order.statusNote || "";
  const isStatusOrNoteChanged = selectedStatus !== initialStatus || (selectedStatus === "fraud" && fraudNote.trim() !== initialNote.trim());
  const isChanged = pendingFile !== null || isStatusOrNoteChanged;

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
  };

  const handleSave = async () => {
    if (selectedStatus === "fraud" && !fraudNote.trim()) {
      alert("กรุณาระบุข้อสงสัย/เหตุผลที่เลือก 'เนียนเลยนะครับ'");
      return;
    }

    setIsSaving(true);
    try {
      if (pendingFile) {
        await onUploadSlip(order.id, pendingFile);
      }
      if (isStatusOrNoteChanged) {
        onSetStatus(order.id, selectedStatus, selectedStatus === "fraud" ? fraudNote.trim() : undefined);
      }
      onClose();
    } catch (err) {
      console.error("Failed to save changes:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="animate-fade-in"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
      }}
      onClick={onClose}
    >
      <div
        className="animate-rise"
        style={{
          width: "100%",
          maxWidth: "580px",
          backgroundColor: "var(--card)",
          borderRadius: "1.5rem",
          padding: "1.75rem",
          boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
          border: "1px solid rgba(50, 55, 65, 0.12)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
          <div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--ink)", marginTop: "0.25rem" }}>
              ตรวจสอบ<br className="mobile-break" />หลักฐานการชำระเงิน
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: "2rem",
              height: "2rem",
              borderRadius: "50%",
              border: "none",
              backgroundColor: "var(--cream)",
              color: "var(--ink-soft)",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Order Info (Queue, Payment Method, Total, & Items) */}
        <div
          style={{
            backgroundColor: "var(--cream)",
            borderRadius: "1rem",
            padding: "1.1rem 1.25rem",
            marginBottom: "1.25rem",
            display: "grid",
            gridTemplateColumns: "1.1fr 1.3fr 1.1fr",
            gap: "0.75rem",
            alignItems: "center",
          }}
        >
          <div>
            <span style={{ color: "var(--ink-soft)", fontSize: "0.75rem", fontWeight: 600 }}>หมายเลขคิว</span>
            <p style={{ margin: 0, fontSize: "1.6rem", color: "var(--ink)", fontWeight: 800, lineHeight: 1.1, marginTop: "0.2rem" }}>
              {order.queueNo}
            </p>
          </div>

          <div>
            <span style={{ color: "var(--ink-soft)", fontSize: "0.75rem", fontWeight: 600 }}>วิธีชำระเงิน</span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginTop: "0.3rem", fontWeight: 700, color: "var(--ink)", fontSize: "0.9rem", whiteSpace: "nowrap" }}>
              {order.paymentMethod === "promptpay_qr" ? (
                <>
                  <QrCode size={17} color="var(--teal)" style={{ flexShrink: 0 }} />
                  <span>พร้อมเพย์ QR</span>
                </>
              ) : (
                <>
                  <Banknote size={17} color="#b45309" style={{ flexShrink: 0 }} />
                  <span>เงินสด</span>
                </>
              )}
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <span style={{ color: "var(--ink-soft)", fontSize: "0.75rem", fontWeight: 600 }}>ยอดที่ต้องชำระ</span>
            <p style={{ margin: 0, fontSize: "1.5rem", color: "var(--ink)", fontWeight: 800, lineHeight: 1.1, marginTop: "0.2rem" }}>
              ฿{order.total}
            </p>
          </div>

          <div style={{ gridColumn: "1 / -1", paddingTop: "0.5rem", borderTop: "1px dashed rgba(50, 55, 65, 0.12)", marginTop: "0.25rem" }}>
            <span style={{ color: "var(--ink-soft)", fontSize: "0.775rem", fontWeight: 700, display: "block", marginBottom: "0.4rem" }}>รายการสั่งซื้อ</span>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
              {order.itemsDetail && order.itemsDetail.length > 0 ? (
                order.itemsDetail.map((item, idx) => (
                  <div key={idx} style={{ fontSize: "0.875rem", color: "var(--ink)" }}>
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
                <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--ink)", fontWeight: 500 }}>{order.itemsSummary}</p>
              )}
            </div>
          </div>
        </div>

        {/* Slip / Evidence Box */}
        <div style={{ marginBottom: "1.25rem" }}>
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
              minHeight: "220px",
              maxHeight: "380px",
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
              /* Display slip image (from local preview or existing uploaded URL) */
              <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <img
                  src={previewUrl || order.slipImageUrl}
                  alt="สลิปโอนเงิน"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "360px",
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
                    backgroundColor: "rgba(0, 0, 0, 0.7)",
                    backdropFilter: "blur(4px)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "0.5rem",
                    padding: "0.4rem 0.75rem",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                  }}
                >
                  <UploadCloud size={14} />
                  <span>{pendingFile ? "เปลี่ยนรูปใหม่" : "เปลี่ยนรูปสลิป"}</span>
                </button>
              </div>
            ) : (
              /* No slip attached fallback with direct upload click */
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{ textAlign: "center", color: "var(--ink-soft)", padding: "1.5rem", cursor: "pointer", width: "100%" }}
              >
                <AlertTriangle size={32} color="#f59e0b" style={{ margin: "0 auto 0.5rem auto" }} />
                <p style={{ fontSize: "0.95rem", fontWeight: 700, margin: 0, color: "var(--ink)" }}>ไม่มีรูปหลักฐาน/สลิปแนบ</p>
                <p style={{ fontSize: "0.8rem", margin: "0.35rem 0 0 0", color: "var(--teal)", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.25rem" }}>
                  <span>คลิกตรงนี้เพื่อเลือกรูปภาพ</span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Change Status Form Section (Dropdown + Textarea + Save Button) */}
        <div style={{ borderTop: "1px solid rgba(50, 55, 65, 0.1)", paddingTop: "1.25rem" }}>
          <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.5rem", color: "var(--ink)" }}>
            สถานะการตรวจสอบ:
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
              fontSize: "0.9rem",
              fontWeight: 600,
              color: "var(--ink)",
              outline: "none",
              marginBottom: "1rem",
              cursor: "pointer",
            }}
          >
            <option value="pending">ยังไม่ยืนยัน</option>
            <option value="verified">ยืนยันแล้ว</option>
            <option value="fraud">เนียนเลยนะครับ</option>
          </select>

          {/* Textarea appears when 'เนียนเลยนะครับ' (fraud) is selected */}
          {selectedStatus === "fraud" && (
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", fontSize: "0.825rem", fontWeight: 600, color: "#991b1b", marginBottom: "0.4rem" }}>
                เหตุผล:
              </label>
              <textarea
                value={fraudNote}
                onChange={(e) => setFraudNote(e.target.value)}
                placeholder="ระบุเหตุผลที่ปฏิเสธสลิป เช่น ยอดเงินไม่ตรง, สลิปซ้ำ..."
                rows={3}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: "0.75rem",
                  border: "1.5px solid rgba(239, 68, 68, 0.4)",
                  backgroundColor: "rgba(254, 242, 242, 0.6)",
                  fontSize: "0.85rem",
                  color: "var(--ink)",
                  outline: "none",
                  resize: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          )}

          {/* Save & Cancel Action Buttons */}
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
            <button
              type="button"
              disabled={isSaving}
              onClick={onClose}
              style={{
                padding: "0.65rem 1.25rem",
                borderRadius: "0.75rem",
                border: "1px solid rgba(50, 55, 65, 0.2)",
                backgroundColor: "transparent",
                color: "var(--ink-soft)",
                fontWeight: 600,
                fontSize: "0.875rem",
                cursor: "pointer",
              }}
            >
              ยกเลิก
            </button>
            <button
              type="button"
              disabled={!isChanged || isSaving}
              onClick={handleSave}
              style={{
                padding: "0.65rem 1.5rem",
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
                <span>บันทึก</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
