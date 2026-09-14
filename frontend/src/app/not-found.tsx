"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Home } from "lucide-react";

export default function NotFound() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--cream)",
        color: "var(--ink)",
        fontFamily: "'Kanit', sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1.5rem",
        textAlign: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          maxWidth: "420px",
          width: "100%",
        }}
      >
        {/* 404 Display with Cup Lid & Straw as the Zero */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.4rem",
            marginBottom: "0.75rem",
            userSelect: "none",
          }}
        >
          {/* First '4' */}
          <span
            className="font-mono"
            style={{
              fontSize: "6.25rem",
              fontWeight: 900,
              color: "var(--teal)",
              lineHeight: 1,
              letterSpacing: "-0.04em",
            }}
          >
            4
          </span>

          {/* '0' - Top-View Cup Lid with Straw */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "82px",
              height: "82px",
              margin: "0 0.1rem",
              position: "relative",
            }}
          >
            <svg
              width="82"
              height="82"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{
                overflow: "visible",
                filter: "drop-shadow(0 4px 10px rgba(75, 155, 140, 0.25))",
              }}
            >
              {/* Outer Lid Rim */}
              <circle
                cx="50"
                cy="50"
                r="44"
                fill="#FFFDF9"
                stroke="var(--teal)"
                strokeWidth="6.5"
              />

              {/* Embossed Middle Ridge (Arced Grooves) */}
              <circle
                cx="50"
                cy="50"
                r="31"
                stroke="var(--teal)"
                strokeWidth="3.5"
                strokeDasharray="40 8"
                strokeLinecap="round"
                opacity="0.85"
              />

              {/* Inner Concentric Circle */}
              <circle
                cx="50"
                cy="50"
                r="19"
                stroke="var(--teal)"
                strokeWidth="2.5"
                opacity="0.5"
              />

              {/* Center Straw Hole on Lid (Underneath Straw) */}
              <circle
                cx="50"
                cy="50"
                r="8.5"
                fill="var(--ink)"
                stroke="var(--teal)"
                strokeWidth="2.5"
              />

              {/* Diagonal Straw (Shorter & On Top Layer Over Lid) */}
              <path
                d="M 50 50 L 66 28"
                stroke="var(--warm)"
                strokeWidth="9"
                strokeLinecap="round"
              />
              <ellipse
                cx="66"
                cy="28"
                rx="4.5"
                ry="2.5"
                transform="rotate(-54 66 28)"
                fill="#D97B40"
              />
            </svg>
          </div>

          {/* Second '4' */}
          <span
            className="font-mono"
            style={{
              fontSize: "6.25rem",
              fontWeight: 900,
              color: "var(--teal)",
              lineHeight: 1,
              letterSpacing: "-0.04em",
            }}
          >
            4
          </span>
        </div>

        {/* Heading */}
        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: 800,
            color: "var(--ink)",
            margin: "0 0 0.5rem",
            letterSpacing: "-0.01em",
          }}
        >
          ไม่พบหน้าที่คุณต้องการ
        </h1>

        {/* Universal Description */}
        <p
          style={{
            fontSize: "0.95rem",
            color: "var(--ink-soft)",
            lineHeight: 1.6,
            margin: "0 0 2rem",
            maxWidth: "340px",
          }}
        >
          ขออภัยด้วยครับ ลิงก์นี้ไม่ถูกต้อง หรือไม่มีอยู่อีกต่อไป
        </p>

        {/* Interactive Floating Pill Button (Warm Cream Theme) */}
        <Link
          href="/"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "0.55rem 0.65rem 0.55rem 1.4rem",
            backgroundColor: isHovered ? "#FFFFFF" : "#FFFDF9",
            color: "var(--ink)",
            borderRadius: "9999px",
            fontSize: "0.95rem",
            fontWeight: 800,
            textDecoration: "none",
            boxShadow: isHovered
              ? "0 12px 28px -4px rgba(0, 0, 0, 0.1), 0 4px 12px -2px rgba(0, 0, 0, 0.05)"
              : "0 6px 18px -2px rgba(0, 0, 0, 0.06), 0 2px 6px rgba(0, 0, 0, 0.03)",
            transform: isHovered ? "translateY(-3px) scale(1.02)" : "translateY(0) scale(1)",
            transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
            cursor: "pointer",
            border: "1.5px solid rgba(50, 55, 65, 0.12)",
          }}
        >
          <span style={{ letterSpacing: "-0.01em" }}>กลับไปหน้าหลัก</span>

          {/* Cream Orb with Dark Arrow */}
          <span
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              backgroundColor: isHovered ? "#ECE8DF" : "#F3EFE7",
              color: "var(--ink)",
              border: "1px solid rgba(50, 55, 65, 0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 6px rgba(0, 0, 0, 0.04)",
              transform: isHovered ? "translateX(2px)" : "translateX(0)",
              transition: "all 0.3s ease",
            }}
          >
            <ArrowRight size={17} strokeWidth={2.6} />
          </span>
        </Link>
      </div>
    </div>
  );
}
