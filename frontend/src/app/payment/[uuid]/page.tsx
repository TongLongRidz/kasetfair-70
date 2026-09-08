"use client";

import React, { use } from "react";
import Image from "next/image";
import Link from "next/link";
import { QrCode, CheckCircle2, Clock, ArrowLeft, Download, ShieldCheck } from "lucide-react";

export default function PaymentPage({ params }: { params: Promise<{ uuid: string }> }) {
  const resolvedParams = use(params);
  const { uuid } = resolvedParams;

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
        padding: "1.5rem",
      }}
    >
      <div
        className="animate-rise"
        style={{
          width: "100%",
          maxWidth: "420px",
          backgroundColor: "var(--card)",
          borderRadius: "1.5rem",
          padding: "2rem",
          border: "1px solid rgba(50, 55, 65, 0.1)",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.08)",
          textAlign: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.3rem",
              fontSize: "0.85rem",
              color: "var(--ink-soft)",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            <ArrowLeft size={16} />
            <span>กลับหน้าร้าน</span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: "var(--teal)", fontSize: "0.8rem", fontWeight: 600 }}>
            <ShieldCheck size={16} />
            <span>ปลอดภัยด้วย PromptPay</span>
          </div>
        </div>

        <h1 style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--ink)" }}>
          ชำระเงินผ่าน QR Code
        </h1>
        <p className="font-mono" style={{ fontSize: "0.8rem", color: "var(--ink-soft)", marginTop: "2px" }}>
          Order ID: {uuid}
        </p>

        {/* QR Simulation Box */}
        <div
          style={{
            margin: "1.5rem 0",
            padding: "1.5rem",
            backgroundColor: "#fff",
            borderRadius: "1.25rem",
            border: "2px dashed var(--teal)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--ink)" }}>
            สแกนเพื่อจ่าย (PromptPay)
          </p>
          <div
            style={{
              width: "180px",
              height: "180px",
              backgroundColor: "var(--cream)",
              borderRadius: "0.75rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <QrCode size={120} color="var(--ink)" />
          </div>
          <p style={{ fontSize: "0.75rem", color: "var(--ink-soft)" }}>
            ถั่วทอง น้ำเต้าหู้ เกษตรแฟร์ 70
          </p>
        </div>

        <div style={{ padding: "0.85rem", backgroundColor: "var(--cream)", borderRadius: "0.75rem", marginBottom: "1.25rem" }}>
          <span style={{ fontSize: "0.85rem", color: "var(--ink-soft)" }}>ยอดชำระเงินทั้งหมด</span>
          <p className="font-display" style={{ fontSize: "2rem", color: "var(--teal)", marginTop: "2px" }}>
            35฿
          </p>
        </div>

        <Link
          href={`/queue?order_id=${uuid}`}
          style={{
            display: "block",
            width: "100%",
            borderRadius: "9999px",
            backgroundColor: "var(--teal)",
            padding: "0.85rem",
            fontSize: "0.95rem",
            fontWeight: 700,
            color: "var(--cream)",
            textDecoration: "none",
            boxShadow: "0 4px 15px rgba(75, 155, 140, 0.3)",
          }}
        >
          แจ้งชำระเงินแล้ว / ตรวจสอบสถานะคิว
        </Link>
      </div>
    </div>
  );
}
