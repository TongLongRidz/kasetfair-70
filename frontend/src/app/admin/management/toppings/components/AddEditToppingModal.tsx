"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { Edit3, X, Upload, ImageIcon, Loader2, Trash2 } from "lucide-react";

interface AddEditToppingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  mode: "create" | "edit";
  formNameTh: string;
  setFormNameTh: (v: string) => void;
  formNameEn: string;
  setFormNameEn: (v: string) => void;
  formPrice: number | string;
  setFormPrice: (v: number | string) => void;
  formAllowHot: boolean;
  setFormAllowHot: (v: boolean) => void;
  formAllowIced: boolean;
  setFormAllowIced: (v: boolean) => void;
  formSortOrder?: number;
  formImageUrl: string;
  setFormImageUrl: (v: string) => void;
  formError: string | null;
  isSubmitting: boolean;
  isUploading: boolean;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage?: () => void;
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
  formAllowHot,
  setFormAllowHot,
  formAllowIced,
  setFormAllowIced,
  formSortOrder = 1,
  formImageUrl,
  setFormImageUrl,
  formError,
  isSubmitting,
  isUploading,
  onFileUpload,
  onRemoveImage,
}: AddEditToppingModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Helper to format image URL (returns empty string if url is empty)
  const getFullImageUrl = (url: string) => {
    if (!url || !url.trim()) return "";
    if (url.startsWith("blob:") || url.startsWith("data:")) return url;
    if (url.startsWith("/uploads/")) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585";
      return `${apiUrl}${url}`;
    }
    return url;
  };

  const currentDisplayImage = getFullImageUrl(formImageUrl);

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
        padding: "0.75rem",
      }}
    >
      <div
        className="animate-modal-pop"
        style={{
          backgroundColor: "var(--card)",
          borderRadius: "1.25rem",
          width: "100%",
          maxWidth: "520px",
          padding: "1.25rem 1.5rem",
          boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
          border: "1px solid rgba(50, 55, 65, 0.1)",
        }}
      >
        {/* Header: Title and Close Button */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontSize: "1.15rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.4rem", margin: 0 }}>
            <Edit3 size={18} color="var(--teal)" />
            {mode === "create" ? "เพิ่มท็อปปิ้งใหม่" : "แก้ไขข้อมูลท็อปปิ้ง"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              padding: "0.2rem",
              borderRadius: "0.5rem",
              color: "var(--ink-soft)",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {formError && (
          <div style={{ marginTop: "0.5rem", padding: "0.5rem 0.75rem", backgroundColor: "rgba(220, 38, 38, 0.1)", border: "1px solid rgba(220, 38, 38, 0.2)", borderRadius: "0.5rem", color: "#dc2626", fontSize: "0.8rem" }}>
            {formError}
          </div>
        )}

        <form onSubmit={onSubmit} style={{ marginTop: "0.85rem", display: "flex", flexDirection: "column", gap: "0.65rem" }}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={onFileUpload}
            accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
            style={{ display: "none" }}
          />

          {/* Top Section: Image Box (~40%) on the left, Order (Readonly) & Price on the right */}
          <div style={{ display: "grid", gridTemplateColumns: "4fr 6fr", gap: "0.85rem", alignItems: "stretch", marginBottom: "0.2rem" }}>
            {/* Clickable 1:1 Square Image Box */}
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                position: "relative",
                width: "100%",
                aspectRatio: "1 / 1",
                borderRadius: "0.85rem",
                overflow: "hidden",
                backgroundColor: "#f2eee4",
                border: "1.5px dashed rgba(50, 55, 65, 0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: isUploading ? "not-allowed" : "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {currentDisplayImage ? (
                <>
                  <Image
                    src={currentDisplayImage}
                    alt="Topping preview"
                    fill
                    unoptimized={currentDisplayImage.startsWith("http") || currentDisplayImage.startsWith("blob:") || currentDisplayImage.startsWith("data:")}
                    style={{ objectFit: "cover" }}
                  />
                  {/* Hover overlay to indicate clickable */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      backgroundColor: "rgba(0, 0, 0, 0.35)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.25rem",
                      color: "#fff",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      opacity: 0.9,
                      transition: "opacity 0.2s ease",
                      padding: "0.25rem",
                      textAlign: "center",
                    }}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>กำลังอัปโหลด...</span>
                      </>
                    ) : (
                      <>
                        <Upload size={16} />
                        <span>คลิกเพื่อเปลี่ยนรูป</span>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.25rem", color: "var(--ink-soft)", padding: "0.5rem", textAlign: "center" }}>
                  {isUploading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" color="var(--teal)" />
                      <span style={{ fontSize: "0.75rem", fontWeight: 500 }}>กำลังอัปโหลด...</span>
                    </>
                  ) : (
                    <>
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          backgroundColor: "var(--cream)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "1px solid rgba(50, 55, 65, 0.1)",
                        }}
                      >
                        <ImageIcon size={16} color="var(--teal)" />
                      </div>
                      <span style={{ fontSize: "0.725rem", fontWeight: 600, color: "var(--ink)", lineHeight: 1.2 }}>
                        กดเพื่ออัปโหลดรูปภาพ
                      </span>
                    </>
                  )}
                </div>
              )}

              {/* Delete / Remove Image Button in Top-Left corner */}
              {currentDisplayImage && onRemoveImage && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveImage();
                  }}
                  title="ลบรูปภาพนี้"
                  style={{
                    position: "absolute",
                    top: "5px",
                    left: "5px",
                    width: "26px",
                    height: "26px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    backdropFilter: "blur(4px)",
                    border: "1.5px solid rgba(220, 38, 38, 0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    boxShadow: "0 2px 5px rgba(0,0,0,0.15)",
                    transition: "all 0.15s ease",
                    padding: 0,
                    zIndex: 3,
                    color: "#dc2626",
                  }}
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>

            {/* Right of image: Order (readonly, top) and Price (bottom) */}
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", gap: "0.5rem" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0.6rem 0.85rem",
                  borderRadius: "0.65rem",
                  backgroundColor: "rgba(75, 155, 140, 0.08)",
                  border: "1px dashed rgba(75, 155, 140, 0.3)",
                  flex: 1,
                  minHeight: "48px",
                }}
              >
                <span
                  style={{
                    fontSize: "clamp(2.2rem, 5.5vw, 3.5rem)",
                    fontWeight: 900,
                    color: "var(--teal)",
                    fontFamily: "'Kanit', sans-serif",
                    lineHeight: 1,
                    letterSpacing: "-0.03em",
                  }}
                >
                  #{formSortOrder}
                </span>
              </div>

              {/* Price input */}
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.15rem", color: "var(--ink)" }}>
                  ราคาบวกเพิ่ม (บาท) *
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  placeholder="เช่น 10"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value === "" ? "" : Number(e.target.value))}
                  style={{
                    width: "100%",
                    padding: "0.45rem 0.65rem",
                    borderRadius: "0.55rem",
                    border: "1px solid rgba(50, 55, 65, 0.15)",
                    backgroundColor: "var(--cream)",
                    fontFamily: "'Kanit', sans-serif",
                    fontSize: "0.825rem",
                    outline: "none",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Row 1: Name TH (Full width) */}
          <div>
            <label style={{ display: "block", fontSize: "0.775rem", fontWeight: 600, marginBottom: "0.15rem" }}>
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
                padding: "0.45rem 0.65rem",
                borderRadius: "0.55rem",
                border: "1px solid rgba(50, 55, 65, 0.15)",
                backgroundColor: "var(--cream)",
                fontFamily: "'Kanit', sans-serif",
                fontSize: "0.825rem",
                outline: "none",
              }}
            />
          </div>

          {/* Row 2: Name EN (Full width) */}
          <div>
            <label style={{ display: "block", fontSize: "0.775rem", fontWeight: 600, marginBottom: "0.15rem" }}>
              ชื่อท็อปปิ้ง (English)
            </label>
            <input
              type="text"
              placeholder="e.g. Brown Sugar Boba"
              value={formNameEn}
              onChange={(e) => setFormNameEn(e.target.value)}
              style={{
                width: "100%",
                padding: "0.45rem 0.65rem",
                borderRadius: "0.55rem",
                border: "1px solid rgba(50, 55, 65, 0.15)",
                backgroundColor: "var(--cream)",
                fontFamily: "'Kanit', sans-serif",
                fontSize: "0.825rem",
                outline: "none",
              }}
            />
          </div>

          {/* Temperature Compatibility (Allow Hot / Allow Iced) */}
          <div>
            <label style={{ display: "block", fontSize: "0.775rem", fontWeight: 600, marginBottom: "0.35rem", color: "var(--ink)" }}>
              การเลือกใส่ในประเภทเครื่องดื่ม *
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.65rem" }}>
              <button
                type="button"
                onClick={() => setFormAllowHot(!formAllowHot)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.55rem",
                  padding: "0.55rem 0.75rem",
                  borderRadius: "0.55rem",
                  border: formAllowHot ? "1.5px solid var(--teal)" : "1px solid rgba(50, 55, 65, 0.15)",
                  backgroundColor: formAllowHot ? "rgba(75, 155, 140, 0.08)" : "var(--cream)",
                  cursor: "pointer",
                  userSelect: "none",
                  transition: "all 0.15s ease",
                  textAlign: "left",
                }}
              >
                <div
                  style={{
                    width: "16px",
                    height: "16px",
                    borderRadius: "4px",
                    border: formAllowHot ? "1.5px solid var(--teal)" : "1.5px solid rgba(50, 55, 65, 0.3)",
                    backgroundColor: formAllowHot ? "var(--teal)" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    transition: "all 0.15s ease",
                  }}
                >
                  {formAllowHot && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span style={{ fontSize: "0.825rem", fontWeight: 600, color: formAllowHot ? "var(--teal)" : "var(--ink)", fontFamily: "'Kanit', sans-serif" }}>
                  เครื่องดื่มร้อน
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFormAllowIced(!formAllowIced)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.55rem",
                  padding: "0.55rem 0.75rem",
                  borderRadius: "0.55rem",
                  border: formAllowIced ? "1.5px solid var(--teal)" : "1px solid rgba(50, 55, 65, 0.15)",
                  backgroundColor: formAllowIced ? "rgba(75, 155, 140, 0.08)" : "var(--cream)",
                  cursor: "pointer",
                  userSelect: "none",
                  transition: "all 0.15s ease",
                  textAlign: "left",
                }}
              >
                <div
                  style={{
                    width: "16px",
                    height: "16px",
                    borderRadius: "4px",
                    border: formAllowIced ? "1.5px solid var(--teal)" : "1.5px solid rgba(50, 55, 65, 0.3)",
                    backgroundColor: formAllowIced ? "var(--teal)" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    transition: "all 0.15s ease",
                  }}
                >
                  {formAllowIced && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span style={{ fontSize: "0.825rem", fontWeight: 600, color: formAllowIced ? "var(--teal)" : "var(--ink)", fontFamily: "'Kanit', sans-serif" }}>
                  เครื่องดื่มเย็น
                </span>
              </button>
            </div>
          </div>

          {/* Bottom Action Buttons */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem", marginTop: "0.35rem" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "0.45rem 1.1rem",
                borderRadius: "0.55rem",
                border: "1px solid rgba(50, 55, 65, 0.15)",
                backgroundColor: "transparent",
                color: "var(--ink)",
                cursor: "pointer",
                fontFamily: "'Kanit', sans-serif",
                fontWeight: 500,
                fontSize: "0.825rem",
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
                gap: "0.4rem",
                padding: "0.45rem 1.35rem",
                borderRadius: "0.55rem",
                border: "none",
                backgroundColor: "var(--teal)",
                color: "#fff",
                cursor: (isSubmitting || isUploading) ? "not-allowed" : "pointer",
                fontFamily: "'Kanit', sans-serif",
                fontWeight: 600,
                fontSize: "0.825rem",
                boxShadow: "0 2px 8px rgba(75, 155, 140, 0.25)",
              }}
            >
              {isSubmitting && <Loader2 size={15} className="animate-spin" />}
              <span>{mode === "create" ? "เพิ่มท็อปปิ้ง" : "บันทึกข้อมูล"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
