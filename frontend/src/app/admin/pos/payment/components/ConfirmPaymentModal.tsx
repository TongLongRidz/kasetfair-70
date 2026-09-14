"use client";

import React from "react";
import {
  CheckCircle2,
  X,
  Banknote,
  QrCode,
  AlertCircle,
  Receipt,
  FileCheck,
  ShoppingBag,
} from "lucide-react";

export interface CartItemSummary {
  cartId: string;
  productName: string;
  temperature: "iced" | "hot";
  sweetness: string;
  toppings?: { name: string }[];
  quantity: number;
  unitPrice: number;
  note?: string;
}

interface ConfirmPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  paymentMethod: "cash" | "promptpay";
  totalAmount: number;
  totalCups: number;
  cart?: CartItemSummary[];
  cashReceived?: number;
  change?: number;
  slipImage?: string | null;
  slipUploadMode?: "immediate" | "later";
  isLoading?: boolean;
}

export default function ConfirmPaymentModal({
  isOpen,
  onClose,
  onConfirm,
  paymentMethod,
  totalAmount,
  totalCups,
  cart = [],
  cashReceived = 0,
  change = 0,
  slipImage,
  slipUploadMode = "immediate",
  isLoading = false,
}: ConfirmPaymentModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="animate-fade-in"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 150,
        padding: "1rem",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onClose();
      }}
    >
      <div
        className="animate-modal-pop"
        style={{
          backgroundColor: "var(--card)",
          borderRadius: "1.5rem",
          width: "100%",
          maxWidth: "480px",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: "1.75rem",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
          border: "1px solid rgba(50, 55, 65, 0.1)",
          fontFamily: "'Kanit', sans-serif",
          color: "var(--ink)",
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingBottom: "0.85rem",
            borderBottom: "1px solid rgba(50, 55, 65, 0.08)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "0.65rem",
                backgroundColor: "rgba(75, 155, 140, 0.12)",
                color: "var(--teal)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Receipt size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800, lineHeight: 1.2 }}>
                ยืนยันการชำระเงิน
              </h3>
              <p style={{ fontSize: "0.775rem", color: "var(--ink-soft)" }}>
                กรุณาตรวจสอบยอดเงินก่อนบันทึกออเดอร์
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              border: "none",
              backgroundColor: "rgba(50, 55, 65, 0.06)",
              color: "var(--ink-soft)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: isLoading ? "not-allowed" : "pointer",
              transition: "background-color 0.15s ease",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Payment Summary Banner */}
        <div
          style={{
            backgroundColor: "var(--cream)",
            borderRadius: "1rem",
            padding: "1rem 1.25rem",
            border: "1px solid rgba(50, 55, 65, 0.08)",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          }}
        >
          {/* Method badge & total */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  padding: "0.2rem 0.6rem",
                  borderRadius: "9999px",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  backgroundColor: paymentMethod === "cash" ? "rgba(220, 160, 50, 0.15)" : "rgba(75, 155, 140, 0.15)",
                  color: paymentMethod === "cash" ? "var(--warm)" : "var(--teal)",
                }}
              >
                {paymentMethod === "cash" ? <Banknote size={14} /> : <QrCode size={14} />}
                {paymentMethod === "cash" ? "เงินสด (Cash)" : "พร้อมเพย์ QR"}
              </span>
            </div>

            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--ink-soft)", display: "block" }}>
                ยอดรวมสุทธิ ({totalCups} แก้ว)
              </span>
              <span className="font-display" style={{ fontSize: "1.75rem", fontWeight: 900, color: "var(--teal)", lineHeight: 1 }}>
                ฿{totalAmount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Cash Details if Cash */}
          {paymentMethod === "cash" && (
            <div
              style={{
                paddingTop: "0.75rem",
                borderTop: "1px dashed rgba(50, 55, 65, 0.12)",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.5rem",
              }}
            >
              <div style={{ backgroundColor: "#fff", padding: "0.6rem 0.85rem", borderRadius: "0.6rem", border: "1px solid rgba(50,55,65,0.08)" }}>
                <span style={{ fontSize: "0.725rem", color: "var(--ink-soft)", display: "block" }}>
                  รับเงินสดมา
                </span>
                <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--ink)" }}>
                  ฿{cashReceived.toLocaleString()}
                </span>
              </div>

              <div style={{ backgroundColor: "rgba(75, 155, 140, 0.08)", padding: "0.6rem 0.85rem", borderRadius: "0.6rem", border: "1px solid rgba(75, 155, 140, 0.2)" }}>
                <span style={{ fontSize: "0.725rem", color: "var(--teal)", fontWeight: 600, display: "block" }}>
                  เงินทอน
                </span>
                <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--teal)" }}>
                  ฿{change.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* PromptPay Slip Details if PromptPay */}
          {paymentMethod === "promptpay" && (
            <div
              style={{
                paddingTop: "0.75rem",
                borderTop: "1px dashed rgba(50, 55, 65, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "0.75rem",
              }}
            >
              {slipImage ? (
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <div style={{ width: "38px", height: "38px", borderRadius: "0.45rem", overflow: "hidden", border: "1px solid rgba(0,0,0,0.1)", flexShrink: 0 }}>
                    <img src={slipImage} alt="Slip" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div>
                    <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#16a34a", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <CheckCircle2 size={13} /> แนบสลิปแล้ว
                    </span>
                    <span style={{ fontSize: "0.7rem", color: "var(--ink-soft)" }}>
                      ตรวจสลิปเรียบร้อย
                    </span>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <AlertCircle size={15} color={slipUploadMode === "immediate" ? "#dc2626" : "#f59e0b"} />
                  <span style={{ fontSize: "0.8rem", color: slipUploadMode === "immediate" ? "#dc2626" : "var(--ink-soft)", fontWeight: 600 }}>
                    {slipUploadMode === "immediate" ? "ยังไม่ได้แนบสลิป" : "ไม่ได้แนบสลิป (บันทึก-ตรวจภายหลัง)"}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>


        {/* Action Buttons */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: "0.75rem", paddingTop: "0.5rem" }}>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            style={{
              padding: "0.8rem",
              borderRadius: "0.75rem",
              border: "1px solid rgba(50, 55, 65, 0.15)",
              backgroundColor: "var(--cream)",
              color: "var(--ink)",
              fontWeight: 600,
              fontSize: "0.875rem",
              cursor: isLoading ? "not-allowed" : "pointer",
              transition: "background-color 0.15s ease",
            }}
          >
            ยกเลิก
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            style={{
              padding: "0.8rem",
              borderRadius: "0.75rem",
              border: "none",
              backgroundColor: "var(--teal)",
              color: "#fff",
              fontWeight: 800,
              fontSize: "0.95rem",
              cursor: isLoading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.45rem",
              boxShadow: "0 4px 15px rgba(75, 155, 140, 0.35)",
              transition: "transform 0.15s ease, background-color 0.15s ease",
            }}
          >
            <CheckCircle2 size={18} />
            <span>{isLoading ? "กำลังบันทึก..." : "ยืนยัน"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
