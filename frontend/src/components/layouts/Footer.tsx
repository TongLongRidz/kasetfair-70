"use client";

import React from "react";
import Link from "next/link";
import useTranslation from "@/hooks/useTranslation";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer
      style={{
        backgroundColor: "var(--card)",
        borderTop: "1px solid rgba(50, 55, 65, 0.1)",
        color: "var(--ink)",
        marginTop: "auto",
        fontFamily: "'Kanit', sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "640px",
          margin: "0 auto",
          padding: "2.5rem 1.25rem 2rem 1.25rem",
        }}
      >
        {/* Brand and Description & Location */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem", alignItems: "start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", height: "2.25rem" }}>
              <span
                style={{
                  width: "2.25rem",
                  height: "2.25rem",
                  display: "grid",
                  placeItems: "center",
                  borderRadius: "0.75rem",
                  backgroundColor: "var(--ink)",
                  color: "var(--cream)",
                  fontWeight: 700,
                  fontSize: "1.1rem",
                }}
              >
                ถ
              </span>
              <div>
                <span style={{ fontSize: "1.1rem", fontWeight: 800, display: "block", lineHeight: 1.1 }}>
                  {t("footer.brand_name", "ถั่วทอง")}
                </span>
                <span
                  className="font-mono"
                  style={{
                    fontSize: "9px",
                    textTransform: "uppercase",
                    letterSpacing: "0.2em",
                    color: "var(--ink-soft)",
                    display: "block",
                  }}
                >
                  Thuathong Soy Milk
                </span>
              </div>
            </div>

            <p style={{ marginTop: "0.75rem", fontSize: "0.85rem", color: "var(--ink-soft)", lineHeight: 1.5, margin: "0.75rem 0 0 0", whiteSpace: "pre-line" }}>
              {t("footer.brand_desc", "น้ำเต้าหู้สดใหม่ทุกวัน\nพร้อมท็อปปิ้งแน่นแก้ว\nให้จิบระหว่างเดินงาน")}
            </p>
          </div>

          {/* Location & Operating Hours */}
          <div>
            <div style={{ display: "flex", alignItems: "flex-end", height: "2.25rem" }}>
              <p style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--ink)", margin: 0, lineHeight: 1.15 }}>
                {t("footer.location_title", "สถานที่ & เวลา")}
              </p>
            </div>
            <p style={{ marginTop: "0.75rem", fontSize: "0.85rem", color: "var(--ink-soft)", lineHeight: 1.5, margin: "0.75rem 0 0 0", whiteSpace: "pre-line" }}>
              {t("footer.location_desc", "เกษตรแฟร์ โซนนิสิต (M) บูธ M__\nมหาวิทยาลัยเกษตรศาสตร์")}<br />
              <span style={{ color: "var(--ink)", fontWeight: 600 }}>{t("footer.operating_hours", "12:00 - 21:00 น.")}</span>
            </p>
          </div>
        </div>

        {/* Divider */}
        <hr style={{ margin: "1.75rem 0 1.25rem 0", borderColor: "rgba(50, 55, 65, 0.08)" }} />

        {/* Bottom copyright and about-us link */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", fontSize: "0.75rem", color: "var(--ink-soft)" }}>
          <p style={{ margin: 0 }}>
            {t("footer.copyright", "© 2026 ถั่วทอง. สงวนลิขสิทธิ์ทั้งหมด. เกษตรแฟร์ 2570")}
          </p>
          <div>
            <Link href="/about-us" style={{ color: "var(--ink-soft)", textDecoration: "none" }}>
              {t("footer.about_us", "เกี่ยวกับเรา")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
