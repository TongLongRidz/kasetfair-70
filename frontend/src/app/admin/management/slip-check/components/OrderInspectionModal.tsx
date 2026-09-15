"use client";

import React, { useRef, useState } from "react";
import { X, CheckCircle2, Clock, AlertTriangle, UploadCloud, Loader2, QrCode, Banknote } from "lucide-react";
import { SlipOrderItem, PaymentVerificationStatus } from "../page";

interface OrderInspectionModalProps {
  order: SlipOrderItem;
  onClose: () => void;
  onSetStatus: (orderId: number, status: PaymentVerificationStatus, note?: string) => void;
  onOpenFraudReasonModal: (order: SlipOrderItem) => void;
  onUploadSlip: (orderId: number, file: File) => Promise<void>;
}

export default function OrderInspectionModal({
  order,
  onClose,
  onSetStatus,
  onOpenFraudReasonModal,
  onUploadSlip,
}: OrderInspectionModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<PaymentVerificationStatus>(order.paymentStatus || "pending");
  const [fraudNote, setFraudNote] = useState<string>(order.statusNote || "");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) {
      alert("กรุณาเลือกไฟล์รูปภาพเท่านั้น");
      return;
    }
    setIsUploading(true);
    try {
      await onUploadSlip(order.id, file);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = () => {
    if (selectedStatus === "fraud" && !fraudNote.trim()) {
      alert("กรุณาระบุข้อสงสัย/เหตุผลที่เลือก 'เนียนเลยนะครับ'");
      return;
    }
    onSetStatus(order.id, selectedStatus, selectedStatus === "fraud" ? fraudNote.trim() : undefined);
    onClose();
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
            padding: "1rem",
            marginBottom: "1.25rem",
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "0.75rem",
            fontSize: "0.85rem",
          }}
        >
          <div>
            <span style={{ color: "var(--ink-soft)", fontSize: "0.75rem" }}>หมายเลขคิว</span>
            <p style={{ margin: 0, fontSize: "1rem", color: "var(--ink)", fontWeight: 800, lineHeight: 1.3, marginTop: "0.2rem" }}>
              {order.queueNo}
            </p>
          </div>

          <div>
            <span style={{ color: "var(--ink-soft)", fontSize: "0.75rem" }}>วิธีชำระเงิน</span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginTop: "0.25rem", fontWeight: 700, color: "var(--ink)" }}>
              {order.paymentMethod === "promptpay_qr" ? (
                <>
                  <QrCode size={16} color="var(--teal)" />
                  <span>พร้อมเพย์ QR</span>
                </>
              ) : (
                <>
                  <Banknote size={16} color="#b45309" />
                  <span>เงินสด</span>
                </>
              )}
            </div>
          </div>

          <div>
            <span style={{ color: "var(--ink-soft)", fontSize: "0.75rem" }}>ยอดที่ต้องชำระ</span>
            <p style={{ margin: 0, fontSize: "1rem", color: "var(--ink)", fontWeight: 800, lineHeight: 1.3, marginTop: "0.2rem" }}>
              ฿{order.total}
            </p>
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <span style={{ color: "var(--ink-soft)", fontSize: "0.75rem" }}>รายการสั่งซื้อ</span>
            <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--ink)" }}>{order.itemsSummary}</p>
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
            {isUploading ? (
              <div style={{ textAlign: "center", color: "var(--teal)", padding: "1.5rem" }}>
                <Loader2 size={32} className="animate-spin" style={{ margin: "0 auto 0.5rem auto" }} />
                <p style={{ fontSize: "0.9rem", fontWeight: 600, margin: 0 }}>กำลังอัพโหลดรูปสลิป...</p>
              </div>
            ) : order.slipImageUrl ? (
              /* Display real slip image if uploaded */
              <img
                src={order.slipImageUrl}
                alt="สลิปโอนเงิน"
                style={{
                  maxWidth: "100%",
                  maxHeight: "360px",
                  objectFit: "contain",
                  borderRadius: "0.5rem",
                }}
              />
            ) : (
              /* No slip attached fallback with direct upload click */
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{ textAlign: "center", color: "var(--ink-soft)", padding: "1.5rem", cursor: "pointer", width: "100%" }}
              >
                <AlertTriangle size={32} color="#f59e0b" style={{ margin: "0 auto 0.5rem auto" }} />
                <p style={{ fontSize: "0.95rem", fontWeight: 700, margin: 0, color: "var(--ink)" }}>ไม่มีรูปหลักฐาน/สลิปแนบ</p>
                <p style={{ fontSize: "0.8rem", margin: "0.35rem 0 0 0", color: "var(--teal)", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.25rem" }}>
                  <span>คลิกตรงนี้เพื่ออัพโหลดรูปภาพ</span>
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
              onClick={handleSave}
              style={{
                padding: "0.65rem 1.5rem",
                borderRadius: "0.75rem",
                border: "none",
                backgroundColor: "var(--teal)",
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.875rem",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(75, 155, 140, 0.35)",
              }}
            >
              บันทึก
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
