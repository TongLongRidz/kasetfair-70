"use client";

import React, { useState, useRef, useEffect } from "react";
import { MoreVertical, Download, Loader2 } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface OrderActionMenuProps {
  onSaveImage: () => void;
  savingImage: boolean;
  showButton?: boolean;
}

export function OrderActionMenu({
  onSaveImage,
  savingImage,
  showButton = true,
}: OrderActionMenuProps) {
  const { lang, setLang, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-hide timer logic (fades out after 3.5 seconds of inactivity)
  const resetIdleTimer = () => {
    setIsVisible(true);
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    // Do not fade out if the menu is currently open or image is saving
    if (!isOpen && !savingImage) {
      idleTimerRef.current = setTimeout(() => {
        setIsVisible(false);
      }, 3500);
    }
  };

  useEffect(() => {
    // Listen for user interactions to bring the button back / keep it visible
    const handleActivity = () => {
      resetIdleTimer();
    };

    const events = ["mousemove", "mousedown", "touchstart", "scroll", "keydown"];
    events.forEach((evt) => window.addEventListener(evt, handleActivity, { passive: true }));

    resetIdleTimer();

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, handleActivity));
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, [isOpen, savingImage]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleDownload = () => {
    setIsOpen(false);
    onSaveImage();
  };

  const handleToggleLang = () => {
    setLang(lang === "th" ? "en" : "th");
  };

  const activeShow = showButton && (isVisible || isOpen || savingImage);

  return (
    <div
      ref={menuRef}
      className="no-export"
      style={{
        position: "absolute",
        top: "1.1rem",
        right: "1.1rem",
        zIndex: 20,
        opacity: activeShow ? 1 : 0,
        pointerEvents: activeShow && !savingImage ? "auto" : savingImage ? "auto" : "none",
        transform: activeShow ? "scale(1)" : "scale(0.85)",
        transition: "opacity 0.4s ease, transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)",
      }}
    >
      {/* Kebab Button */}
      <button
        type="button"
        id="order-kebab-menu-btn"
        aria-label={t("order.receipt.more_options", "More Options")}
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          backgroundColor: isOpen ? "var(--teal)" : "#FFFFFF",
          color: isOpen ? "#FFFFFF" : "var(--ink)",
          border: "1px solid rgba(50, 55, 65, 0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: isOpen
            ? "0 4px 12px rgba(13, 148, 136, 0.25)"
            : "0 2px 8px rgba(0, 0, 0, 0.08)",
          transition: "all 0.2s ease",
          padding: 0,
        }}
      >
        <MoreVertical size={18} strokeWidth={2.2} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            width: "152px",
            backgroundColor: "#FFFFFF",
            borderRadius: "0.75rem",
            boxShadow: "0 8px 24px -4px rgba(0, 0, 0, 0.12), 0 4px 8px -2px rgba(0, 0, 0, 0.06)",
            border: "1px solid rgba(50, 55, 65, 0.1)",
            padding: "0.3rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.2rem",
            animation: "kebabFadeIn 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {/* Action 1: Download Receipt */}
          <button
            type="button"
            onClick={handleDownload}
            disabled={savingImage}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "0.45rem",
              padding: "0.4rem 0.5rem",
              borderRadius: "0.5rem",
              border: "none",
              backgroundColor: "transparent",
              color: "var(--ink)",
              fontSize: "0.78rem",
              fontWeight: 600,
              cursor: savingImage ? "not-allowed" : "pointer",
              textAlign: "left",
              transition: "background-color 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(50, 55, 65, 0.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <div
              style={{
                width: "22px",
                height: "22px",
                borderRadius: "50%",
                backgroundColor: "#E0F2FE",
                color: "#0284c7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {savingImage ? (
                <Loader2 size={12} strokeWidth={2.4} className="animate-spin" />
              ) : (
                <Download size={12} strokeWidth={2.2} />
              )}
            </div>
            <span style={{ flex: 1, whiteSpace: "nowrap" }}>{t("order.receipt.save_receipt")}</span>
          </button>

          <div
            style={{
              height: "1px",
              backgroundColor: "rgba(50, 55, 65, 0.08)",
              margin: "0.15rem 0.3rem",
            }}
          />

          {/* Action 2: Language Switcher (Compact with flag emojis & text) */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0.25rem 0.3rem",
            }}
          >
            <div
              style={{
                display: "flex",
                width: "100%",
                backgroundColor: "rgba(50, 55, 65, 0.06)",
                borderRadius: "0.55rem",
                padding: "2px",
                gap: "2px",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setLang("th");
                  setIsOpen(false);
                }}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.25rem",
                  padding: "0.3rem 0.4rem",
                  borderRadius: "0.45rem",
                  border: "none",
                  backgroundColor: lang === "th" ? "#FFFFFF" : "transparent",
                  color: lang === "th" ? "var(--teal)" : "var(--ink-soft)",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  cursor: "pointer",
                  boxShadow: lang === "th" ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                  transition: "all 0.15s ease",
                }}
              >
                <span>🇹🇭</span>
                <span>TH</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setLang("en");
                  setIsOpen(false);
                }}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.25rem",
                  padding: "0.3rem 0.4rem",
                  borderRadius: "0.45rem",
                  border: "none",
                  backgroundColor: lang === "en" ? "#FFFFFF" : "transparent",
                  color: lang === "en" ? "var(--teal)" : "var(--ink-soft)",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  cursor: "pointer",
                  boxShadow: lang === "en" ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                  transition: "all 0.15s ease",
                }}
              >
                <span>🇬🇧</span>
                <span>EN</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderActionMenu;
