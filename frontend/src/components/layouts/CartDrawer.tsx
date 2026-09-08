"use client";

import React, { useState, useEffect } from "react";
import { ShoppingBag, X, Plus, Minus, Trash2 } from "lucide-react";

export interface CartItemModel {
  cartId: string;
  productId: number;
  productName: string;
  temperature: "iced" | "hot";
  sweetness: "0%" | "25%" | "50%" | "75%" | "100%";
  toppings: { id: string | number; name: string; price: number }[];
  unitPrice: number;
  quantity: number;
  note?: string;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItemModel[];
  onUpdateQty: (cartId: string, delta: number) => void;
  onCheckout?: () => void;
  title?: string;
  subtitle?: string;
  checkoutButtonText?: string;
  extraHeaderContent?: React.ReactNode;
  discountAmount?: number;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cart,
  onUpdateQty,
  onCheckout,
  title = "ตะกร้าเครื่องดื่ม",
  subtitle,
  checkoutButtonText = "ดำเนินการสั่งซื้อ & ชำระเงิน",
  extraHeaderContent,
  discountAmount = 0,
}: CartDrawerProps) {
  const [isRendered, setIsRendered] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      setIsClosing(false);
    } else if (isRendered && !isClosing) {
      // Trigger smooth exit animation
      setIsClosing(true);
      const timer = setTimeout(() => {
        setIsRendered(false);
        setIsClosing(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsRendered(false);
      setIsClosing(false);
    }, 300);
  };

  if (!isRendered && !isOpen) return null;

  const totalCups = cart.reduce((sum, item) => sum + item.quantity, 0);
  const rawTotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const finalTotal = Math.max(0, rawTotal - discountAmount);

  return (
    <div
      className={isClosing ? "animate-fade-out" : "animate-fade-in"}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        backgroundColor: "rgba(0, 0, 0, 0.55)",
        backdropFilter: "blur(4px)",
        display: "flex",
        justifyContent: "flex-end",
      }}
      onClick={handleClose}
    >
      <div
        className={isClosing ? "animate-slide-out-right" : "animate-slide-right"}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "460px",
          height: "100vh",
          backgroundColor: "var(--cream)",
          display: "flex",
          flexDirection: "column",
          boxShadow: "-10px 0 35px rgba(0, 0, 0, 0.25)",
          borderLeft: "1px solid rgba(50, 55, 65, 0.1)",
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid rgba(50, 55, 65, 0.1)",
            backgroundColor: "var(--card)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "50%",
                backgroundColor: "rgba(75, 155, 140, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--teal)",
              }}
            >
              <ShoppingBag size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--ink)", lineHeight: 1.2 }}>
                {title}
              </h3>
              <p style={{ fontSize: "0.8rem", color: "var(--ink-soft)", marginTop: "2px" }}>
                {subtitle || `ทั้งหมด ${totalCups} รายการ`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="ปิดตะกร้า"
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              border: "1px solid rgba(50, 55, 65, 0.1)",
              backgroundColor: "transparent",
              color: "var(--ink-soft)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(50,55,65,0.06)";
              e.currentTarget.style.color = "var(--ink)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "var(--ink-soft)";
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Optional Extra Header (e.g. Loyalty Phone Lookup) */}
        {extraHeaderContent && (
          <div style={{ padding: "1rem 1.5rem 0.5rem 1.5rem" }}>
            {extraHeaderContent}
          </div>
        )}

        {/* Items List (Scrollable) */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "1rem 1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          }}
        >
          {cart.length === 0 ? (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                color: "var(--ink-soft)",
                padding: "2rem 0",
              }}
            >
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(50, 55, 65, 0.05)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "1rem",
                  color: "var(--ink-soft)",
                }}
              >
                <ShoppingBag size={32} opacity={0.6} />
              </div>
              <p style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--ink)" }}>ตะกร้ายังว่างอยู่</p>
              <p style={{ fontSize: "0.85rem", marginTop: "0.25rem", maxWidth: "220px" }}>
                เลือกเครื่องดื่มเมนูโปรดของคุณเพื่อเพิ่มลงในตะกร้า
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.cartId}
                style={{
                  borderRadius: "1rem",
                  backgroundColor: "var(--card)",
                  padding: "0.9rem 1rem",
                  border: "1px solid rgba(50, 55, 65, 0.08)",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {item.productName}
                  </h4>
                  <p style={{ fontSize: "0.75rem", color: "var(--ink-soft)", marginTop: "0.15rem" }}>
                    {item.temperature === "iced" ? "เย็น" : "ร้อน"} · หวาน {item.sweetness}
                  </p>
                  {item.toppings.length > 0 && (
                    <p style={{ fontSize: "0.75rem", color: "var(--teal)", marginTop: "0.1rem", fontWeight: 500 }}>
                      + {item.toppings.map((t) => t.name).join(", ")}
                    </p>
                  )}
                  {item.note && (
                    <p style={{ fontSize: "0.72rem", color: "#f59e0b", marginTop: "0.1rem" }}>
                      Note: {item.note}
                    </p>
                  )}
                  <p style={{ marginTop: "0.3rem", fontSize: "1rem", fontWeight: 800, color: "var(--ink)" }}>
                    {item.unitPrice * item.quantity}฿{" "}
                    <span style={{ fontSize: "0.72rem", color: "var(--ink-soft)", fontWeight: 400 }}>
                      (@{item.unitPrice}฿)
                    </span>
                  </p>
                </div>

                {/* Quantity Control Pill */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", backgroundColor: "var(--cream)", padding: "0.25rem 0.4rem", borderRadius: "9999px", border: "1px solid rgba(50, 55, 65, 0.1)" }}>
                  <button
                    type="button"
                    onClick={() => onUpdateQty(item.cartId, -1)}
                    aria-label="ลดจำนวน"
                    style={{
                      width: "1.75rem",
                      height: "1.75rem",
                      borderRadius: "50%",
                      border: "none",
                      backgroundColor: item.quantity === 1 ? "rgba(220, 50, 50, 0.1)" : "#fff",
                      color: item.quantity === 1 ? "#dc2626" : "var(--ink)",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.1s ease",
                    }}
                  >
                    {item.quantity === 1 ? <Trash2 size={13} /> : <Minus size={13} />}
                  </button>

                  <span
                    className="font-mono"
                    style={{
                      fontSize: "0.9rem",
                      fontWeight: 700,
                      minWidth: "1.2rem",
                      textAlign: "center",
                    }}
                  >
                    {item.quantity}
                  </span>

                  <button
                    type="button"
                    onClick={() => onUpdateQty(item.cartId, 1)}
                    aria-label="เพิ่มจำนวน"
                    style={{
                      width: "1.75rem",
                      height: "1.75rem",
                      borderRadius: "50%",
                      border: "none",
                      backgroundColor: "var(--ink)",
                      color: "var(--cream)",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.1s ease",
                    }}
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer / Checkout Summary */}
        {cart.length > 0 && (
          <div
            style={{
              padding: "1.25rem 1.5rem",
              backgroundColor: "var(--card)",
              borderTop: "1px solid rgba(50, 55, 65, 0.1)",
              boxShadow: "0 -4px 15px rgba(0, 0, 0, 0.04)",
            }}
          >
            {discountAmount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#22c55e", fontWeight: 600, marginBottom: "0.4rem" }}>
                <span>ส่วนลดแลกแต้ม</span>
                <span>-{discountAmount}฿</span>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <span style={{ fontSize: "1rem", fontWeight: 700, color: "var(--ink)" }}>ยอดรวมทั้งหมด</span>
              <span className="font-display" style={{ fontSize: "1.85rem", color: "var(--teal)", lineHeight: 1 }}>
                {finalTotal}฿
              </span>
            </div>

            <button
              type="button"
              onClick={onCheckout}
              style={{
                width: "100%",
                borderRadius: "9999px",
                backgroundColor: "var(--teal)",
                padding: "0.95rem",
                fontSize: "1rem",
                fontWeight: 700,
                color: "var(--cream)",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 4px 15px rgba(75, 155, 140, 0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                transition: "transform 0.15s ease, filter 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(1.05)")}
              onMouseLeave={(e) => (e.currentTarget.style.filter = "brightness(1)")}
            >
              <ShoppingBag size={18} />
              <span>{checkoutButtonText} ({finalTotal}฿)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
