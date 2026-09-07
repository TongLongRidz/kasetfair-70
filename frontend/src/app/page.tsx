"use client";

import { useState } from "react";
import Image from "next/image";

interface Product {
  id: number;
  name: string;
  desc: string;
  price: number;
  image: string;
  recommended: boolean;
  available: boolean;
  category: string;
}

const categories = ["ทั้งหมด", "เต้าหู้", "ชานม", "ไข่มุก", "น้ำผลไม้"];

const products: Product[] = [
  {
    id: 1,
    name: "เต้าหู้ไข่มุก",
    desc: "สูตรเข้มข้น ราดน้ำตาลทรายแดง",
    price: 35,
    image: "/images/drink-pearl.jpg",
    recommended: true,
    available: true,
    category: "เต้าหู้",
  },
  {
    id: 2,
    name: "น้ำมะม่วงปั่น",
    desc: "มะม่วงสดปั่น เพิ่มความหวานตามใจ",
    price: 40,
    image: "/images/drink-mango.jpg",
    recommended: false,
    available: true,
    category: "น้ำผลไม้",
  },
  {
    id: 3,
    name: "มัทฉะนม",
    desc: "มัทฉะเขียวเข้ม ชงสด",
    price: 50,
    image: "/images/drink-matcha.jpg",
    recommended: false,
    available: false,
    category: "ชานม",
  },
  {
    id: 4,
    name: "ลิ้นจี่น้ำผึ้ง",
    desc: "ลิ้นจี่คั้นสด ผสมน้ำผึ้งแท้",
    price: 45,
    image: "/images/drink-lychee.jpg",
    recommended: false,
    available: true,
    category: "น้ำผลไม้",
  },
];

