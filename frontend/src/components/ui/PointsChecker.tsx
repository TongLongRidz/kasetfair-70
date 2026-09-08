"use client";

import React, { useState } from "react";

interface PointsCheckerProps {
  className?: string;
  style?: React.CSSProperties;
  onPointsFound?: (result: { phone: string; name: string; points: number }) => void;
}

export default function PointsChecker({
  className = "",
  style,
  onPointsFound,
}: PointsCheckerProps) {
  const [phoneInput, setPhoneInput] = useState("");
  const [pointsChecked, setPointsChecked] = useState(false);
  const [pointsResult, setPointsResult] = useState<{
    name: string;
    points: number;
  } | null>(null);

  const handleCheckPoints = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phoneInput.trim();
    if (!cleanPhone) return;

    const result = {
      name: "คุณลูกค้า",
      points: 25,
    };

    setPointsChecked(true);
    setPointsResult(result);

    if (onPointsFound) {
      onPointsFound({
        phone: cleanPhone,
        ...result,
      });
    }
  };

  return (
    <div
      className={`animate-rise ${className}`}
      style={{
        borderRadius: "1.25rem",
        backgroundColor: "var(--card)",
        padding: "1.25rem",
        border: "1px solid rgba(50, 55, 65, 0.1)",
        boxShadow: "0 4px 20px -2px rgba(0,0,0,0.05)",
        ...style,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <div
          style={{
            width: "2rem",
            height: "2rem",
            borderRadius: "0.5rem",
            backgroundColor: "rgba(75, 155, 140, 0.15)",
            color: "var(--teal)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1rem",
          }}
        >
          🎁
        </div>
        <div>
          <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--ink)", margin: 0 }}>
            ตรวจสอบแต้มสะสมสมาชิก
          </h2>
          <p style={{ marginTop: "0.15rem", fontSize: "0.825rem", color: "var(--ink-soft)", margin: 0 }}>
            กรอกเบอร์โทรศัพท์เพื่อตรวจเช็คแต้มสะสมและรับสิทธิพิเศษ
          </p>
        </div>
      </div>

      <form
        onSubmit={handleCheckPoints}
        style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}
      >
        <input
          type="tel"
          value={phoneInput}
          onChange={(e) => setPhoneInput(e.target.value)}
          placeholder="08X-XXX-XXXX"
          style={{
            minWidth: 0,
            flex: 1,
            borderRadius: "0.75rem",
            backgroundColor: "var(--cream)",
            padding: "0.75rem 1rem",
            fontSize: "0.875rem",
            border: "1px solid rgba(50, 55, 65, 0.15)",
            outline: "none",
            color: "var(--ink)",
            fontFamily: "inherit",
          }}
        />
        <button
          type="submit"
          style={{
            whiteSpace: "nowrap",
            borderRadius: "0.75rem",
            backgroundColor: "var(--ink)",
            padding: "0.75rem 1.25rem",
            fontSize: "0.875rem",
            fontWeight: 700,
            color: "var(--cream)",
            border: "none",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
            (e.currentTarget as HTMLElement).style.opacity = "0.9";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
            (e.currentTarget as HTMLElement).style.opacity = "1";
          }}
        >
          ตรวจสอบ
        </button>
      </form>

      {pointsChecked && pointsResult && (
        <div
          className="animate-fade-in"
          style={{
            marginTop: "1rem",
            padding: "0.85rem 1rem",
            borderRadius: "0.85rem",
            backgroundColor: "rgba(75, 155, 140, 0.1)",
            border: "1px solid rgba(75, 155, 140, 0.25)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--ink)" }}>
              {phoneInput}
            </span>
            <p style={{ fontSize: "0.75rem", color: "var(--ink-soft)", margin: 0 }}>
              สมาชิกประจำร้านถั่วทอง
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <span
              className="font-display"
              style={{ fontSize: "1.4rem", color: "var(--teal)", fontWeight: 800 }}
            >
              {pointsResult.points}
            </span>
            <span
              style={{
                fontSize: "0.8rem",
                marginLeft: "0.25rem",
                fontWeight: 600,
                color: "var(--ink)",
              }}
            >
              แต้ม
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
