"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { X, Plus, Minus, Check, Flame, Snowflake, Sparkles } from "lucide-react";

export interface CustomizerProduct {
  id: number;
  name_th: string;
  name_en?: string;
  desc?: string;
  price_hot?: number | null;
  price_iced?: number | null;
  image?: string;
  category?: string;
  default_toppings?: string[];
}

export interface CustomizerTopping {
  id: number | string;
  name_th: string;
  name_en?: string;
  price: number;
  allow_hot?: boolean;
  allow_iced?: boolean;
  is_available?: boolean;
  is_sold_out?: boolean;
}

export interface OrderItemResult {
  product: CustomizerProduct;
  temperature: "iced" | "hot";
  sweetness: "0%" | "25%" | "50%" | "75%" | "100%";
  toppings: CustomizerTopping[];
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  note: string;
}

export interface InitialOrderValues {
  cartId?: string;
  temperature?: "iced" | "hot";
  sweetness?: "0%" | "25%" | "50%" | "75%" | "100%";
  toppings?: (CustomizerTopping | { id: string | number; [key: string]: any })[];
  quantity?: number;
  note?: string;
}

interface OrderProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: CustomizerProduct | null;
  toppings: CustomizerTopping[];
  initialValues?: InitialOrderValues | null;
  onAddToCart: (result: OrderItemResult, editCartId?: string) => void;
}