export default function Home() {
  const [activeCategory, setActiveCategory] = useState("ทั้งหมด");
  const [cartCount, setCartCount] = useState(2);
  const [phoneInput, setPhoneInput] = useState("");
  const [pointsChecked, setPointsChecked] = useState(false);
  const [pointsResult, setPointsResult] = useState<{ name: string; points: number } | null>(null);

  const filteredProducts =
    activeCategory === "ทั้งหมด"
      ? products
      : products.filter((p) => p.category === activeCategory);

  const handleCheckPoints = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput.trim()) return;
    setPointsChecked(true);
    // Demo mock state
    setPointsResult({
      name: "คุณลูกค้า",
      points: 15,
    });
  };

  const addToCart = (product: Product) => {
    if (!product.available) return;
    setCartCount((prev) => prev + 1);
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
      {/* Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          borderBottom: "1px solid rgba(50, 55, 65, 0.1)",
          backgroundColor: "rgba(247, 246, 240, 0.9)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
      >
        <div
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.75rem 1rem",
          }}
        >
          <a href="#" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none", color: "inherit" }}>
            <span
              style={{
                width: "2.25rem",
                height: "2.25rem",
                display: "grid",
                placeItems: "center",
                borderRadius: "0.75rem",
                backgroundColor: "var(--ink)",
                color: "var(--cream)",
                fontWeight: 700,
                fontSize: "1.125rem",
              }}
            >
              ถ
            </span>
            <span style={{ lineHeight: 1.1 }}>
              <span style={{ display: "block", fontSize: "1rem", fontWeight: 600 }}>ถั่วทอง</span>
              <span
                className="font-mono"
                style={{
                  display: "block",
                  fontSize: "9px",
                  textTransform: "uppercase",
                  letterSpacing: "0.2em",
                  color: "var(--ink-soft)",
                }}
              >
                Taothong
              </span>
            </span>
          </a>
          <nav style={{ display: "flex", alignItems: "center", gap: "1.25rem", fontSize: "0.875rem", fontWeight: 500 }}>
            <a href="#" style={{ color: "var(--ink)", textDecoration: "none" }}>
              หน้าหลัก
            </a>
            <a href="#menu" style={{ color: "var(--ink-soft)", textDecoration: "none" }}>
              เมนู
            </a>
            <a href="#promotions" style={{ color: "var(--ink-soft)", textDecoration: "none" }}>
              โปรโมชัน
            </a>
            <a
              href="#points"
              style={{
                borderRadius: "9999px",
                backgroundColor: "var(--teal)",
                padding: "0.375rem 0.75rem",
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "var(--cream)",
                textDecoration: "none",
              }}
            >
              ตรวจสอบคิว
            </a>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: "600px", margin: "0 auto", padding: "0 1rem 8rem 1rem" }}>
        {/* Hero Section */}
        <section className="animate-rise" style={{ marginTop: "1rem" }}>
          <div
            style={{
              position: "relative",
              overflow: "hidden",
              borderRadius: "22px",
              backgroundColor: "var(--teal)",
              padding: "1.25rem",
              color: "var(--cream)",
              boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.15)",
            }}
          >
            <div style={{ position: "relative", zIndex: 10 }}>
              <p
                className="font-mono"
                style={{
                  fontSize: "10px",
                  textTransform: "uppercase",
                  letterSpacing: "0.25em",
                  color: "rgba(247, 246, 240, 0.75)",
                }}
              >
                KASET FAIR 70 · STAND 12
              </p>
              <h1
                style={{
                  marginTop: "0.5rem",
                  fontSize: "1.875rem",
                  fontWeight: 700,
                  lineHeight: 1.1,
                }}
              >
                น้ำเต้าหู้
                <br />
                เย็นชื่นใจ
              </h1>
              <p
                style={{
                  marginTop: "0.5rem",
                  maxWidth: "26ch",
                  fontSize: "0.875rem",
                  lineHeight: 1.5,
                  color: "rgba(247, 246, 240, 0.88)",
                }}
              >
                เต้าหู้สดจากเตา ต้มใหม่ทุกเช้า พร้อมไข่มุกนุ่ม ๆ ให้จิบระหว่างเดินงาน
              </p>
              <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <a
                  href="#menu"
                  style={{
                    borderRadius: "9999px",
                    backgroundColor: "var(--warm)",
                    padding: "0.625rem 1.25rem",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "var(--ink)",
                    textDecoration: "none",
                  }}
                >
                  ดูเมนู
                </a>
                <a
                  href="#points"
                  style={{
                    borderRadius: "9999px",
                    backgroundColor: "rgba(247, 246, 240, 0.15)",
                    padding: "0.625rem 1rem",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    color: "var(--cream)",
                    textDecoration: "none",
                  }}
                >
                  สะสมแต้ม
                </a>
              </div>
            </div>
            <div
              style={{
                position: "absolute",
                right: "-1.25rem",
                top: "-1.25rem",
                width: "10rem",
                height: "10rem",
                borderRadius: "9999px",
                overflow: "hidden",
                border: "2px solid rgba(247, 246, 240, 0.2)",
              }}
            >
              <Image
                src="/images/hero-soy.jpg"
                alt="แก้วน้ำเต้าหู้เย็นมีหยดน้ำเกาะ ท่ามกลางแสงไฟตลาดยามค่ำ"
                fill
                sizes="160px"
                style={{ objectFit: "cover" }}
                priority
              />
            </div>
          </div>
          <div style={{ marginTop: "0.75rem", display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <span style={{ width: "1.25rem", height: "0.375rem", borderRadius: "9999px", backgroundColor: "rgba(50, 55, 65, 0.7)" }} />
            <span style={{ width: "0.375rem", height: "0.375rem", borderRadius: "9999px", backgroundColor: "rgba(50, 55, 65, 0.15)" }} />
            <span style={{ width: "0.375rem", height: "0.375rem", borderRadius: "9999px", backgroundColor: "rgba(50, 55, 65, 0.15)" }} />
          </div>
        </section>

        {/* Menu Section */}
        <section id="menu" style={{ marginTop: "1.75rem" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>เมนูล่าสุด</h2>
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
              marginTop: "0.75rem",
              display: "flex",
              gap: "0.5rem",
              overflowX: "auto",
              paddingBottom: "0.25rem",
            }}
          >
            {categories.map((cat) => {
              const isSelected = cat === activeCategory;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    whiteSpace: "nowrap",
                    borderRadius: "9999px",
                    padding: "0.5rem 1rem",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    cursor: "pointer",
                    border: isSelected ? "none" : "1px solid rgba(50, 55, 65, 0.1)",
                    backgroundColor: isSelected ? "var(--ink)" : "var(--card)",
                    color: isSelected ? "var(--cream)" : "var(--ink-soft)",
                    transition: "all 0.2s ease",
                  }}
                >
                  {cat}
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
              gap: "0.75rem",
            }}
          >
            {filteredProducts.map((p, i) => (
              <article
                key={p.id}
                className="animate-rise"
                style={{
                  animationDelay: `${100 + i * 50}ms`,
                  overflow: "hidden",
                  borderRadius: "1rem",
                  backgroundColor: "var(--card)",
                  border: "1px solid rgba(50, 55, 65, 0.1)",
                  opacity: p.available ? 1 : 0.65,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div style={{ position: "relative", width: "100%", aspectRatio: "1/1" }}>
                  <Image
                    src={p.image}
                    alt={p.name}
                    fill
                    sizes="(max-width: 600px) 50vw, 300px"
                    priority={i === 0}
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
                        padding: "0.15rem 0.5rem",
                        fontSize: "10px",
                        fontWeight: 700,
                        color: "var(--ink)",
                      }}
                    >
                      เมนูแนะนำ
                    </span>
                  )}
                  {!p.available && (
                    <span
                      style={{
                        position: "absolute",
                        left: "0.5rem",
                        top: "0.5rem",
                        borderRadius: "9999px",
                        backgroundColor: "var(--pearl)",
                        padding: "0.15rem 0.5rem",
                        fontSize: "10px",
                        fontWeight: 700,
                        color: "var(--cream)",
                      }}
                    >
                      สินค้าหมด
                    </span>
                  )}
                </div>
                <div style={{ padding: "0.75rem", display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
                  <div>
                    <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--ink)" }}>{p.name}</h3>
                    <p style={{ marginTop: "0.15rem", fontSize: "0.75rem", color: "var(--ink-soft)" }}>{p.desc}</p>
                  </div>
                  <div style={{ marginTop: "0.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span className="font-display" style={{ fontSize: "1.125rem", color: "var(--ink)" }}>
                      {p.price} ฿
                    </span>
                    {p.available ? (
                      <button
                        onClick={() => addToCart(p)}
                        style={{
                          borderRadius: "9999px",
                          backgroundColor: "var(--teal)",
                          padding: "0.35rem 0.75rem",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          color: "var(--cream)",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        เพิ่ม +
                      </button>
                    ) : (
                      <button
                        disabled
                        style={{
                          borderRadius: "9999px",
                          backgroundColor: "rgba(50, 55, 65, 0.1)",
                          padding: "0.35rem 0.75rem",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          color: "var(--ink-soft)",
                          border: "none",
                          cursor: "not-allowed",
                        }}
                      >
                        หมด
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Promotions Section */}
        <section id="promotions" style={{ marginTop: "2rem" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>โปรโมชันสะสมแต้ม</h2>
            <p
              className="font-mono"
              style={{
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                color: "var(--ink-soft)",
              }}
            >
              Rewards
            </p>
          </div>
          <div
            style={{
              marginTop: "0.75rem",
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "0.75rem",
            }}
          >
            <article
              className="animate-rise"
              style={{
                borderRadius: "1rem",
                backgroundColor: "rgba(75, 155, 140, 0.12)",
                padding: "1rem",
                border: "1px solid rgba(75, 155, 140, 0.25)",
              }}
            >
              <p className="font-mono" style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--teal)", fontWeight: 600 }}>
                10 แต้ม
              </p>
              <h3 style={{ marginTop: "0.5rem", fontSize: "1rem", fontWeight: 600 }}>ลด 5 บาท</h3>
              <p style={{ marginTop: "0.25rem", fontSize: "0.75rem", color: "var(--ink-soft)" }}>ทุกเมนูในร้าน</p>
              <button
                style={{
                  marginTop: "0.75rem",
                  width: "100%",
                  borderRadius: "9999px",
                  backgroundColor: "var(--teal)",
                  padding: "0.5rem 0",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "var(--cream)",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                แลก
              </button>
            </article>

            <article
              className="animate-rise"
              style={{
                borderRadius: "1rem",
                backgroundColor: "rgba(220, 160, 50, 0.15)",
                padding: "1rem",
                border: "1px solid rgba(220, 160, 50, 0.3)",
              }}
            >
              <p className="font-mono" style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--warm)", fontWeight: 600 }}>
                30 แต้ม
              </p>
              <h3 style={{ marginTop: "0.5rem", fontSize: "1rem", fontWeight: 600 }}>ฟรีไข่มุก</h3>
              <p style={{ marginTop: "0.25rem", fontSize: "0.75rem", color: "var(--ink-soft)" }}>เติมฟรี 1 ถ้วย</p>
              <button
                style={{
                  marginTop: "0.75rem",
                  width: "100%",
                  borderRadius: "9999px",
                  backgroundColor: "var(--warm)",
                  padding: "0.5rem 0",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "var(--ink)",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                แลก
              </button>
            </article>
          </div>
        </section>

        {/* Check Points Section */}
        <section id="points" style={{ marginTop: "2rem" }}>
          <div
            className="animate-rise"
            style={{
              borderRadius: "1rem",
              backgroundColor: "var(--card)",
              padding: "1.25rem",
              border: "1px solid rgba(50, 55, 65, 0.1)",
            }}
          >
            <h2 style={{ fontSize: "1.125rem", fontWeight: 700 }}>ตรวจสอบแต้มสะสม</h2>
            <p style={{ marginTop: "0.25rem", fontSize: "0.875rem", color: "var(--ink-soft)" }}>
              กรอกเบอร์โทรเพื่อเช็คแต้มของคุณ
            </p>
            <form onSubmit={handleCheckPoints} style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem" }}>
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
                  padding: "0.75rem 1rem",
                  fontSize: "0.875rem",
                  fontWeight: 600,
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
                  padding: "0.75rem 1rem",
                  borderRadius: "0.75rem",
                  backgroundColor: "rgba(75, 155, 140, 0.1)",
                  border: "1px solid rgba(75, 155, 140, 0.25)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>{phoneInput}</span>
                  <p style={{ fontSize: "0.75rem", color: "var(--ink-soft)" }}>สมาชิกถั่วทอง</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span className="font-display" style={{ fontSize: "1.25rem", color: "var(--teal)" }}>
                    {pointsResult.points}
                  </span>
                  <span style={{ fontSize: "0.75rem", marginLeft: "0.25rem" }}>แต้ม</span>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Floating Cart Button */}
      <button
        className="animate-badge"
        style={{
          position: "fixed",
          bottom: "1.25rem",
          right: "1.25rem",
          zIndex: 40,
          width: "3.5rem",
          height: "3.5rem",
          display: "grid",
          placeItems: "center",
          borderRadius: "9999px",
          backgroundColor: "var(--ink)",
          color: "var(--cream)",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
          border: "none",
          cursor: "pointer",
        }}
      >
        <span style={{ fontSize: "1.25rem", fontWeight: 600 }}>+</span>
        {cartCount > 0 && (
          <span
            style={{
              position: "absolute",
              right: "-0.25rem",
              top: "-0.25rem",
              width: "1.5rem",
              height: "1.5rem",
              display: "grid",
              placeItems: "center",
              borderRadius: "9999px",
              backgroundColor: "var(--warm)",
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "var(--ink)",
              border: "2px solid var(--cream)",
            }}
          >
            {cartCount}
          </span>
        )}
      </button>
    </div>
  );
}
