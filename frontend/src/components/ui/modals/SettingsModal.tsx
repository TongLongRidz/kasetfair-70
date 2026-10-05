"use client";

import React, { useState, useEffect } from "react";
import { Settings, Clock, Globe, Monitor, X, Maximize2, Minimize2 } from "lucide-react";
import useTranslation from "@/hooks/useTranslation";
import useDateTimeFormatter from "@/hooks/useDateTimeFormatter";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { lang, setLang } = useTranslation();
  const {
    dateFormat,
    eraFormat,
    timeFormat,
    setDateFormat,
    setEraFormat,
    setTimeFormat,
  } = useDateTimeFormatter();

  const [settingsTab, setSettingsTab] = useState<"datetime" | "language" | "display">("datetime");
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        backgroundColor: "rgba(30, 35, 45, 0.5)",
        backdropFilter: "blur(4px)",
        display: "grid",
        placeItems: "center",
        padding: "1rem",
        fontFamily: "'Kanit', sans-serif",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "460px",
          maxHeight: "90vh",
          backgroundColor: "var(--card)",
          borderRadius: "1.25rem",
          border: "1px solid rgba(50, 55, 65, 0.12)",
          boxShadow: "0 20px 40px -10px rgba(0,0,0,0.15)",
          padding: "1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.15rem",
          position: "relative",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid rgba(50, 55, 65, 0.08)",
            paddingBottom: "0.85rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div
              style={{
                width: "2.25rem",
                height: "2.25rem",
                borderRadius: "0.65rem",
                backgroundColor: "rgba(75, 155, 140, 0.12)",
                display: "grid",
                placeItems: "center",
                color: "var(--teal)",
              }}
            >
              <Settings size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--ink)", margin: 0, lineHeight: 1.2 }}>
                ตั้งค่าระบบ (Settings)
              </h3>
              <p style={{ fontSize: "0.75rem", color: "var(--ink-soft)", margin: 0 }}>
                {settingsTab === "datetime" && "ปรับรูปแบบวันที่และเวลา"}
                {settingsTab === "language" && "ปรับเปลี่ยนภาษาการแสดงผล"}
                {settingsTab === "display" && "ปรับโหมดการแสดงผลหน้าจอ"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              width: "2rem",
              height: "2rem",
              borderRadius: "0.5rem",
              border: "none",
              backgroundColor: "var(--cream)",
              color: "var(--ink-soft)",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* 3 Tab Navigation Bar */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            backgroundColor: "var(--cream)",
            padding: "0.25rem",
            borderRadius: "0.75rem",
            border: "1px solid rgba(50, 55, 65, 0.1)",
            gap: "0.25rem",
          }}
        >
          <button
            type="button"
            onClick={() => setSettingsTab("datetime")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.35rem",
              padding: "0.45rem 0.25rem",
              borderRadius: "0.55rem",
              border: "none",
              fontSize: "0.785rem",
              fontWeight: settingsTab === "datetime" ? 700 : 500,
              backgroundColor: settingsTab === "datetime" ? "var(--card)" : "transparent",
              color: settingsTab === "datetime" ? "var(--teal)" : "var(--ink-soft)",
              boxShadow: settingsTab === "datetime" ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
              cursor: "pointer",
              transition: "all 0.15s ease",
              whiteSpace: "nowrap",
            }}
          >
            <Clock size={14} />
            <span>วันที่ & เวลา</span>
          </button>

          <button
            type="button"
            onClick={() => setSettingsTab("language")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.35rem",
              padding: "0.45rem 0.25rem",
              borderRadius: "0.55rem",
              border: "none",
              fontSize: "0.785rem",
              fontWeight: settingsTab === "language" ? 700 : 500,
              backgroundColor: settingsTab === "language" ? "var(--card)" : "transparent",
              color: settingsTab === "language" ? "var(--teal)" : "var(--ink-soft)",
              boxShadow: settingsTab === "language" ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
              cursor: "pointer",
              transition: "all 0.15s ease",
              whiteSpace: "nowrap",
            }}
          >
            <Globe size={14} />
            <span>ภาษา</span>
          </button>

          <button
            type="button"
            onClick={() => setSettingsTab("display")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.35rem",
              padding: "0.45rem 0.25rem",
              borderRadius: "0.55rem",
              border: "none",
              fontSize: "0.785rem",
              fontWeight: settingsTab === "display" ? 700 : 500,
              backgroundColor: settingsTab === "display" ? "var(--card)" : "transparent",
              color: settingsTab === "display" ? "var(--teal)" : "var(--ink-soft)",
              boxShadow: settingsTab === "display" ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
              cursor: "pointer",
              transition: "all 0.15s ease",
              whiteSpace: "nowrap",
            }}
          >
            <Monitor size={14} />
            <span>การแสดงผล</span>
          </button>
        </div>

        {/* TAB CONTENT 1: Format Date & Time */}
        {settingsTab === "datetime" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Date Format */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--ink)" }}>
                <span>รูปแบบวันที่ (Date Format)</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setDateFormat("dmy")}
                  style={{
                    padding: "0.6rem 0.65rem",
                    borderRadius: "0.65rem",
                    border: dateFormat === "dmy" ? "2px solid var(--teal)" : "1px solid rgba(50, 55, 65, 0.12)",
                    backgroundColor: dateFormat === "dmy" ? "rgba(75, 155, 140, 0.12)" : "var(--cream)",
                    color: dateFormat === "dmy" ? "var(--teal)" : "var(--ink)",
                    fontSize: "0.825rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    textAlign: "center",
                    transition: "all 0.15s ease",
                  }}
                >
                  วัน-เดือน-ปี (DD/MM/YYYY)
                </button>

                <button
                  type="button"
                  onClick={() => setDateFormat("ymd")}
                  style={{
                    padding: "0.6rem 0.65rem",
                    borderRadius: "0.65rem",
                    border: dateFormat === "ymd" ? "2px solid var(--teal)" : "1px solid rgba(50, 55, 65, 0.12)",
                    backgroundColor: dateFormat === "ymd" ? "rgba(75, 155, 140, 0.12)" : "var(--cream)",
                    color: dateFormat === "ymd" ? "var(--teal)" : "var(--ink)",
                    fontSize: "0.825rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    textAlign: "center",
                    transition: "all 0.15s ease",
                  }}
                >
                  ปี-เดือน-วัน (YYYY-MM-DD)
                </button>
              </div>
            </div>

            {/* Era Selector (BE vs CE) */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.45rem",
                paddingTop: "0.65rem",
                borderTop: "1px solid rgba(50, 55, 65, 0.08)",
              }}
            >
              <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--ink)" }}>
                <span>ศักราช (Era Format)</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setEraFormat("be")}
                  style={{
                    padding: "0.6rem 0.65rem",
                    borderRadius: "0.65rem",
                    border: eraFormat === "be" ? "2px solid var(--teal)" : "1px solid rgba(50, 55, 65, 0.12)",
                    backgroundColor: eraFormat === "be" ? "rgba(75, 155, 140, 0.12)" : "var(--cream)",
                    color: eraFormat === "be" ? "var(--teal)" : "var(--ink)",
                    fontSize: "0.825rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    textAlign: "center",
                    transition: "all 0.15s ease",
                  }}
                >
                  พุทธศักราช (พ.ศ.)
                </button>

                <button
                  type="button"
                  onClick={() => setEraFormat("ce")}
                  style={{
                    padding: "0.6rem 0.65rem",
                    borderRadius: "0.65rem",
                    border: eraFormat === "ce" ? "2px solid var(--teal)" : "1px solid rgba(50, 55, 65, 0.12)",
                    backgroundColor: eraFormat === "ce" ? "rgba(75, 155, 140, 0.12)" : "var(--cream)",
                    color: eraFormat === "ce" ? "var(--teal)" : "var(--ink)",
                    fontSize: "0.825rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    textAlign: "center",
                    transition: "all 0.15s ease",
                  }}
                >
                  คริสต์ศักราช (ค.ศ.)
                </button>
              </div>
            </div>

            {/* Time Format */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.45rem",
                paddingTop: "0.65rem",
                borderTop: "1px solid rgba(50, 55, 65, 0.08)",
              }}
            >
              <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--ink)" }}>
                <span>รูปแบบเวลา (Time Format)</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setTimeFormat("24h")}
                  style={{
                    padding: "0.6rem 0.65rem",
                    borderRadius: "0.65rem",
                    border: timeFormat === "24h" ? "2px solid var(--teal)" : "1px solid rgba(50, 55, 65, 0.12)",
                    backgroundColor: timeFormat === "24h" ? "rgba(75, 155, 140, 0.12)" : "var(--cream)",
                    color: timeFormat === "24h" ? "var(--teal)" : "var(--ink)",
                    fontSize: "0.825rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    textAlign: "center",
                    transition: "all 0.15s ease",
                  }}
                >
                  24 ชั่วโมง (14:30:00)
                </button>

                <button
                  type="button"
                  onClick={() => setTimeFormat("12h")}
                  style={{
                    padding: "0.6rem 0.65rem",
                    borderRadius: "0.65rem",
                    border: timeFormat === "12h" ? "2px solid var(--teal)" : "1px solid rgba(50, 55, 65, 0.12)",
                    backgroundColor: timeFormat === "12h" ? "rgba(75, 155, 140, 0.12)" : "var(--cream)",
                    color: timeFormat === "12h" ? "var(--teal)" : "var(--ink)",
                    fontSize: "0.825rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    textAlign: "center",
                    transition: "all 0.15s ease",
                  }}
                >
                  12 ชั่วโมง (2:30:00 PM)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB CONTENT 2: Language */}
        {settingsTab === "language" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--ink)" }}>
              <span>เลือกภาษาของระบบ (Select Language)</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.65rem" }}>
              <button
                type="button"
                onClick={() => setLang("th")}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  padding: "1.25rem 0.75rem",
                  borderRadius: "0.85rem",
                  border: lang === "th" ? "2px solid var(--teal)" : "1px solid rgba(50, 55, 65, 0.12)",
                  backgroundColor: lang === "th" ? "rgba(75, 155, 140, 0.12)" : "var(--cream)",
                  color: lang === "th" ? "var(--teal)" : "var(--ink)",
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <span style={{ fontSize: "2rem", lineHeight: 1 }}>🇹🇭</span>
                <span>ภาษาไทย (TH)</span>
              </button>

              <button
                type="button"
                onClick={() => setLang("en")}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  padding: "1.25rem 0.75rem",
                  borderRadius: "0.85rem",
                  border: lang === "en" ? "2px solid var(--teal)" : "1px solid rgba(50, 55, 65, 0.12)",
                  backgroundColor: lang === "en" ? "rgba(75, 155, 140, 0.12)" : "var(--cream)",
                  color: lang === "en" ? "var(--teal)" : "var(--ink)",
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <span style={{ fontSize: "2rem", lineHeight: 1 }}>🇬🇧</span>
                <span>English (EN)</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB CONTENT 3: Display Mode */}
        {settingsTab === "display" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--ink)" }}>
              <span>โหมดการแสดงผลหน้าจอ (Screen Display Mode)</span>
            </div>
            <button
              type="button"
              onClick={toggleFullscreen}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.65rem",
                padding: "1rem",
                borderRadius: "0.85rem",
                border: isFullscreen ? "2px solid var(--teal)" : "1px solid rgba(50, 55, 65, 0.12)",
                backgroundColor: isFullscreen ? "rgba(75, 155, 140, 0.12)" : "var(--cream)",
                color: isFullscreen ? "var(--teal)" : "var(--ink)",
                fontSize: "0.925rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s ease",
                width: "100%",
              }}
            >
              {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
              <span>{isFullscreen ? "ออกจากโหมดเต็มจอ (Exit Fullscreen)" : "แสดงผลเต็มจอ (Fullscreen)"}</span>
            </button>
            <p style={{ fontSize: "0.775rem", color: "var(--ink-soft)", textAlign: "center", margin: 0 }}>
              * รองรับการแสดงผลเต็มหน้าจอสำหรับจอ POS หน้าร้าน หรือ Kitchen Display System
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
