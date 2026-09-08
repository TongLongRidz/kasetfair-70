"use client";

import React, { useState } from "react";
import Image from "next/image";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import CartDrawer from "@/components/layouts/CartDrawer";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Phone,
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
} from "lucide-react";

interface Product {
  id: number;
  name_th: string;
  name_en: string;
  price: number;
  category: "flavours" | "combos";
  image: string;
  is_available: boolean;
  is_sold_out: boolean;
  is_recommended: boolean;
  default_toppings?: string[];
}

interface Topping {
  id: number;
  name_th: string;
  name_en: string;
  price: number;
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

const PRODUCTS: Product[] = [
  {
    id: 1,
    name_th: "น้ำเต้าหู้ดั้งเดิม",
    name_en: "Original Soy Milk",
    price: 35,
    category: "flavours",
    image: "/images/hero-soy.jpg",
    is_available: true,
    is_sold_out: false,
    is_recommended: true,
  },
  {
    id: 2,
    name_th: "น้ำเต้าหู้มัทฉะ",
    name_en: "Matcha Soy",
    price: 50,
    category: "flavours",
    image: "/images/drink-matcha.jpg",
    is_available: true,
    is_sold_out: false,
    is_recommended: true,
  },
  {
    id: 3,
    name_th: "น้ำเต้าหู้ชาไทย",
    name_en: "Thai Tea Soy",
    price: 45,
    category: "flavours",
    image: "/images/drink-mango.jpg",
    is_available: true,
    is_sold_out: false,
    is_recommended: false,
  },
  {
    id: 4,
    name_th: "น้ำเต้าหู้นมเย็น",
    name_en: "Nom Yen Soy",
    price: 40,
    category: "flavours",
    image: "/images/drink-lychee.jpg",
    is_available: true,
    is_sold_out: false,
    is_recommended: false,
  },
  {
    id: 5,
    name_th: "น้ำเต้าหู้ช็อกโกแลต",
    name_en: "Choco Soy",
    price: 45,
    category: "flavours",
    image: "/images/drink-pearl.jpg",
    is_available: true,
    is_sold_out: false,
    is_recommended: false,
  },
  {
    id: 6,
    name_th: "Matcha + Red Bean / Boba",
    name_en: "Combo Matcha Lover",
    price: 65,
    category: "combos",
    image: "/images/drink-matcha.jpg",
    is_available: true,
    is_sold_out: false,
    is_recommended: true,
    default_toppings: ["ไข่มุกบราวน์ชูการ์", "ถั่วแดงกวนหวานมัน"],
  },
  {
    id: 7,
    name_th: "Thai Tea + Boba",
    name_en: "Combo Thai Tea Boba",
    price: 55,
    category: "combos",
    image: "/images/drink-mango.jpg",
    is_available: true,
    is_sold_out: false,
    is_recommended: true,
    default_toppings: ["ไข่มุกบราวน์ชูการ์"],
  },
  {
    id: 8,
    name_th: "Nom Yen + Grass Jelly",
    name_en: "Combo Pinky Grass Jelly",
    price: 50,
    category: "combos",
    image: "/images/drink-lychee.jpg",
    is_available: true,
    is_sold_out: false,
    is_recommended: false,
    default_toppings: ["เฉาก๊วยหนึบ"],
  },
];

const TOPPINGS: Topping[] = [
  { id: 1, name_th: "ไข่มุกบราวน์ชูการ์", name_en: "Brown Sugar Boba", price: 10, is_sold_out: false },
  { id: 2, name_th: "เฉาก๊วยหนึบ", name_en: "Grass Jelly", price: 10, is_sold_out: false },
  { id: 3, name_th: "เม็ดแมงลัก", name_en: "Basil Seeds", price: 5, is_sold_out: false },
  { id: 4, name_th: "เมล็ดเจีย", name_en: "Chia Seeds", price: 10, is_sold_out: false },
  { id: 5, name_th: "สาคูใบเตย", name_en: "Pandan Sago", price: 5, is_sold_out: false },
  { id: 6, name_th: "ถั่วแดงกวนหวานมัน", name_en: "Sweet Red Bean", price: 10, is_sold_out: false },
];

export default function POSFrontDeskPage() {
  const [selectedCategory, setSelectedCategory] = useState<"all" | "flavours" | "combos">("all");
  const [searchMenu, setSearchMenu] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Item Customizer Modal State
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);
  const [custTemp, setCustTemp] = useState<"iced" | "hot">("iced");
  const [custSweetness, setCustSweetness] = useState<"0%" | "25%" | "50%" | "75%" | "100%">("50%");
  const [custToppings, setCustToppings] = useState<Topping[]>([]);
  const [custQuantity, setCustQuantity] = useState<number>(1);
  const [custNote, setCustNote] = useState<string>("");

