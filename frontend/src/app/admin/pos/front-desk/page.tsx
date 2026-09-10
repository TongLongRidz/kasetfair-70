"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import CartDrawer from "@/components/layouts/CartDrawer";
import OrderProductModal, { OrderItemResult } from "@/components/ui/modals/OrderProductModal";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Sparkles,
  ShoppingBag,
  CreditCard,
  Banknote,
  QrCode,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  X,
  RotateCcw,
  Flame,
  Award,
  Loader2,
  ImageIcon,
} from "lucide-react";

interface Product {
  id: number;
  name_th: string;
  name_en: string;
  desc: string;
  price_hot: number | null;
  price_iced: number | null;
  category: "flavours" | "combos";
  image: string;
  is_available: boolean;
  is_sold_out: boolean;
  is_recommended: boolean;
  sort_order: number;
  default_toppings?: string[];
}

interface Topping {
  id: number;
  name_th: string;
  name_en: string;
  price: number;
  allow_hot: boolean;
  allow_iced: boolean;
  is_available: boolean;
  is_sold_out: boolean;
}

interface CartItem {
  cart_item_id: string;
  product: Product;
  temperature: "iced" | "hot";
  sweetness: "0%" | "25%" | "50%" | "75%" | "100%";
  toppings: Topping[];
  quantity: number;
  unit_price: number;
  total_price: number;
  note: string;
}

