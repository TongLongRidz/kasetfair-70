"use client";

import React, { useState, useRef, useEffect, ReactNode } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface CustomDropdownOption<T extends string | number = string> {
  value: T;
  label: string;
  icon?: ReactNode;
  badge?: string;
}

interface CustomDropdownProps<T extends string | number = string> {
  options: CustomDropdownOption<T>[];
  value: T;
  onChange: (value: T) => void;
  placeholder?: string;
  minWidth?: string;
  size?: "sm" | "md";
  className?: string;
  disabled?: boolean;
}

export default function CustomDropdown<T extends string | number = string>({
  options,
  value,
  onChange,
  placeholder = "เลือกรายการ",
  minWidth = "160px",
  size = "md",
  disabled = false,
}: CustomDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  // Keyboard accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setIsOpen((prev) => !prev);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        display: "inline-block",
        minWidth: minWidth,
        fontFamily: "'Kanit', sans-serif",
      }}
    >
      {/* Dropdown Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.5rem",
          padding: size === "sm" ? "0.35rem 0.65rem" : "0.5rem 0.85rem",
          fontSize: size === "sm" ? "0.8rem" : "0.85rem",
          fontWeight: 600,
          borderRadius: "0.65rem",
          backgroundColor: isOpen ? "rgba(75, 155, 140, 0.08)" : "var(--cream)",
          border: isOpen ? "1.5px solid var(--teal)" : "1px solid rgba(50, 55, 65, 0.15)",
          color: "var(--ink)",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.6 : 1,
          outline: "none",
          transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
          boxShadow: isOpen ? "0 0 0 3px rgba(75, 155, 140, 0.15)" : "0 1px 2px rgba(0,0,0,0.02)",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "0.45rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {selectedOption?.icon && (
            <span style={{ display: "inline-flex", alignItems: "center", flexShrink: 0 }}>
              {selectedOption.icon}
            </span>
          )}
          <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </span>

        <ChevronDown
          size={size === "sm" ? 14 : 16}
          color="var(--ink-soft)"
          style={{
            flexShrink: 0,
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
          }}
        />
      </button>

      {/* Floating Menu List */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            zIndex: 100,
            backgroundColor: "var(--card)",
            borderRadius: "0.75rem",
            border: "1px solid rgba(50, 55, 65, 0.12)",
            boxShadow: "0 10px 30px -4px rgba(0, 0, 0, 0.12), 0 4px 8px -2px rgba(0, 0, 0, 0.04)",
            padding: "0.35rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.15rem",
            maxHeight: "240px",
            overflowY: "auto",
            animation: "rise 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards",
          }}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "0.5rem",
                  padding: "0.5rem 0.65rem",
                  borderRadius: "0.5rem",
                  fontSize: "0.825rem",
                  fontWeight: isSelected ? 700 : 500,
                  fontFamily: "'Kanit', sans-serif",
                  border: "none",
                  backgroundColor: isSelected ? "rgba(75, 155, 140, 0.12)" : "transparent",
                  color: isSelected ? "var(--teal)" : "var(--ink)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background-color 0.12s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = "rgba(50, 55, 65, 0.05)";
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                  {opt.icon && <span style={{ flexShrink: 0 }}>{opt.icon}</span>}
                  <span>{opt.label}</span>
                </span>

                {isSelected && <Check size={14} color="var(--teal)" strokeWidth={2.5} style={{ flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