  // Customer Loyalty Lookup State
  const [customerPhone, setCustomerPhone] = useState("");
  const [foundCustomer, setFoundCustomer] = useState<{ name: string; points: number } | null>(null);
  const [isRedeemingReward, setIsRedeemingReward] = useState(false);

  // Payment Checkout Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "promptpay">("cash");
  const [cashReceived, setCashReceived] = useState<string>("");
  const [orderSuccessQueue, setOrderSuccessQueue] = useState<{ queueNumber: string; orderId: number; total: number; change: number } | null>(null);

  // Filter Products
  const filteredProducts = PRODUCTS.filter((p) => {
    if (selectedCategory !== "all" && p.category !== selectedCategory) return false;
    if (searchMenu.trim() && !p.name_th.includes(searchMenu.trim()) && !p.name_en.toLowerCase().includes(searchMenu.toLowerCase())) return false;
    return true;
  });

  // Open Customizer
  const handleOpenCustomizer = (product: Product) => {
    setCustomizingProduct(product);
    setCustTemp("iced");
    setCustSweetness("50%");
    setCustToppings([]);
    setCustQuantity(1);
    setCustNote("");
  };

  // Toggle Topping in Customizer
  const handleToggleTopping = (topping: Topping) => {
    if (custToppings.some((t) => t.id === topping.id)) {
      setCustToppings(custToppings.filter((t) => t.id !== topping.id));
    } else {
      setCustToppings([...custToppings, topping]);
    }
  };

  // Add customized item to cart
  const handleAddToCart = () => {
    if (!customizingProduct) return;

    const toppingTotal = custToppings.reduce((s, t) => s + t.price, 0);
    const unitPrice = customizingProduct.price + toppingTotal;
    const totalPrice = unitPrice * custQuantity;

    const newItem: CartItem = {
      cart_item_id: `${customizingProduct.id}-${custTemp}-${custSweetness}-${custToppings.map((t) => t.id).sort().join(",")}-${Date.now()}`,
      product: customizingProduct,
      temperature: custTemp,
      sweetness: custSweetness,
      toppings: custToppings,
      quantity: custQuantity,
      unit_price: unitPrice,
      total_price: totalPrice,
      note: custNote.trim(),
    };

    setCart([...cart, newItem]);
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
  const discountAmount = isRedeemingReward ? 35 : 0;
  const netTotal = Math.max(0, subtotal - discountAmount);
  const totalCups = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Customer Phone Lookup simulation
  const handleLookupCustomer = (phone: string) => {
    setCustomerPhone(phone);
    if (phone.replace(/\D/g, "").length >= 9) {
      setFoundCustomer({
        name: "คุณฟ้า (สมาชิกประจำ)",
        points: 12,
      });
    } else {
      setFoundCustomer(null);
      setIsRedeemingReward(false);
    }
  };

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
    setCustomerPhone("");
    setFoundCustomer(null);
    setIsRedeemingReward(false);
    setCashReceived("");
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--cream)", fontFamily: "'Kanit', sans-serif" }}>
      <AdminSidebar />