export default function POSFrontDeskPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [toppings, setToppings] = useState<Topping[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState<"all" | "flavours" | "combos">("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Item Customizer Modal State
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);

  // Payment Checkout Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "promptpay">("cash");
  const [cashReceived, setCashReceived] = useState<string>("");
  const [orderSuccessQueue, setOrderSuccessQueue] = useState<{ queueNumber: string; orderId: number; total: number; change: number } | null>(null);

  // Helper to get image URL
  const getFullImageUrl = (url?: string) => {
    if (!url) return "";
    if (url.startsWith("/uploads/")) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585";
      return `${apiUrl}${url}`;
    }
    return url;
  };

  // Fetch real products and toppings from API
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585";
      
      // Fetch available products
      const resProducts = await fetch(`${apiUrl}/api/v1/products?page_size=100&status=available`);
      if (resProducts.ok) {
        const prodData = await resProducts.json();
        const mappedProducts: Product[] = (prodData.data || []).map((p: any) => {
          const comboToppingNames = (p.combo_recipes || [])
            .map((r: any) => r.topping?.name_th)
            .filter(Boolean);

          return {
            id: p.id,
            name_th: p.name_th,
            name_en: p.name_en || "",
            desc: p.desc_th || "",
            price_hot: p.price_hot,
            price_iced: p.price_iced,
            category: p.is_combo ? "combos" : "flavours",
            image: getFullImageUrl(p.image_url),
            is_available: p.is_available,
            is_sold_out: p.is_sold_out,
            is_recommended: p.is_recommended,
            sort_order: p.sort_order || 0,
            default_toppings: comboToppingNames,
          };
        });
        setProducts(mappedProducts);
      }

      // Fetch available toppings
      const resToppings = await fetch(`${apiUrl}/api/v1/toppings?page_size=100&status=available`);
      if (resToppings.ok) {
        const topData = await resToppings.json();
        const mappedToppings: Topping[] = (topData.data || []).map((t: any) => ({
          id: t.id,
          name_th: t.name_th,
          name_en: t.name_en || "",
          price: t.price || 0,
          allow_hot: Boolean(t.allow_hot),
          allow_iced: Boolean(t.allow_iced),
          is_available: Boolean(t.is_available),
          is_sold_out: Boolean(t.is_sold_out),
        }));
        setToppings(mappedToppings);
      }
    } catch (err) {
      console.error("Error fetching POS data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter Products (Recommended items first, then sort_order)
  const filteredProducts = products
    .filter((p) => {
      if (selectedCategory !== "all" && p.category !== selectedCategory) return false;
      return true;
    })
    .sort((a, b) => {
      if (a.is_recommended !== b.is_recommended) {
        return a.is_recommended ? -1 : 1;
      }
      return a.sort_order - b.sort_order;
    });

  // Helper to get base price of product based on chosen temperature
  const getProductPrice = (product: Product, temp: "iced" | "hot") => {
    if (temp === "hot") {
      return product.price_hot !== null && product.price_hot !== undefined ? product.price_hot : (product.price_iced || 0);
    }
    return product.price_iced !== null && product.price_iced !== undefined ? product.price_iced : (product.price_hot || 0);
  };

  // Open Customizer
  const handleOpenCustomizer = (product: Product) => {
    setCustomizingProduct(product);
  };

  // Add customized item from OrderProductModal to cart
  const handleAddToCart = (result: OrderItemResult) => {
    const newItem: CartItem = {
      cart_item_id: `${result.product.id}-${result.temperature}-${result.sweetness}-${result.toppings.map((t) => t.id).sort().join(",")}-${Date.now()}`,
      product: result.product as Product,
      temperature: result.temperature,
      sweetness: result.sweetness,
      toppings: result.toppings as Topping[],
      quantity: result.quantity,
      unit_price: result.unitPrice,
      total_price: result.totalPrice,
      note: result.note,
    };

    setCart((prev) => [...prev, newItem]);
    setCustomizingProduct(null);
  };

  // Update Cart Quantity
  const handleUpdateCartQty = (cartItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.cart_item_id === cartItemId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            return {
              ...item,
              quantity: newQty,
              total_price: item.unit_price * newQty,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  // Cart Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.total_price, 0);
  const netTotal = subtotal;
  const totalCups = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Handle Checkout Submit
  const handleFinishCheckout = () => {
    const cashNum = Number(cashReceived) || netTotal;
    const change = Math.max(0, cashNum - netTotal);
    const queueNum = `A${Math.floor(10 + Math.random() * 90)}`;

    setOrderSuccessQueue({
      queueNumber: queueNum,
      orderId: Math.floor(1000 + Math.random() * 9000),
      total: netTotal,
      change: paymentMethod === "cash" ? change : 0,
    });
    setIsCheckoutOpen(false);
    setIsCartOpen(false);
    setCart([]);
    setCashReceived("");
  };

  const isAnyOverlayOpen = isCartOpen || !!customizingProduct || isCheckoutOpen || !!orderSuccessQueue;

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--cream)" }}>
      <AdminSidebar />

      <main className="kanit-theme" style={{ flex: 1, padding: "1.75rem 2.5rem 6rem 2.5rem", overflowY: isAnyOverlayOpen ? "hidden" : "auto", minWidth: 0, position: "relative", fontFamily: "'Kanit', sans-serif" }}>
        <div style={{ maxWidth: "640px", margin: "0 auto" }}>
          {/* Header Bar */}
          <div>
            <h1 style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--ink)", lineHeight: 1.2 }}>
              รายการเมนูเครื่องดื่ม
            </h1>
            <p style={{ fontSize: "0.8rem", color: "var(--ink-soft)", marginTop: "0.25rem" }}>
              กดเลือกเมนูเพื่อปรับความหวาน อุณหภูมิ และท็อปปิ้ง
            </p>
          </div>

          {/* Category Tabs */}
          <div
            style={{
              marginTop: "0.85rem",
              display: "flex",
              gap: "0.5rem",
              borderBottom: "1px solid rgba(50, 55, 65, 0.1)",
              paddingBottom: "0.5rem",
              overflowX: "auto",
            }}
          >
            {[
              { id: "all", label: "ทั้งหมด" },
              { id: "flavours", label: "รสชาติหลัก" },
              { id: "combos", label: "เมนูคอมโบ" },
            ].map((tab) => {
              const isSelected = selectedCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedCategory(tab.id as any)}
                  style={{
                    borderRadius: "9999px",
                    padding: "0.45rem 0.9rem",
                    fontSize: "0.825rem",
                    fontWeight: isSelected ? 700 : 500,
                    cursor: "pointer",
                    border: isSelected ? "none" : "1px solid rgba(50, 55, 65, 0.1)",
                    backgroundColor: isSelected ? "var(--ink)" : "var(--card)",
                    color: isSelected ? "var(--cream)" : "var(--ink-soft)",
                    transition: "all 0.2s ease",
                    whiteSpace: "nowrap",
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Products Grid (2 Columns Exact Match with Storefront) */}
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "260px", gap: "0.75rem", color: "var(--ink-soft)" }}>
              <Loader2 size={32} className="animate-spin" color="var(--teal)" />
              <span style={{ fontSize: "0.875rem" }}>กำลังโหลดรายการเมนู...</span>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "260px", gap: "0.5rem", color: "var(--ink-soft)" }}>
              <span style={{ fontSize: "1.5rem" }}>🔍</span>
              <p style={{ fontSize: "0.9rem", fontWeight: 600 }}>ไม่พบเมนูที่ค้นหา</p>
            </div>
          ) : (
            <div
              style={{
                marginTop: "1rem",
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "0.85rem",
              }}
            >
            {filteredProducts.map((p, i) => (
              <article
                key={p.id}
                className="animate-rise"
                onClick={() => handleOpenCustomizer(p)}
              style={{
                animationDelay: `${50 + i * 30}ms`,
                overflow: "hidden",
                borderRadius: "1.25rem",
                backgroundColor: "var(--card)",
                border: "1px solid rgba(50, 55, 65, 0.1)",
                display: "flex",
                flexDirection: "column",
                cursor: "pointer",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow = "0 10px 24px rgba(0,0,0,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.03)";
              }}
            >
              {/* Image & Top Badges (1:1 Aspect Ratio like admin/management/menu) */}
              <div style={{ position: "relative", width: "100%", aspectRatio: "1/1", backgroundColor: "#f0ece1", borderTopLeftRadius: "1.25rem", borderTopRightRadius: "1.25rem" }}>
                {/* Inner wrapper for image overflow clipping */}
                <div style={{ position: "absolute", inset: 0, overflow: "hidden", borderTopLeftRadius: "1.25rem", borderTopRightRadius: "1.25rem" }}>
                  {p.image ? (
                    <Image
                      src={p.image}
                      alt={p.name_th}
                      fill
                      sizes="(max-width: 640px) 50vw, 240px"
                      priority={i < 4}
                      unoptimized={p.image.startsWith("http")}
                      draggable={false}
                      style={{
                        objectFit: "cover",
                        userSelect: "none",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#ebe6d8",
                        color: "var(--ink-soft)",
                        gap: "0.35rem",
                        opacity: 0.6,
                      }}
                    >
                      <ImageIcon size={32} strokeWidth={1.5} />
                      <span style={{ fontSize: "0.7rem", fontWeight: 500 }}>ไม่มีรูปภาพ</span>
                    </div>
                  )}
                </div>

                {p.is_recommended && (
                  <span
                    style={{
                      position: "absolute",
                      left: "0.5rem",
                      top: "0.5rem",
                      borderRadius: "9999px",
                      backgroundColor: "var(--warm)",
                      padding: "0.2rem 0.6rem",
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "var(--ink)",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                      zIndex: 10,
                    }}
                  >
                    แนะนำ
                  </span>
                )}
                {p.category === "combos" && (
                  <span
                    style={{
                      position: "absolute",
                      right: "0.5rem",
                      top: "0.5rem",
                      borderRadius: "9999px",
                      backgroundColor: "var(--teal)",
                      padding: "0.2rem 0.5rem",
                      fontSize: "9px",
                      fontWeight: 700,
                      color: "var(--cream)",
                      zIndex: 10,
                    }}
                  >
                    COMBO
                  </span>
                )}
              </div>

              <div style={{ padding: "0.85rem", display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
                <div>
                  <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--ink)" }}>{p.name_th}</h3>
                  <p className="font-mono" style={{ fontSize: "0.7rem", color: "var(--ink-soft)", marginTop: "0.1rem" }}>
                    {p.name_en}
                  </p>
                  <p style={{ marginTop: "0.35rem", fontSize: "0.75rem", color: "var(--ink-soft)", lineHeight: 1.35 }}>
                    {p.desc}
                  </p>
                </div>

                <div style={{ marginTop: "0.75rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <span style={{ fontSize: "0.7rem", color: "var(--ink-soft)" }}>เริ่มต้น </span>
                    <span className="font-display" style={{ fontSize: "1.25rem", color: "var(--ink)" }}>
                      {p.price_iced ?? p.price_hot ?? 0}฿
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenCustomizer(p);
                    }}
                    style={{
                      borderRadius: "9999px",
                      backgroundColor: "var(--ink)",
                      padding: "0.4rem 0.85rem",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "var(--cream)",
                      border: "none",
                      cursor: "pointer",
                      transition: "opacity 0.15s ease",
                    }}
                  >
                    เลือก +
                  </button>
                </div>
              </div>
            </article>
          ))}
            </div>
          )}
        </div>

        {/* Floating Cart Button (Bottom Right - Exactly like Storefront) */}
        <button
          type="button"
          onClick={() => setIsCartOpen(true)}
          aria-label="ตะกร้าสินค้า"
          style={{
            position: "fixed",
            bottom: "2rem",
            right: "2.5rem",
            zIndex: 40,
            width: "4rem",
            height: "4rem",
            display: "grid",
            placeItems: "center",
            borderRadius: "9999px",
            backgroundColor: "var(--ink)",
            color: "var(--cream)",
            boxShadow: "0 12px 32px rgba(0, 0, 0, 0.35)",
            border: "none",
            cursor: "pointer",
            transition: "transform 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          <ShoppingBag size={24} />
          {totalCups > 0 && (
            <span
              style={{
                position: "absolute",
                right: "-0.2rem",
                top: "-0.2rem",
                minWidth: "1.6rem",
                height: "1.6rem",
                padding: "0 0.3rem",
                display: "grid",
                placeItems: "center",
                borderRadius: "9999px",
                backgroundColor: "var(--warm)",
                fontSize: "0.8rem",
                fontWeight: 800,
                color: "var(--ink)",
                border: "2px solid var(--cream)",
              }}
            >
              {totalCups}
            </span>
          )}
        </button>

        {/* Cart Drawer (Slide in from right) */}
        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cart={cart.map((c) => ({
            cartId: c.cart_item_id,
            productId: c.product.id,
            productName: c.product.name_th,
            temperature: c.temperature,
            sweetness: c.sweetness,
            toppings: c.toppings.map((t) => ({ id: t.id, name: t.name_th, price: t.price })),
            unitPrice: c.unit_price,
            quantity: c.quantity,
            note: c.note,
          }))}
          onUpdateQty={handleUpdateCartQty}
          onCheckout={() => {
            setIsCartOpen(false);
            setIsCheckoutOpen(true);
          }}
          title="ตะกร้าเครื่องดื่ม (Walk-in)"
          subtitle={`ทั้งหมด ${totalCups} แก้ว`}
          checkoutButtonText="ชำระเงิน & ออกบัตรคิว"
        />

        {/* Item Customizer Modal (Reusable Modal with Checkbox Toppings) */}
        <OrderProductModal
          isOpen={!!customizingProduct}
          onClose={() => setCustomizingProduct(null)}
          product={customizingProduct}
          toppings={toppings}
          onAddToCart={handleAddToCart}
        />

        {/* Payment Checkout Modal */}
        {isCheckoutOpen && (
          <div
            className="animate-fade-in"
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 100,
              padding: "1rem",
            }}
          >
            <div
              className="animate-modal-pop"
              style={{
                backgroundColor: "var(--card)",
                borderRadius: "1.25rem",
                width: "100%",
                maxWidth: "460px",
                padding: "1.75rem",
                boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--ink)" }}>
                  ชำระเงินออเดอร์ Walk-in
                </h3>
                <button type="button" onClick={() => setIsCheckoutOpen(false)} style={{ border: "none", background: "none", cursor: "pointer", color: "var(--ink-soft)" }}>
                  <X size={20} />
                </button>
              </div>

              <div style={{ marginTop: "1rem", textAlign: "center", padding: "1rem", backgroundColor: "var(--cream)", borderRadius: "0.75rem" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--ink-soft)" }}>ยอดชำระสุทธิ</span>
                <p style={{ fontSize: "2rem", fontWeight: 800, color: "var(--teal)", marginTop: "2px" }}>
                  ฿{netTotal}
                </p>
              </div>

              {/* Payment Method Selector */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginTop: "1rem" }}>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("cash")}
                  style={{
                    padding: "0.75rem",
                    borderRadius: "0.75rem",
                    border: paymentMethod === "cash" ? "2px solid var(--teal)" : "1px solid rgba(50,55,65,0.1)",
                    backgroundColor: paymentMethod === "cash" ? "rgba(75,155,140,0.1)" : "var(--card)",
                    color: paymentMethod === "cash" ? "var(--teal)" : "var(--ink)",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "0.35rem",
                  }}
                >
                  <Banknote size={24} />
                  <span>เงินสด (Cash)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("promptpay")}
                  style={{
                    padding: "0.75rem",
                    borderRadius: "0.75rem",
                    border: paymentMethod === "promptpay" ? "2px solid var(--teal)" : "1px solid rgba(50,55,65,0.1)",
                    backgroundColor: paymentMethod === "promptpay" ? "rgba(75,155,140,0.1)" : "var(--card)",
                    color: paymentMethod === "promptpay" ? "var(--teal)" : "var(--ink)",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "0.35rem",
                  }}
                >
                  <QrCode size={24} />
                  <span>พร้อมเพย์ (QR PromptPay)</span>
                </button>
              </div>

              {/* Cash Change Calculator */}
              {paymentMethod === "cash" && (
                <div style={{ marginTop: "1rem" }}>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.35rem" }}>
                    จำนวนเงินที่รับจากลูกค้า (บาท)
                  </label>
                  <input
                    type="number"
                    placeholder={`เช่น ${netTotal}`}
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.6rem 0.85rem",
                      borderRadius: "0.6rem",
                      border: "1px solid rgba(50,55,65,0.15)",
                      fontSize: "1.1rem",
                      fontWeight: 700,
                      outline: "none",
                      backgroundColor: "var(--cream)",
                    }}
                  />
                  {cashReceived && Number(cashReceived) >= netTotal && (
                    <p style={{ marginTop: "0.5rem", fontSize: "0.95rem", fontWeight: 700, color: "var(--teal)" }}>
                      เงินทอน: ฿{Number(cashReceived) - netTotal}
                    </p>
                  )}
                </div>
              )}

              {/* PromptPay QR Simulation */}
              {paymentMethod === "promptpay" && (
                <div style={{ marginTop: "1rem", textAlign: "center", padding: "1rem", backgroundColor: "#fff", borderRadius: "0.75rem", border: "1px solid rgba(50,55,65,0.1)" }}>
                  <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--ink)" }}>สแกน QR Code พร้อมเพย์</p>
                  <div style={{ width: "120px", height: "120px", backgroundColor: "var(--cream)", margin: "0.5rem auto", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "0.5rem" }}>
                    <QrCode size={64} color="var(--ink)" />
                  </div>
                  <p style={{ fontSize: "0.75rem", color: "var(--ink-soft)" }}>ถั่วทอง น้ำเต้าหู้ (พร้อมเพย์)</p>
                </div>
              )}

              <button
                type="button"
                onClick={handleFinishCheckout}
                style={{
                  width: "100%",
                  marginTop: "1.25rem",
                  padding: "0.85rem",
                  borderRadius: "9999px",
                  border: "none",
                  backgroundColor: "var(--teal)",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "1rem",
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(75,155,140,0.3)",
                }}
              >
                ยืนยันการชำระเงิน & ออกบัตรคิว
              </button>
            </div>
          </div>
        )}

        {/* Order Success Ticket Modal */}
        {orderSuccessQueue && (
          <div
            className="animate-fade-in"
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 100,
              padding: "1rem",
            }}
          >
            <div
              className="animate-modal-pop"
              style={{
                backgroundColor: "var(--card)",
                borderRadius: "1.25rem",
                width: "100%",
                maxWidth: "380px",
                padding: "2rem 1.75rem",
                textAlign: "center",
                boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
              }}
            >
              <div style={{ width: "56px", height: "56px", borderRadius: "50%", backgroundColor: "rgba(34, 197, 94, 0.15)", color: "#22c55e", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
                <CheckCircle2 size={32} />
              </div>

              <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--ink)" }}>
                บันทึกออเดอร์สำเร็จ!
              </h3>
              <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)", marginTop: "2px" }}>
                ออเดอร์ #{orderSuccessQueue.orderId} (Walk-in)
              </p>

              <div style={{ marginTop: "1.25rem", padding: "1.25rem", backgroundColor: "var(--cream)", borderRadius: "1rem", border: "2px dashed var(--teal)" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--ink-soft)", fontWeight: 600 }}>หมายเลขคิวของคุณ</span>
                <p className="font-mono" style={{ fontSize: "2.75rem", fontWeight: 900, color: "var(--teal)", lineHeight: 1.2, marginTop: "4px" }}>
                  {orderSuccessQueue.queueNumber}
                </p>
                {orderSuccessQueue.change > 0 && (
                  <p style={{ fontSize: "0.85rem", color: "var(--ink)", fontWeight: 700, marginTop: "0.5rem" }}>
                    เงินทอน: ฿{orderSuccessQueue.change}
                  </p>
                )}
              </div>

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
                <button
                  type="button"
                  onClick={() => setOrderSuccessQueue(null)}
                  style={{
                    flex: 1,
                    padding: "0.75rem",
                    borderRadius: "0.6rem",
                    border: "none",
                    backgroundColor: "var(--teal)",
                    color: "#fff",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  รับออเดอร์ถัดไป
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
