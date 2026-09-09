"use client";

import React from "react";
import { X, Loader2, ShieldCheck, User } from "lucide-react";
import { AdminUser } from "@/lib/auth";

interface AdminFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  mode: "create" | "edit";
  selectedAdmin: AdminUser | null;
  formUsername: string;
  setFormUsername: (v: string) => void;
  formName: string;
  setFormName: (v: string) => void;
  formPassword: string;
  setFormPassword: (v: string) => void;
  formIsActivate: boolean;
  setFormIsActivate: (v: boolean) => void;
  formIsSuperadmin: boolean;
  setFormIsSuperadmin: (v: boolean) => void;
  isCurrentSuper: boolean;
  formError: string | null;
  isSubmitting: boolean;
}

export default function AdminFormModal({
  isOpen,
  onClose,
  onSubmit,
  mode,
  selectedAdmin,
  formUsername,
  setFormUsername,
  formName,
  setFormName,
  formPassword,
  setFormPassword,
  formIsActivate,
  setFormIsActivate,
  formIsSuperadmin,
  setFormIsSuperadmin,
  isCurrentSuper,
  formError,
  isSubmitting,
}: AdminFormModalProps) {
  if (!isOpen) return null;

  const isEdit = mode === "edit";

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
          maxWidth: "480px",
          width: "100%",
          padding: "1.75rem",
          boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0, color: "var(--ink)" }}>
              {isEdit ? "แก้ไขข้อมูลแอดมิน" : "สร้างแอดมินใหม่"}
            </h2>
            {isEdit && selectedAdmin && (
              <p style={{ fontSize: "0.8rem", color: "var(--ink-soft)", margin: "0.2rem 0 0 0" }}>
                @{selectedAdmin.username}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-soft)", padding: "0.2rem" }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Error Notification */}
        {formError && (
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
            {formError}
          </div>
        )}

        <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Username */}
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.3rem", color: "var(--ink)" }}>
              ชื่อผู้ใช้งาน (Username) {!isEdit && "*"}
            </label>
            <input
              type="text"
              required={!isEdit}
              disabled={isEdit}
              value={formUsername}
              onChange={(e) => setFormUsername(e.target.value)}
              placeholder="เช่น somchai_staff"
              style={{
                width: "100%",
                padding: "0.65rem 0.85rem",
                borderRadius: "0.6rem",
                backgroundColor: isEdit ? "rgba(50, 55, 65, 0.05)" : "var(--cream)",
                border: "1px solid rgba(50, 55, 65, 0.15)",
                fontFamily: "inherit",
                fontSize: "0.9rem",
                outline: "none",
                color: isEdit ? "var(--ink-soft)" : "var(--ink)",
                cursor: isEdit ? "not-allowed" : "text",
              }}
            />
          </div>

          {/* Name */}
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.3rem", color: "var(--ink)" }}>
              ชื่อ (Display Name) *
            </label>
            <input
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="เช่น สมชาย (กะเช้า)"
              style={{
                width: "100%",
                padding: "0.65rem 0.85rem",
                borderRadius: "0.6rem",
                backgroundColor: "var(--cream)",
                border: "1px solid rgba(50, 55, 65, 0.15)",
                fontFamily: "inherit",
                fontSize: "0.9rem",
                outline: "none",
                color: "var(--ink)",
              }}
            />
          </div>

          {/* Password */}
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.3rem", color: "var(--ink)" }}>
              {isEdit ? "เปลี่ยนรหัสผ่านใหม่ (เว้นว่างไว้หากไม่ต้องการเปลี่ยน)" : "รหัสผ่านเริ่มต้น (Password) *"}
            </label>
            <input
              type="password"
              required={!isEdit}
              value={formPassword}
              onChange={(e) => setFormPassword(e.target.value)}
              placeholder={isEdit ? "กรอกรหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)" : "ความยาวอย่างน้อย 6 ตัวอักษร"}
              style={{
                width: "100%",
                padding: "0.65rem 0.85rem",
                borderRadius: "0.6rem",
                backgroundColor: "var(--cream)",
                border: "1px solid rgba(50, 55, 65, 0.15)",
                fontFamily: "inherit",
                fontSize: "0.9rem",
                outline: "none",
                color: "var(--ink)",
              }}
            />
          </div>

          {/* Superadmin Exclusive Switch & Controls */}
          {isEdit && isCurrentSuper && (
            <div
              style={{
                padding: "0.9rem 1rem",
                borderRadius: "0.75rem",
                backgroundColor: "var(--cream)",
                border: "1px solid rgba(50, 55, 65, 0.1)",
                display: "flex",
                flexDirection: "column",
                gap: "0.85rem",
              }}
            >
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--teal)" }}>
                สิทธิ์เฉพาะ Superadmin
              </div>

              {/* iOS-style Switch for Is Activate */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
                <div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--ink)" }}>
                    เปิดใช้งานบัญชี (Is Activate)
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--ink-soft)", marginTop: "2px" }}>
                    อนุญาตให้บัญชีนี้เข้าสู่ระบบได้
                  </div>
                </div>

                <label
                  style={{
                    position: "relative",
                    display: "inline-block",
                    width: "44px",
                    height: "24px",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formIsActivate}
                    onChange={(e) => setFormIsActivate(e.target.checked)}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      inset: 0,
                      backgroundColor: formIsActivate ? "var(--teal)" : "rgba(50, 55, 65, 0.2)",
                      borderRadius: "24px",
                      transition: "background-color 0.2s ease",
                    }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      top: "2px",
                      left: formIsActivate ? "22px" : "2px",
                      width: "20px",
                      height: "20px",
                      backgroundColor: "#fff",
                      borderRadius: "50%",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
                      transition: "left 0.2s ease",
                    }}
                  />
                </label>
              </div>

              {/* Checkbox for Superadmin */}
              <label style={{ display: "flex", alignItems: "center", gap: "0.6rem", cursor: "pointer", fontSize: "0.85rem", paddingTop: "0.35rem", borderTop: "1px solid rgba(50, 55, 65, 0.08)" }}>
                <input
                  type="checkbox"
                  checked={formIsSuperadmin}
                  onChange={(e) => setFormIsSuperadmin(e.target.checked)}
                  style={{ width: "16px", height: "16px", accentColor: "#dc2626" }}
                />
                <span style={{ color: "var(--ink)" }}>
                  <strong>กำหนดสิทธิ์ Superadmin</strong> - ให้มีอำนาจดูแลระบบทั้งหมด
                </span>
              </label>
            </div>
          )}

          {!isEdit && (
            <div
              style={{
                padding: "0.75rem",
                borderRadius: "0.6rem",
                backgroundColor: "rgba(75, 155, 140, 0.08)",
                border: "1px solid rgba(75, 155, 140, 0.2)",
                fontSize: "0.8rem",
                color: "var(--ink-soft)",
              }}
            >
              <strong>หมายเหตุ:</strong> บัญชีที่สร้างใหม่จะมีสถานะเริ่มต้นเป็น <em>&quot;รอการอนุมัติ (Inactive)&quot;</em> โดย Superadmin จะต้องเป็นผู้เปิดสวิตช์เปิดใช้งาน (Activate) ให้ก่อนเข้าสู่ระบบได้
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.5rem" }}>
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
                color: "var(--ink)",
              }}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: "0.6rem 1.25rem",
                borderRadius: "0.6rem",
                backgroundColor: isEdit ? "var(--teal)" : "var(--ink)",
                color: isEdit ? "#fff" : "var(--cream)",
                border: "none",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                fontWeight: 600,
                fontSize: "0.875rem",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
              {isEdit ? "บันทึกการแก้ไข" : "บันทึกบัญชีใหม่"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