      <main style={{ flex: 1, padding: "1.75rem 2.5rem 6rem 2.5rem", overflowY: "auto", minWidth: 0, position: "relative" }}>
        {/* Header Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--ink)", lineHeight: 1.2 }}>
              ระบบขายหน้าร้าน (POS Walk-in)
            </h1>
          </div>

          {/* Search Input */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", backgroundColor: "var(--card)", padding: "0.55rem 0.95rem", borderRadius: "0.75rem", border: "1px solid rgba(50,55,65,0.1)", minWidth: "260px" }}>
            <Search size={18} color="var(--ink-soft)" />
            <input
              type="text"
              placeholder="ค้นหาเมนูเครื่องดื่ม..."
              value={searchMenu}
              onChange={(e) => setSearchMenu(e.target.value)}
              style={{ border: "none", background: "transparent", outline: "none", fontSize: "0.875rem", width: "100%", fontFamily: "'Kanit', sans-serif" }}
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div style={{ display: "flex", gap: "0.6rem", marginTop: "1.25rem", overflowX: "auto", paddingBottom: "4px" }}>
          {[
            { id: "all", label: "ทั้งหมด" },
            { id: "flavours", label: "รสชาติหลัก" },
            { id: "combos", label: "เมนูคอมโบ" },
          ].map((tab) => {
            const active = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedCategory(tab.id as any)}
                style={{
                  padding: "0.5rem 1.25rem",
                  borderRadius: "9999px",
                  border: active ? "none" : "1px solid rgba(50, 55, 65, 0.1)",
                  backgroundColor: active ? "var(--ink)" : "var(--card)",
                  color: active ? "var(--cream)" : "var(--ink-soft)",
                  fontWeight: active ? 700 : 500,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s ease",
                  boxShadow: active ? "0 4px 12px rgba(0,0,0,0.15)" : "none",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Product Grid (Full Width Responsive Catalog) */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1.25rem", marginTop: "1.25rem" }}>
          {filteredProducts.map((p) => (
            <div
              key={p.id}
              onClick={() => handleOpenCustomizer(p)}
              style={{
                backgroundColor: "var(--card)",
                borderRadius: "1.25rem",
                border: "1px solid rgba(50, 55, 65, 0.1)",
                padding: "1rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
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
              <div>
                <div style={{ position: "relative", width: "100%", height: "140px", borderRadius: "0.9rem", overflow: "hidden", marginBottom: "0.75rem" }}>
                  <Image src={p.image} alt={p.name_th} fill sizes="240px" style={{ objectFit: "cover" }} />
                  {p.is_recommended && (
                    <span style={{ position: "absolute", top: 8, left: 8, backgroundColor: "var(--warm)", color: "var(--ink)", fontSize: "0.7rem", padding: "2px 8px", borderRadius: "9999px", fontWeight: 700 }}>
                      แนะนำ
                    </span>
                  )}
                  {p.category === "combos" && (
                    <span style={{ position: "absolute", bottom: 8, left: 8, backgroundColor: "var(--teal)", color: "#fff", fontSize: "0.7rem", padding: "2px 8px", borderRadius: "9999px", fontWeight: 700 }}>
                      COMBO
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--ink)", lineHeight: 1.3 }}>
                  {p.name_th}
                </h3>
                <p style={{ fontSize: "0.8rem", color: "var(--ink-soft)", marginTop: "2px" }}>
                  {p.name_en}
                </p>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem", paddingTop: "0.6rem", borderTop: "1px solid rgba(50,55,65,0.06)" }}>
                <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--teal)" }}>
                  ฿{p.price}
                </span>
                <div style={{ width: "32px", height: "32px", borderRadius: "9999px", backgroundColor: "rgba(75, 155, 140, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--teal)" }}>
                  <Plus size={18} />
                </div>
              </div>
            </div>
          ))}
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
          discountAmount={discountAmount}
          extraHeaderContent={
            <div style={{ padding: "0.85rem", backgroundColor: "var(--card)", borderRadius: "1rem", border: "1px solid rgba(50,55,65,0.08)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <Phone size={15} color="var(--teal)" />
                <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>เบอร์โทรศัพท์สมาชิก (Optional):</span>
              </div>
              <input
                type="tel"
                placeholder="กรอกเบอร์โทรลูกค้า เช่น 081-234-5678 เพื่อสะสมแต้ม"
                value={customerPhone}
                onChange={(e) => handleLookupCustomer(e.target.value)}
                style={{
                  width: "100%",
                  marginTop: "0.4rem",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "0.6rem",
                  border: "1px solid rgba(50,55,65,0.15)",
                  backgroundColor: "var(--cream)",
                  fontSize: "0.875rem",
                  fontFamily: "'Kanit', sans-serif",
                  outline: "none",
                }}
              />
              {foundCustomer && (
                <div style={{ marginTop: "0.6rem", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem", paddingTop: "0.4rem", borderTop: "1px dashed rgba(50,55,65,0.1)" }}>
                  <span style={{ color: "var(--ink)", fontWeight: 600 }}>{foundCustomer.name}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ color: "var(--teal)", fontWeight: 700 }}>{foundCustomer.points} แต้ม</span>
                    {foundCustomer.points >= 5 && (
                      <button
                        type="button"
                        onClick={() => setIsRedeemingReward(!isRedeemingReward)}
                        style={{
                          fontSize: "0.75rem",
                          padding: "3px 8px",
                          borderRadius: "9999px",
                          border: "none",
                          backgroundColor: isRedeemingReward ? "#22c55e" : "var(--teal)",
                          color: "#fff",
                          cursor: "pointer",
                          fontWeight: 600,
                        }}
                      >
                        {isRedeemingReward ? "ใช้แต้มแล้ว (-35บ.)" : "แลกฟรี 1 แก้ว (5แต้ม)"}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          }
        />

        {/* Item Customizer Modal (Matched with Storefront) */}
        {customizingProduct && (
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
                borderRadius: "1.5rem",
                width: "100%",
                maxWidth: "480px",
                maxHeight: "90vh",
                overflowY: "auto",
                padding: "1.5rem",
                boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--ink)" }}>
                    {customizingProduct.name_th}
                  </h3>
                  <p style={{ fontSize: "0.8rem", color: "var(--ink-soft)" }}>{customizingProduct.name_en}</p>
                </div>
                <button type="button" onClick={() => setCustomizingProduct(null)} style={{ border: "none", background: "none", cursor: "pointer", color: "var(--ink-soft)", fontSize: "1.25rem" }}>
                  ✕
                </button>
              </div>

              <hr style={{ margin: "1rem 0", borderColor: "rgba(50, 55, 65, 0.1)" }} />

              {/* 1. Temperature Selection */}
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.4rem" }}>
                  1. เลือกอุณหภูมิ (Temperature)
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                  <button
                    type="button"
                    onClick={() => setCustTemp("iced")}
                    style={{
                      padding: "0.7rem",
                      borderRadius: "0.75rem",
                      border: custTemp === "iced" ? "2px solid var(--teal)" : "1px solid rgba(50, 55, 65, 0.15)",
                      backgroundColor: custTemp === "iced" ? "rgba(75, 155, 140, 0.12)" : "var(--cream)",
                      color: custTemp === "iced" ? "var(--teal)" : "var(--ink)",
                      fontWeight: 700,
                      cursor: "pointer",
                      fontSize: "0.85rem",
                    }}
                  >
                    เย็น (Iced)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustTemp("hot")}
                    style={{
                      padding: "0.7rem",
                      borderRadius: "0.75rem",
                      border: custTemp === "hot" ? "2px solid var(--warm)" : "1px solid rgba(50, 55, 65, 0.15)",
                      backgroundColor: custTemp === "hot" ? "rgba(220, 160, 50, 0.12)" : "var(--cream)",
                      color: custTemp === "hot" ? "var(--warm)" : "var(--ink)",
                      fontWeight: 700,
                      cursor: "pointer",
                      fontSize: "0.85rem",
                    }}
                  >
                    ร้อน (Hot)
                  </button>
                </div>
              </div>

              {/* 2. Sweetness Selector */}
              <div style={{ marginTop: "1.25rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.4rem" }}>
                  2. ระดับความหวาน (Sweetness)
                </label>
                <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                  {(["0%", "25%", "50%", "75%", "100%"] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setCustSweetness(lvl)}
                      style={{
                        flex: 1,
                        minWidth: "55px",
                        padding: "0.55rem 0.2rem",
                        borderRadius: "0.65rem",
                        border: custSweetness === lvl ? "2px solid var(--ink)" : "1px solid rgba(50, 55, 65, 0.15)",
                        backgroundColor: custSweetness === lvl ? "var(--ink)" : "var(--cream)",
                        color: custSweetness === lvl ? "var(--cream)" : "var(--ink)",
                        fontWeight: 700,
                        fontSize: "0.8rem",
                        cursor: "pointer",
                      }}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Toppings Selector */}
              <div style={{ marginTop: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: 700 }}>3. เลือกท็อปปิ้ง (Toppings)</label>
                  <span style={{ fontSize: "0.75rem", color: "var(--ink-soft)" }}>เลือกได้หลายอย่าง</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "0.4rem", maxHeight: "160px", overflowY: "auto" }}>
                  {TOPPINGS.map((top) => {
                    const isSelected = custToppings.some((t) => t.id === top.id);
                    const isBobaDisabled = custTemp === "hot" && top.id === 1;
                    return (
                      <button
                        key={top.id}
                        type="button"
                        disabled={isBobaDisabled}
                        onClick={() => handleToggleTopping(top)}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "0.55rem 0.85rem",
                          borderRadius: "0.75rem",
                          border: isSelected ? "2px solid var(--teal)" : "1px solid rgba(50, 55, 65, 0.12)",
                          backgroundColor: isSelected ? "rgba(75, 155, 140, 0.12)" : "var(--cream)",
                          color: isBobaDisabled ? "var(--ink-soft)" : "var(--ink)",
                          fontSize: "0.85rem",
                          fontWeight: isSelected ? 700 : 500,
                          cursor: isBobaDisabled ? "not-allowed" : "pointer",
                        }}
                      >
                        <span>
                          {isSelected ? "✓ " : "+ "} {top.name_th}
                        </span>
                        <span style={{ color: "var(--teal)", fontWeight: 700 }}>
                          +{top.price}฿
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Note input */}
              <div style={{ marginTop: "1rem" }}>
                <input
                  type="text"
                  placeholder="หมายเหตุเพิ่มเติม (เช่น แยกน้ำแข็ง)..."
                  value={custNote}
                  onChange={(e) => setCustNote(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "0.6rem",
                    border: "1px solid rgba(50,55,65,0.15)",
                    backgroundColor: "var(--cream)",
                    fontSize: "0.85rem",
                    outline: "none",
                  }}
                />
              </div>

              {/* Modal Bottom CTA */}
              <div style={{ marginTop: "1.25rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--ink-soft)" }}>ราคารวม</span>
                  <p style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--ink)", lineHeight: 1 }}>
                    {(customizingProduct.price + custToppings.reduce((s, t) => s + t.price, 0)) * custQuantity}฿
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddToCart}
                  style={{
                    flex: 1,
                    borderRadius: "9999px",
                    backgroundColor: "var(--teal)",
                    padding: "0.75rem 1rem",
                    fontSize: "0.95rem",
                    fontWeight: 700,
                    color: "var(--cream)",
                    border: "none",
                    cursor: "pointer",
                    boxShadow: "0 4px 15px rgba(75, 155, 140, 0.3)",
                  }}
                >
                  เพิ่มลงตะกร้า +
                </button>
              </div>
            </div>
          </div>
        )}

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
