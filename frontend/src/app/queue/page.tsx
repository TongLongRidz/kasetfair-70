"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/layouts/Navbar";
import Footer from "@/components/layouts/Footer";
import { Maximize2, Minimize2 } from "lucide-react";

interface QueueItem {
  id: number;
  queue_number: string;
  order_id: string;
  method: "walkin" | "online" | "merchant";
  status: "preparing" | "ready" | "completed";
  ordered_at: string;
  called_at?: string;
}

// Online orders only (B = Online pre-orders)
const MOCK_ONLINE_QUEUES: QueueItem[] = [
  {
    id: 1,
    queue_number: "B015",
    order_id: "ORD-8943",
    method: "online",
    status: "ready",
    ordered_at: "11:24",
    called_at: "11:30",
  },
  {
    id: 2,
    queue_number: "B014",
    order_id: "ORD-8939",
    method: "online",
    status: "ready",
    ordered_at: "11:18",
    called_at: "11:26",
  },
  {
    id: 3,
    queue_number: "B013",
    order_id: "ORD-8935",
    method: "online",
    status: "ready",
    ordered_at: "11:15",
    called_at: "11:22",
  },
  {
    id: 4,
    queue_number: "B016",
    order_id: "ORD-8946",
    method: "online",
    status: "preparing",
    ordered_at: "11:32",
  },
  {
    id: 5,
    queue_number: "B017",
    order_id: "ORD-8949",
    method: "online",
    status: "preparing",
    ordered_at: "11:35",
  },
  {
    id: 6,
    queue_number: "B018",
    order_id: "ORD-8952",
    method: "online",
    status: "preparing",
    ordered_at: "11:38",
  },
  {
    id: 7,
    queue_number: "B019",
    order_id: "ORD-8955",
    method: "online",
    status: "preparing",
    ordered_at: "11:40",
  },
];

