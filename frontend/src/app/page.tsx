"use client";

import { useState } from "react";
import Image from "next/image";
import Navbar from "@/components/layouts/Navbar";
import { ShoppingCart } from "lucide-react";

// Types
type Temperature = "iced" | "hot";
type Sweetness = "0%" | "25%" | "50%" | "75%" | "100%";

interface Topping {
  id: string;
  name: string;
  price: number;
  icedOnly?: boolean; // e.g. Boba is iced only
}

interface Product {
  id: number;
  name: string;
  nameEn: string;
  desc: string;
  price: number;
  image: string;
  category: "flavours" | "combos";
  recommended?: boolean;
  available: boolean;
  color: string;
  defaultToppings?: string[];
}

interface CartItem {
  cartId: string;
  productId: number;
  productName: string;
  temperature: Temperature;
  sweetness: Sweetness;
  toppings: Topping[];
  unitPrice: number;
  quantity: number;
}

// Data Definitions
const FLAVOURS: Product[] = [
  {
    id: 1,
    name: "น้ำเต้าหู้ดั้งเดิม",
    nameEn: "Original Soy Milk",
    desc: "น้ำเต้าหู้เข้มข้น หอมถั่วเหลืองแท้ 100% ต้มสดใหม่ทุกวัน",
    price: 35,
    image: "/images/hero-soy.jpg",
    category: "flavours",
    recommended: true,
    available: true,
    color: "#E5D9C5",
  },
  {
    id: 2,
    name: "น้ำเต้าหู้มัทฉะ",
    nameEn: "Matcha Soy",
    desc: "มัทฉะเกรดพรีเมียม ชงสดผสมน้ำเต้าหู้หอมละมุนเข้มข้น",
    price: 50,
    image: "/images/drink-matcha.jpg",
    category: "flavours",
    recommended: true,
    available: true,
    color: "#9BB068",
  },
  {
    id: 3,
    name: "น้ำเต้าหู้ชาไทย",
    nameEn: "Thai Tea Soy",
    desc: "ชาไทยใบชาคัดพิเศษ หอมเข้มมันนัว กลมกล่อมลงตัว",
    price: 45,
    image: "/images/drink-mango.jpg",
    category: "flavours",
    recommended: false,
    available: true,
    color: "#D97B40",
  },
  {
    id: 4,
    name: "น้ำเต้าหู้นมเย็น",
    nameEn: "Nom Yen Soy",
    desc: "สละนมเย็นสีชมพูหวานละมุน หอมสดชื่น ดื่มง่าย",
    price: 40,
    image: "/images/drink-lychee.jpg",
    category: "flavours",
    recommended: false,
    available: true,
    color: "#E89AA8",
  },
  {
    id: 5,
    name: "น้ำเต้าหู้ช็อกโกแลต",
    nameEn: "Choco Soy",
    desc: "โกโก้เข้มข้นสูตรพิเศษ เข้ากันได้ดีเยี่ยมกับน้ำเต้าหู้",
    price: 45,
    image: "/images/drink-pearl.jpg",
    category: "flavours",
    recommended: false,
    available: true,
    color: "#7D533C",
  },
];

