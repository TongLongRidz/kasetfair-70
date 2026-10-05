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

const DEFAULT_HOURLY_DATA: DayHourlyData = {
  dateLabel: "วันนี้",
  shortLabel: "วันนี้",
  totalCups: 0,
  totalRev: "฿0",
  peakSlot: "-",
  maxCups: 10,
  slots: [
    { time: "10:00", cups: 0, online: 0, walkin: 0, revenue: 0 },
    { time: "11:00", cups: 0, online: 0, walkin: 0, revenue: 0 },
    { time: "12:00", cups: 0, online: 0, walkin: 0, revenue: 0 },
    { time: "13:00", cups: 0, online: 0, walkin: 0, revenue: 0 },
    { time: "14:00", cups: 0, online: 0, walkin: 0, revenue: 0 },
    { time: "15:00", cups: 0, online: 0, walkin: 0, revenue: 0 },
    { time: "16:00", cups: 0, online: 0, walkin: 0, revenue: 0 },
    { time: "17:00", cups: 0, online: 0, walkin: 0, revenue: 0 },
    { time: "18:00", cups: 0, online: 0, walkin: 0, revenue: 0 },
    { time: "19:00", cups: 0, online: 0, walkin: 0, revenue: 0 },
    { time: "20:00", cups: 0, online: 0, walkin: 0, revenue: 0 },
    { time: "21:00", cups: 0, online: 0, walkin: 0, revenue: 0 },
    { time: "22:00", cups: 0, online: 0, walkin: 0, revenue: 0 },
  ],
};

const DEFAULT_KPIS: KPIData[] = [
  { label: "รายรับรวม", value: "฿0", sub: "คำนวณสุทธิจากรายการรายรับทั้งหมด", tone: "teal" },
  { label: "รายจ่ายรวม", value: "฿0", sub: "คำนวณสุทธิจากรายการรายจ่ายทั้งหมด", tone: "orange" },
  { label: "กำไรสุทธิ", value: "฿0", sub: "คำนวณสุทธิจากรายรับและรายจ่าย", tone: "teal" },
  { label: "จำนวนออเดอร์", value: "0 รายการ", sub: "ออเดอร์ในระบบทั้งหมด", tone: "plain" },
  { label: "จำนวนแก้ว", value: "0 แก้ว", sub: "จำนวนแก้วที่ขายได้จริง", tone: "plain" },
  { label: "สลิปรอตรวจ", value: "0 รายการ", sub: "ค้างตรวจสอบ ฿0", tone: "orange" },
];

const DEFAULT_CHANNELS = {
  total: "฿0",
  online: { pct: 0, amount: "฿0", dashArray: "0 88", dashOffset: "0" },
  walkin: { pct: 0, amount: "฿0", dashArray: "0 88", dashOffset: "0" },
};

