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
  desc: string;
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
    desc: "น้ำเต้าหู้เข้มข้น หอมถั่วเหลืองแท้ 100% ต้มสดใหม่ทุกวัน",
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
    desc: "มัทฉะเกรดพรีเมียม ชงสดผสมน้ำเต้าหู้หอมละมุนเข้มข้น",
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
    desc: "ชาไทยใบชาคัดพิเศษ หอมเข้มมันนัว กลมกล่อมลงตัว",
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
    desc: "สละนมเย็นสีชมพูหวานละมุน หอมสดชื่น ดื่มง่าย",
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
    desc: "โกโก้เข้มข้นสูตรพิเศษ เข้ากันได้ดีเยี่ยมกับน้ำเต้าหู้",
    price: 45,
    category: "flavours",
    image: "/images/drink-pearl.jpg",
    is_available: true,
    is_sold_out: false,
    is_recommended: false,
  },
  {
    id: 101,
    name_th: "Matcha + Red Bean / Boba",
    name_en: "Combo Matcha Lover",
    desc: "มัทฉะเข้มข้นจับคู่กับไข่มุกหนึบหนับและถั่วแดงหวานมัน",
    price: 65,
    category: "combos",
    image: "/images/drink-matcha.jpg",
    is_available: true,
    is_sold_out: false,
    is_recommended: true,
    default_toppings: ["ไข่มุกบราวน์ชูการ์", "ถั่วแดงกวนหวานมัน"],
  },
  {
    id: 102,
    name_th: "Thai Tea + Boba",
    name_en: "Combo Thai Tea Boba",
    desc: "ชาไทยรสเข้มสูตรเด็ด เสิร์ฟพร้อมไข่มุกบราวน์ชูการ์นุ่มหนึบ",
    price: 55,
    category: "combos",
    image: "/images/drink-mango.jpg",
    is_available: true,
    is_sold_out: false,
    is_recommended: true,
    default_toppings: ["ไข่มุกบราวน์ชูการ์"],
  },
  {
    id: 103,
    name_th: "Nom Yen + Grass Jelly",
    name_en: "Combo Pinky Grass Jelly",
    desc: "นมเย็นชมพูหวานละมุน ตัดกับความหนึบเย็นชื่นใจของเฉาก๊วย",
    price: 50,
    category: "combos",
    image: "/images/drink-lychee.jpg",
    is_available: true,
    is_sold_out: false,
    is_recommended: false,
    default_toppings: ["เฉาก๊วยหนึบ"],
  },
  {
    id: 104,
    name_th: "Choco Special Combo",
    name_en: "Combo Choco Delight",
    desc: "ช็อกโกแลตเข้มข้นจับคู่ท็อปปิ้งสาคูและเฉาก๊วย เคี้ยวเพลิน",
    price: 55,
    category: "combos",
    image: "/images/drink-pearl.jpg",
    is_available: true,
    is_sold_out: false,
    is_recommended: false,
    default_toppings: ["สาคูใบเตย", "เฉาก๊วยหนึบ"],
  },
  {
    id: 105,
    name_th: "Original Signature Combo",
    name_en: "Combo Original All-Star",
    desc: "น้ำเต้าหู้สูตรโบราณ พร้อมเครื่องแน่นจัดเต็ม เม็ดแมงลัก เมล็ดเจีย สาคู",
    price: 50,
    category: "combos",
    image: "/images/hero-soy.jpg",
    is_available: true,
    is_sold_out: false,
    is_recommended: false,
    default_toppings: ["เม็ดแมงลัก", "เมล็ดเจีย", "สาคูใบเตย"],
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
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--cream)" }}>
      <AdminSidebar />

      <main className="kanit-theme" style={{ flex: 1, padding: "1.75rem 2.5rem 6rem 2.5rem", overflowY: "auto", minWidth: 0, position: "relative", fontFamily: "'Kanit', sans-serif" }}>
        <div style={{ maxWidth: "640px", margin: "0 auto" }}>
          {/* Header Bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h1 style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--ink)", lineHeight: 1.2 }}>
                รายการเมนูเครื่องดื่ม
              </h1>
              <p style={{ fontSize: "0.8rem", color: "var(--ink-soft)", marginTop: "0.25rem" }}>
                กดเลือกเมนูเพื่อปรับความหวาน, อุณหภูมิ และท็อปปิ้ง
              </p>
            </div>

            {/* Search Input */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", backgroundColor: "var(--card)", padding: "0.45rem 0.85rem", borderRadius: "9999px", border: "1px solid rgba(50,55,65,0.1)", width: "100%", maxWidth: "260px" }}>
              <Search size={16} color="var(--ink-soft)" />
              <input
                type="text"
                placeholder="ค้นหาเมนู..."
                value={searchMenu}
                onChange={(e) => setSearchMenu(e.target.value)}
                style={{ border: "none", background: "transparent", outline: "none", fontSize: "0.825rem", width: "100%", fontFamily: "'Kanit', sans-serif" }}
              />
            </div>
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
              <div style={{ position: "relative", width: "100%", aspectRatio: "1/1" }}>
                <Image
                  src={p.image}
                  alt={p.name_th}
                  fill
                  sizes="(max-width: 640px) 50vw, 240px"
                  priority={i < 4}
                  style={{ objectFit: "cover" }}
                />
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
                      {p.price}฿
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
