"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layouts/Navbar";
import Footer from "@/components/layouts/Footer";
import { Search } from "lucide-react";

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
  { id: "red_bean", name: "ถั่วแดง", price: 10 },
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
    tag: "",
    title: "น้ำเต้าหู้",
    highlight: "5 รสชาติ",
    desc: "น้ำเต้าหู้สดใหม่ทุกวัน พร้อมท็อปปิ้งแน่นแก้ว ให้จิบระหว่างเดินงาน",
    ctaText: "สั่งเลย!",
    ctaLink: "/order",
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
    ctaText: "ดูโปรโมชั่น & แลกแต้ม",
    ctaLink: "/promotion",
    image: "/images/drink-pearl.jpg",
    bgColor: "#634832",
  },
];

export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"all" | "flavours" | "combos">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleBannerCtaClick = (e: React.MouseEvent<HTMLAnchorElement>, ctaLink: string) => {
    if (ctaLink.startsWith("#")) {
      e.preventDefault();
      const sectionId = ctaLink.replace("#", "");
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  // Filter display products
  const baseProducts =
    activeTab === "all"
      ? [...FLAVOURS, ...COMBOS]
      : activeTab === "flavours"
      ? FLAVOURS
      : COMBOS;

  const displayProducts = baseProducts.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.nameEn.toLowerCase().includes(q) ||
      p.desc.toLowerCase().includes(q)
    );
  });


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
      <main style={{ maxWidth: "640px", margin: "0 auto", padding: "0 1rem 3rem 1rem" }}>
        {/* Hero Banner Carousel */}
        <section className="animate-rise" style={{ marginTop: "1rem" }}>
          <div
            className="hero-banner-card"
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
            <div className="hero-banner-content" style={{ position: "relative", zIndex: 10, maxWidth: "68%" }}>
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
                className="hero-banner-title"
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
                className="hero-banner-desc"
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
                  onClick={(e) => handleBannerCtaClick(e, BANNERS[currentSlide].ctaLink)}
                  className="hero-banner-cta"
                  style={{
                    borderRadius: "9999px",
                    backgroundColor: "var(--warm)",
                    padding: "0.5rem 1.25rem",
                    fontSize: "0.875rem",
                    fontWeight: 700,
                    color: "var(--ink)",
                    textDecoration: "none",
                    cursor: "pointer",
                  }}
                >
                  {BANNERS[currentSlide].ctaText}
                </a>
              </div>
            </div>

            <div
              className="hero-banner-image-wrapper"
              style={{
                position: "absolute",
                right: "-1.5rem",
                bottom: "-1.5rem",
                width: "13rem",
                height: "13rem",
                borderRadius: "9999px",
                overflow: "hidden",
                border: "4px solid rgba(247, 246, 240, 0.25)",
                boxShadow: "0 8px 25px rgba(0,0,0,0.2)",
              }}
            >
              <Image
                src={BANNERS[currentSlide].image}
                alt={BANNERS[currentSlide].title}
                fill
                sizes="(max-width: 480px) 140px, 220px"
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
        <section id="menu" style={{ marginTop: "1.75rem", scrollMarginTop: "4.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "0.75rem" }}>
            <div>
              <h2 style={{ fontSize: "1.35rem", fontWeight: 600 }}>รายการเมนูเครื่องดื่ม</h2>
              <p style={{ fontSize: "0.8rem", color: "var(--ink-soft)" }}>กดเลือกเมนูเพื่อปรับความหวาน, อุณหภูมิ และท็อปปิ้ง</p>
            </div>

            {/* Search Input (Matched with POS walk-in) */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", backgroundColor: "var(--card)", padding: "0.45rem 0.85rem", borderRadius: "9999px", border: "1px solid rgba(50,55,65,0.1)", width: "100%", maxWidth: "240px" }}>
              <Search size={16} color="var(--ink-soft)" />
              <input
                type="text"
                placeholder="ค้นหาเมนู..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
            }}
          >
            {[
              { id: "all", label: "ทั้งหมด" },
              { id: "flavours", label: "รสชาติหลัก" },
              { id: "combos", label: "เมนูคอมโบ" },
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
                style={{
                  animationDelay: `${50 + i * 40}ms`,
                  overflow: "hidden",
                  borderRadius: "1.25rem",
                  backgroundColor: "var(--card)",
                  border: "1px solid rgba(50, 55, 65, 0.1)",
                  display: "flex",
                  flexDirection: "column",
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
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Toppings Showcase Section */}
        <section id="toppings" style={{ marginTop: "2.25rem", scrollMarginTop: "4.5rem" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div>
              <h2 style={{ fontSize: "1.35rem", fontWeight: 600 }}>ท็อปปิ้ง (Toppings)</h2>
              <p style={{ fontSize: "0.8rem", color: "var(--ink-soft)" }}>เพิ่มความอร่อยให้เครื่องดื่มแก้วโปรด</p>
            </div>
          </div>

          <div
            style={{
              marginTop: "0.85rem",
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "0.65rem",
            }}
          >
            {TOPPINGS.map((topping) => (
              <div
                key={topping.id}
                style={{
                  borderRadius: "1rem",
                  backgroundColor: "var(--card)",
                  border: "1px solid rgba(50, 55, 65, 0.1)",
                  padding: "0.85rem 0.75rem",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  minHeight: "85px",
                }}
              >
                <div>
                  <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--ink)", lineHeight: 1.25 }}>
                    {topping.name}
                  </p>
                  {topping.icedOnly && (
                    <span
                      style={{
                        display: "inline-block",
                        marginTop: "0.25rem",
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
                <p className="font-display" style={{ marginTop: "0.4rem", fontSize: "1.15rem", color: "var(--teal)", lineHeight: 1 }}>
                  +{topping.price}฿
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