const COMBOS: Product[] = [
  {
    id: 101,
    name: "Matcha + Red Bean / Boba",
    nameEn: "Combo Matcha Lover",
    desc: "มัทฉะเข้มข้นจับคู่กับไข่มุกหนึบหนับและถั่วแดงหวานมัน",
    price: 65,
    image: "/images/drink-matcha.jpg",
    category: "combos",
    recommended: true,
    available: true,
    color: "#9BB068",
    defaultToppings: ["boba", "red_bean"],
  },
  {
    id: 102,
    name: "Thai Tea + Boba",
    nameEn: "Combo Thai Tea Boba",
    desc: "ชาไทยรสเข้มสูตรเด็ด เสิร์ฟพร้อมไข่มุกบราวน์ชูการ์นุ่มหนึบ",
    price: 55,
    image: "/images/drink-mango.jpg",
    category: "combos",
    recommended: true,
    available: true,
    color: "#D97B40",
    defaultToppings: ["boba"],
  },
  {
    id: 103,
    name: "Nom Yen + Grass Jelly",
    nameEn: "Combo Pinky Grass Jelly",
    desc: "นมเย็นชมพูหวานละมุน ตัดกับความหนึบเย็นชื่นใจของเฉาก๊วย",
    price: 50,
    image: "/images/drink-lychee.jpg",
    category: "combos",
    recommended: false,
    available: true,
    color: "#E89AA8",
    defaultToppings: ["grass_jelly"],
  },
  {
    id: 104,
    name: "Choco Special Combo",
    nameEn: "Combo Choco Delight",
    desc: "ช็อกโกแลตเข้มข้นจับคู่ท็อปปิ้งสาคูและเฉาก๊วย เคี้ยวเพลิน",
    price: 55,
    image: "/images/drink-pearl.jpg",
    category: "combos",
    recommended: false,
    available: true,
    color: "#7D533C",
    defaultToppings: ["sago", "grass_jelly"],
  },
  {
    id: 105,
    name: "Original Signature Combo",
    nameEn: "Combo Original All-Star",
    desc: "น้ำเต้าหู้สูตรโบราณ พร้อมเครื่องแน่นจัดเต็ม เม็ดแมงลัก เมล็ดเจีย สาคู",
    price: 50,
    image: "/images/hero-soy.jpg",
    category: "combos",
    recommended: false,
    available: true,
    color: "#E5D9C5",
    defaultToppings: ["basil_seeds", "chia_seeds", "sago"],
  },
];

const TOPPINGS: Topping[] = [
  { id: "boba", name: "Boba (ไข่มุก)", price: 10, icedOnly: true },
  { id: "basil_seeds", name: "เม็ดแมงลัก", price: 5 },
  { id: "chia_seeds", name: "เมล็ดเจีย", price: 10 },
  { id: "sago", name: "สาคู", price: 5 },
  { id: "grass_jelly", name: "เฉาก๊วย", price: 10 },
];

const SWEETNESS_OPTIONS: Sweetness[] = ["0%", "25%", "50%", "75%", "100%"];

interface BannerSlide {
  tag: string;
  title: string;
  highlight: string;
  desc: string;
  ctaText: string;
  ctaLink: string;
  image: string;
  bgColor: string;
}

