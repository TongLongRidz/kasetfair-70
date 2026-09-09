import React from "react";
import Navbar from "@/components/layouts/Navbar";
import Footer from "@/components/layouts/Footer";

export default function OrderPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--cream)",
        color: "var(--ink)",
        fontFamily: "'Kanit', sans-serif",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <Navbar />

      <main
        style={{
          maxWidth: "640px",
          margin: "0 auto",
          padding: "3rem 1rem",
          textAlign: "center",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--ink)" }}>
          Hello World
        </h1>
        <p style={{ fontSize: "1rem", color: "var(--ink-soft)", marginTop: "0.5rem" }}>
          หน้าสั่งซื้อออนไลน์ (Order Online)
        </p>
      </main>

      <Footer />
    </div>
  );
}
