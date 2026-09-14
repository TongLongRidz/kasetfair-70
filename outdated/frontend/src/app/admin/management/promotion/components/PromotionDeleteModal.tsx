"use client";

import React from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

interface PromotionDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  promotionName: string;
  isSubmitting: boolean;
  deleteError?: string | null;
}

export default function PromotionDeleteModal({
  isOpen,
  onClose,
  onSubmit,
  promotionName,
  isSubmitting,
  deleteError = null,
}: PromotionDeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="animate-fade-in"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(4px)",
        display: "grid",
        placeItems: "center",
        zIndex: 100,
        padding: "1rem",
      }}
    >
      <div
        className="animate-rise"
        style={{
          backgroundColor: "var(--card)",
          borderRadius: "1.25rem",
          maxWidth: "440px",
          width: "100%",
          padding: "1.5rem",
          boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
          border: "1px solid rgba(50, 55, 65, 0.1)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "var(--crimson)", marginBottom: "0.75rem" }}>
          <div
            style={{
              width: "2.5rem",
              height: "2.5rem",
              borderRadius: "0.75rem",
              backgroundColor: "rgba(239, 68, 68, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0, color: "var(--ink)" }}>ยืนยันการลบโปรโมชั่น</h3>
            <p style={{ fontSize: "0.8rem", color: "var(--ink-soft)", margin: 0 }}>การดำเนินการนี้ไม่สามารถยกเลิกได้</p>
          </div>
        </div>

        <p style={{ fontSize: "0.875rem", color: "var(--ink)", lineHeight: 1.5, marginBottom: "1rem" }}>
          คุณต้องการลบโปรโมชั่น <strong style={{ color: "var(--crimson)" }}>"{promotionName}"</strong> ใช่หรือไม่? ประวัติการแลกสิทธิ์ที่เกี่ยวข้องจะถูกลบออกจากระบบด้วย
        </p>

        {deleteError && (
          <div
            style={{
              padding: "0.5rem 0.75rem",
              borderRadius: "0.5rem",
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              color: "var(--crimson)",
              fontSize: "0.8rem",
              marginBottom: "1rem",
            }}
          >
            {deleteError}
          </div>
        )}

        <form onSubmit={onSubmit} style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem" }}>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              padding: "0.5rem 1.1rem",
              borderRadius: "0.5rem",
              border: "1px solid rgba(50, 55, 65, 0.15)",
              backgroundColor: "transparent",
              color: "var(--ink)",
              cursor: "pointer",
              fontFamily: "'Kanit', sans-serif",
              fontSize: "0.85rem",
              fontWeight: 500,
            }}
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.5rem 1.35rem",
              borderRadius: "0.5rem",
              border: "none",
              backgroundColor: "var(--crimson)",
              color: "#fff",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              fontFamily: "'Kanit', sans-serif",
              fontSize: "0.85rem",
              fontWeight: 600,
              boxShadow: "0 2px 8px rgba(239, 68, 68, 0.25)",
            }}
          >
            {isSubmitting && <Loader2 size={15} className="animate-spin" />}
            <span>ยืนยันลบ</span>
          </button>
        </form>
      </div>
    </div>
  );
}
