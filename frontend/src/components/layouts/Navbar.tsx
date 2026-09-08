import React from "react";

export default function Navbar() {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 30,
        borderBottom: "1px solid rgba(50, 55, 65, 0.1)",
        backgroundColor: "rgba(247, 246, 240, 0.95)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
      }}
    >
      <div
        style={{
          maxWidth: "640px",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.75rem 1rem",
        }}
      >
        <a
          href="#"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <span
            style={{
              width: "2.5rem",
              height: "2.5rem",
              display: "grid",
              placeItems: "center",
              borderRadius: "0.85rem",
              backgroundColor: "var(--ink)",
              color: "var(--cream)",
              fontWeight: 700,
              fontSize: "1.25rem",
            }}
          >
            ถ
          </span>
          <span style={{ lineHeight: 1.15 }}>
            <span style={{ display: "block", fontSize: "1.05rem", fontWeight: 700 }}>ถั่วทอง</span>
            <span
              className="font-mono"
              style={{
                display: "block",
                fontSize: "9px",
                textTransform: "uppercase",
                letterSpacing: "0.22em",
                color: "var(--ink-soft)",
              }}
            >
              Taothong Soy Milk
            </span>
          </span>
        </a>

        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.85rem",
            fontSize: "0.875rem",
            fontWeight: 500,
          }}
        >
          <a href="#menu" style={{ color: "var(--ink)", textDecoration: "none" }}>
            เมนู
          </a>
          <a href="#toppings" style={{ color: "var(--ink-soft)", textDecoration: "none" }}>
            ท็อปปิ้ง
          </a>
          <a href="#promotions" style={{ color: "var(--ink-soft)", textDecoration: "none" }}>
            โปรโมชั่น
          </a>
          <a
            href="#points"
            style={{
              borderRadius: "9999px",
              backgroundColor: "var(--teal)",
              padding: "0.35rem 0.85rem",
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "var(--cream)",
              textDecoration: "none",
            }}
          >
            ตรวจสอบคิว
          </a>
        </nav>
      </div>
    </header>
  );
}