export default function QueuePage() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sync fullscreen change events (e.g. user presses Esc)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      // Fallback state toggle if browser fullscreen API is restricted
      setIsFullscreen((prev) => !prev);
    }
  };

  // Ready queues (คิวที่เรียก / พร้อมรับ - ออนไลน์)
  const readyQueues = MOCK_ONLINE_QUEUES.filter((q) => q.status === "ready");
  const latestCalledQueue = readyQueues[0] || null; // คิวล่าสุดที่เรียกตัวใหญ่สุด
  const otherReadyQueues = readyQueues.slice(1);

  // Preparing queues (คิวที่กำลังทำ - ออนไลน์)
  const preparingQueues = MOCK_ONLINE_QUEUES.filter((q) => q.status === "preparing");

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--cream)",
        color: "var(--ink)",
        fontFamily: "'Kanit', sans-serif",
        position: "relative",
        display: isFullscreen ? "flex" : "block",
        flexDirection: "column",
        justifyContent: isFullscreen ? "center" : "initial",
        alignItems: isFullscreen ? "center" : "initial",
      }}
    >
      {/* Hide Navbar completely when in Fullscreen Mode */}
      {!isFullscreen && <Navbar />}

      {/* Subtle / Clean Fullscreen Toggle Button */}
      <button
        type="button"
        onClick={toggleFullscreen}
        aria-label={isFullscreen ? "ออกจากโหมดเต็มจอ" : "แสดงผลเต็มจอ"}
        style={{
          position: "fixed",
          top: isFullscreen ? "1rem" : "5rem",
          right: "1.25rem",
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          gap: "0.35rem",
          padding: "0.45rem 0.75rem",
          borderRadius: "9999px",
          border: "1px solid rgba(50, 55, 65, 0.15)",
          backgroundColor: isFullscreen ? "rgba(255, 255, 255, 0.85)" : "var(--card)",
          backdropFilter: "blur(8px)",
          color: "var(--ink-soft)",
          fontSize: "0.75rem",
          fontWeight: 600,
          cursor: "pointer",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.06)",
          transition: "all 0.2s ease",
          opacity: isFullscreen ? 0.45 : 0.8,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = "1";
          e.currentTarget.style.color = "var(--ink)";
          e.currentTarget.style.transform = "scale(1.04)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = isFullscreen ? "0.45" : "0.8";
          e.currentTarget.style.color = "var(--ink-soft)";
          e.currentTarget.style.transform = "scale(1)";
        }}
      >
        {isFullscreen ? (
          <>
            <Minimize2 size={14} />
            <span>ย่อจอ</span>
          </>
        ) : (
          <>
            <Maximize2 size={14} />
            <span>เต็มจอ</span>
          </>
        )}
      </button>

      <main
        style={{
          width: "100%",
          maxWidth: isFullscreen ? "1080px" : "680px",
          margin: "0 auto",
          padding: isFullscreen ? "1.5rem 2rem" : "1.5rem 1rem 3rem 1rem",
          transition: "max-width 0.3s ease, padding 0.3s ease",
          boxSizing: "border-box",
        }}
      >
        {/* 1. คิวที่เรียกรับเครื่องดื่ม (คิวที่เรียก - Highlighted Big Numbers) */}
        <section className="animate-rise">
          <div
            style={{
              borderRadius: "1.75rem",
              backgroundColor: "var(--card)",
              border: "3px solid #22c55e",
              padding: isFullscreen ? "2.25rem 2rem" : "1.75rem 1.5rem",
              boxShadow: "0 10px 35px rgba(34, 197, 94, 0.18)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Header Label */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: isFullscreen ? "1.6rem" : "1.35rem", fontWeight: 900, color: "#16a34a", letterSpacing: "0.02em" }}>
                พร้อมเสิร์ฟ (READY FOR PICKUP)
              </h2>
              <span
                style={{
                  borderRadius: "9999px",
                  backgroundColor: "rgba(34, 197, 94, 0.15)",
                  color: "#16a34a",
                  padding: "0.3rem 0.75rem",
                  fontSize: isFullscreen ? "0.9rem" : "0.8rem",
                  fontWeight: 700,
                }}
              >
                ทั้งหมด {readyQueues.length} คิว
              </span>
            </div>

            {/* Latest Called Queue - Extra Giant Size */}
            {latestCalledQueue ? (
              <div
                style={{
                  marginTop: "1.25rem",
                  padding: isFullscreen ? "2rem" : "1.5rem",
                  borderRadius: "1.25rem",
                  backgroundColor: "rgba(34, 197, 94, 0.1)",
                  border: "2px dashed #22c55e",
                  textAlign: "center",
                }}
              >
                <p
                  className="font-mono"
                  style={{
                    fontSize: isFullscreen ? "7.5rem" : "5.5rem",
                    fontWeight: 900,
                    color: "#15803d",
                    lineHeight: 1,
                    margin: "0.35rem 0",
                    letterSpacing: "-0.02em",
                    textShadow: "0 4px 12px rgba(34, 197, 94, 0.2)",
                    transition: "font-size 0.3s ease",
                  }}
                >
                  {latestCalledQueue.queue_number}
                </p>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "2.5rem 0", color: "var(--ink-soft)" }}>
                <p style={{ fontSize: "1.1rem" }}>ยังไม่มีคิวที่เรียกในขณะนี้</p>
              </div>
            )}

            {/* Other Ready Queues - Large Grid */}
            {otherReadyQueues.length > 0 && (
              <div style={{ marginTop: "1.25rem" }}>
                <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--ink-soft)", marginBottom: "0.6rem" }}>
                  คิวที่เรียกก่อนหน้า (ยังไม่มารับ):
                </p>
                <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fill, minmax(${isFullscreen ? "150px" : "130px"}, 1fr))`, gap: "0.65rem" }}>
                  {otherReadyQueues.map((q) => (
                    <div
                      key={q.id}
                      style={{
                        padding: "0.75rem",
                        borderRadius: "1rem",
                        backgroundColor: "#fff",
                        border: "1.5px solid rgba(34, 197, 94, 0.4)",
                        textAlign: "center",
                        boxShadow: "0 2px 8px rgba(34, 197, 94, 0.08)",
                      }}
                    >
                      <p className="font-mono" style={{ fontSize: isFullscreen ? "3rem" : "2.5rem", fontWeight: 900, color: "#16a34a", lineHeight: 1 }}>
                        {q.queue_number}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 2. คิวที่กำลังทำ (PREPARING QUEUES) */}
        <section style={{ marginTop: "2rem" }} className="animate-rise">
          <div
            style={{
              borderRadius: "1.75rem",
              backgroundColor: "var(--card)",
              border: "1px solid rgba(50, 55, 65, 0.12)",
              padding: isFullscreen ? "2rem" : "1.5rem",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h2 style={{ fontSize: isFullscreen ? "1.45rem" : "1.25rem", fontWeight: 800, color: "var(--ink)" }}>
                คิวที่กำลังทำ
              </h2>
              <span
                style={{
                  borderRadius: "9999px",
                  backgroundColor: "rgba(50, 55, 65, 0.08)",
                  color: "var(--ink)",
                  padding: "0.3rem 0.75rem",
                  fontSize: isFullscreen ? "0.9rem" : "0.8rem",
                  fontWeight: 700,
                }}
              >
                ทั้งหมด {preparingQueues.length} คิว
              </span>
            </div>

            {/* Grid of Waiting Queues */}
            {preparingQueues.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem 0", color: "var(--ink-soft)" }}>
                <p>ไม่มีคิวรอชงในขณะนี้</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fill, minmax(${isFullscreen ? "130px" : "105px"}, 1fr))`, gap: "0.6rem" }}>
                {preparingQueues.map((q) => (
                  <div
                    key={q.id}
                    style={{
                      padding: isFullscreen ? "1.25rem 0.5rem" : "1rem 0.5rem",
                      borderRadius: "1rem",
                      backgroundColor: "var(--cream)",
                      border: "1px solid rgba(50, 55, 65, 0.1)",
                      textAlign: "center",
                    }}
                  >
                    <p className="font-mono" style={{ fontSize: isFullscreen ? "2.2rem" : "1.85rem", fontWeight: 800, color: "var(--ink)", lineHeight: 1 }}>
                      {q.queue_number}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      {!isFullscreen && <Footer />}
    </div>
  );
}