const BANNERS: BannerSlide[] = [
  {
    tag: "KASET FAIR 70 · STAND 12",
    title: "น้ำเต้าหู้",
    highlight: "5 รสชาติ",
    desc: "น้ำเต้าหู้ต้มสดใหม่ทุกวัน พร้อมท็อปปิ้งแน่นแก้ว ให้จิบระหว่างเดินงาน",
    ctaText: "เลือกซื้อเลย!",
    ctaLink: "#menu",
    image: "/images/hero-soy.jpg",
    bgColor: "var(--teal)",
  },
  {
    tag: "SPECIAL COMBO SETS",
    title: "เซ็ตคู่สุดคุ้ม",
    highlight: "จับคู่ท็อปปิ้งลงตัว",
    desc: "Matcha + ถั่วแดง/Boba, Thai Tea + Boba และ Pinky Nom Yen + เฉาก๊วย",
    ctaText: "สั่งเซ็ตคอมโบ",
    ctaLink: "#menu",
    image: "/images/drink-matcha.jpg",
    bgColor: "#3E6B5C",
  },
  {
    tag: "MEMBER REWARDS",
    title: "สะสมแต้มถั่วทอง",
    highlight: "ซื้อ 10 แต้มแลกฟรี",
    desc: "กรอกเบอร์โทรศัพท์เพื่อสะสมแต้มทุกแก้ว และแลกรับส่วนลดสุดพิเศษในงาน",
    ctaText: "เช็คแต้ม",
    ctaLink: "#points",
    image: "/images/drink-pearl.jpg",
    bgColor: "#634832",
  },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<"all" | "flavours" | "combos">("all");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Customization modal states
  const [temperature, setTemperature] = useState<Temperature>("iced");
  const [sweetness, setSweetness] = useState<Sweetness>("50%");
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
  
  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Phone points check
  const [phoneInput, setPhoneInput] = useState("");
  const [pointsChecked, setPointsChecked] = useState(false);
  const [pointsResult, setPointsResult] = useState<{ name: string; points: number } | null>(null);

  // Open modal
  const handleOpenCustomize = (product: Product) => {
    setSelectedProduct(product);
    setTemperature("iced");
    setSweetness("50%");
    setSelectedToppings(product.defaultToppings || []);
  };

  // Close modal
  const handleCloseModal = () => {
    setSelectedProduct(null);
  };

  // Toggle topping in modal
  const toggleTopping = (toppingId: string) => {
    setSelectedToppings((prev) =>
      prev.includes(toppingId)
        ? prev.filter((id) => id !== toppingId)
        : [...prev, toppingId]
    );
  };

  // Auto remove boba if temperature changed to hot
  const handleTemperatureChange = (temp: Temperature) => {
    setTemperature(temp);
    if (temp === "hot") {
      setSelectedToppings((prev) => prev.filter((id) => id !== "boba"));
    }
  };

  // Calculate modal item price
  const calculateModalPrice = () => {
    if (!selectedProduct) return 0;
    const toppingsCost = selectedToppings.reduce((acc, topId) => {
      const topping = TOPPINGS.find((t) => t.id === topId);
      return acc + (topping?.price || 0);
    }, 0);
    return selectedProduct.price + toppingsCost;
  };

  // Add customized item to cart
  const handleAddToCart = () => {
    if (!selectedProduct) return;

    const toppingsList = selectedToppings
      .map((id) => TOPPINGS.find((t) => t.id === id))
      .filter((t): t is Topping => !!t);

    const unitPrice = calculateModalPrice();
    const cartId = `${selectedProduct.id}-${temperature}-${sweetness}-${selectedToppings.sort().join(",")}`;

    setCart((prev) => {
      const existing = prev.find((item) => item.cartId === cartId);
      if (existing) {
        return prev.map((item) =>
          item.cartId === cartId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          cartId,
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          temperature,
          sweetness,
          toppings: toppingsList,
          unitPrice,
          quantity: 1,
        },
      ];
    });

    handleCloseModal();
    setIsCartOpen(true);
  };

  // Update cart item quantity
  const updateCartQty = (cartId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.cartId === cartId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalCartPrice = cart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);

  // Filter display products
  const displayProducts =
    activeTab === "all"
      ? [...FLAVOURS, ...COMBOS]
      : activeTab === "flavours"
      ? FLAVOURS
      : COMBOS;

  const handleCheckPoints = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput.trim()) return;
    setPointsChecked(true);
    setPointsResult({
      name: "คุณลูกค้า",
      points: 25,
    });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--cream)",
        color: "var(--ink)",
        fontFamily: "'Kanit', sans-serif",
      }}
    >
      {/* Navbar Component */}
      <Navbar />

      {/* Main Container */}
      <main style={{ maxWidth: "640px", margin: "0 auto", padding: "0 1rem 8rem 1rem" }}>
        {/* Hero Banner Carousel */}
        <section className="animate-rise" style={{ marginTop: "1rem" }}>
          <div
            style={{
              position: "relative",
              overflow: "hidden",
              borderRadius: "24px",
              backgroundColor: BANNERS[currentSlide].bgColor,
              padding: "1.5rem",
              color: "var(--cream)",
              boxShadow: "0 8px 30px -4px rgba(0, 0, 0, 0.15)",
              transition: "background-color 0.4s ease",
              minHeight: "190px",
            }}
          >
            <div style={{ position: "relative", zIndex: 10, maxWidth: "68%" }}>
              <p
                className="font-mono"
                style={{
                  fontSize: "10px",
                  textTransform: "uppercase",
                  letterSpacing: "0.22em",
                  color: "rgba(247, 246, 240, 0.8)",
                  fontWeight: 600,
                }}
              >
                {BANNERS[currentSlide].tag}
              </p>
              <h1
                style={{
                  marginTop: "0.4rem",
                  fontSize: "1.875rem",
                  fontWeight: 800,
                  lineHeight: 1.1,
                  color: "var(--cream)",
                }}
              >
                {BANNERS[currentSlide].title}
                <br />
                {BANNERS[currentSlide].highlight}
              </h1>
              <p
                style={{
                  marginTop: "0.4rem",
                  fontSize: "0.825rem",
                  lineHeight: 1.45,
                  color: "rgba(247, 246, 240, 0.9)",
                }}
              >
                {BANNERS[currentSlide].desc}
              </p>
              <div style={{ marginTop: "1.1rem", display: "flex", gap: "0.6rem" }}>
                <a
                  href={BANNERS[currentSlide].ctaLink}
                  style={{
                    borderRadius: "9999px",
                    backgroundColor: "var(--warm)",
                    padding: "0.5rem 1.25rem",
                    fontSize: "0.875rem",
                    fontWeight: 700,
                    color: "var(--ink)",
                    textDecoration: "none",
                  }}
                >
                  {BANNERS[currentSlide].ctaText}
                </a>
              </div>
            </div>

            <div
              style={{
                position: "absolute",
                right: "-2rem",
                top: "-2rem",
                width: "13.5rem",
                height: "13.5rem",
                borderRadius: "9999px",
                overflow: "hidden",
                border: "4px solid rgba(247, 246, 240, 0.25)",
              }}
            >
              <Image
                src={BANNERS[currentSlide].image}
                alt={BANNERS[currentSlide].title}
                fill
                sizes="220px"
                style={{ objectFit: "cover" }}
                priority
              />
            </div>
          </div>

          {/* Mockup Carousel Indicator Dots */}
          <div style={{ marginTop: "0.75rem", display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <span style={{ width: "1.25rem", height: "0.375rem", borderRadius: "9999px", backgroundColor: "rgba(50, 55, 65, 0.7)" }} />
            <span style={{ width: "0.375rem", height: "0.375rem", borderRadius: "9999px", backgroundColor: "rgba(50, 55, 65, 0.15)" }} />
            <span style={{ width: "0.375rem", height: "0.375rem", borderRadius: "9999px", backgroundColor: "rgba(50, 55, 65, 0.15)" }} />
          </div>
        </section>

        {/* Menu Section */}
        <section id="menu" style={{ marginTop: "1.75rem" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div>
              <h2 style={{ fontSize: "1.35rem", fontWeight: 800 }}>รายการเมนูเครื่องดื่ม</h2>
              <p style={{ fontSize: "0.8rem", color: "var(--ink-soft)" }}>กดเลือกเมนูเพื่อปรับความหวาน, อุณหภูมิ และท็อปปิ้ง</p>
            </div>
            <p
              className="font-mono"
              style={{
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                color: "var(--ink-soft)",
              }}
            >
              Menu
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
            }}
          >
            {[
              { id: "all", label: "ทั้งหมด" },
              { id: "flavours", label: "5 รสชาติหลัก" },
              { id: "combos", label: "เซ็ตคู่คอมโบ" },
            ].map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
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
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Products Grid */}
          <div
            style={{
              marginTop: "1rem",
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "0.85rem",
            }}
          >
            {displayProducts.map((p, i) => (
              <article
                key={p.id}
                className="animate-rise"
                onClick={() => handleOpenCustomize(p)}
                style={{
                  animationDelay: `${50 + i * 40}ms`,
                  overflow: "hidden",
                  borderRadius: "1.25rem",
                  backgroundColor: "var(--card)",
                  border: "1px solid rgba(50, 55, 65, 0.1)",
                  display: "flex",
                  flexDirection: "column",
                  cursor: "pointer",
                  transition: "transform 0.15s ease, box-shadow 0.15s ease",
                }}
              >
                <div style={{ position: "relative", width: "100%", aspectRatio: "1/1" }}>
                  <Image
                    src={p.image}
                    alt={p.name}
                    fill
                    sizes="(max-width: 640px) 50vw, 300px"
                    priority={i < 2}
                    style={{ objectFit: "cover" }}
                  />
                  {p.recommended && (
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
                    <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--ink)" }}>{p.name}</h3>
                    <p className="font-mono" style={{ fontSize: "0.7rem", color: "var(--ink-soft)", marginTop: "0.1rem" }}>
                      {p.nameEn}
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
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenCustomize(p);
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
                      }}
                    >
                      เลือก +
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Toppings Showcase Section */}
        <section id="toppings" style={{ marginTop: "2.25rem" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div>
              <h2 style={{ fontSize: "1.35rem", fontWeight: 800 }}>ท็อปปิ้ง (Toppings)</h2>
              <p style={{ fontSize: "0.8rem", color: "var(--ink-soft)" }}>เพิ่มความอร่อยให้เครื่องดื่มแก้วโปรด</p>
            </div>
            <p
              className="font-mono"
              style={{
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                color: "var(--ink-soft)",
              }}
            >
              Toppings
            </p>
          </div>

          <div
            style={{
              marginTop: "0.85rem",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: "0.6rem",
            }}
          >
            {TOPPINGS.map((topping) => (
              <div
                key={topping.id}
                style={{
                  borderRadius: "1rem",
                  backgroundColor: "var(--card)",
                  border: "1px solid rgba(50, 55, 65, 0.1)",
                  padding: "0.75rem",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--ink)" }}>{topping.name}</p>
                  {topping.icedOnly && (
                    <span
                      style={{
                        display: "inline-block",
                        marginTop: "0.2rem",
                        fontSize: "9px",
                        color: "var(--teal)",
                        fontWeight: 600,
                        backgroundColor: "rgba(75, 155, 140, 0.15)",
                        padding: "0.1rem 0.4rem",
                        borderRadius: "4px",
                      }}
                    >
                      เฉพาะเมนูเย็น
                    </span>
                  )}
                </div>
                <p className="font-display" style={{ marginTop: "0.5rem", fontSize: "1.1rem", color: "var(--teal)" }}>
                  +{topping.price}฿
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Check Points Section */}
        <section id="points" style={{ marginTop: "2.25rem" }}>
          <div
            className="animate-rise"
            style={{
              borderRadius: "1.25rem",
              backgroundColor: "var(--card)",
              padding: "1.25rem",
              border: "1px solid rgba(50, 55, 65, 0.1)",
            }}
          >
            <h2 style={{ fontSize: "1.15rem", fontWeight: 800 }}>ตรวจสอบแต้มสะสมสมาชิก</h2>
            <p style={{ marginTop: "0.2rem", fontSize: "0.825rem", color: "var(--ink-soft)" }}>
              กรอกเบอร์โทรศัพท์เพื่อตรวจเช็คแต้มสะสมและรับสิทธิพิเศษ
            </p>
            <form onSubmit={handleCheckPoints} style={{ marginTop: "0.85rem", display: "flex", gap: "0.5rem" }}>
              <input
                type="tel"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="08X-XXX-XXXX"
                style={{
                  minWidth: 0,
                  flex: 1,
                  borderRadius: "0.75rem",
                  backgroundColor: "var(--cream)",
                  padding: "0.75rem 1rem",
                  fontSize: "0.875rem",
                  border: "1px solid rgba(50, 55, 65, 0.15)",
                  outline: "none",
                  color: "var(--ink)",
                  fontFamily: "inherit",
                }}
              />
              <button
                type="submit"
                style={{
                  whiteSpace: "nowrap",
                  borderRadius: "0.75rem",
                  backgroundColor: "var(--ink)",
                  padding: "0.75rem 1.25rem",
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  color: "var(--cream)",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                ตรวจสอบ
              </button>
            </form>

            {pointsChecked && pointsResult && (
              <div
                style={{
                  marginTop: "1rem",
                  padding: "0.85rem 1rem",
                  borderRadius: "0.85rem",
                  backgroundColor: "rgba(75, 155, 140, 0.1)",
                  border: "1px solid rgba(75, 155, 140, 0.25)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <span style={{ fontSize: "0.9rem", fontWeight: 700 }}>{phoneInput}</span>
                  <p style={{ fontSize: "0.75rem", color: "var(--ink-soft)" }}>สมาชิกประจำร้านถั่วทอง</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span className="font-display" style={{ fontSize: "1.4rem", color: "var(--teal)" }}>
                    {pointsResult.points}
                  </span>
                  <span style={{ fontSize: "0.8rem", marginLeft: "0.25rem", fontWeight: 600 }}>แต้ม</span>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Customization Modal */}
      {selectedProduct && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
          }}
          onClick={handleCloseModal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "600px",
              maxHeight: "90vh",
              overflowY: "auto",
              backgroundColor: "var(--cream)",
              borderTopLeftRadius: "24px",
              borderTopRightRadius: "24px",
              padding: "1.5rem",
              boxShadow: "0 -10px 40px rgba(0, 0, 0, 0.2)",
            }}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 800 }}>{selectedProduct.name}</h3>
                <p className="font-mono" style={{ fontSize: "0.8rem", color: "var(--ink-soft)" }}>
                  {selectedProduct.nameEn}
                </p>
                <p style={{ marginTop: "0.25rem", fontSize: "0.8rem", color: "var(--ink-soft)" }}>
                  {selectedProduct.desc}
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  color: "var(--ink-soft)",
                  padding: "0 0.5rem",
                }}
              >
                ✕
              </button>
            </div>

            <hr style={{ margin: "1rem 0", borderColor: "rgba(50, 55, 65, 0.1)" }} />

            {/* 1. Temperature Selection */}
            <div>
              <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                1. เลือกอุณหภูมิ (Temperature)
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => handleTemperatureChange("iced")}
                  style={{
                    padding: "0.75rem",
                    borderRadius: "0.85rem",
                    border: temperature === "iced" ? "2px solid var(--teal)" : "1px solid rgba(50, 55, 65, 0.15)",
                    backgroundColor: temperature === "iced" ? "rgba(75, 155, 140, 0.12)" : "var(--card)",
                    color: temperature === "iced" ? "var(--teal)" : "var(--ink)",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontSize: "0.875rem",
                  }}
                >
                  เย็น (Iced)
                </button>
                <button
                  type="button"
                  onClick={() => handleTemperatureChange("hot")}
                  style={{
                    padding: "0.75rem",
                    borderRadius: "0.85rem",
                    border: temperature === "hot" ? "2px solid var(--warm)" : "1px solid rgba(50, 55, 65, 0.15)",
                    backgroundColor: temperature === "hot" ? "rgba(220, 160, 50, 0.12)" : "var(--card)",
                    color: temperature === "hot" ? "var(--warm)" : "var(--ink)",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontSize: "0.875rem",
                  }}
                >
                  ร้อน (Hot)
                </button>
              </div>
            </div>

            {/* 2. Sweetness Selection */}
            <div style={{ marginTop: "1.25rem" }}>
              <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                2. ระดับความหวาน (Sweetness)
              </label>
              <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                {SWEETNESS_OPTIONS.map((level) => {
                  const isSelected = sweetness === level;
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setSweetness(level)}
                      style={{
                        flex: 1,
                        minWidth: "60px",
                        padding: "0.6rem 0.2rem",
                        borderRadius: "0.75rem",
                        border: isSelected ? "2px solid var(--ink)" : "1px solid rgba(50, 55, 65, 0.15)",
                        backgroundColor: isSelected ? "var(--ink)" : "var(--card)",
                        color: isSelected ? "var(--cream)" : "var(--ink)",
                        fontWeight: 700,
                        cursor: "pointer",
                        fontSize: "0.8rem",
                      }}
                    >
                      {level}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Toppings Selection */}
            <div style={{ marginTop: "1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <label style={{ fontSize: "0.9rem", fontWeight: 700 }}>3. เลือกท็อปปิ้ง (Toppings)</label>
                <span style={{ fontSize: "0.75rem", color: "var(--ink-soft)" }}>เลือกได้หลายอย่าง</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "0.45rem" }}>
                {TOPPINGS.map((topping) => {
                  const isBobaDisabled = temperature === "hot" && topping.icedOnly;
                  const isSelected = selectedToppings.includes(topping.id);

                  return (
                    <button
                      key={topping.id}
                      type="button"
                      disabled={isBobaDisabled}
                      onClick={() => toggleTopping(topping.id)}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "0.65rem 0.9rem",
                        borderRadius: "0.85rem",
                        border: isSelected ? "2px solid var(--teal)" : "1px solid rgba(50, 55, 65, 0.12)",
                        backgroundColor: isSelected
                          ? "rgba(75, 155, 140, 0.12)"
                          : isBobaDisabled
                          ? "rgba(50, 55, 65, 0.05)"
                          : "var(--card)",
                        color: isBobaDisabled ? "var(--ink-soft)" : "var(--ink)",
                        cursor: isBobaDisabled ? "not-allowed" : "pointer",
                        opacity: isBobaDisabled ? 0.6 : 1,
                      }}
                    >
                      <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                        {isSelected ? "✓ " : "+ "} {topping.name}
                        {topping.icedOnly && (
                          <span style={{ fontSize: "0.7rem", color: "var(--teal)", marginLeft: "0.4rem" }}>
                            (เฉพาะเย็น)
                          </span>
                        )}
                      </span>
                      <span className="font-display" style={{ fontSize: "0.95rem", color: "var(--teal)" }}>
                        +{topping.price}฿
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modal Bottom CTA */}
            <div style={{ marginTop: "1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--ink-soft)" }}>ราคารวมแก้วนี้</span>
                <p className="font-display" style={{ fontSize: "1.6rem", color: "var(--ink)", lineHeight: 1 }}>
                  {calculateModalPrice()}฿
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddToCart}
                style={{
                  flex: 1,
                  borderRadius: "9999px",
                  backgroundColor: "var(--teal)",
                  padding: "0.85rem 1rem",
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

      {/* Cart Drawer / Bottom Sheet */}
      {isCartOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 60,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
          }}
          onClick={() => setIsCartOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "600px",
              maxHeight: "85vh",
              overflowY: "auto",
              backgroundColor: "var(--cream)",
              borderTopLeftRadius: "24px",
              borderTopRightRadius: "24px",
              padding: "1.5rem",
              boxShadow: "0 -10px 40px rgba(0, 0, 0, 0.25)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 800 }}>ตะกร้าเครื่องดื่มของคุณ</h3>
                <p style={{ fontSize: "0.8rem", color: "var(--ink-soft)" }}>ทั้งหมด {totalCartCount} แก้ว</p>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  color: "var(--ink-soft)",
                }}
              >
                ✕
              </button>
            </div>

            <hr style={{ margin: "1rem 0", borderColor: "rgba(50, 55, 65, 0.1)" }} />

            {cart.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem 0", color: "var(--ink-soft)" }}>
                <p style={{ fontSize: "1.1rem" }}>ตะกร้ายังว่างอยู่</p>
                <p style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>เลือกเครื่องดื่มแสนอร่อยได้เลย!</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {cart.map((item) => (
                  <div
                    key={item.cartId}
                    style={{
                      borderRadius: "1rem",
                      backgroundColor: "var(--card)",
                      padding: "0.85rem",
                      border: "1px solid rgba(50, 55, 65, 0.1)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: "0.95rem", fontWeight: 700 }}>{item.productName}</h4>
                      <p style={{ fontSize: "0.75rem", color: "var(--ink-soft)", marginTop: "0.15rem" }}>
                        {item.temperature === "iced" ? "เย็น" : "ร้อน"} · หวาน {item.sweetness}
                      </p>
                      {item.toppings.length > 0 && (
                        <p style={{ fontSize: "0.75rem", color: "var(--teal)", marginTop: "0.1rem" }}>
                          + {item.toppings.map((t) => t.name).join(", ")}
                        </p>
                      )}
                      <p className="font-display" style={{ marginTop: "0.25rem", fontSize: "1rem", color: "var(--ink)" }}>
                        {item.unitPrice * item.quantity}฿{" "}
                        <span style={{ fontSize: "0.75rem", color: "var(--ink-soft)", fontWeight: 400 }}>
                          (@{item.unitPrice}฿)
                        </span>
                      </p>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <button
                        onClick={() => updateCartQty(item.cartId, -1)}
                        style={{
                          width: "1.75rem",
                          height: "1.75rem",
                          borderRadius: "9999px",
                          border: "1px solid rgba(50, 55, 65, 0.2)",
                          backgroundColor: "var(--cream)",
                          color: "var(--ink)",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        -
                      </button>
                      <span style={{ fontSize: "0.9rem", fontWeight: 700, minWidth: "1.2rem", textAlign: "center" }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateCartQty(item.cartId, 1)}
                        style={{
                          width: "1.75rem",
                          height: "1.75rem",
                          borderRadius: "9999px",
                          border: "none",
                          backgroundColor: "var(--ink)",
                          color: "var(--cream)",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {cart.length > 0 && (
              <div style={{ marginTop: "1.5rem", borderTop: "1px solid rgba(50, 55, 65, 0.1)", paddingTop: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <span style={{ fontSize: "1rem", fontWeight: 600 }}>ยอดรวมทั้งหมด</span>
                  <span className="font-display" style={{ fontSize: "1.75rem", color: "var(--teal)" }}>
                    {totalCartPrice}฿
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => alert(`สั่งซื้อสำเร็จ! ยอดรวม ${totalCartPrice} บาท`)}
                  style={{
                    width: "100%",
                    borderRadius: "9999px",
                    backgroundColor: "var(--teal)",
                    padding: "0.9rem",
                    fontSize: "1rem",
                    fontWeight: 700,
                    color: "var(--cream)",
                    border: "none",
                    cursor: "pointer",
                    boxShadow: "0 4px 15px rgba(75, 155, 140, 0.35)",
                  }}
                >
                  ดำเนินการสั่งซื้อ & ชำระเงิน (PromptPay)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Cart Button */}
      <button
        onClick={() => setIsCartOpen(true)}
        className="animate-badge"
        aria-label="ตะกร้าสินค้า"
        style={{
          position: "fixed",
          bottom: "1.25rem",
          right: "1.25rem",
          zIndex: 40,
          width: "3.75rem",
          height: "3.75rem",
          display: "grid",
          placeItems: "center",
          borderRadius: "9999px",
          backgroundColor: "var(--ink)",
          color: "var(--cream)",
          boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.4)",
          border: "none",
          cursor: "pointer",
        }}
      >
        <ShoppingCart size={22} />
        {totalCartCount > 0 && (
          <span
            style={{
              position: "absolute",
              right: "-0.25rem",
              top: "-0.25rem",
              minWidth: "1.5rem",
              height: "1.5rem",
              padding: "0 0.25rem",
              display: "grid",
              placeItems: "center",
              borderRadius: "9999px",
              backgroundColor: "var(--warm)",
              fontSize: "0.75rem",
              fontWeight: 800,
              color: "var(--ink)",
              border: "2px solid var(--cream)",
            }}
          >
            {totalCartCount}
          </span>
        )}
      </button>
    </div>
  );
}
