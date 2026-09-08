"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [lang, setLang] = React.useState<"th" | "en">("th");
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
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
          <a
            href="#menu"
            className="nav-menu-link"
            onClick={(e) => handleScrollTo(e, "menu")}
            style={{ color: "var(--ink)", textDecoration: "none", cursor: "pointer" }}
          >
            {lang === "th" ? "เมนู" : "Menu"}
          </a>
          <a
            href="#toppings"
            className="nav-menu-link"
            onClick={(e) => handleScrollTo(e, "toppings")}
            style={{ color: "var(--ink-soft)", textDecoration: "none", cursor: "pointer" }}
          >
            {lang === "th" ? "ท็อปปิ้ง" : "Toppings"}
          </a>
          <Link href="/promotion" className="nav-menu-link" style={{ color: "var(--ink-soft)", textDecoration: "none" }}>
            {lang === "th" ? "โปรโมชั่น" : "Promos"}
          </Link>
          <Link
            href="/queue"
            className="nav-queue-btn"
            style={{
              borderRadius: "9999px",
              backgroundColor: "var(--teal)",
              padding: "0.35rem 0.85rem",
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "var(--cream)",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            {lang === "th" ? "ตรวจสอบคิว" : "Queue"}
          </Link>

          {/* Language Dropdown */}
          <div ref={dropdownRef} style={{ position: "relative", flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "0.3rem 0.6rem 0.3rem 0.4rem",
                borderRadius: "9999px",
                backgroundColor: isOpen ? "rgba(225, 222, 210, 0.9)" : "rgba(235, 233, 222, 0.8)",
                border: "1px solid rgba(50, 55, 65, 0.12)",
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "var(--ink)",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <span className="relative flex items-center justify-center size-5 bg-white rounded-full shadow-sm overflow-hidden select-none border border-zinc-200/50">
                <span className="absolute text-[22px] scale-[1.5] leading-none translate-y-[1.75px]">
                  {lang === "th" ? "🇹🇭" : "🇺🇸"}
                </span>
              </span>
              <span>{lang === "th" ? "TH" : "EN"}</span>
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

            {/* Dropdown Menu */}
            {isOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 6px)",
                  right: 0,
                  width: "120px",
                  backgroundColor: "#ffffff",
                  borderRadius: "12px",
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                  border: "1px solid rgba(50, 55, 65, 0.1)",
                  padding: "4px",
                  zIndex: 50,
                  display: "flex",
                  flexDirection: "column",
                  gap: "2px",
                  animation: "fadeIn 0.15s ease",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setLang("th");
                    setIsOpen(false);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    width: "100%",
                    padding: "6px 8px",
                    border: "none",
                    borderRadius: "8px",
                    backgroundColor: lang === "th" ? "rgba(100, 194, 121, 0.12)" : "transparent",
                    color: lang === "th" ? "#2e7d32" : "var(--ink)",
                    fontSize: "0.75rem",
                    fontWeight: lang === "th" ? 700 : 500,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "background-color 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (lang !== "th") e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.04)";
                  }}
                  onMouseLeave={(e) => {
                    if (lang !== "th") e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <span className="relative flex items-center justify-center size-5 bg-white rounded-full shadow-sm overflow-hidden select-none border border-zinc-200/50">
                    <span className="absolute text-[22px] scale-[1.5] leading-none translate-y-[1.75px]">
                      🇹🇭
                    </span>
                  </span>
                  <span>ภาษาไทย</span>
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
                    gap: "8px",
                    width: "100%",
                    padding: "6px 8px",
                    border: "none",
                    borderRadius: "8px",
                    backgroundColor: lang === "en" ? "rgba(100, 194, 121, 0.12)" : "transparent",
                    color: lang === "en" ? "#2e7d32" : "var(--ink)",
                    fontSize: "0.75rem",
                    fontWeight: lang === "en" ? 700 : 500,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "background-color 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (lang !== "en") e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.04)";
                  }}
                  onMouseLeave={(e) => {
                    if (lang !== "en") e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <span className="relative flex items-center justify-center size-5 bg-white rounded-full shadow-sm overflow-hidden select-none border border-zinc-200/50">
                    <span className="absolute text-[22px] scale-[1.5] leading-none translate-y-[1.75px]">
                      🇺🇸
                    </span>
                  </span>
                  <span>English</span>
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}


