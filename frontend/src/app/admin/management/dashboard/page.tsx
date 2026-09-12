"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import { BarChart2, LineChart as LineChartIcon, Search, ArrowUpDown, ChevronLeft, ChevronRight, Clock, Zap, Flame } from "lucide-react";

// Helper hook for scroll intersection trigger
function useInView(threshold = 0.2) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(entry.target); // Trigger animation once when scrolled into view
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isInView };
}

// Custom Permanent Scrollbar Slider Wrapper with Full Pointer Interaction (Drag & Seek)
function ScrollableChartWrapper({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [scrollState, setScrollState] = useState({ left: 0, max: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const updateScroll = () => {
    if (!containerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
    const max = Math.max(0, Math.round(scrollWidth - clientWidth));
    setScrollState({ left: scrollLeft, max });
  };

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollLeft = 0;
    }
    updateScroll();
    const timer = setTimeout(updateScroll, 60);
    window.addEventListener("resize", updateScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateScroll);
    };
  }, [children]);

  const hasScroll = scrollState.max > 2;
  const thumbWidthPct = hasScroll ? 35 : 100;
  const thumbLeftPct = hasScroll ? (scrollState.left / scrollState.max) * (100 - thumbWidthPct) : 0;

  const handleSeek = (clientX: number) => {
    if (!trackRef.current || !containerRef.current || scrollState.max <= 0) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const ratio = clickX / rect.width;
    containerRef.current.scrollLeft = ratio * scrollState.max;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!hasScroll) return;
    setIsDragging(true);
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
    handleSeek(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      handleSeek(e.clientX);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  return (
    <div style={{ width: "100%", marginTop: "auto", paddingTop: "0.5rem" }}>
      <div
        ref={containerRef}
        onScroll={updateScroll}
        className="hide-scrollbar"
        style={{
          overflowX: "auto",
          width: "100%",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {children}
      </div>

      {/* Interactive Custom Dark Gray Sliderbar Track + Thumb (Only displayed when content overflows) */}
      {hasScroll && (
        <div
          ref={trackRef}
          className="admin-chart-slider-track"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{
            marginTop: "0.75rem",
            padding: "4px 0",
            width: "100%",
            cursor: "pointer",
            touchAction: "none",
            userSelect: "none",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              height: "8px",
              width: "100%",
              backgroundColor: "rgba(50, 55, 65, 0.14)",
              borderRadius: "9999px",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: `${thumbLeftPct}%`,
                width: `${thumbWidthPct}%`,
                backgroundColor: isDragging ? "#1f2937" : "#4b5563",
                borderRadius: "9999px",
                boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
                transition: isDragging ? "none" : "left 0.05s ease-out, background-color 0.15s ease",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

const ranges = ["วันนี้", "ทั้งงาน"] as const;

interface KPIData {
  label: string;
  value: string;
  sub: string;
  tone: "teal" | "orange" | "plain";
}

interface TrendItem {
  d: string;
  rev: number;
  exp: number;
}

interface TopProductItem {
  name: string;
  cups: number;
  amount: string;
  pct: number;
}

interface HourlySalesSlot {
  time: string;
  cups: number;
  online: number;
  walkin: number;
  revenue: number;
}

export interface DayHourlyData {
  dateLabel: string;
  shortLabel: string;
  totalCups: number;
  totalRev: string;
  peakSlot: string;
  maxCups: number;
  slots: HourlySalesSlot[];
}

const DAILY_HOURLY_SALES: DayHourlyData[] = [
  {
    dateLabel: "อาทิตย์ที่ 26 ม.ค. (วันเปิดงานสัปดาห์ 1)",
    shortLabel: "อา. 26 ม.ค.",
    totalCups: 412,
    totalRev: "฿14,500",
    peakSlot: "17:00 (72 แก้ว)",
    maxCups: 80,
    slots: [
      { time: "10:00", cups: 10, online: 6, walkin: 4, revenue: 350 },
      { time: "11:00", cups: 15, online: 8, walkin: 7, revenue: 525 },
      { time: "12:00", cups: 38, online: 22, walkin: 16, revenue: 1330 },
      { time: "13:00", cups: 30, online: 18, walkin: 12, revenue: 1050 },
      { time: "14:00", cups: 25, online: 15, walkin: 10, revenue: 875 },
      { time: "15:00", cups: 28, online: 16, walkin: 12, revenue: 980 },
      { time: "16:00", cups: 42, online: 25, walkin: 17, revenue: 1470 },
      { time: "17:00", cups: 72, online: 42, walkin: 30, revenue: 2520 },
      { time: "18:00", cups: 60, online: 36, walkin: 24, revenue: 2100 },
      { time: "19:00", cups: 45, online: 26, walkin: 19, revenue: 1575 },
      { time: "20:00", cups: 28, online: 16, walkin: 12, revenue: 980 },
      { time: "21:00", cups: 14, online: 8, walkin: 6, revenue: 490 },
      { time: "22:00", cups: 5, online: 3, walkin: 2, revenue: 175 },
    ],
  },
  {
    dateLabel: "จันทร์ที่ 27 ม.ค.",
    shortLabel: "จ. 27 ม.ค.",
    totalCups: 460,
    totalRev: "฿16,200",
    peakSlot: "18:00 (104 แก้ว)",
    maxCups: 120,
    slots: [
      { time: "10:00", cups: 12, online: 7, walkin: 5, revenue: 420 },
      { time: "11:00", cups: 18, online: 10, walkin: 8, revenue: 630 },
      { time: "12:00", cups: 42, online: 25, walkin: 17, revenue: 1470 },
      { time: "13:00", cups: 34, online: 20, walkin: 14, revenue: 1190 },
      { time: "14:00", cups: 28, online: 16, walkin: 12, revenue: 980 },
      { time: "15:00", cups: 32, online: 19, walkin: 13, revenue: 1120 },
      { time: "16:00", cups: 50, online: 30, walkin: 20, revenue: 1750 },
      { time: "17:00", cups: 78, online: 46, walkin: 32, revenue: 2730 },
      { time: "18:00", cups: 104, online: 62, walkin: 42, revenue: 3680 },
      { time: "19:00", cups: 52, online: 31, walkin: 21, revenue: 1820 },
      { time: "20:00", cups: 32, online: 19, walkin: 13, revenue: 1120 },
      { time: "21:00", cups: 16, online: 9, walkin: 7, revenue: 560 },
      { time: "22:00", cups: 6, online: 3, walkin: 3, revenue: 210 },
    ],
  },
  {
    dateLabel: "อังคารที่ 28 ม.ค.",
    shortLabel: "อ. 28 ม.ค.",
    totalCups: 535,
    totalRev: "฿18,900",
    peakSlot: "18:00 (122 แก้ว)",
    maxCups: 140,
    slots: [
      { time: "10:00", cups: 14, online: 8, walkin: 6, revenue: 490 },
      { time: "11:00", cups: 22, online: 13, walkin: 9, revenue: 770 },
      { time: "12:00", cups: 48, online: 28, walkin: 20, revenue: 1680 },
      { time: "13:00", cups: 40, online: 24, walkin: 16, revenue: 1400 },
      { time: "14:00", cups: 32, online: 19, walkin: 13, revenue: 1120 },
      { time: "15:00", cups: 38, online: 22, walkin: 16, revenue: 1330 },
      { time: "16:00", cups: 58, online: 34, walkin: 24, revenue: 2030 },
      { time: "17:00", cups: 88, online: 52, walkin: 36, revenue: 3080 },
      { time: "18:00", cups: 122, online: 72, walkin: 50, revenue: 4320 },
      { time: "19:00", cups: 62, online: 36, walkin: 26, revenue: 2170 },
      { time: "20:00", cups: 38, online: 22, walkin: 16, revenue: 1330 },
      { time: "21:00", cups: 18, online: 10, walkin: 8, revenue: 630 },
      { time: "22:00", cups: 7, online: 4, walkin: 3, revenue: 245 },
    ],
  },
  {
    dateLabel: "พุธที่ 29 ม.ค.",
    shortLabel: "พ. 29 ม.ค.",
    totalCups: 605,
    totalRev: "฿21,300",
    peakSlot: "18:00 (138 แก้ว)",
    maxCups: 150,
    slots: [
      { time: "10:00", cups: 16, online: 10, walkin: 6, revenue: 560 },
      { time: "11:00", cups: 25, online: 15, walkin: 10, revenue: 875 },
      { time: "12:00", cups: 55, online: 33, walkin: 22, revenue: 1925 },
      { time: "13:00", cups: 46, online: 27, walkin: 19, revenue: 1610 },
      { time: "14:00", cups: 36, online: 21, walkin: 15, revenue: 1260 },
      { time: "15:00", cups: 44, online: 26, walkin: 18, revenue: 1540 },
      { time: "16:00", cups: 66, online: 39, walkin: 27, revenue: 2310 },
      { time: "17:00", cups: 98, online: 58, walkin: 40, revenue: 3430 },
      { time: "18:00", cups: 138, online: 82, walkin: 56, revenue: 4860 },
      { time: "19:00", cups: 70, online: 41, walkin: 29, revenue: 2450 },
      { time: "20:00", cups: 42, online: 25, walkin: 17, revenue: 1470 },
      { time: "21:00", cups: 20, online: 12, walkin: 8, revenue: 700 },
      { time: "22:00", cups: 9, online: 5, walkin: 4, revenue: 315 },
    ],
  },
  {
    dateLabel: "พฤหัสบดีที่ 30 ม.ค.",
    shortLabel: "พฤ. 30 ม.ค.",
    totalCups: 790,
    totalRev: "฿28,400",
    peakSlot: "18:00 (178 แก้ว)",
    maxCups: 200,
    slots: [
      { time: "10:00", cups: 22, online: 13, walkin: 9, revenue: 770 },
      { time: "11:00", cups: 34, online: 20, walkin: 14, revenue: 1190 },
      { time: "12:00", cups: 72, online: 43, walkin: 29, revenue: 2520 },
      { time: "13:00", cups: 60, online: 35, walkin: 25, revenue: 2100 },
      { time: "14:00", cups: 48, online: 28, walkin: 20, revenue: 1680 },
      { time: "15:00", cups: 56, online: 33, walkin: 23, revenue: 1960 },
      { time: "16:00", cups: 88, online: 52, walkin: 36, revenue: 3080 },
      { time: "17:00", cups: 132, online: 78, walkin: 54, revenue: 4620 },
      { time: "18:00", cups: 178, online: 106, walkin: 72, revenue: 6410 },
      { time: "19:00", cups: 90, online: 54, walkin: 36, revenue: 3150 },
      { time: "20:00", cups: 55, online: 33, walkin: 22, revenue: 1925 },
      { time: "21:00", cups: 28, online: 16, walkin: 12, revenue: 980 },
      { time: "22:00", cups: 12, online: 7, walkin: 5, revenue: 420 },
    ],
  },
  {
    dateLabel: "ศุกร์ที่ 31 ม.ค.",
    shortLabel: "ศ. 31 ม.ค.",
    totalCups: 940,
    totalRev: "฿33,500",
    peakSlot: "18:00 (215 แก้ว)",
    maxCups: 240,
    slots: [
      { time: "10:00", cups: 26, online: 15, walkin: 11, revenue: 910 },
      { time: "11:00", cups: 42, online: 25, walkin: 17, revenue: 1470 },
      { time: "12:00", cups: 86, online: 51, walkin: 35, revenue: 3010 },
      { time: "13:00", cups: 72, online: 43, walkin: 29, revenue: 2520 },
      { time: "14:00", cups: 58, online: 34, walkin: 24, revenue: 2030 },
      { time: "15:00", cups: 68, online: 40, walkin: 28, revenue: 2380 },
      { time: "16:00", cups: 106, online: 63, walkin: 43, revenue: 3710 },
      { time: "17:00", cups: 158, online: 94, walkin: 64, revenue: 5530 },
      { time: "18:00", cups: 215, online: 128, walkin: 87, revenue: 7720 },
      { time: "19:00", cups: 110, online: 66, walkin: 44, revenue: 3850 },
      { time: "20:00", cups: 66, online: 39, walkin: 27, revenue: 2310 },
      { time: "21:00", cups: 34, online: 20, walkin: 14, revenue: 1190 },
      { time: "22:00", cups: 15, online: 9, walkin: 6, revenue: 525 },
    ],
  },
  {
    dateLabel: "เสาร์ที่ 1 ก.พ. (วันหยุดสุดสัปดาห์ 1)",
    shortLabel: "ส. 1 ก.พ.",
    totalCups: 1040,
    totalRev: "฿36,800",
    peakSlot: "18:00 (242 แก้ว)",
    maxCups: 260,
    slots: [
      { time: "10:00", cups: 30, online: 18, walkin: 12, revenue: 1050 },
      { time: "11:00", cups: 48, online: 28, walkin: 20, revenue: 1680 },
      { time: "12:00", cups: 96, online: 57, walkin: 39, revenue: 3360 },
      { time: "13:00", cups: 82, online: 49, walkin: 33, revenue: 2870 },
      { time: "14:00", cups: 66, online: 39, walkin: 27, revenue: 2310 },
      { time: "15:00", cups: 78, online: 46, walkin: 32, revenue: 2730 },
      { time: "16:00", cups: 118, online: 70, walkin: 48, revenue: 4130 },
      { time: "17:00", cups: 175, online: 104, walkin: 71, revenue: 6125 },
      { time: "18:00", cups: 242, online: 145, walkin: 97, revenue: 8640 },
      { time: "19:00", cups: 124, online: 74, walkin: 50, revenue: 4340 },
      { time: "20:00", cups: 72, online: 43, walkin: 29, revenue: 2520 },
      { time: "21:00", cups: 38, online: 22, walkin: 16, revenue: 1330 },
      { time: "22:00", cups: 18, online: 11, walkin: 7, revenue: 630 },
    ],
  },
  {
    dateLabel: "อาทิตย์ที่ 2 ก.พ. (วันหยุดสุดสัปดาห์ 2)",
    shortLabel: "อา. 2 ก.พ.",
    totalCups: 995,
    totalRev: "฿35,600",
    peakSlot: "18:00 (230 แก้ว)",
    maxCups: 250,
    slots: [
      { time: "10:00", cups: 28, online: 17, walkin: 11, revenue: 980 },
      { time: "11:00", cups: 45, online: 27, walkin: 18, revenue: 1575 },
      { time: "12:00", cups: 92, online: 55, walkin: 37, revenue: 3220 },
      { time: "13:00", cups: 78, online: 46, walkin: 32, revenue: 2730 },
      { time: "14:00", cups: 62, online: 37, walkin: 25, revenue: 2170 },
      { time: "15:00", cups: 74, online: 44, walkin: 30, revenue: 2590 },
      { time: "16:00", cups: 112, online: 67, walkin: 45, revenue: 3920 },
      { time: "17:00", cups: 168, online: 100, walkin: 68, revenue: 5880 },
      { time: "18:00", cups: 230, online: 138, walkin: 92, revenue: 8230 },
      { time: "19:00", cups: 118, online: 70, walkin: 48, revenue: 4130 },
      { time: "20:00", cups: 68, online: 40, walkin: 28, revenue: 2380 },
      { time: "21:00", cups: 36, online: 21, walkin: 15, revenue: 1260 },
      { time: "22:00", cups: 16, online: 10, walkin: 6, revenue: 560 },
    ],
  },
  {
    dateLabel: "จันทร์ที่ 3 ก.พ.",
    shortLabel: "จ. 3 ก.พ.",
    totalCups: 505,
    totalRev: "฿17,800",
    peakSlot: "18:00 (115 แก้ว)",
    maxCups: 130,
    slots: [
      { time: "10:00", cups: 13, online: 7, walkin: 6, revenue: 455 },
      { time: "11:00", cups: 20, online: 12, walkin: 8, revenue: 700 },
      { time: "12:00", cups: 45, online: 26, walkin: 19, revenue: 1575 },
      { time: "13:00", cups: 36, online: 21, walkin: 15, revenue: 1260 },
      { time: "14:00", cups: 30, online: 17, walkin: 13, revenue: 1050 },
      { time: "15:00", cups: 35, online: 20, walkin: 15, revenue: 1225 },
      { time: "16:00", cups: 54, online: 32, walkin: 22, revenue: 1890 },
      { time: "17:00", cups: 82, online: 49, walkin: 33, revenue: 2870 },
      { time: "18:00", cups: 115, online: 68, walkin: 47, revenue: 4080 },
      { time: "19:00", cups: 56, online: 33, walkin: 23, revenue: 1960 },
      { time: "20:00", cups: 35, online: 21, walkin: 14, revenue: 1225 },
      { time: "21:00", cups: 17, online: 10, walkin: 7, revenue: 595 },
      { time: "22:00", cups: 7, online: 4, walkin: 3, revenue: 245 },
    ],
  },
  {
    dateLabel: "อังคารที่ 4 ก.พ.",
    shortLabel: "อ. 4 ก.พ.",
    totalCups: 550,
    totalRev: "฿19,400",
    peakSlot: "18:00 (126 แก้ว)",
    maxCups: 140,
    slots: [
      { time: "10:00", cups: 15, online: 9, walkin: 6, revenue: 525 },
      { time: "11:00", cups: 23, online: 13, walkin: 10, revenue: 805 },
      { time: "12:00", cups: 49, online: 29, walkin: 20, revenue: 1715 },
      { time: "13:00", cups: 40, online: 24, walkin: 16, revenue: 1400 },
      { time: "14:00", cups: 33, online: 19, walkin: 14, revenue: 1155 },
      { time: "15:00", cups: 38, online: 22, walkin: 16, revenue: 1330 },
      { time: "16:00", cups: 60, online: 35, walkin: 25, revenue: 2100 },
      { time: "17:00", cups: 90, online: 53, walkin: 37, revenue: 3150 },
      { time: "18:00", cups: 126, online: 75, walkin: 51, revenue: 4460 },
      { time: "19:00", cups: 60, online: 35, walkin: 25, revenue: 2100 },
      { time: "20:00", cups: 38, online: 22, walkin: 16, revenue: 1330 },
      { time: "21:00", cups: 19, online: 11, walkin: 8, revenue: 665 },
      { time: "22:00", cups: 8, online: 5, walkin: 3, revenue: 280 },
    ],
  },
  {
    dateLabel: "พุธที่ 5 ก.พ.",
    shortLabel: "พ. 5 ก.พ.",
    totalCups: 640,
    totalRev: "฿22,600",
    peakSlot: "18:00 (148 แก้ว)",
    maxCups: 160,
    slots: [
      { time: "10:00", cups: 18, online: 10, walkin: 8, revenue: 630 },
      { time: "11:00", cups: 27, online: 16, walkin: 11, revenue: 945 },
      { time: "12:00", cups: 58, online: 34, walkin: 24, revenue: 2030 },
      { time: "13:00", cups: 48, online: 28, walkin: 20, revenue: 1680 },
      { time: "14:00", cups: 39, online: 23, walkin: 16, revenue: 1365 },
      { time: "15:00", cups: 45, online: 26, walkin: 19, revenue: 1575 },
      { time: "16:00", cups: 70, online: 41, walkin: 29, revenue: 2450 },
      { time: "17:00", cups: 105, online: 62, walkin: 43, revenue: 3675 },
      { time: "18:00", cups: 148, online: 88, walkin: 60, revenue: 5240 },
      { time: "19:00", cups: 72, online: 43, walkin: 29, revenue: 2520 },
      { time: "20:00", cups: 44, online: 26, walkin: 18, revenue: 1540 },
      { time: "21:00", cups: 22, online: 13, walkin: 9, revenue: 770 },
      { time: "22:00", cups: 10, online: 6, walkin: 4, revenue: 350 },
    ],
  },
  {
    dateLabel: "พฤหัสบดีที่ 6 ก.พ.",
    shortLabel: "พฤ. 6 ก.พ.",
    totalCups: 710,
    totalRev: "฿25,100",
    peakSlot: "18:00 (162 แก้ว)",
    maxCups: 180,
    slots: [
      { time: "10:00", cups: 20, online: 12, walkin: 8, revenue: 700 },
      { time: "11:00", cups: 30, online: 18, walkin: 12, revenue: 1050 },
      { time: "12:00", cups: 64, online: 38, walkin: 26, revenue: 2240 },
      { time: "13:00", cups: 52, online: 31, walkin: 21, revenue: 1820 },
      { time: "14:00", cups: 43, online: 25, walkin: 18, revenue: 1505 },
      { time: "15:00", cups: 50, online: 29, walkin: 21, revenue: 1750 },
      { time: "16:00", cups: 78, online: 46, walkin: 32, revenue: 2730 },
      { time: "17:00", cups: 118, online: 70, walkin: 48, revenue: 4130 },
      { time: "18:00", cups: 162, online: 96, walkin: 66, revenue: 5740 },
      { time: "19:00", cups: 80, online: 47, walkin: 33, revenue: 2800 },
      { time: "20:00", cups: 48, online: 28, walkin: 20, revenue: 1680 },
      { time: "21:00", cups: 24, online: 14, walkin: 10, revenue: 840 },
      { time: "22:00", cups: 11, online: 6, walkin: 5, revenue: 385 },
    ],
  },
  {
    dateLabel: "ศุกร์ที่ 7 ก.พ.",
    shortLabel: "ศ. 7 ก.พ.",
    totalCups: 880,
    totalRev: "฿31,200",
    peakSlot: "18:00 (202 แก้ว)",
    maxCups: 220,
    slots: [
      { time: "10:00", cups: 24, online: 14, walkin: 10, revenue: 840 },
      { time: "11:00", cups: 38, online: 22, walkin: 16, revenue: 1330 },
      { time: "12:00", cups: 80, online: 48, walkin: 32, revenue: 2800 },
      { time: "13:00", cups: 66, online: 39, walkin: 27, revenue: 2310 },
      { time: "14:00", cups: 54, online: 32, walkin: 22, revenue: 1890 },
      { time: "15:00", cups: 62, online: 36, walkin: 26, revenue: 2170 },
      { time: "16:00", cups: 98, online: 58, walkin: 40, revenue: 3430 },
      { time: "17:00", cups: 148, online: 88, walkin: 60, revenue: 5180 },
      { time: "18:00", cups: 202, online: 120, walkin: 82, revenue: 7210 },
      { time: "19:00", cups: 100, online: 60, walkin: 40, revenue: 3500 },
      { time: "20:00", cups: 60, online: 35, walkin: 25, revenue: 2100 },
      { time: "21:00", cups: 32, online: 19, walkin: 13, revenue: 1120 },
      { time: "22:00", cups: 16, online: 9, walkin: 7, revenue: 560 },
    ],
  },
  {
    dateLabel: "เสาร์ที่ 8 ก.พ. (วันเสาร์สุดท้าย)",
    shortLabel: "ส. 8 ก.พ.",
    totalCups: 1085,
    totalRev: "฿38,400",
    peakSlot: "18:00 (254 แก้ว)",
    maxCups: 270,
    slots: [
      { time: "10:00", cups: 32, online: 19, walkin: 13, revenue: 1120 },
      { time: "11:00", cups: 50, online: 30, walkin: 20, revenue: 1750 },
      { time: "12:00", cups: 100, online: 59, walkin: 41, revenue: 3500 },
      { time: "13:00", cups: 85, online: 50, walkin: 35, revenue: 2975 },
      { time: "14:00", cups: 70, online: 41, walkin: 29, revenue: 2450 },
      { time: "15:00", cups: 82, online: 48, walkin: 34, revenue: 2870 },
      { time: "16:00", cups: 125, online: 74, walkin: 51, revenue: 4375 },
      { time: "17:00", cups: 185, online: 110, walkin: 75, revenue: 6475 },
      { time: "18:00", cups: 254, online: 152, walkin: 102, revenue: 9080 },
      { time: "19:00", cups: 130, online: 77, walkin: 53, revenue: 4550 },
      { time: "20:00", cups: 76, online: 45, walkin: 31, revenue: 2660 },
      { time: "21:00", cups: 40, online: 24, walkin: 16, revenue: 1400 },
      { time: "22:00", cups: 20, online: 12, walkin: 8, revenue: 700 },
    ],
  },
];

const DATA_BY_RANGE = {
  วันนี้: {
    kpis: [
      { label: "รายรับรวม", value: "฿24,850", sub: "+12.4% จากเมื่อวาน", tone: "teal" as const },
      { label: "รายจ่ายรวม", value: "฿8,320", sub: "ต้นทุนวัตถุดิบ 33.5%", tone: "orange" as const },
      { label: "กำไรสุทธิ", value: "฿16,530", sub: "อัตรากำไร 66.5%", tone: "teal" as const },
      { label: "จำนวนออเดอร์", value: "412", sub: "เฉลี่ย ฿60.3 / บิล", tone: "plain" as const },
      { label: "จำนวนแก้ว", value: "689", sub: "เฉลี่ย 1.67 แก้ว / บิล", tone: "plain" as const },
      { label: "สลิปรอตรวจ", value: "3 รายการ", sub: "ค้างตรวจสอบ ฿545", tone: "orange" as const },
    ],
    trend: [
      // สัปดาห์ที่ 1 (26 ม.ค. - 1 ก.พ.) เริ่มจากวันอาทิตย์
      { d: "อา. 26 ม.ค.", rev: 14500, exp: 4800 },
      { d: "จ. 27 ม.ค.", rev: 16200, exp: 5100 },
      { d: "อ. 28 ม.ค.", rev: 18900, exp: 5800 },
      { d: "พ. 29 ม.ค.", rev: 21300, exp: 6700 },
      { d: "พฤ. 30 ม.ค.", rev: 28400, exp: 8900 },
      { d: "ศ. 31 ม.ค.", rev: 33500, exp: 10200 },
      { d: "ส. 1 ก.พ.", rev: 36800, exp: 11400 },
      // สัปดาห์ที่ 2 (2 ก.พ. - 8 ก.พ.) เริ่มจากวันอาทิตย์
      { d: "อา. 2 ก.พ.", rev: 35600, exp: 11200 },
      { d: "จ. 3 ก.พ.", rev: 17800, exp: 5600 },
      { d: "อ. 4 ก.พ.", rev: 19400, exp: 6100 },
      { d: "พ. 5 ก.พ.", rev: 22600, exp: 7200 },
      { d: "พฤ. 6 ก.พ.", rev: 25100, exp: 7900 },
      { d: "ศ. 7 ก.พ.", rev: 31200, exp: 9800 },
      { d: "ส. 8 ก.พ.", rev: 38400, exp: 11900 },
    ],
    maxBar: 40000,
    channels: {
      total: "฿24,850",
      online: { pct: 58, amount: "฿14,413", dashArray: "51.02 36.94", dashOffset: "0" },
      walkin: { pct: 42, amount: "฿10,437", dashArray: "36.94 51.02", dashOffset: "-51.02" },
    },
    topProducts: [
      { name: "น้ำเต้าหู้ดั้งเดิม (หวานน้อย)", cups: 168, amount: "฿5,880", pct: 100 },
      { name: "น้ำเต้าหู้มัทฉะเกียวโต", cups: 121, amount: "฿6,050", pct: 72 },
      { name: "น้ำเต้าหู้ชาไทยพรีเมียม", cups: 96, amount: "฿4,320", pct: 57 },
      { name: "น้ำเต้าหู้ช็อกโกแลตเข้มข้น", cups: 74, amount: "฿3,330", pct: 44 },
      { name: "น้ำเต้าหู้นมเย็นชมพู", cups: 62, amount: "฿2,480", pct: 37 },
    ],
    peakHours: [
      { time: "16:00 - 18:00", cups: 196, revenue: "฿7,120", orders: 114, pct: 100, isPeak: true },
      { time: "12:00 - 14:00", cups: 154, revenue: "฿5,680", orders: 92, pct: 79, isPeak: false },
      { time: "18:00 - 20:00", cups: 142, revenue: "฿5,150", orders: 85, pct: 72, isPeak: false },
      { time: "14:00 - 16:00", cups: 98, revenue: "฿3,520", orders: 58, pct: 50, isPeak: false },
      { time: "10:00 - 12:00", cups: 61, revenue: "฿2,180", orders: 38, pct: 31, isPeak: false },
      { time: "20:00 - 22:00", cups: 38, revenue: "฿1,200", orders: 25, pct: 19, isPeak: false },
    ],
    orders: [
      { id: 12, no: "TT-1042", q: "A21", name: "คุณฟ้า (เกษตรศาสตร์)", ch: "ออนไลน์" as const, total: "฿185", amount: 185, st: "รอตรวจสลิป" },
      { id: 11, no: "TT-1041", q: "W08", name: "คุณเบียร์ (Walk-in)", ch: "หน้าร้าน" as const, total: "฿120", amount: 120, st: "กำลังทำ" },
      { id: 10, no: "TT-1040", q: "A20", name: "คุณแนน", ch: "ออนไลน์" as const, total: "฿240", amount: 240, st: "พร้อมรับ" },
      { id: 9, no: "TT-1039", q: "W07", name: "คุณโอ๊ต", ch: "หน้าร้าน" as const, total: "฿90", amount: 90, st: "รับแล้ว" },
      { id: 8, no: "TT-1038", q: "A19", name: "คุณปอ", ch: "ออนไลน์" as const, total: "฿310", amount: 310, st: "รับแล้ว" },
      { id: 7, no: "TT-1037", q: "A18", name: "คุณกานต์", ch: "ออนไลน์" as const, total: "฿150", amount: 150, st: "รับแล้ว" },
      { id: 6, no: "TT-1036", q: "W06", name: "คุณมุก", ch: "หน้าร้าน" as const, total: "฿70", amount: 70, st: "รับแล้ว" },
      { id: 5, no: "TT-1035", q: "A17", name: "คุณนพดล", ch: "ออนไลน์" as const, total: "฿260", amount: 260, st: "รับแล้ว" },
      { id: 4, no: "TT-1034", q: "W05", name: "คุณบอย", ch: "หน้าร้าน" as const, total: "฿135", amount: 135, st: "รับแล้ว" },
      { id: 3, no: "TT-1033", q: "A16", name: "คุณแพรวา", ch: "ออนไลน์" as const, total: "฿195", amount: 195, st: "รับแล้ว" },
      { id: 2, no: "TT-1032", q: "W04", name: "คุณเต้", ch: "หน้าร้าน" as const, total: "฿105", amount: 105, st: "รับแล้ว" },
      { id: 1, no: "TT-1031", q: "A15", name: "คุณวิภา", ch: "ออนไลน์" as const, total: "฿175", amount: 175, st: "รับแล้ว" },
    ],
  },
  ทั้งงาน: {
    kpis: [
      { label: "รายรับรวม", value: "฿346,150", sub: "ยอดรวม 14 วันจัดงาน", tone: "teal" as const },
      { label: "รายจ่ายรวม", value: "฿109,020", sub: "ค่าเช่า & วัตถุดิบ 31.5%", tone: "orange" as const },
      { label: "กำไรสุทธิ", value: "฿237,130", sub: "อัตรากำไรเฉลี่ย 68.5%", tone: "teal" as const },
      { label: "จำนวนออเดอร์", value: "5,840", sub: "เฉลี่ย 417 ออเดอร์ / วัน", tone: "plain" as const },
      { label: "จำนวนแก้ว", value: "9,780", sub: "เฉลี่ย 698 แก้ว / วัน", tone: "plain" as const },
      { label: "สลิปรอตรวจ", value: "3 รายการ", sub: "ตรวจแล้ว 99.9% ทั้งงาน", tone: "orange" as const },
    ],
    trend: [
      // สัปดาห์ที่ 1 (26 ม.ค. - 1 ก.พ.) เริ่มจากวันอาทิตย์
      { d: "อา. 26 ม.ค.", rev: 14500, exp: 4800 },
      { d: "จ. 27 ม.ค.", rev: 16200, exp: 5100 },
      { d: "อ. 28 ม.ค.", rev: 18900, exp: 5800 },
      { d: "พ. 29 ม.ค.", rev: 21300, exp: 6700 },
      { d: "พฤ. 30 ม.ค.", rev: 28400, exp: 8900 },
      { d: "ศ. 31 ม.ค.", rev: 33500, exp: 10200 },
      { d: "ส. 1 ก.พ.", rev: 36800, exp: 11400 },
      // สัปดาห์ที่ 2 (2 ก.พ. - 8 ก.พ.) เริ่มจากวันอาทิตย์
      { d: "อา. 2 ก.พ.", rev: 35600, exp: 11200 },
      { d: "จ. 3 ก.พ.", rev: 17800, exp: 5600 },
      { d: "อ. 4 ก.พ.", rev: 19400, exp: 6100 },
      { d: "พ. 5 ก.พ.", rev: 22600, exp: 7200 },
      { d: "พฤ. 6 ก.พ.", rev: 25100, exp: 7900 },
      { d: "ศ. 7 ก.พ.", rev: 31200, exp: 9800 },
      { d: "ส. 8 ก.พ.", rev: 38400, exp: 11900 },
    ],
    maxBar: 40000,
    channels: {
      total: "฿346,150",
      online: { pct: 62, amount: "฿214,613", dashArray: "54.54 33.42", dashOffset: "0" },
      walkin: { pct: 38, amount: "฿131,537", dashArray: "33.42 54.54", dashOffset: "-54.54" },
    },
    topProducts: [
      { name: "น้ำเต้าหู้ดั้งเดิม (หวานน้อย)", cups: 2680, amount: "฿93,800", pct: 100 },
      { name: "น้ำเต้าหู้มัทฉะเกียวโต", cups: 2190, amount: "฿109,500", pct: 82 },
      { name: "น้ำเต้าหู้ชาไทยพรีเมียม", cups: 1740, amount: "฿78,300", pct: 65 },
      { name: "น้ำเต้าหู้ช็อกโกแลตเข้มข้น", cups: 1320, amount: "฿59,400", pct: 49 },
      { name: "น้ำเต้าหู้นมเย็นชมพู", cups: 980, amount: "฿39,200", pct: 37 },
    ],
    peakHours: [
      { time: "16:00 - 18:00 (ช่วงเย็น)", cups: 2840, revenue: "฿102,400", orders: 1690, pct: 100, isPeak: true },
      { time: "18:00 - 20:00 (ช่วงค่ำ)", cups: 2350, revenue: "฿84,600", orders: 1410, pct: 83, isPeak: false },
      { time: "12:00 - 14:00 (ช่วงเที่ยง)", cups: 2180, revenue: "฿78,500", orders: 1305, pct: 77, isPeak: false },
      { time: "14:00 - 16:00 (ช่วงบ่าย)", cups: 1250, revenue: "฿45,000", orders: 750, pct: 44, isPeak: false },
      { time: "10:00 - 12:00 (ช่วงสาย)", cups: 780, revenue: "฿23,400", orders: 460, pct: 27, isPeak: false },
      { time: "20:00 - 22:00 (ก่อนปิดงาน)", cups: 380, revenue: "฿12,250", orders: 225, pct: 13, isPeak: false },
    ],
    orders: [
      { id: 112, no: "TT-1042", q: "A21", name: "คุณฟ้า (เกษตรศาสตร์)", ch: "ออนไลน์" as const, total: "฿185", amount: 185, st: "รอตรวจสลิป" },
      { id: 111, no: "TT-0988", q: "A15", name: "คุณกวิน (สั่งล่วงหน้า)", ch: "ออนไลน์" as const, total: "฿450", amount: 450, st: "รับแล้ว" },
      { id: 110, no: "TT-0912", q: "W88", name: "คุณมินท์", ch: "หน้าร้าน" as const, total: "฿320", amount: 320, st: "รับแล้ว" },
      { id: 109, no: "TT-0870", q: "A04", name: "คุณเอกพงษ์ (คณะเกษตร)", ch: "ออนไลน์" as const, total: "฿560", amount: 560, st: "รับแล้ว" },
      { id: 108, no: "TT-0812", q: "W75", name: "คุณแพทริค", ch: "หน้าร้าน" as const, total: "฿140", amount: 140, st: "รับแล้ว" },
      { id: 107, no: "TT-0765", q: "A92", name: "คุณจารุณี", ch: "ออนไลน์" as const, total: "฿280", amount: 280, st: "รับแล้ว" },
      { id: 106, no: "TT-0654", q: "W50", name: "คุณต้นตระการ", ch: "หน้าร้าน" as const, total: "฿210", amount: 210, st: "รับแล้ว" },
      { id: 105, no: "TT-0543", q: "A71", name: "คุณบิวตี้", ch: "ออนไลน์" as const, total: "฿380", amount: 380, st: "รับแล้ว" },
      { id: 104, no: "TT-0432", q: "W33", name: "คุณพลอยไพลิน", ch: "หน้าร้าน" as const, total: "฿175", amount: 175, st: "รับแล้ว" },
      { id: 103, no: "TT-0321", q: "A44", name: "คุณอาร์มินทร์", ch: "ออนไลน์" as const, total: "฿490", amount: 490, st: "รับแล้ว" },
      { id: 102, no: "TT-0210", q: "W19", name: "คุณธนกร", ch: "หน้าร้าน" as const, total: "฿150", amount: 150, st: "รับแล้ว" },
      { id: 101, no: "TT-0105", q: "A02", name: "คุณศศิธร", ch: "ออนไลน์" as const, total: "฿350", amount: 350, st: "รับแล้ว" },
    ],
  },
};

export default function AdminDashboardPage() {
  const [range, setRange] = useState<(typeof ranges)[number]>("วันนี้");
  const [chartType, setChartType] = useState<"bar" | "line">("bar");
  const [trendWeek, setTrendWeek] = useState<number>(2); // 1 = Week 1, 2 = Week 2 (Current)
  const [hourlyDayIndex, setHourlyDayIndex] = useState<number>(13); // Index 0-13 for daily hourly sales pagination

  // Scroll trigger refs for graph animations
  const trendView = useInView(0.15);
  const channelView = useInView(0.15);
  const hourlyView = useInView(0.15);
  const topProductsView = useInView(0.15);

  // Dynamic Data based on Range
  const currentData = DATA_BY_RANGE[range];
  const { kpis, trend, maxBar, channels, topProducts, peakHours, orders } = currentData;

  // 7 Days per week page (starting from Sunday)
  const currentWeekTrend = trend.slice((trendWeek - 1) * 7, trendWeek * 7);

  // Selected Day's Hourly Cup Sales Data
  const currentHourlyData = DAILY_HOURLY_SALES[hourlyDayIndex] || DAILY_HOURLY_SALES[DAILY_HOURLY_SALES.length - 1];

  // Reset page when range changes
  const handleRangeChange = (newRange: (typeof ranges)[number]) => {
    setRange(newRange);
  };


  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--cream)",
        color: "var(--ink)",
        fontFamily: "'Kanit', sans-serif",
        display: "flex",
        flexDirection: "row",
        width: "100%",
      }}
    >
      {/* Admin Sidebar Component */}
      <AdminSidebar />

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: "1.75rem 2.5rem", overflowY: "auto", minWidth: 0 }}>
        {/* Header & Date Range Filter */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, lineHeight: 1.2 }}>
              แดชบอร์ดสรุปยอดขาย
            </h1>
          </div>

          {/* Range Toggle */}
          <div
            style={{
              display: "flex",
              borderRadius: "9999px",
              backgroundColor: "var(--card)",
              padding: "0.25rem",
              border: "1px solid rgba(50, 55, 65, 0.12)",
            }}
          >
            {ranges.map((r) => {
              const isSelected = range === r;
              return (
                <button
                  key={r}
                  onClick={() => handleRangeChange(r)}
                  style={{
                    borderRadius: "9999px",
                    padding: "0.4rem 1rem",
                    fontSize: "0.85rem",
                    fontWeight: isSelected ? 700 : 500,
                    border: "none",
                    cursor: "pointer",
                    backgroundColor: isSelected ? "var(--ink)" : "transparent",
                    color: isSelected ? "var(--cream)" : "var(--ink-soft)",
                    transition: "all 0.2s ease",
                  }}
                >
                  {r}
                </button>
              );
            })}
          </div>
        </div>

        {/* KPI Cards Grid (2 rows x 3 columns default, 1 row x 6 columns on extra wide screens) */}
        <section
          className="admin-kpi-grid"
          style={{
            marginTop: "1.5rem",
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "0.85rem",
          }}
        >
          {kpis.map((k, i) => {
            const isTeal = k.tone === "teal";
            const isWarm = k.tone === "orange";

            return (
              <div
                key={k.label}
                className="admin-kpi-card animate-rise"
                style={{
                  animationDelay: `${i * 45}ms`,
                  borderRadius: "1.25rem",
                  backgroundColor: "var(--card)",
                  padding: "1.25rem 1.35rem",
                  border: "1px solid rgba(50, 55, 65, 0.09)",
                  boxShadow: "0 2px 12px -2px rgba(0,0,0,0.03)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxSizing: "border-box",
                }}
              >
                <div>
                  <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)", fontWeight: 500 }}>
                    {k.label}
                  </p>
                </div>

                <div style={{ marginTop: "0.5rem", marginBottom: "0.35rem" }}>
                  <p
                    style={{
                      fontSize: "1.85rem",
                      fontWeight: 800,
                      fontFamily: "'Kanit', sans-serif",
                      color: isTeal ? "var(--teal)" : isWarm ? "var(--warm)" : "var(--ink)",
                      letterSpacing: "-0.01em",
                      lineHeight: 1.15,
                    }}
                  >
                    {k.value}
                  </p>
                </div>

                <div>
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--ink-soft)",
                      fontWeight: 400,
                      lineHeight: 1.3,
                    }}
                  >
                    {k.sub}
                  </p>
                </div>
              </div>
            );
          })}
        </section>


        {/* Middle Row: Trend Chart + Channels / Queue */}
        <div
          className="admin-dashboard-middle-grid"
          style={{
            marginTop: "1.25rem",
          }}
        >
          {/* Revenue / Expense Trend Chart (Bar & Line Toggle) */}
          <section
            ref={trendView.ref}
            className="admin-dashboard-trend-col"
            style={{
              borderRadius: "1.25rem",
              backgroundColor: "var(--card)",
              padding: "1.25rem",
              border: "1px solid rgba(50, 55, 65, 0.1)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.75rem" }}>
                <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>แนวโน้มรายรับ / รายจ่าย</h2>

                {/* Chart Type Toggle (Bar / Line) */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    height: "32px",
                    borderRadius: "0.5rem",
                    backgroundColor: "var(--cream)",
                    padding: "2px",
                    border: "1px solid rgba(50, 55, 65, 0.1)",
                    fontFamily: "'Kanit', sans-serif",
                    boxSizing: "border-box",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setChartType("bar")}
                    title="กราฟแท่ง (Bar Chart)"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      height: "100%",
                      gap: "0.25rem",
                      padding: "0 0.65rem",
                      borderRadius: "0.35rem",
                      fontSize: "0.8rem",
                      fontWeight: chartType === "bar" ? 600 : 400,
                      fontFamily: "'Kanit', sans-serif",
                      border: "none",
                      cursor: "pointer",
                      backgroundColor: chartType === "bar" ? "var(--card)" : "transparent",
                      color: chartType === "bar" ? "var(--teal)" : "var(--ink-soft)",
                      boxShadow: chartType === "bar" ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
                      transition: "all 0.15s ease",
                      boxSizing: "border-box",
                    }}
                  >
                    <BarChart2 size={15} />
                    <span>แท่ง</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartType("line")}
                    title="กราฟเส้น (Line Chart)"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      height: "100%",
                      gap: "0.25rem",
                      padding: "0 0.65rem",
                      borderRadius: "0.35rem",
                      fontSize: "0.8rem",
                      fontWeight: chartType === "line" ? 600 : 400,
                      fontFamily: "'Kanit', sans-serif",
                      border: "none",
                      cursor: "pointer",
                      backgroundColor: chartType === "line" ? "var(--card)" : "transparent",
                      color: chartType === "line" ? "var(--teal)" : "var(--ink-soft)",
                      boxShadow: chartType === "line" ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
                      transition: "all 0.15s ease",
                      boxSizing: "border-box",
                    }}
                  >
                    <LineChartIcon size={15} />
                    <span>เส้น</span>
                  </button>
                </div>

                {/* Week Pagination (2 Weeks - Starting Sunday) */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    height: "32px",
                    gap: "0.25rem",
                    backgroundColor: "var(--cream)",
                    padding: "2px 6px",
                    borderRadius: "0.5rem",
                    border: "1px solid rgba(50, 55, 65, 0.1)",
                    fontSize: "0.8rem",
                    fontFamily: "'Kanit', sans-serif",
                    boxSizing: "border-box",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setTrendWeek(1)}
                    disabled={trendWeek === 1}
                    style={{
                      border: "none",
                      background: "transparent",
                      cursor: trendWeek === 1 ? "not-allowed" : "pointer",
                      opacity: trendWeek === 1 ? 0.35 : 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "0 2px",
                      height: "100%",
                      color: "var(--ink)",
                    }}
                    title="สัปดาห์ก่อนหน้า"
                  >
                    <ChevronLeft size={15} />
                  </button>
                  <span style={{ fontWeight: 600, color: "var(--ink)", whiteSpace: "nowrap", padding: "0 0.2rem" }}>
                    สัปดาห์ที่ {trendWeek}/2 {trendWeek === 1 ? "(26 ม.ค. - 1 ก.พ.)" : "(2 - 8 ก.พ.)"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setTrendWeek(2)}
                    disabled={trendWeek === 2}
                    style={{
                      border: "none",
                      background: "transparent",
                      cursor: trendWeek === 2 ? "not-allowed" : "pointer",
                      opacity: trendWeek === 2 ? 0.35 : 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "0 2px",
                      height: "100%",
                      color: "var(--ink)",
                    }}
                    title="สัปดาห์ถัดไป"
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>

              </div>

              <div style={{ display: "flex", gap: "1rem", fontSize: "0.75rem", color: "var(--ink-soft)" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <span style={{ width: "0.6rem", height: "0.6rem", borderRadius: "9999px", backgroundColor: "var(--teal)" }} />
                  รายรับ
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <span style={{ width: "0.6rem", height: "0.6rem", borderRadius: "9999px", backgroundColor: "var(--warm)" }} />
                  รายจ่าย
                </span>
              </div>
            </div>

            {/* Chart Visualizations (Scrollable only for graph visual on mobile) */}
            <ScrollableChartWrapper>
              <div
                key={`trend-chart-${range}-${chartType}-${trendWeek}`}
                className={trendView.isInView ? "animate-wipe-left" : ""}
                style={{ minWidth: "500px" }}
              >
                {chartType === "bar" ? (
                  /* Bar visualization with scroll-triggered left-to-right animation */
                  <div style={{ display: "flex", height: "220px", alignItems: "flex-end", gap: "0.75rem" }}>
                    {currentWeekTrend.map((t, idx) => (
                      <div key={t.d} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", gap: "0.5rem", height: "100%" }}>
                        <div style={{ display: "flex", width: "100%", height: "100%", alignItems: "flex-end", justifyContent: "center", gap: "0.35rem", borderBottom: "1px solid rgba(50, 55, 65, 0.08)", paddingBottom: "2px" }}>
                          <div
                            title={`รายรับ: ฿${t.rev.toLocaleString()}`}
                            className={trendView.isInView ? "animate-bar-grow" : ""}
                            style={{
                              width: "36%",
                              borderRadius: "4px 4px 0 0",
                              backgroundColor: "var(--teal)",
                              height: `${(t.rev / maxBar) * 100}%`,
                              animationDelay: `${idx * 90}ms`,
                              transition: "height 0.5s ease",
                            }}
                          />
                          <div
                            title={`รายจ่าย: ฿${t.exp.toLocaleString()}`}
                            className={trendView.isInView ? "animate-bar-grow" : ""}
                            style={{
                              width: "36%",
                              borderRadius: "4px 4px 0 0",
                              backgroundColor: "var(--warm)",
                              height: `${(t.exp / maxBar) * 100}%`,
                              animationDelay: `${idx * 90 + 45}ms`,
                              transition: "height 0.5s ease",
                            }}
                          />
                        </div>
                        <span style={{ fontSize: "0.75rem", color: "var(--ink-soft)", fontWeight: 500, whiteSpace: "nowrap" }}>{t.d}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Line visualization with scroll-triggered SVG drawing animation */
                  (() => {
                    const revPts = currentWeekTrend.map((t, idx) => ({
                      x: (idx / (currentWeekTrend.length - 1)) * 600,
                      y: 150 - (t.rev / maxBar) * 130,
                    }));
                    const revCum = [0];
                    for (let i = 1; i < revPts.length; i++) {
                      const dx = revPts[i].x - revPts[i - 1].x;
                      const dy = revPts[i].y - revPts[i - 1].y;
                      revCum.push(revCum[i - 1] + Math.sqrt(dx * dx + dy * dy));
                    }
                    const revTotal = revCum[revCum.length - 1] || 600;

                    const expPts = currentWeekTrend.map((t, idx) => ({
                      x: (idx / (currentWeekTrend.length - 1)) * 600,
                      y: 150 - (t.exp / maxBar) * 130,
                    }));
                    const expCum = [0];
                    for (let i = 1; i < expPts.length; i++) {
                      const dx = expPts[i].x - expPts[i - 1].x;
                      const dy = expPts[i].y - expPts[i - 1].y;
                      expCum.push(expCum[i - 1] + Math.sqrt(dx * dx + dy * dy));
                    }
                    const expTotal = expCum[expCum.length - 1] || 600;

                    const lineDurationMs = 550;
                    const expDelayMs = 45;

                    const revKeyframes = revPts
                      .map((pt, i) => {
                        const pct = ((revCum[i] / revTotal) * 100).toFixed(2);
                        return `${pct}% { width: ${pt.x.toFixed(1)}px; }`;
                      })
                      .join(" ");

                    const expKeyframes = expPts
                      .map((pt, i) => {
                        const pct = ((expCum[i] / expTotal) * 100).toFixed(2);
                        return `${pct}% { width: ${pt.x.toFixed(1)}px; }`;
                      })
                      .join(" ");

                    const animSec = (lineDurationMs / 1000).toFixed(2);

                    return (
                      <div style={{ display: "flex", flexDirection: "column", height: "220px", justifyContent: "flex-end" }}>
                        <div style={{ position: "relative", width: "100%", height: "175px" }}>
                          <svg viewBox="0 0 600 160" preserveAspectRatio="none" style={{ width: "100%", height: "100%", overflow: "visible" }}>
                            <defs>
                              <style>{`
                                @keyframes drawRevLine {
                                  0% { stroke-dashoffset: ${revTotal.toFixed(2)}px; opacity: 1; }
                                  100% { stroke-dashoffset: 0px; opacity: 1; }
                                }
                                @keyframes drawExpLine {
                                  0% { stroke-dashoffset: ${expTotal.toFixed(2)}px; opacity: 1; }
                                  100% { stroke-dashoffset: 0px; opacity: 1; }
                                }
                                @keyframes revClipWipe { ${revKeyframes} }
                                @keyframes expClipWipe { ${expKeyframes} }

                                .animate-rev-line {
                                  stroke-dasharray: ${revTotal.toFixed(2)}px;
                                  stroke-dashoffset: ${revTotal.toFixed(2)}px;
                                  animation: drawRevLine ${animSec}s linear forwards;
                                }
                                .animate-exp-line {
                                  stroke-dasharray: ${expTotal.toFixed(2)}px;
                                  stroke-dashoffset: ${expTotal.toFixed(2)}px;
                                  animation: drawExpLine ${animSec}s linear forwards;
                                  animation-delay: ${expDelayMs}ms;
                                }
                                .animate-rev-area-wipe {
                                  animation: revClipWipe ${animSec}s linear forwards;
                                }
                                .animate-exp-area-wipe {
                                  animation: expClipWipe ${animSec}s linear forwards;
                                  animation-delay: ${expDelayMs}ms;
                                }
                              `}</style>
                              <linearGradient id="tealGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="var(--teal)" stopOpacity="0.25" />
                                <stop offset="100%" stopColor="var(--teal)" stopOpacity="0.0" />
                              </linearGradient>
                              <linearGradient id="warmGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="var(--warm)" stopOpacity="0.2" />
                                <stop offset="100%" stopColor="var(--warm)" stopOpacity="0.0" />
                              </linearGradient>
                              <clipPath id="revAreaClip">
                                <rect className={trendView.isInView ? "animate-rev-area-wipe" : ""} x="0" y="0" width="0" height="160" />
                              </clipPath>
                              <clipPath id="expAreaClip">
                                <rect className={trendView.isInView ? "animate-exp-area-wipe" : ""} x="0" y="0" width="0" height="160" />
                              </clipPath>
                            </defs>

                            {/* Revenue Area */}
                            <polygon
                              clipPath="url(#revAreaClip)"
                              fill="url(#tealGrad)"
                              points={`0,160 ${revPts.map((p) => `${p.x},${p.y}`).join(" ")} 600,160`}
                            />

                            {/* Expense Area */}
                            <polygon
                              clipPath="url(#expAreaClip)"
                              fill="url(#warmGrad)"
                              points={`0,160 ${expPts.map((p) => `${p.x},${p.y}`).join(" ")} 600,160`}
                            />

                            {/* Revenue Polyline */}
                            <polyline
                              className={trendView.isInView ? "animate-rev-line" : ""}
                              fill="none"
                              stroke="var(--teal)"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              points={revPts.map((p) => `${p.x},${p.y}`).join(" ")}
                            />
                            {/* Expense Line */}
                            <polyline
                              className={trendView.isInView ? "animate-exp-line" : ""}
                              fill="none"
                              stroke="var(--warm)"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              points={expPts.map((p) => `${p.x},${p.y}`).join(" ")}
                            />

                            {/* Revenue Dots (Pops up at exact millisecond line tip touches point) */}
                            {currentWeekTrend.map((t, idx) => {
                              const pt = revPts[idx];
                              const delayMs = Math.round((revCum[idx] / revTotal) * lineDurationMs);
                              return (
                                <circle
                                  key={`rev-${t.d}`}
                                  className={trendView.isInView ? "animate-pop-dot" : ""}
                                  style={{
                                    animationDelay: `${delayMs}ms`,
                                    opacity: trendView.isInView ? undefined : 0,
                                  }}
                                  cx={pt.x}
                                  cy={pt.y}
                                  r="4.5"
                                  fill="var(--card)"
                                  stroke="var(--teal)"
                                  strokeWidth="2.5"
                                />
                              );
                            })}

                            {/* Expense Dots (Pops up at exact millisecond line tip touches point) */}
                            {currentWeekTrend.map((t, idx) => {
                              const pt = expPts[idx];
                              const delayMs = expDelayMs + Math.round((expCum[idx] / expTotal) * lineDurationMs);
                              return (
                                <circle
                                  key={`exp-${t.d}`}
                                  className={trendView.isInView ? "animate-pop-dot" : ""}
                                  style={{
                                    animationDelay: `${delayMs}ms`,
                                    opacity: trendView.isInView ? undefined : 0,
                                  }}
                                  cx={pt.x}
                                  cy={pt.y}
                                  r="4.5"
                                  fill="var(--card)"
                                  stroke="var(--warm)"
                                  strokeWidth="2.5"
                                />
                              );
                            })}
                          </svg>
                        </div>

                        {/* Day Labels along bottom */}
                        <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid rgba(50, 55, 65, 0.08)", paddingTop: "0.5rem", marginTop: "0.25rem" }}>
                          {currentWeekTrend.map((t) => (
                            <span key={t.d} style={{ fontSize: "0.75rem", color: "var(--ink-soft)", fontWeight: 500, textAlign: "center", width: "45px" }}>
                              {t.d}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>
            </ScrollableChartWrapper>
          </section>



          {/* Right Column: Channels Section (Flanked Text Left/Right on Desktop, Centered Donut + 2 Cols Stats on Mobile) */}
          <div className="admin-dashboard-channel-col" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            {/* Channel Split Section */}
            <section
              ref={channelView.ref}
              style={{
                height: "100%",
                borderRadius: "1.25rem",
                backgroundColor: "var(--card)",
                padding: "1.25rem 1.25rem",
                border: "1px solid rgba(50, 55, 65, 0.1)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>ช่องทางการขาย</h2>
              </div>

              {/* Channels Layout: Pie Chart Top Centered, 2 Columns Stats Below */}
              <div
                className="admin-channel-body-wrapper"
                style={{
                  margin: "auto 0",
                  width: "100%",
                  padding: "0.25rem 0",
                }}
              >
                {/* Left: ออนไลน์ */}
                <div className="admin-channel-stat-item admin-channel-left" style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                  <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--teal)" }}>
                    ออนไลน์
                  </div>
                  <span style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--teal)", fontFamily: "'Kanit', sans-serif", marginTop: "0.15rem", lineHeight: 1.1 }}>
                    {channels.online.pct}%
                  </span>
                  <span style={{ fontSize: "0.95rem", color: "var(--ink)", fontWeight: 600, fontFamily: "'Kanit', sans-serif", marginTop: "0.3rem" }}>
                    {channels.online.amount}
                  </span>
                </div>

                {/* Center: Maximized Extra Large Thick Pie / Donut Chart */}
                <div className="admin-channel-donut" style={{ position: "relative", width: "210px", height: "210px", flexShrink: 0 }}>
                  <svg
                    className={channelView.isInView ? "animate-donut-fill" : ""}
                    viewBox="-2 -2 40 40"
                    style={{
                      width: "100%",
                      height: "100%",
                      overflow: "visible",
                    }}
                  >
                    {/* Base Track */}
                    <circle
                      cx="18"
                      cy="18"
                      r="14"
                      fill="transparent"
                      stroke="rgba(50, 55, 65, 0.08)"
                      strokeWidth="8"
                    />
                    {/* Online Slice: (Teal - Aligned directly facing Left) */}
                    <circle
                      cx="18"
                      cy="18"
                      r="14"
                      fill="transparent"
                      stroke="var(--teal)"
                      strokeWidth="8"
                      strokeDasharray={channels.online.dashArray}
                      strokeDashoffset={channels.online.dashOffset}
                      style={{ transition: "stroke-dasharray 0.5s ease, stroke-dashoffset 0.5s ease" }}
                    />
                    {/* Walk-in Slice: (Warm - Aligned directly facing Right) */}
                    <circle
                      cx="18"
                      cy="18"
                      r="14"
                      fill="transparent"
                      stroke="var(--warm)"
                      strokeWidth="8"
                      strokeDasharray={channels.walkin.dashArray}
                      strokeDashoffset={channels.walkin.dashOffset}
                      style={{ transition: "stroke-dasharray 0.5s ease, stroke-dashoffset 0.5s ease" }}
                    />
                  </svg>
                </div>

                {/* Right: หน้าร้าน */}
                <div className="admin-channel-stat-item admin-channel-right" style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                  <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--warm)" }}>
                    หน้าร้าน
                  </div>
                  <span style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--warm)", fontFamily: "'Kanit', sans-serif", marginTop: "0.15rem", lineHeight: 1.1 }}>
                    {channels.walkin.pct}%
                  </span>
                  <span style={{ fontSize: "0.95rem", color: "var(--ink)", fontWeight: 600, fontFamily: "'Kanit', sans-serif", marginTop: "0.3rem" }}>
                    {channels.walkin.amount}
                  </span>
                </div>
              </div>

            </section>
          </div>
        </div>





        {/* Bottom Row: Recent Orders & Top Selling Menu */}
        <div
          className="admin-dashboard-bottom-grid"
          style={{
            marginTop: "1.25rem",
          }}
        >
          {/* Hourly Cup Sales Chart Section (กราฟแก้วที่ขายได้ตามเวลา + ปุ่มกดดูแต่ละวัน ซ้าย/ขวา) */}
          <section
            ref={hourlyView.ref}
            style={{
              borderRadius: "1.25rem",
              backgroundColor: "var(--card)",
              padding: "1.25rem",
              border: "1px solid rgba(50, 55, 65, 0.1)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              {/* Header with Title and Day Navigation */}
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "0.5rem", marginBottom: "1.1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "0.5rem",
                      backgroundColor: "rgba(38, 166, 154, 0.12)",
                      color: "var(--teal)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Clock size={16} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: "1rem", fontWeight: 700, lineHeight: 1.2 }}>ยอดขายแก้วตามเวลา</h2>
                    <span style={{ fontSize: "0.75rem", color: "var(--ink-soft)" }}>
                      จำแนกจำนวนแก้วในแต่ละชั่วโมง (ออนไลน์ vs หน้าร้าน)
                    </span>
                  </div>
                </div>

                {/* Day Pagination & Info Badges */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  {/* Day Selector Control */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem",
                      backgroundColor: "var(--cream)",
                      padding: "0.2rem 0.35rem",
                      borderRadius: "0.65rem",
                      border: "1px solid rgba(50, 55, 65, 0.1)",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setHourlyDayIndex((prev) => Math.max(0, prev - 1))}
                      disabled={hourlyDayIndex === 0}
                      title="วันก่อนหน้า"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "26px",
                        height: "26px",
                        borderRadius: "0.4rem",
                        border: "none",
                        backgroundColor: hourlyDayIndex === 0 ? "transparent" : "var(--card)",
                        color: hourlyDayIndex === 0 ? "rgba(50, 55, 65, 0.25)" : "var(--ink)",
                        cursor: hourlyDayIndex === 0 ? "not-allowed" : "pointer",
                        boxShadow: hourlyDayIndex === 0 ? "none" : "0 1px 3px rgba(0,0,0,0.06)",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <ChevronLeft size={15} />
                    </button>

                    <span
                      style={{
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        padding: "0 0.5rem",
                        color: "var(--ink)",
                        minWidth: "75px",
                        textAlign: "center",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {currentHourlyData.shortLabel}
                    </span>

                    <button
                      type="button"
                      onClick={() => setHourlyDayIndex((prev) => Math.min(DAILY_HOURLY_SALES.length - 1, prev + 1))}
                      disabled={hourlyDayIndex === DAILY_HOURLY_SALES.length - 1}
                      title="วันถัดไป"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "26px",
                        height: "26px",
                        borderRadius: "0.4rem",
                        border: "none",
                        backgroundColor: hourlyDayIndex === DAILY_HOURLY_SALES.length - 1 ? "transparent" : "var(--card)",
                        color: hourlyDayIndex === DAILY_HOURLY_SALES.length - 1 ? "rgba(50, 55, 65, 0.25)" : "var(--ink)",
                        cursor: hourlyDayIndex === DAILY_HOURLY_SALES.length - 1 ? "not-allowed" : "pointer",
                        boxShadow: hourlyDayIndex === DAILY_HOURLY_SALES.length - 1 ? "none" : "0 1px 3px rgba(0,0,0,0.06)",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <ChevronRight size={15} />
                    </button>
                  </div>

                  {/* Peak badge */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem",
                      backgroundColor: "rgba(235, 148, 93, 0.12)",
                      color: "var(--warm)",
                      padding: "0.25rem 0.55rem",
                      borderRadius: "9999px",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}
                  >
                    <Flame size={12} />
                    <span>พีค {currentHourlyData.peakSlot}</span>
                  </div>
                </div>
              </div>

              {/* Sub-header: Day details & Total Summary */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "space-between",
                  alignItems: "center",
                  backgroundColor: "rgba(50, 55, 65, 0.03)",
                  padding: "0.55rem 0.85rem",
                  borderRadius: "0.75rem",
                  marginBottom: "1rem",
                  fontSize: "0.8rem",
                  gap: "0.5rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontWeight: 600, color: "var(--ink)" }}>{currentHourlyData.dateLabel}</span>
                  <span style={{ color: "var(--ink-soft)" }}>|</span>
                  <span style={{ color: "var(--teal)", fontWeight: 700 }}>รวม {currentHourlyData.totalCups.toLocaleString()} แก้ว</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.75rem" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--teal)" }} />
                    <span style={{ color: "var(--ink-soft)" }}>ออนไลน์</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.75rem" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--warm)" }} />
                    <span style={{ color: "var(--ink-soft)" }}>หน้าร้าน</span>
                  </div>
                </div>
              </div>

              {/* Hourly Cups Bar Chart with scroll-triggered animation & permanent custom sliderbar */}
              <ScrollableChartWrapper>
                <div
                  key={`hourly-chart-${range}-${hourlyDayIndex}`}
                  className={hourlyView.isInView ? "animate-wipe-left" : ""}
                  style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${currentHourlyData.slots.length}, 1fr)`,
                    alignItems: "flex-end",
                    gap: "0.4rem",
                    height: "175px",
                    paddingTop: "1.25rem",
                    paddingBottom: "0.35rem",
                    width: "100%",
                    minWidth: "620px",
                  }}
                >
                  {currentHourlyData.slots.map((slot, slotIdx) => {
                    const pct = Math.min(100, Math.max(14, (slot.cups / currentHourlyData.maxCups) * 100));
                    const isPeak = slot.cups === Math.max(...currentHourlyData.slots.map((s) => s.cups));
                    const onlinePct = slot.cups > 0 ? (slot.online / slot.cups) * 100 : 50;
                    const walkinPct = 100 - onlinePct;

                    return (
                      <div
                        key={slot.time}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          height: "100%",
                          justifyContent: "flex-end",
                          backgroundColor: isPeak ? "rgba(235, 148, 93, 0.09)" : "transparent",
                          borderRadius: "0.85rem",
                          padding: "0.35rem 0.15rem",
                          border: isPeak ? "1px solid rgba(235, 148, 93, 0.3)" : "1px solid transparent",
                          position: "relative",
                          transition: "all 0.2s ease",
                        }}
                      >
                        {/* Cup Count Top Label & Peak Badge */}
                        <div
                          style={{
                            fontSize: isPeak ? "0.85rem" : "0.78rem",
                            fontWeight: isPeak ? 800 : 700,
                            color: isPeak ? "var(--warm)" : "var(--ink)",
                            marginBottom: "0.35rem",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "0.15rem",
                          }}
                        >
                          {isPeak && (
                            <div
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.2rem",
                                backgroundColor: "var(--warm)",
                                color: "#ffffff",
                                padding: "0.12rem 0.45rem",
                                borderRadius: "9999px",
                                fontSize: "0.65rem",
                                fontWeight: 700,
                                boxShadow: "0 2px 8px rgba(235, 148, 93, 0.4)",
                                marginBottom: "0.1rem",
                                whiteSpace: "nowrap",
                                lineHeight: 1,
                              }}
                            >
                              <Flame size={10} fill="#ffffff" />
                              <span>พีคสุด</span>
                            </div>
                          )}
                          <span>{slot.cups}</span>
                        </div>

                        {/* Stacked / Segmented Cup Volume Bar */}
                        <div
                          className={hourlyView.isInView ? "animate-bar-grow" : ""}
                          style={{
                            width: "100%",
                            maxWidth: isPeak ? "44px" : "40px",
                            height: `${pct}%`,
                            borderRadius: "0.5rem 0.5rem 0.25rem 0.25rem",
                            overflow: "hidden",
                            display: "flex",
                            flexDirection: "column-reverse",
                            boxShadow: isPeak ? "0 6px 20px rgba(235, 148, 93, 0.35)" : "0 2px 6px rgba(0,0,0,0.04)",
                            border: isPeak ? "2px solid var(--warm)" : "1px solid rgba(50, 55, 65, 0.08)",
                            animationDelay: `${slotIdx * 90}ms`,
                            transition: "height 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.2s ease",
                            backgroundColor: "rgba(50, 55, 65, 0.06)",
                            transform: isPeak ? "scale(1.03)" : "none",
                          }}
                          title={`${slot.time} น. : ${slot.cups} แก้ว (ออนไลน์ ${slot.online} แก้ว, หน้าร้าน ${slot.walkin} แก้ว) - ฿${slot.revenue.toLocaleString()}`}
                        >
                          {/* Online portion (Teal) */}
                          <div
                            style={{
                              height: `${onlinePct}%`,
                              backgroundColor: "var(--teal)",
                              width: "100%",
                              transition: "height 0.3s ease",
                            }}
                          />
                          {/* Walk-in portion (Warm) */}
                          <div
                            style={{
                              height: `${walkinPct}%`,
                              backgroundColor: "var(--warm)",
                              width: "100%",
                              transition: "height 0.3s ease",
                            }}
                          />
                        </div>

                        {/* Time Label Bottom */}
                        <div
                          style={{
                            marginTop: "0.45rem",
                            fontSize: "0.75rem",
                            color: isPeak ? "var(--warm)" : "var(--ink-soft)",
                            fontWeight: isPeak ? 800 : 500,
                            textAlign: "center",
                          }}
                        >
                          {slot.time}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollableChartWrapper>
            </div>

            {/* Bottom Insight Footer */}
            <div
              style={{
                marginTop: "0.85rem",
                paddingTop: "0.65rem",
                borderTop: "1px solid rgba(50, 55, 65, 0.08)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "0.75rem",
                color: "var(--ink-soft)",
              }}
            >
              <span>
                ยอดขายวัน{currentHourlyData.shortLabel}: รวม <strong>{currentHourlyData.totalCups} แก้ว</strong> ({currentHourlyData.totalRev})
              </span>
              <span style={{ fontWeight: 600, color: "var(--teal)" }}>
                ช่วงเวลาขายดีสุด: {currentHourlyData.peakSlot}
              </span>
            </div>
          </section>

          {/* Top Products */}
          <section
            ref={topProductsView.ref}
            style={{
              borderRadius: "1.25rem",
              backgroundColor: "var(--card)",
              padding: "1.25rem",
              border: "1px solid rgba(50, 55, 65, 0.1)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>เมนูขายดี</h2>
              <Link
                href="/admin/management/menu"
                style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--teal)", textDecoration: "none" }}
              >
                ดูทั้งหมด →
              </Link>
            </div>
            <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.85rem" }}>

              {topProducts.map((p, i) => (
                <div key={p.name}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.825rem" }}>
                    <span style={{ fontWeight: 600 }}>
                      <span className="font-mono" style={{ marginRight: "0.35rem", color: "var(--ink-soft)", fontSize: "0.75rem" }}>
                        {i + 1}.
                      </span>
                      {p.name}
                    </span>
                    <span style={{ color: "var(--ink-soft)" }}>{p.cups} แก้ว</span>
                  </div>
                  <div style={{ marginTop: "0.35rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <div style={{ flex: 1, height: "0.45rem", borderRadius: "9999px", backgroundColor: "rgba(50, 55, 65, 0.08)", overflow: "hidden" }}>
                      <div
                        className={topProductsView.isInView ? "animate-bar-grow-right" : ""}
                        style={{
                          height: "100%",
                          borderRadius: "9999px",
                          backgroundColor: "var(--teal)",
                          width: `${p.pct}%`,
                          animationDelay: `${i * 100}ms`,
                          transition: "width 0.5s ease",
                        }}
                      />
                    </div>
                    <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--ink)" }}>{p.amount}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