export default function OrderProductModal({
  isOpen,
  onClose,
  product,
  toppings,
  initialValues,
  onAddToCart,
}: OrderProductModalProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Customization state
  const [temperature, setTemperature] = useState<"iced" | "hot">("iced");
  const [sweetness, setSweetness] = useState<"0%" | "25%" | "50%" | "75%" | "100%">("50%");
  const [selectedToppings, setSelectedToppings] = useState<CustomizerTopping[]>([]);
  const [quantity, setQuantity] = useState<number>(1);
  const [note, setNote] = useState<string>("");

  // Initialize or reset state when product changes or opens
  useEffect(() => {
    if (isOpen && product) {
      setIsMounted(true);
      document.body.classList.add("lock-scroll");
      document.documentElement.classList.add("lock-scroll");

      const hasIced = product.price_iced !== null && product.price_iced !== undefined;
      const initialTemp: "iced" | "hot" = hasIced ? "iced" : "hot";
      setTemperature(initialValues?.temperature || initialTemp);
      setSweetness(initialValues?.sweetness || "50%");

      if (initialValues?.toppings && initialValues.toppings.length > 0) {
        const matched = toppings.filter((t) =>
          initialValues.toppings?.some((it) => String(it.id) === String(t.id))
        );
        setSelectedToppings(matched);
      } else {
        setSelectedToppings([]);
      }

      setQuantity(initialValues?.quantity && initialValues.quantity > 0 ? initialValues.quantity : 1);
      setNote(initialValues?.note || "");

      const rAF = requestAnimationFrame(() => {
        setIsVisible(true);
      });
      return () => cancelAnimationFrame(rAF);
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => {
        setIsMounted(false);
        document.body.classList.remove("lock-scroll");
        document.documentElement.classList.remove("lock-scroll");
      }, 250);
      return () => {
        clearTimeout(timer);
        document.body.classList.remove("lock-scroll");
        document.documentElement.classList.remove("lock-scroll");
      };
    }
  }, [isOpen, product, initialValues, toppings]);

  if (!isMounted || !product) return null;

  // Price calculations
  const getBasePrice = () => {
    if (temperature === "hot") {
      return product.price_hot !== null && product.price_hot !== undefined
        ? product.price_hot
        : product.price_iced || 0;
    }
    return product.price_iced !== null && product.price_iced !== undefined
      ? product.price_iced
      : product.price_hot || 0;
  };

  const basePrice = getBasePrice();
  const toppingTotal = selectedToppings.reduce((sum, t) => sum + (t.price || 0), 0);
  const unitPrice = basePrice + toppingTotal;
  const totalPrice = unitPrice * quantity;

  // Toggle topping checkbox
  const handleToggleTopping = (topping: CustomizerTopping) => {
    const isChecked = selectedToppings.some((t) => t.id === topping.id);
    if (isChecked) {
      setSelectedToppings((prev) => prev.filter((t) => t.id !== topping.id));
    } else {
      setSelectedToppings((prev) => [...prev, topping]);
    }
  };

  const handleConfirm = () => {
    onAddToCart(
      {
        product,
        temperature,
        sweetness,
        toppings: selectedToppings,
        quantity,
        unitPrice,
        totalPrice,
        note: note.trim(),
      },
      initialValues?.cartId
    );
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.55)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: "1rem",
        opacity: isVisible ? 1 : 0,
        pointerEvents: isVisible ? "auto" : "none",
        transition: "opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
      onClick={onClose}
    >
      <div
        className="customizer-modal-box"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "var(--card)",
          borderRadius: "1.25rem",
          width: "100%",
          maxWidth: "540px",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.35)",
          border: "1px solid rgba(50, 55, 65, 0.1)",
          transform: isVisible ? "scale(1) translateY(0)" : "scale(0.95) translateY(12px)",
          transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "0.85rem 1.25rem",
            borderBottom: "1px solid rgba(50, 55, 65, 0.08)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--ink)", lineHeight: 1.2 }}>
              {product.name_th}
            </h3>
            {product.name_en && (
              <p className="font-mono" style={{ fontSize: "0.7rem", color: "var(--ink-soft)", marginTop: "0.1rem" }}>
                {product.name_en}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิด"
            style={{
              width: "32px",
              height: "32px",
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
            <X size={16} />
          </button>
        </div>

        {/* Compact Form Body */}
        <div
          style={{
            padding: "0.85rem 1.25rem",
            overflowY: "auto",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          }}
        >
          {/* Row 1: Temperature Selection & Sweetness Side-by-Side */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "0.75rem", alignItems: "start" }}>
            {/* 1. Temperature Selection (No price in button) */}
            <div>
              <label style={{ display: "block", fontSize: "0.775rem", fontWeight: 700, color: "var(--ink)", marginBottom: "0.35rem" }}>
                1. อุณหภูมิ
              </label>
              <div style={{ display: "grid", gridTemplateColumns: product.price_iced !== null && product.price_hot !== null ? "1fr 1fr" : "1fr", gap: "0.4rem" }}>
                {product.price_iced !== null && (
                  <button
                    type="button"
                    onClick={() => {
                      setTemperature("iced");
                      setSelectedToppings((prev) => prev.filter((t) => t.allow_iced !== false));
                    }}
                    style={{
                      padding: "0.45rem 0.4rem",
                      borderRadius: "0.65rem",
                      border: temperature === "iced" ? "1.5px solid var(--teal)" : "1.5px solid rgba(50, 55, 65, 0.15)",
                      backgroundColor: temperature === "iced" ? "rgba(75, 155, 140, 0.12)" : "var(--cream)",
                      color: temperature === "iced" ? "var(--teal)" : "var(--ink)",
                      fontWeight: 700,
                      cursor: "pointer",
                      fontSize: "0.8rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.3rem",
                      transition: "background-color 0.15s ease, border-color 0.15s ease",
                      whiteSpace: "nowrap",
                      boxSizing: "border-box",
                    }}
                  >
                    <Snowflake size={14} />
                    <span>เย็น</span>
                  </button>
                )}
                {product.price_hot !== null && (
                  <button
                    type="button"
                    onClick={() => {
                      setTemperature("hot");
                      setSelectedToppings((prev) => prev.filter((t) => t.allow_hot !== false));
                    }}
                    style={{
                      padding: "0.45rem 0.4rem",
                      borderRadius: "0.65rem",
                      border: temperature === "hot" ? "1.5px solid var(--warm)" : "1.5px solid rgba(50, 55, 65, 0.15)",
                      backgroundColor: temperature === "hot" ? "rgba(220, 160, 50, 0.12)" : "var(--cream)",
                      color: temperature === "hot" ? "var(--warm)" : "var(--ink)",
                      fontWeight: 700,
                      cursor: "pointer",
                      fontSize: "0.8rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.3rem",
                      transition: "background-color 0.15s ease, border-color 0.15s ease",
                      whiteSpace: "nowrap",
                      boxSizing: "border-box",
                    }}
                  >
                    <Flame size={14} />
                    <span>ร้อน</span>
                  </button>
                )}
              </div>
            </div>

            {/* 2. Sweetness Selector */}
            <div>
              <label style={{ display: "block", fontSize: "0.775rem", fontWeight: 700, color: "var(--ink)", marginBottom: "0.35rem" }}>
                2. ระดับความหวาน
              </label>
              <div style={{ display: "flex", gap: "0.25rem" }}>
                {(["0%", "25%", "50%", "75%", "100%"] as const).map((lvl) => {
                  const isSelected = sweetness === lvl;
                  return (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setSweetness(lvl)}
                      style={{
                        flex: 1,
                        padding: "0.45rem 0.1rem",
                        borderRadius: "0.55rem",
                        border: isSelected ? "1.5px solid var(--ink)" : "1px solid rgba(50, 55, 65, 0.15)",
                        backgroundColor: isSelected ? "var(--ink)" : "var(--cream)",
                        color: isSelected ? "var(--cream)" : "var(--ink)",
                        fontWeight: 700,
                        fontSize: "0.75rem",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        textAlign: "center",
                      }}
                    >
                      {lvl}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3. Toppings Checkbox Selector (Compact 2 Columns) */}
          {product.category === "combos" ? (
            <div
              style={{
                padding: "0.6rem 0.85rem",
                borderRadius: "0.75rem",
                backgroundColor: "rgba(75, 155, 140, 0.08)",
                border: "1px dashed var(--teal)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginBottom: "0.2rem" }}>
                <Sparkles size={14} color="var(--teal)" />
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--teal)" }}>
                  เซ็ตคอมโบพร้อมท็อปปิ้งในตัว
                </span>
              </div>
              <p style={{ fontSize: "0.725rem", color: "var(--ink-soft)", lineHeight: 1.35 }}>
                {product.default_toppings && product.default_toppings.length > 0
                  ? `ประกอบด้วย: ${product.default_toppings.join(", ")}`
                  : product.desc || "เมนูนี้จัดเซ็ตคู่ท็อปปิ้งสูตรพิเศษมาให้เรียบร้อยแล้ว ไม่สามารถเพิ่ม/เปลี่ยนท็อปปิ้งได้"}
              </p>
            </div>
          ) : toppings && toppings.length > 0 ? (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                <label style={{ fontSize: "0.775rem", fontWeight: 700, color: "var(--ink)" }}>
                  3. เพิ่มท็อปปิ้ง (Toppings)
                </label>
                <span style={{ fontSize: "0.7rem", color: "var(--ink-soft)" }}>เลือกได้หลายอย่าง</span>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "0.35rem",
                  maxHeight: "155px",
                  overflowY: "auto",
                  paddingRight: "0.2rem",
                }}
              >
                {toppings.map((top) => {
                  const isChecked = selectedToppings.some((t) => t.id === top.id);
                  const isDisabled =
                    (temperature === "hot" && top.allow_hot === false) ||
                    (temperature === "iced" && top.allow_iced === false) ||
                    top.is_sold_out === true;

                  return (
                    <label
                      key={top.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0.35rem 0.55rem",
                        borderRadius: "0.6rem",
                        border: isChecked ? "1.5px solid var(--teal)" : "1.5px solid rgba(50, 55, 65, 0.12)",
                        backgroundColor: isChecked ? "rgba(75, 155, 140, 0.08)" : "var(--cream)",
                        cursor: isDisabled ? "not-allowed" : "pointer",
                        opacity: isDisabled ? 0.5 : 1,
                        transition: "background-color 0.15s ease, border-color 0.15s ease",
                        userSelect: "none",
                        boxSizing: "border-box",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", minWidth: 0, overflow: "hidden" }}>
                        {/* Custom Checkbox */}
                        <div
                          style={{
                            width: "15px",
                            height: "15px",
                            borderRadius: "4px",
                            border: isChecked ? "1.5px solid var(--teal)" : "1.5px solid rgba(50, 55, 65, 0.3)",
                            backgroundColor: isChecked ? "var(--teal)" : "transparent",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff",
                            transition: "background-color 0.15s ease, border-color 0.15s ease",
                            flexShrink: 0,
                            boxSizing: "border-box",
                          }}
                        >
                          {isChecked && <Check size={11} strokeWidth={3} />}
                        </div>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={isDisabled}
                          onChange={() => !isDisabled && handleToggleTopping(top)}
                          style={{ display: "none" }}
                        />
                        <span style={{ fontSize: "0.775rem", fontWeight: isChecked ? 600 : 500, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {top.name_th}
                          {isDisabled && (
                            <span style={{ fontSize: "0.65rem", color: "#dc2626", marginLeft: "0.2rem" }}>
                              {top.is_sold_out ? "(หมด)" : "(ไม่รองรับ)"}
                            </span>
                          )}
                        </span>
                      </div>
                      <span style={{ color: "var(--teal)", fontWeight: 700, fontSize: "0.75rem", flexShrink: 0, marginLeft: "0.25rem" }}>
                        +{top.price}฿
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* 4. Note Input */}
          <div>
            <label style={{ display: "block", fontSize: "0.775rem", fontWeight: 700, color: "var(--ink)", marginBottom: "0.25rem" }}>
              หมายเหตุเพิ่มเติม (Optional)
            </label>
            <input
              type="text"
              placeholder="เช่น แยกน้ำแข็ง ฯลฯ"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={{
                width: "100%",
                padding: "0.4rem 0.65rem",
                borderRadius: "0.55rem",
                border: "1px solid rgba(50,55,65,0.15)",
                backgroundColor: "var(--cream)",
                fontSize: "0.8rem",
                fontFamily: "'Kanit', sans-serif",
                outline: "none",
                color: "var(--ink)",
              }}
            />
          </div>
        </div>

        {/* Footer / Add to Cart CTA */}
        <div
          style={{
            padding: "0.85rem 1.25rem",
            borderTop: "1px solid rgba(50, 55, 65, 0.08)",
            backgroundColor: "var(--card)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.85rem",
          }}
        >
          {/* Quantity Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "0.45rem",
                border: "1px solid rgba(50, 55, 65, 0.15)",
                backgroundColor: "var(--cream)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: quantity <= 1 ? "not-allowed" : "pointer",
                opacity: quantity <= 1 ? 0.4 : 1,
                color: "var(--ink)",
              }}
            >
              <Minus size={13} />
            </button>
            <span style={{ fontSize: "0.95rem", fontWeight: 700, minWidth: "22px", textAlign: "center", color: "var(--ink)" }}>
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "0.45rem",
                border: "1px solid rgba(50, 55, 65, 0.15)",
                backgroundColor: "var(--cream)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "var(--ink)",
              }}
            >
              <Plus size={13} />
            </button>
          </div>

          {/* Total & Submit Button */}
          <button
            type="button"
            onClick={handleConfirm}
            style={{
              flex: 1,
              borderRadius: "9999px",
              backgroundColor: "var(--teal)",
              padding: "0.65rem 1.15rem",
              fontSize: "0.9rem",
              fontWeight: 700,
              color: "var(--cream)",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              boxShadow: "0 4px 12px rgba(75, 155, 140, 0.3)",
              transition: "transform 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <span>{initialValues?.cartId ? "บันทึกการแก้ไข" : "เพิ่มลงตะกร้า"}</span>
            <span style={{ fontWeight: 800 }}>฿{totalPrice}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
