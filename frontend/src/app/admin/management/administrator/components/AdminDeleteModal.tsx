"use client";

import React from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { AdminUser } from "@/lib/auth";

interface AdminDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  selectedAdmin: AdminUser | null;
  deleteConfirmText: string;
  setDeleteConfirmText: (v: string) => void;
  deleteError: string | null;
  isSubmitting: boolean;
}

export default function AdminDeleteModal({
  isOpen,
  onClose,
  onSubmit,
  selectedAdmin,
  deleteConfirmText,
  setDeleteConfirmText,
  deleteError,
  isSubmitting,
}: AdminDeleteModalProps) {
  if (!isOpen || !selectedAdmin) return null;

  return (
    <div
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
          padding: "1.75rem",
          boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "#dc2626", marginBottom: "1rem" }}>
          <div
            style={{
              width: "2.5rem",
              height: "2.5rem",
              borderRadius: "0.75rem",
              backgroundColor: "rgba(220, 38, 38, 0.12)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <AlertTriangle size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--ink)" }}>ยืนยันการลบบัญชีแอดมิน</h2>
            <p style={{ fontSize: "0.8rem", color: "var(--ink-soft)" }}>การดำเนินการนี้ไม่สามารถยกเลิกได้</p>
          </div>
        </div>

        <p style={{ fontSize: "0.875rem", color: "var(--ink)", lineHeight: 1.5, marginBottom: "1rem" }}>
          คุณกำลังจะลบบัญชีของ <strong>{selectedAdmin.name}</strong> (<code>@{selectedAdmin.username}</code>)
        </p>

        {deleteError && (
          <div
            style={{
              padding: "0.65rem 0.85rem",
              borderRadius: "0.6rem",
              backgroundColor: "rgba(220, 38, 38, 0.08)",
              border: "1px solid rgba(220, 38, 38, 0.2)",
              color: "#b91c1c",
              fontSize: "0.85rem",
              marginBottom: "1rem",
            }}
          >
            {deleteError}
          </div>
        )}

        <form onSubmit={onSubmit}>
          <label style={{ display: "block", fontSize: "0.825rem", color: "var(--ink-soft)", marginBottom: "0.4rem" }}>
            พิมพ์ <strong style={{ color: "#dc2626" }}>delete this admin</strong> เพื่อยืนยัน:
          </label>
          <input
            type="text"
            required
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder="delete this admin"
            style={{
              width: "100%",
              padding: "0.65rem 0.85rem",
              borderRadius: "0.6rem",
              backgroundColor: "var(--cream)",
              border: "1px solid rgba(220, 38, 38, 0.3)",
              fontFamily: "inherit",
              fontSize: "0.9rem",
              outline: "none",
              marginBottom: "1.25rem",
            }}
          />

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "0.6rem 1.25rem",
                borderRadius: "0.6rem",
                backgroundColor: "var(--cream)",
                border: "1px solid rgba(50, 55, 65, 0.15)",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: "0.875rem",
              }}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !deleteConfirmText.trim()}
              style={{
                padding: "0.6rem 1.25rem",
                borderRadius: "0.6rem",
                backgroundColor: "#dc2626",
                color: "#fff",
                border: "none",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                fontWeight: 600,
                fontSize: "0.875rem",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                opacity: deleteConfirmText.trim() ? 1 : 0.6,
              }}
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
              ยืนยันการลบบัญชี
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