export default function AdminDashboardPage() {
  const [range, setRange] = useState<(typeof ranges)[number]>("วันนี้");
  const [chartType, setChartType] = useState<"bar" | "line">("bar");
  const [trendWeek, setTrendWeek] = useState<number>(2); // 1 = Week 1, 2 = Week 2 (Current)
  const [hourlyDayIndex, setHourlyDayIndex] = useState<number>(13); // Index 0-13 for daily hourly sales pagination

  // Live DB Dashboard State
  const [liveKpis, setLiveKpis] = useState<any>(null);
  const [liveChannels, setLiveChannels] = useState<any>(null);
  const [liveTopProducts, setLiveTopProducts] = useState<any[]>([]);
  const [liveTrend, setLiveTrend] = useState<TrendItem[] | null>(null);
  const [liveMaxBar, setLiveMaxBar] = useState<number | null>(null);
  const [liveTodayHourly, setLiveTodayHourly] = useState<DayHourlyData | null>(null);
  const [dbLoading, setDbLoading] = useState<boolean>(true);

  // Fetch real DB metrics from backend API
  const fetchDashboardStats = async (selectedRange: string) => {
    setDbLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585";
      const param = selectedRange === "วันนี้" ? "today" : "all";
      const res = await fetch(`${apiUrl}/api/v1/dashboard/stats?range=${param}`);
      if (res.ok) {
        const json = await res.json();
        if (json.kpis) setLiveKpis(json.kpis);
        if (json.channels) setLiveChannels(json.channels);
        if (json.top_products) setLiveTopProducts(json.top_products);
        if (json.trend && json.trend.length > 0) setLiveTrend(json.trend);
        if (json.max_bar) setLiveMaxBar(json.max_bar);
        if (json.today_hourly) setLiveTodayHourly(json.today_hourly);
      }
    } catch (err) {
      console.error("Failed to fetch dashboard stats from DB:", err);
    } finally {
      setDbLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats(range);
  }, [range]);

  // Scroll trigger refs for graph animations
  const trendView = useInView(0.15);
  const channelView = useInView(0.15);
  const hourlyView = useInView(0.15);
  const topProductsView = useInView(0.15);

  const trend = liveTrend || [];
  const maxBar = liveMaxBar || 10000;

  const kpis: KPIData[] = liveKpis ? [
    { label: "รายรับรวม", value: liveKpis.total_revenue || "฿0", sub: "คำนวณสุทธิจากรายการรายรับทั้งหมด", tone: "teal" },
    { label: "รายจ่ายรวม", value: liveKpis.total_expenses || "฿0", sub: "คำนวณสุทธิจากรายการรายจ่ายทั้งหมด", tone: "orange" },
    { label: "กำไรสุทธิ", value: liveKpis.net_profit || "฿0", sub: "คำนวณสุทธิจากรายรับและรายจ่าย", tone: "teal" },
    { label: "จำนวนออเดอร์", value: `${liveKpis.total_orders || 0} รายการ`, sub: "ออเดอร์ในระบบทั้งหมด", tone: "plain" },
    { label: "จำนวนแก้ว", value: `${liveKpis.total_cups || 0} แก้ว`, sub: "จำนวนแก้วที่ขายได้จริง", tone: "plain" },
    { label: "สลิปรอตรวจ", value: `${liveKpis.pending_slips || 0} รายการ`, sub: `ค้างตรวจสอบ ${liveKpis.pending_amount || "฿0"}`, tone: "orange" },
  ] : DEFAULT_KPIS;

  const channels = liveChannels ? {
    total: liveChannels.total || "฿0",
    online: {
      pct: liveChannels.online?.pct || 0,
      amount: liveChannels.online?.amount || "฿0",
      dashArray: `${(liveChannels.online?.pct || 0) * 0.88} ${(100 - (liveChannels.online?.pct || 0)) * 0.88}`,
      dashOffset: "0",
    },
    walkin: {
      pct: liveChannels.walkin?.pct || 0,
      amount: liveChannels.walkin?.amount || "฿0",
      dashArray: `${(liveChannels.walkin?.pct || 0) * 0.88} ${(100 - (liveChannels.walkin?.pct || 0)) * 0.88}`,
      dashOffset: `-${(liveChannels.online?.pct || 0) * 0.88}`,
    },
  } : DEFAULT_CHANNELS;

  const topProducts: TopProductItem[] = liveTopProducts || [];

  // 7 Days per week page (starting from Sunday)
  const currentWeekTrend = trend.slice((trendWeek - 1) * 7, trendWeek * 7);

  // Selected Day's Hourly Cup Sales Data (Live DB)
  const currentHourlyData: DayHourlyData = liveTodayHourly || DEFAULT_HOURLY_DATA;

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
      <main style={{ flex: 1, padding: "1.75rem 2.5rem", minWidth: 0 }}>
        {/* Header & Date Range Filter */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, lineHeight: 1.2 }}>
              แดชบอร์ด
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
            {currentWeekTrend.every((t) => t.rev === 0 && t.exp === 0) ? (
              <div
                style={{
                  height: "220px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(50, 55, 65, 0.02)",
                  borderRadius: "0.85rem",
                  border: "1px dashed rgba(50, 55, 65, 0.15)",
                  margin: "1rem 0 0.5rem",
                  color: "var(--ink-soft)",
                  gap: "0.4rem",
                }}
              >
                <LineChartIcon size={32} style={{ opacity: 0.35 }} />
                <p style={{ fontSize: "0.875rem", fontWeight: 600 }}>ยังไม่มีข้อมูลแนวโน้มรายรับ-รายจ่าย</p>
                <p style={{ fontSize: "0.75rem", opacity: 0.8 }}>กราฟแนวโน้มจะเริ่มวาดอัตโนมัติเมื่อมีรายการรายรับหรือรายจ่ายบันทึกเข้ามา</p>
              </div>
            ) : (
              <ScrollableChartWrapper>
                <div
                  key={`trend-chart-${range}-${chartType}-${trendWeek}`}
                  style={{ minWidth: "500px" }}
                >
                  {chartType === "bar" ? (
                    /* Bar visualization with scroll-triggered left-to-right animation */
                    <div style={{ display: "flex", height: "220px", alignItems: "flex-end", gap: "0.75rem" }}>
                      {currentWeekTrend.map((t, idx) => {
                        const delayMs = idx * 60;
                        return (
                          <div
                            key={t.d}
                            className={trendView.isInView ? "animate-rise" : ""}
                            style={{
                              flex: 1,
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "flex-end",
                              gap: "0.5rem",
                              height: "100%",
                              animationDelay: `${delayMs}ms`,
                              animationFillMode: "both",
                            }}
                          >
                            <div style={{ display: "flex", width: "100%", height: "100%", alignItems: "flex-end", justifyContent: "center", gap: "0.35rem", borderBottom: "1px solid rgba(50, 55, 65, 0.08)", paddingBottom: "2px" }}>
                              <div
                                title={`รายรับ: ฿${t.rev.toLocaleString()}`}
                                className={trendView.isInView ? "animate-bar-grow" : ""}
                                style={{
                                  width: "36%",
                                  borderRadius: "4px 4px 0 0",
                                  backgroundColor: "var(--teal)",
                                  height: `${(t.rev / maxBar) * 100}%`,
                                  animationDelay: `${delayMs}ms`,
                                  animationFillMode: "both",
                                  transition: "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
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
                                  animationDelay: `${delayMs + 30}ms`,
                                  animationFillMode: "both",
                                  transition: "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
                                }}
                              />
                            </div>
                            <span style={{ fontSize: "0.75rem", color: "var(--ink-soft)", fontWeight: 500, whiteSpace: "nowrap" }}>{t.d}</span>
                          </div>
                        );
                      })}
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

                      const lineDurationMs = 850;
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
                            {currentWeekTrend.map((t, idx) => {
                              const delayMs = Math.round((idx / (currentWeekTrend.length - 1)) * lineDurationMs);
                              return (
                                <span
                                  key={t.d}
                                  className={trendView.isInView ? "animate-rise" : ""}
                                  style={{
                                    fontSize: "0.75rem",
                                    color: "var(--ink-soft)",
                                    fontWeight: 500,
                                    textAlign: "center",
                                    width: "45px",
                                    animationDelay: `${delayMs}ms`,
                                    animationFillMode: "both",
                                  }}
                                >
                                  {t.d}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()
                  )}
                </div>
              </ScrollableChartWrapper>
            )}
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
                      backgroundColor: "var(--cream)",
                      padding: "0.25rem 0.75rem",
                      borderRadius: "0.65rem",
                      border: "1px solid rgba(50, 55, 65, 0.1)",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        color: "var(--ink)",
                        textAlign: "center",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {currentHourlyData.dateLabel}
                    </span>
                  </div>

                  {/* Peak badge */}
                  {currentHourlyData.totalCups > 0 && (
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
                  )}
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

              {/* Empty State when no data available for the day */}
              {currentHourlyData.totalCups === 0 ? (
                <div
                  style={{
                    height: "175px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "rgba(50, 55, 65, 0.02)",
                    borderRadius: "0.85rem",
                    border: "1px dashed rgba(50, 55, 65, 0.15)",
                    margin: "0.5rem 0",
                    color: "var(--ink-soft)",
                    gap: "0.4rem",
                  }}
                >
                  <BarChart2 size={32} style={{ opacity: 0.35 }} />
                  <p style={{ fontSize: "0.875rem", fontWeight: 600 }}>ยังไม่มีข้อมูลยอดขายในวันนี้</p>
                  <p style={{ fontSize: "0.75rem", opacity: 0.8 }}>กราฟจะแสดงอัตโนมัติเมื่อมีคำสั่งซื้อสำเร็จเข้ามาในระบบ</p>
                </div>
              ) : (
                /* Hourly Cups Bar Chart with scroll-triggered animation & permanent custom sliderbar */
                <ScrollableChartWrapper>
                  <div
                    key={`hourly-chart-${range}-${hourlyDayIndex}`}
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
                      const isPeak = slot.cups > 0 && slot.cups === Math.max(...currentHourlyData.slots.map((s) => s.cups));
                      const onlinePct = slot.cups > 0 ? (slot.online / slot.cups) * 100 : 50;
                      const walkinPct = 100 - onlinePct;
                      const delayMs = slotIdx * 45;

                      return (
                        <div
                          key={slot.time}
                          className={hourlyView.isInView ? "animate-rise" : ""}
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
                            animationDelay: `${delayMs}ms`,
                            animationFillMode: "both",
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
                              animationDelay: `${delayMs}ms`,
                              animationFillMode: "both",
                              transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
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
                                transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                              }}
                            />
                            {/* Walk-in portion (Warm) */}
                            <div
                              style={{
                                height: `${walkinPct}%`,
                                backgroundColor: "var(--warm)",
                                width: "100%",
                                transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
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
              )}
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
                ช่วงเวลาขายดีสุด: {currentHourlyData.totalCups > 0 ? currentHourlyData.peakSlot : "-"}
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
                href="/staff/management/menu"
                style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--teal)", textDecoration: "none" }}
              >
                ดูทั้งหมด →
              </Link>
            </div>
            <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              {topProducts.length === 0 ? (
                <div
                  style={{
                    padding: "2rem 1rem",
                    textAlign: "center",
                    color: "var(--ink-soft)",
                    fontSize: "0.825rem",
                    backgroundColor: "rgba(50, 55, 65, 0.02)",
                    borderRadius: "0.75rem",
                    border: "1px dashed rgba(50, 55, 65, 0.12)",
                  }}
                >
                  <p style={{ fontWeight: 600 }}>ยังไม่มีข้อมูลอันดับเมนูขายดี</p>
                  <p style={{ fontSize: "0.75rem", opacity: 0.8, marginTop: "0.2rem" }}>ระบบจะจัดอันดับอัตโนมัติเมื่อมีออเดอร์เข้ามา</p>
                </div>
              ) : (
                topProducts.map((p, i) => (
                  <div
                    key={p.name}
                    className={topProductsView.isInView ? "animate-rise" : ""}
                    style={{
                      animationDelay: `${i * 60}ms`,
                      animationFillMode: "both",
                    }}
                  >
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
                            animationDelay: `${i * 90}ms`,
                            animationFillMode: "both",
                          }}
                        />
                      </div>
                      <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--ink)" }}>{p.amount}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

