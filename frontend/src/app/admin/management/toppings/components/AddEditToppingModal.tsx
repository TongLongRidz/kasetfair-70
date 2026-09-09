"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { Edit3, X, Upload, ImageIcon, Loader2 } from "lucide-react";

interface AddEditToppingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  mode: "create" | "edit";
  formNameTh: string;
  setFormNameTh: (v: string) => void;
  formNameEn: string;
  setFormNameEn: (v: string) => void;
  formPrice: number;
  setFormPrice: (v: number) => void;
  formSortOrder: number;
  setFormSortOrder: (v: number) => void;
  formImageUrl: string;
  setFormImageUrl: (v: string) => void;
  formError: string | null;
  isSubmitting: boolean;
  isUploading: boolean;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function AddEditToppingModal({
  isOpen,
  onClose,
  onSubmit,
  mode,
  formNameTh,
  setFormNameTh,
  formNameEn,
  setFormNameEn,
  formPrice,
  setFormPrice,
  formSortOrder,
  setFormSortOrder,
  formImageUrl,
  setFormImageUrl,
  formError,
  isSubmitting,
  isUploading,
  onFileUpload,
}: AddEditToppingModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Helper to format image URL (handle relative /uploads from backend)
  const getFullImageUrl = (url: string) => {
    if (!url) return "/images/drink-pearl.jpg";
    if (url.startsWith("/uploads/")) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585";
      return `${apiUrl}${url}`;
    }
    return url;
  };

  return (
    <div
      className="animate-fade-in"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: "1rem",
      }}
    >
      <div
        className="animate-modal-pop"
        style={{
          backgroundColor: "var(--card)",
          borderRadius: "1.25rem",
          width: "100%",
          maxWidth: "480px",
          padding: "1.75rem",
          boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
          border: "1px solid rgba(50, 55, 65, 0.1)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontSize: "1.25rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Edit3 size={20} color="var(--teal)" />
            {mode === "create" ? "เพิ่มท็อปปิ้งใหม่" : "แก้ไขข้อมูลท็อปปิ้ง"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              padding: "0.25rem",
              borderRadius: "0.5rem",
              color: "var(--ink-soft)",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {formError && (
          <div style={{ marginTop: "1rem", padding: "0.75rem", backgroundColor: "rgba(220, 38, 38, 0.1)", border: "1px solid rgba(220, 38, 38, 0.2)", borderRadius: "0.5rem", color: "#dc2626", fontSize: "0.85rem" }}>
            {formError}
          </div>
        )}

        <form onSubmit={onSubmit} style={{ marginTop: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Image Upload Area */}
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.35rem" }}>
              รูปภาพท็อปปิ้ง
            </label>

            <input
              type="file"
              ref={fileInputRef}
              onChange={onFileUpload}
              accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
              style={{ display: "none" }}
            />

            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
              <div
                style={{
                  position: "relative",
                  width: "64px",
                  height: "64px",
                  borderRadius: "0.75rem",
                  overflow: "hidden",
                  backgroundColor: "#f0ece1",
                  border: "1px solid rgba(50, 55, 65, 0.15)",
                  flexShrink: 0,
                }}
              >
                {formImageUrl ? (
                  <Image
                    src={getFullImageUrl(formImageUrl)}
                    alt="Topping preview"
                    fill
                    unoptimized={getFullImageUrl(formImageUrl).startsWith("http")}
                    style={{ objectFit: "cover" }}
                  />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <ImageIcon size={22} color="var(--ink-soft)" />
                  </div>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", flex: 1 }}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.4rem",
                    padding: "0.45rem 0.75rem",
                    borderRadius: "0.6rem",
                    backgroundColor: "var(--cream)",
                    border: "1px dashed rgba(50, 55, 65, 0.25)",
                    color: "var(--ink)",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    cursor: isUploading ? "not-allowed" : "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {isUploading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>กำลังอัปโหลดรูป...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={14} color="var(--teal)" />
                      <span>อัปโหลดรูปภาพใหม่ (JPG, PNG, WebP)</span>
                    </>
                  )}
                </button>

                <input
                  type="text"
                  placeholder="หรือกรอก URL / Path ของรูป..."
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.35rem 0.65rem",
                    borderRadius: "0.5rem",
                    border: "1px solid rgba(50, 55, 65, 0.12)",
                    backgroundColor: "var(--card)",
                    fontFamily: "'Kanit', sans-serif",
                    fontSize: "0.75rem",
                    outline: "none",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Topping Name TH */}
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.35rem" }}>
              ชื่อท็อปปิ้ง (ภาษาไทย) *
            </label>
            <input
              type="text"
              required
              placeholder="เช่น ไข่มุกบราวน์ชูการ์"
              value={formNameTh}
              onChange={(e) => setFormNameTh(e.target.value)}
              style={{
                width: "100%",
                padding: "0.6rem 0.85rem",
                borderRadius: "0.6rem",
                border: "1px solid rgba(50, 55, 65, 0.15)",
                backgroundColor: "var(--cream)",
                fontFamily: "'Kanit', sans-serif",
                fontSize: "0.9rem",
                outline: "none",
              }}
            />
          </div>

          {/* Topping Name EN */}
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.35rem" }}>
              ชื่อท็อปปิ้ง (English)
            </label>
            <input
              type="text"
              placeholder="e.g. Brown Sugar Boba"
              value={formNameEn}
              onChange={(e) => setFormNameEn(e.target.value)}
              style={{
                width: "100%",
                padding: "0.6rem 0.85rem",
                borderRadius: "0.6rem",
                border: "1px solid rgba(50, 55, 65, 0.15)",
                backgroundColor: "var(--cream)",
                fontFamily: "'Kanit', sans-serif",
                fontSize: "0.9rem",
                outline: "none",
              }}
            />
          </div>

          {/* Price & Sort Order */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.35rem" }}>
                ราคาบวกเพิ่ม (บาท) *
              </label>
              <input
                type="number"
                required
                min={0}
                value={formPrice}
                onChange={(e) => setFormPrice(Number(e.target.value))}
                style={{
                  width: "100%",
                  padding: "0.6rem 0.85rem",
                  borderRadius: "0.6rem",
                  border: "1px solid rgba(50, 55, 65, 0.15)",
                  backgroundColor: "var(--cream)",
                  fontFamily: "'Kanit', sans-serif",
                  fontSize: "0.9rem",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.35rem" }}>
                ลำดับการแสดงผล
              </label>
              <input
                type="number"
                required
                min={1}
                value={formSortOrder}
                onChange={(e) => setFormSortOrder(Number(e.target.value))}
                style={{
                  width: "100%",
                  padding: "0.6rem 0.85rem",
                  borderRadius: "0.6rem",
                  border: "1px solid rgba(50, 55, 65, 0.15)",
                  backgroundColor: "var(--cream)",
                  fontFamily: "'Kanit', sans-serif",
                  fontSize: "0.9rem",
                  outline: "none",
                }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "0.6rem 1.25rem",
                borderRadius: "0.6rem",
                border: "1px solid rgba(50, 55, 65, 0.15)",
                backgroundColor: "transparent",
                color: "var(--ink)",
                cursor: "pointer",
                fontFamily: "'Kanit', sans-serif",
                fontWeight: 500,
              }}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.6rem 1.5rem",
                borderRadius: "0.6rem",
                border: "none",
                backgroundColor: "var(--teal)",
                color: "#fff",
                cursor: (isSubmitting || isUploading) ? "not-allowed" : "pointer",
                fontFamily: "'Kanit', sans-serif",
                fontWeight: 600,
                boxShadow: "0 2px 8px rgba(75, 155, 140, 0.25)",
              }}
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              <span>{mode === "create" ? "เพิ่มท็อปปิ้ง" : "บันทึกการแก้ไข"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
