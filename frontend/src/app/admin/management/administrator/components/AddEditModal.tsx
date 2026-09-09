"use client";

import React from "react";
import { X, Loader2, ShieldCheck, User } from "lucide-react";
import { AdminUser } from "@/lib/auth";

interface AddEditModalProps {
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

export default function AddEditModal({
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
}: AddEditModalProps) {
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

        <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
          {/* Username */}
          {isEdit ? (
            <div style={{ display: "flex", justifyContent: "center", margin: "0.15rem 0" }}>
              <span
                className="font-mono"
                style={{
                  display: "inline-block",
                  padding: "0.35rem 0.95rem",
                  borderRadius: "0.55rem",
                  backgroundColor: "rgba(50, 55, 65, 0.06)",
                  border: "1px solid rgba(50, 55, 65, 0.12)",
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  color: "var(--ink)",
                  letterSpacing: "0.025em",
                  textAlign: "center",
                }}
              >
                @{formUsername}
              </span>
            </div>
          ) : (
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.3rem", color: "var(--ink)" }}>
                ชื่อผู้ใช้งาน (Username) *
              </label>
              <input
                type="text"
                required
                value={formUsername}
                onChange={(e) => setFormUsername(e.target.value)}
                placeholder="เช่น somchai_staff"
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
          )}

          {/* Name */}
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.3rem", color: "var(--ink)" }}>
              ชื่อ *
            </label>
            <input
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="เช่น สมชาย ใจดี"
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
              {isEdit ? "รหัสผ่านใหม่ (เว้นว่างไว้หากไม่ต้องการเปลี่ยน)" : "รหัสผ่าน *"}
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

          {/* Superadmin Exclusive Switches: is_activate & is_superadmin */}
          {isEdit && isCurrentSuper && (
            <div
              style={{
                padding: "0.85rem 1rem",
                borderRadius: "0.75rem",
                backgroundColor: "var(--cream)",
                border: "1px solid rgba(50, 55, 65, 0.1)",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              {/* iOS Switch 1: Is Activate */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
                <div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--ink)" }}>
                    เปิดใช้งานบัญชี
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--ink-soft)", marginTop: "1px" }}>
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

              {/* iOS Switch 2: Is Superadmin */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "1rem",
                  paddingTop: "0.6rem",
                  borderTop: "1px solid rgba(50, 55, 65, 0.08)",
                }}
              >
                <div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--ink)" }}>
                    สิทธิ์ Superadmin
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--ink-soft)", marginTop: "1px" }}>
                    ให้มีอำนาจดูแลระบบและจัดการแอดมินทั้งหมด
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
                    checked={formIsSuperadmin}
                    onChange={(e) => setFormIsSuperadmin(e.target.checked)}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      inset: 0,
                      backgroundColor: formIsSuperadmin ? "#dc2626" : "rgba(50, 55, 65, 0.2)",
                      borderRadius: "24px",
                      transition: "background-color 0.2s ease",
                    }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      top: "2px",
                      left: formIsSuperadmin ? "22px" : "2px",
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
