"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CupSoda, Coins, TicketPercent, Layers } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [lang, setLang] = React.useState<"th" | "en">("th");
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    setIsOpen(false);
    if (pathname === "/") {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      router.push("/");
      // Once navigated to home, scroll smoothly
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 150);
    }
  };

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 30,
        borderBottom: "1px solid rgba(50, 55, 65, 0.1)",
        backgroundColor: "rgba(247, 246, 240, 0.95)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
      }}
    >
      <div
        style={{
          maxWidth: "640px",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.75rem 1rem",
        }}
      >
        <Link
          href="/"
          onClick={handleLogoClick}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            textDecoration: "none",
            color: "inherit",
            cursor: "pointer",
          }}
        >
          <span
            style={{
              width: "2.5rem",
              height: "2.5rem",
              display: "grid",
              placeItems: "center",
              borderRadius: "0.85rem",
              backgroundColor: "var(--ink)",
              color: "var(--cream)",
              fontWeight: 700,
              fontSize: "1.25rem",
            }}
          >
            ถ
          </span>
          <span style={{ lineHeight: 1.15 }}>
            <span style={{ display: "block", fontSize: "1.05rem", fontWeight: 700 }}>ถั่วทอง | M__</span>
            <span
              className="font-mono"
              style={{
                display: "block",
                fontSize: "9px",
                textTransform: "uppercase",
                letterSpacing: "0.22em",
                color: "var(--ink-soft)",
              }}
            >
              Taothong Soy Milk
            </span>
          </span>
        </Link>

        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            fontSize: "0.875rem",
            fontWeight: 500,
          }}
        >
          {/* Quick link for Queue Check (always in navbar) */}
          <Link
            href="/queue"
            className="nav-queue-btn"
            style={{
              borderRadius: "9999px",
              backgroundColor: "var(--teal)",
              padding: "0.4rem 0.9rem",
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "var(--cream)",
              textDecoration: "none",
              whiteSpace: "nowrap",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              boxShadow: "0 2px 6px rgba(0, 77, 64, 0.2)",
              transition: "transform 0.15s ease, opacity 0.15s ease",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>{lang === "th" ? "ตรวจสอบคิว" : "Queue"}</span>
          </Link>

          {/* Menu Dropdown Container */}
          <div ref={dropdownRef} style={{ position: "relative", flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle Navigation Menu"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "0.38rem 0.65rem 0.38rem 0.5rem",
                borderRadius: "9999px",
                backgroundColor: isOpen ? "rgba(225, 222, 210, 0.95)" : "rgba(235, 233, 222, 0.85)",
                border: "1px solid rgba(50, 55, 65, 0.12)",
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "var(--ink)",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {/* Hamburger icon */}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="18" x2="20" y2="18" />
              </svg>
              <span>{lang === "th" ? "เมนู" : "Menu"}</span>
              <svg
                width="10"
                height="6"
                viewBox="0 0 10 6"
                fill="none"
                style={{
                  transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s ease",
                  opacity: 0.6,
                }}
              >
                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* Dropdown Menu Content */}
            {isOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  width: "185px",
                  backgroundColor: "#ffffff",
                  borderRadius: "14px",
                  boxShadow: "0 12px 30px -5px rgba(0, 0, 0, 0.15), 0 8px 12px -6px rgba(0, 0, 0, 0.08)",
                  border: "1px solid rgba(50, 55, 65, 0.1)",
                  padding: "6px",
                  zIndex: 50,
                  display: "flex",
                  flexDirection: "column",
                  gap: "3px",
                  animation: "fadeIn 0.15s ease",
                }}
              >
                {/* Navigation links */}
                <a
                  href="#menu"
                  onClick={(e) => handleScrollTo(e, "menu")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 10px",
                    borderRadius: "8px",
                    color: "var(--ink)",
                    textDecoration: "none",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "background-color 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.04)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <span>{lang === "th" ? "เมนูเครื่องดื่ม" : "Drinks Menu"}</span>
                </a>

                <a
                  href="#toppings"
                  onClick={(e) => handleScrollTo(e, "toppings")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 10px",
                    borderRadius: "8px",
                    color: "var(--ink)",
                    textDecoration: "none",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "background-color 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.04)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <span>{lang === "th" ? "ท็อปปิ้ง" : "Toppings"}</span>
                </a>

                <Link
                  href="/promotion"
                  onClick={() => setIsOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 10px",
                    borderRadius: "8px",
                    color: "var(--ink)",
                    textDecoration: "none",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    transition: "background-color 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.04)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <span>{lang === "th" ? "โปรโมชั่น" : "Promotions"}</span>
                </Link>

                {/* Divider */}
                <div style={{ height: "1px", backgroundColor: "rgba(50, 55, 65, 0.08)", margin: "4px 2px" }} />

                {/* Language Switch Section */}
                <div style={{ padding: "4px 8px 2px 8px", fontSize: "0.68rem", fontWeight: 700, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {lang === "th" ? "เลือกภาษา / Language" : "Language"}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px", padding: "2px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setLang("th");
                      setIsOpen(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "5px",
                      padding: "6px 8px",
                      border: "none",
                      borderRadius: "8px",
                      backgroundColor: lang === "th" ? "rgba(46, 125, 50, 0.12)" : "rgba(0,0,0,0.03)",
                      color: lang === "th" ? "#2e7d32" : "var(--ink)",
                      fontSize: "0.72rem",
                      fontWeight: lang === "th" ? 700 : 500,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span>🇹🇭</span>
                    <span>ไทย</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLang("en");
                      setIsOpen(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "5px",
                      padding: "6px 8px",
                      border: "none",
                      borderRadius: "8px",
                      backgroundColor: lang === "en" ? "rgba(46, 125, 50, 0.12)" : "rgba(0,0,0,0.03)",
                      color: lang === "en" ? "#2e7d32" : "var(--ink)",
                      fontSize: "0.72rem",
                      fontWeight: lang === "en" ? 700 : 500,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span>🇺🇸</span>
                    <span>EN</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}


