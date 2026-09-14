"use client";

import React, { useEffect, useRef } from "react";
import { Gift, X, Loader2 } from "lucide-react";

export interface PromotionFormData {
  name_th: string;
  name_en: string;
  desc_th: string;
  desc_en: string;
  point_usage: number;
  all_limit: string;
  person_limit: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

interface AddEditPromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  mode: "create" | "edit";
  formNameTh: string;
  setFormNameTh: (v: string) => void;
  formNameEn: string;
  setFormNameEn: (v: string) => void;
  formDescTh: string;
  setFormDescTh: (v: string) => void;
  formDescEn: string;
  setFormDescEn: (v: string) => void;
  formPointUsage: number;
  setFormPointUsage: (v: number) => void;
  formAllLimit: string;
  setFormAllLimit: (v: string) => void;
  formPersonLimit: string;
  setFormPersonLimit: (v: string) => void;
  formStartDate: string;
  setFormStartDate: (v: string) => void;
  formEndDate: string;
  setFormEndDate: (v: string) => void;
  formIsActive: boolean;
  setFormIsActive: (v: boolean) => void;
  formError?: string | null;
  isSubmitting?: boolean;
}

export default function AddEditPromotionModal({
  isOpen,
  onClose,
  onSubmit,
  mode,
  formNameTh,
  setFormNameTh,
  formNameEn,
  setFormNameEn,
  formDescTh,
  setFormDescTh,
  formDescEn,
  setFormDescEn,
  formPointUsage,
  setFormPointUsage,
  formAllLimit,
  setFormAllLimit,
  formPersonLimit,
  setFormPersonLimit,
  formStartDate,
  setFormStartDate,
  formEndDate,
  setFormEndDate,
  formIsActive,
  setFormIsActive,
  formError = null,
  isSubmitting = false,
}: AddEditPromotionModalProps) {
  const descThRef = useRef<HTMLTextAreaElement>(null);
  const descEnRef = useRef<HTMLTextAreaElement>(null);
  const isSyncingHeight = useRef<boolean>(false);

  // Sync heights of Thai and English textareas
  useEffect(() => {
    if (!isOpen) return;

    const syncHeight = (source: HTMLTextAreaElement, target: HTMLTextAreaElement | null) => {
      if (!source || !target || isSyncingHeight.current) return;
      isSyncingHeight.current = true;
      target.style.height = `${source.offsetHeight}px`;
      requestAnimationFrame(() => {
        isSyncingHeight.current = false;
      });
    };

    let roTh: ResizeObserver | null = null;
    let roEn: ResizeObserver | null = null;

    if (typeof ResizeObserver !== "undefined") {
      if (descThRef.current) {
        roTh = new ResizeObserver(() => {
          if (descThRef.current && descEnRef.current) {
            syncHeight(descThRef.current, descEnRef.current);
          }
        });
        roTh.observe(descThRef.current);
      }

      if (descEnRef.current) {
        roEn = new ResizeObserver(() => {
          if (descEnRef.current && descThRef.current) {
            syncHeight(descEnRef.current, descThRef.current);
          }
        });
        roEn.observe(descEnRef.current);
      }
    }

    return () => {
      roTh?.disconnect();
      roEn?.disconnect();
    };
  }, [isOpen]);

  if (!isOpen) return null;

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
          maxWidth: "560px",
          padding: "1.25rem 1.5rem",
          boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
          border: "1px solid rgba(50, 55, 65, 0.1)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3
            style={{
              fontSize: "1.15rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              margin: 0,
            }}
          >
            <Gift size={18} color="var(--teal)" />
            {mode === "edit" ? "แก้ไขโปรโมชั่น" : "สร้างโปรโมชั่นใหม่"}
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
          <div
            style={{
              marginTop: "0.6rem",
              padding: "0.5rem 0.75rem",
              borderRadius: "0.5rem",
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              color: "var(--crimson)",
              fontSize: "0.8rem",
            }}
          >
            {formError}
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={onSubmit}
          style={{
            marginTop: "1rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.7rem",
          }}
        >
          {/* 1. Name TH & EN (2 columns) */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  marginBottom: "0.25rem",
                }}
              >
                ชื่อภาษาไทย (TH) *
              </label>
              <input
                type="text"
                required
                placeholder="เช่น สะสมครบ 5 แต้ม ฟรี 1 แก้ว"
                value={formNameTh}
                onChange={(e) => setFormNameTh(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.45rem 0.65rem",
                  borderRadius: "0.5rem",
                  border: "1px solid rgba(50, 55, 65, 0.15)",
                  backgroundColor: "var(--cream)",
                  fontFamily: "'Kanit', sans-serif",
                  fontSize: "0.85rem",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  marginBottom: "0.25rem",
                }}
              >
                ชื่อภาษาอังกฤษ (EN) *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Collect 5 Points Get 1 Free"
                value={formNameEn}
                onChange={(e) => setFormNameEn(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.45rem 0.65rem",
                  borderRadius: "0.5rem",
                  border: "1px solid rgba(50, 55, 65, 0.15)",
                  backgroundColor: "var(--cream)",
                  fontFamily: "'Kanit', sans-serif",
                  fontSize: "0.85rem",
                  outline: "none",
                }}
              />
            </div>
          </div>

          {/* 2. Point Usage & Limits (3 columns) */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.6rem" }}>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  marginBottom: "0.25rem",
                }}
              >
                แต้มที่ใช้แลก *
              </label>
              <input
                type="number"
                required
                min={0}
                placeholder="เช่น 5"
                value={formPointUsage}
                onChange={(e) => setFormPointUsage(Math.max(0, Number(e.target.value)))}
                style={{
                  width: "100%",
                  padding: "0.45rem 0.65rem",
                  borderRadius: "0.5rem",
                  border: "1px solid rgba(50, 55, 65, 0.15)",
                  backgroundColor: "var(--cream)",
                  fontFamily: "'Kanit', sans-serif",
                  fontSize: "0.85rem",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  marginBottom: "0.25rem",
                }}
              >
                โควตารวมทั้งหมด
              </label>
              <input
                type="number"
                min={1}
                placeholder="ไม่จำกัด"
                value={formAllLimit}
                onChange={(e) => setFormAllLimit(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.45rem 0.65rem",
                  borderRadius: "0.5rem",
                  border: "1px solid rgba(50, 55, 65, 0.15)",
                  backgroundColor: "var(--cream)",
                  fontFamily: "'Kanit', sans-serif",
                  fontSize: "0.85rem",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  marginBottom: "0.25rem",
                }}
              >
                จำกัดต่อคน
              </label>
              <input
                type="number"
                min={1}
                placeholder="ไม่จำกัด"
                value={formPersonLimit}
                onChange={(e) => setFormPersonLimit(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.45rem 0.65rem",
                  borderRadius: "0.5rem",
                  border: "1px solid rgba(50, 55, 65, 0.15)",
                  backgroundColor: "var(--cream)",
                  fontFamily: "'Kanit', sans-serif",
                  fontSize: "0.85rem",
                  outline: "none",
                }}
              />
            </div>
          </div>

          {/* 3. Dates (Start & End in 2 columns) */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  marginBottom: "0.25rem",
                }}
              >
                วันเวลาเริ่มต้น
              </label>
              <input
                type="datetime-local"
                value={formStartDate}
                onChange={(e) => setFormStartDate(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.45rem 0.6rem",
                  borderRadius: "0.5rem",
                  border: "1px solid rgba(50, 55, 65, 0.15)",
                  backgroundColor: "var(--cream)",
                  fontFamily: "'Kanit', sans-serif",
                  fontSize: "0.8rem",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  marginBottom: "0.25rem",
                }}
              >
                วันเวลาสิ้นสุด
              </label>
              <input
                type="datetime-local"
                value={formEndDate}
                onChange={(e) => setFormEndDate(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.45rem 0.6rem",
                  borderRadius: "0.5rem",
                  border: "1px solid rgba(50, 55, 65, 0.15)",
                  backgroundColor: "var(--cream)",
                  fontFamily: "'Kanit', sans-serif",
                  fontSize: "0.8rem",
                  outline: "none",
                }}
              />
            </div>
          </div>

          {/* 4. Description TH & EN (2 columns) */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  marginBottom: "0.25rem",
                }}
              >
                รายละเอียดเงื่อนไข (TH)
              </label>
              <textarea
                ref={descThRef}
                rows={2}
                placeholder="เงื่อนไขภาษาไทย..."
                value={formDescTh}
                onChange={(e) => setFormDescTh(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.45rem 0.65rem",
                  borderRadius: "0.5rem",
                  border: "1px solid rgba(50, 55, 65, 0.15)",
                  backgroundColor: "var(--cream)",
                  fontFamily: "'Kanit', sans-serif",
                  fontSize: "0.8rem",
                  outline: "none",
                  resize: "vertical",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  marginBottom: "0.25rem",
                }}
              >
                รายละเอียดเงื่อนไข (EN)
              </label>
              <textarea
                ref={descEnRef}
                rows={2}
                placeholder="English terms..."
                value={formDescEn}
                onChange={(e) => setFormDescEn(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.45rem 0.65rem",
                  borderRadius: "0.5rem",
                  border: "1px solid rgba(50, 55, 65, 0.15)",
                  backgroundColor: "var(--cream)",
                  fontFamily: "'Kanit', sans-serif",
                  fontSize: "0.8rem",
                  outline: "none",
                  resize: "vertical",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {/* 5. Is Active Toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.1rem" }}>
            <input
              type="checkbox"
              id="formIsActive"
              checked={formIsActive}
              onChange={(e) => setFormIsActive(e.target.checked)}
              style={{
                width: "16px",
                height: "16px",
                accentColor: "var(--teal)",
                cursor: "pointer",
              }}
            />
            <label
              htmlFor="formIsActive"
              style={{ fontSize: "0.825rem", fontWeight: 600, cursor: "pointer" }}
            >
              เปิดใช้งานโปรโมชั่นนี้ทันที (is_active)
            </label>
          </div>

          {/* 6. Buttons */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.6rem",
              marginTop: "0.3rem",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: "0.45rem 1.1rem",
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
                padding: "0.45rem 1.35rem",
                borderRadius: "0.5rem",
                border: "none",
                backgroundColor: "var(--teal)",
                color: "#fff",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                fontFamily: "'Kanit', sans-serif",
                fontSize: "0.85rem",
                fontWeight: 600,
                boxShadow: "0 2px 8px rgba(75, 155, 140, 0.25)",
              }}
            >
              {isSubmitting && <Loader2 size={15} className="animate-spin" />}
              {mode === "edit" ? "บันทึกการแก้ไข" : "สร้างโปรโมชั่น"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
