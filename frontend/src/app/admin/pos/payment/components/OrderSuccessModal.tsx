"use client";

import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import { CheckCircle2, QrCode as QrIcon } from "lucide-react";

export interface OrderSuccessData {
  queueNumber: string;
  orderId: number;
  total?: number;
  paymentMethod: "cash" | "promptpay";
  change?: number;
  itemsCount?: number;
  slipUrl?: string | null;
  orderUuid?: string;
}

interface OrderSuccessModalProps {
  data: OrderSuccessData | null;
  onNextOrder: () => void;
}

export default function OrderSuccessModal({ data, onNextOrder }: OrderSuccessModalProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");

  useEffect(() => {
    if (!data) return;

    // Generate QR code for tracking order status (order/[uuid])
    const uuid = data.orderUuid || `mock-${data.orderId}-${Date.now().toString(36)}`;
    const trackingUrl = typeof window !== "undefined"
      ? `${window.location.origin}/order/${uuid}`
      : `http://localhost:3050/order/${uuid}`;

    QRCode.toDataURL(trackingUrl, {
      width: 180,
      margin: 1,
      color: {
        dark: "#1A1D20",
        light: "#FFFFFF",
      },
    })
      .then((url) => setQrCodeUrl(url))
      .catch((err) => console.error("Error generating tracking QR code:", err));
  }, [data]);

  if (!data) return null;

  return (
    <div
      className="animate-fade-in"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
        padding: "1rem",
        fontFamily: "'Kanit', sans-serif",
      }}
    >
      <div
        className="animate-modal-pop"
        style={{
          backgroundColor: "var(--card)",
          borderRadius: "1.5rem",
          width: "100%",
          maxWidth: "420px",
          maxHeight: "92vh",
          overflowY: "auto",
          padding: "1.65rem 1.25rem",
          textAlign: "center",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.35)",
          border: "1px solid rgba(50, 55, 65, 0.1)",
          color: "var(--ink)",
        }}
      >
        {/* Harmonious Theme Circle Check Icon */}
        <div
          style={{
            width: "62px",
            height: "62px",
            borderRadius: "50%",
            backgroundColor: "rgba(75, 155, 140, 0.14)",
            color: "var(--teal)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 0.85rem",
          }}
        >
          <CheckCircle2 size={36} color="var(--teal)" strokeWidth={2.2} />
        </div>

        {/* Title & Subtitle */}
        <h3 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--ink)", lineHeight: 1.2 }}>
          สั่งซื้อสำเร็จ!
        </h3>
        <p style={{ fontSize: "0.825rem", color: "var(--ink-soft)", marginTop: "3px" }}>
          ออเดอร์ #{data.orderId} (ชำระผ่าน {data.paymentMethod === "promptpay" ? "พร้อมเพย์" : "เงินสด"})
        </p>

        {/* Queue & QR Container (Responsive 2 Columns) */}
        <div
          style={{
            marginTop: "1.15rem",
            padding: "1.15rem 0.85rem",
            backgroundColor: "var(--cream)",
            borderRadius: "1rem",
            border: "2px dashed var(--teal)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.65rem",
            textAlign: "left",
            overflow: "hidden",
            boxSizing: "border-box",
            width: "100%",
          }}
        >
          {/* Left Column: Queue Number */}
          <div
            style={{
              flex: 1,
              minWidth: "100px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
            }}
          >
            <span style={{ fontSize: "0.82rem", color: "var(--ink-soft)", fontWeight: 600 }}>
              หมายเลขคิว
            </span>

            <p
              className="font-mono"
              style={{
                fontSize: "clamp(2.5rem, 8vw, 3.25rem)",
                fontWeight: 900,
                color: "var(--teal)",
                lineHeight: 1.1,
                marginTop: "4px",
                letterSpacing: "0.02em",
              }}
            >
              {data.queueNumber}
            </p>
          </div>

          {/* Divider */}
          <div
            style={{
              width: "1px",
              alignSelf: "stretch",
              backgroundColor: "rgba(75, 155, 140, 0.25)",
              flexShrink: 0,
            }}
          />

          {/* Right Column: QR Code */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.3rem",
              textAlign: "center",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: "88px",
                height: "88px",
                backgroundColor: "#fff",
                borderRadius: "0.5rem",
                padding: "4px",
                border: "1px solid rgba(50, 55, 65, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                boxSizing: "border-box",
                overflow: "hidden",
              }}
            >
              {qrCodeUrl ? (
                <img
                  src={qrCodeUrl}
                  alt="Track Queue QR"
                  draggable={false}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    display: "block",
                    userSelect: "none",
                    WebkitUserDrag: "none",
                    pointerEvents: "none",
                  } as React.CSSProperties & { WebkitUserDrag?: string }}
                />
              ) : (
                <QrIcon size={28} color="var(--ink-soft)" />
              )}
            </div>

            <span style={{ fontSize: "0.7rem", color: "var(--ink-soft)", fontWeight: 500, maxWidth: "92px", lineHeight: 1.2 }}>
              สแกนติดตามคิว
            </span>
          </div>
        </div>

        {/* Action Button: Next Order */}
        <div style={{ marginTop: "1.35rem" }}>
          <button
            type="button"
            onClick={onNextOrder}
            style={{
              width: "100%",
              padding: "0.85rem",
              borderRadius: "0.85rem",
              border: "none",
              backgroundColor: "var(--teal)",
              color: "#fff",
              fontWeight: 800,
              fontSize: "0.95rem",
              cursor: "pointer",
              boxShadow: "0 4px 15px rgba(75,155,140,0.35)",
              transition: "transform 0.15s ease, background-color 0.15s ease",
            }}
          >
            รับออเดอร์ถัดไป
          </button>
        </div>
      </div>
    </div>
  );
}
