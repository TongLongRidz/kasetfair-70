import React from "react";
import Link from "next/link";

export default function Footer() {
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
                  ถั่วทอง
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
                  Taothong Soy Milk
                </span>
              </div>
            </div>

            <p style={{ marginTop: "0.75rem", fontSize: "0.85rem", color: "var(--ink-soft)", lineHeight: 1.5, margin: "0.75rem 0 0 0" }}>
              น้ำเต้าหู้สดใหม่ทุกวัน<br />พร้อมท็อปปิ้งแน่นแก้ว<br />ให้จิบระหว่างเดินงาน
            </p>
          </div>

          {/* Location & Operating Hours */}
          <div>
            <div style={{ display: "flex", alignItems: "flex-end", height: "2.25rem" }}>
              <p style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--ink)", margin: 0, lineHeight: 1.15 }}>
                สถานที่ & เวลา
              </p>
            </div>
            <p style={{ marginTop: "0.75rem", fontSize: "0.85rem", color: "var(--ink-soft)", lineHeight: 1.5, margin: "0.75rem 0 0 0" }}>
              เกษตรแฟร์ โซนนิสิต (M) บูธ M__<br />
              มหาวิทยาลัยเกษตรศาสตร์<br />
              <span style={{ color: "var(--ink)", fontWeight: 600 }}>12:00 - 21:00 น.</span>
            </p>
          </div>
        </div>

        {/* Divider */}
        <hr style={{ margin: "1.75rem 0 1.25rem 0", borderColor: "rgba(50, 55, 65, 0.08)" }} />

        {/* Bottom copyright and about-us link */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", fontSize: "0.75rem", color: "var(--ink-soft)" }}>
          <p style={{ margin: 0 }}>
            © 2026 ถั่วทอง. All rights reserved. เกษตรแฟร์ 2570
          </p>
          <div>
            <Link href="/about-us" style={{ color: "var(--ink-soft)", textDecoration: "none" }}>
              เกี่ยวกับเรา
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
