"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";
import { SlipOrderItem } from "../page";

interface FraudReasonModalProps {
  targetOrder: SlipOrderItem;
  reason: string;
  onChangeReason: (val: string) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function FraudReasonModal({
  targetOrder,
  reason,
  onChangeReason,
  onClose,
  onSubmit,
}: FraudReasonModalProps) {
  return (
    <div
      className="animate-fade-in"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 110,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
      }}
      onClick={onClose}
    >
      <form
        onSubmit={onSubmit}
        className="animate-rise"
        style={{
          width: "100%",
          maxWidth: "460px",
          backgroundColor: "var(--card)",
          borderRadius: "1.5rem",
          padding: "1.75rem",
          boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
          border: "2px solid #b91c1c",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#b91c1c", marginBottom: "0.5rem" }}>
          <AlertTriangle size={24} />
          <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0 }}>
            ระบุเหตุผล (เนียนเลยนะครับ)
          </h3>
        </div>
        <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)", marginBottom: "1rem" }}>
          คิว <strong className="font-mono">{targetOrder.queueNo}</strong> โดย {targetOrder.customerName}
        </p>

        <label style={{ display: "block", fontSize: "0.825rem", fontWeight: 700, marginBottom: "0.4rem" }}>
          กรุณาระบุเหตุผลที่ปฏิเสธสลิป / พบความผิดปกติ: <span style={{ color: "#b91c1c" }}>*</span>
        </label>
        <textarea
          required
          rows={3}
          value={reason}
          onChange={(e) => onChangeReason(e.target.value)}
          placeholder="เช่น สลิปปลอม, ยอดเงินไม่เข้าบัญชี, ใช้สลิปเก่าซ้ำ, สลิปตัดต่อ..."
          style={{
            width: "100%",
            borderRadius: "0.75rem",
            backgroundColor: "var(--cream)",
            border: "1px solid rgba(50, 55, 65, 0.2)",
            padding: "0.75rem",
            fontSize: "0.875rem",
            fontFamily: "'Kanit', sans-serif",
            outline: "none",
            color: "var(--ink)",
            boxSizing: "border-box",
            marginBottom: "1.25rem",
          }}
        />

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "0.6rem 1rem",
              borderRadius: "0.6rem",
              backgroundColor: "var(--cream)",
              border: "1px solid rgba(50, 55, 65, 0.15)",
              color: "var(--ink)",
              fontWeight: 600,
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            style={{
              padding: "0.6rem 1.25rem",
              borderRadius: "0.6rem",
              backgroundColor: "#991b1b",
              border: "none",
              color: "#fff",
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            บันทึกสถานะเนียนเลยนะครับ
          </button>
        </div>
      </form>
    </div>
  );
}
