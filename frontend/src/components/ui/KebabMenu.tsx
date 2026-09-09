"use client";

import React, { ReactNode } from "react";
import { MoreVertical } from "lucide-react";

export interface KebabMenuItem {
  key: string;
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  danger?: boolean;
  color?: string;
  hoverBg?: string;
}

interface KebabMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  title?: string;
  headerTitle?: string;
  items?: KebabMenuItem[];
  children?: ReactNode;
  buttonSize?: string;
  iconSize?: number;
  width?: string;
  menuTop?: string;
}

export default function KebabMenu({
  isOpen,
  onToggle,
  title = "จัดการ",
  headerTitle = "การดำเนินการ",
  items,
  children,
  buttonSize = "2rem",
  iconSize = 15,
  width = "185px",
  menuTop = "2.35rem",
}: KebabMenuProps) {
  return (
    <div className="kebab-container" style={{ position: "relative", display: "inline-block" }}>
      {/* Kebab Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        title={title}
        style={{
          width: buttonSize,
          height: buttonSize,
          borderRadius: "0.55rem",
          border: "1px solid rgba(50, 55, 65, 0.12)",
          backgroundColor: isOpen ? "var(--ink)" : "var(--cream)",
          color: isOpen ? "var(--cream)" : "var(--ink)",
          display: "grid",
          placeItems: "center",
          cursor: "pointer",
          transition: "all 0.15s ease",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <MoreVertical size={iconSize} />
      </button>

      {/* Kebab Dropdown Menu */}
      {isOpen && (
        <div
          className="animate-rise"
          style={{
            position: "absolute",
            right: 0,
            top: menuTop,
            zIndex: 60,
            width: width,
            backgroundColor: "var(--card)",
            borderRadius: "0.85rem",
            border: "1px solid rgba(50, 55, 65, 0.12)",
            boxShadow: "0 10px 25px -3px rgba(0, 0, 0, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            padding: "0.4rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.25rem",
            textAlign: "left",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {headerTitle && (
            <div style={{ padding: "0.35rem 0.5rem 0.2rem 0.5rem", borderBottom: "1px solid rgba(50, 55, 65, 0.08)", marginBottom: "0.2rem" }}>
              <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
                {headerTitle}
              </p>
            </div>
          )}

          {children ? (
            children
          ) : (
            items?.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  item.onClick();
                  onToggle();
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.5rem 0.65rem",
                  borderRadius: "0.5rem",
                  border: "none",
                  backgroundColor: "transparent",
                  color: item.danger ? "#dc2626" : item.color || "var(--ink)",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  fontFamily: "'Kanit', sans-serif",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background-color 0.1s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor =
                    item.hoverBg || (item.danger ? "rgba(220, 38, 38, 0.08)" : "var(--cream)");
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
