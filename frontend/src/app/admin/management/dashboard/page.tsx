"use client";

import { useState } from "react";
import Link from "next/link";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import { BarChart2, LineChart as LineChartIcon, Search, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";

const ranges = ["วันนี้", "ทั้งงาน"] as const;


const kpis = [
  { label: "รายรับรวม", value: "฿24,850", sub: "+12% จากเมื่อวาน", tone: "teal" },
  { label: "รายจ่ายรวม", value: "฿8,320", sub: "วัตถุดิบ 62%", tone: "orange" },
  { label: "กำไรสุทธิ", value: "฿16,530", sub: "อัตรากำไร 66%", tone: "teal" },
  { label: "จำนวนออเดอร์", value: "412", sub: "ออเดอร์ทั้งหมด", tone: "plain" },
  { label: "จำนวนแก้ว", value: "689", sub: "เฉลี่ย 1.7 แก้ว/บิล", tone: "plain" },
];


const trend = [
  { d: "จ.", rev: 42, exp: 16 },
  { d: "อ.", rev: 55, exp: 20 },
  { d: "พ.", rev: 48, exp: 18 },
  { d: "พฤ.", rev: 70, exp: 24 },
  { d: "ศ.", rev: 88, exp: 30 },
  { d: "ส.", rev: 100, exp: 34 },
  { d: "อา.", rev: 76, exp: 26 },
];

const topProducts = [
  { name: "น้ำเต้าหู้ดั้งเดิม", cups: 168, amount: "฿5,880", pct: 100 },
  { name: "น้ำเต้าหู้มัทฉะ", cups: 121, amount: "฿6,050", pct: 72 },
  { name: "น้ำเต้าหู้ชาไทย", cups: 96, amount: "฿4,320", pct: 57 },
  { name: "น้ำเต้าหู้ช็อกโกแลต", cups: 74, amount: "฿3,330", pct: 44 },
];

const orders = [
  { id: 1, no: "TT-1042", q: "A21", name: "คุณฟ้า", ch: "ออนไลน์", total: "฿185", amount: 185, st: "รอตรวจสลิป" },
  { id: 2, no: "TT-1041", q: "W08", name: "คุณเบียร์", ch: "หน้าร้าน", total: "฿120", amount: 120, st: "กำลังทำ" },
  { id: 3, no: "TT-1040", q: "A20", name: "คุณแนน", ch: "ออนไลน์", total: "฿240", amount: 240, st: "พร้อมรับ" },
  { id: 4, no: "TT-1039", q: "W07", name: "คุณโอ๊ต", ch: "หน้าร้าน", total: "฿90", amount: 90, st: "รับแล้ว" },
  { id: 5, no: "TT-1038", q: "A19", name: "คุณปอ", ch: "ออนไลน์", total: "฿310", amount: 310, st: "รับแล้ว" },
  { id: 6, no: "TT-1037", q: "A18", name: "คุณกานต์", ch: "ออนไลน์", total: "฿150", amount: 150, st: "รับแล้ว" },
  { id: 7, no: "TT-1036", q: "W06", name: "คุณมุก", ch: "หน้าร้าน", total: "฿70", amount: 70, st: "รับแล้ว" },
  { id: 8, no: "TT-1035", q: "A17", name: "คุณนพ", ch: "ออนไลน์", total: "฿260", amount: 260, st: "รับแล้ว" },
  { id: 9, no: "TT-1034", q: "W05", name: "คุณบอย", ch: "หน้าร้าน", total: "฿135", amount: 135, st: "รับแล้ว" },
  { id: 10, no: "TT-1033", q: "A16", name: "คุณแพร", ch: "ออนไลน์", total: "฿195", amount: 195, st: "รับแล้ว" },
];

export default function AdminDashboardPage() {
  const [range, setRange] = useState<(typeof ranges)[number]>("วันนี้");
  const [chartType, setChartType] = useState<"bar" | "line">("bar");
  const maxBar = 100;

  // Recent Orders Filter, Sort, Pagination States
  const [orderSearch, setOrderSearch] = useState("");
  const [orderSort, setOrderSort] = useState<"latest" | "oldest" | "amount_high" | "amount_low">("latest");
  const [orderPageSize, setOrderPageSize] = useState<number>(5);
  const [orderPage, setOrderPage] = useState<number>(1);

  // Filter & Sort Logic
  const filteredOrders = orders
    .filter((o) => {
      const q = orderSearch.toLowerCase();
      return (
        o.no.toLowerCase().includes(q) ||
        o.q.toLowerCase().includes(q) ||
        o.name.toLowerCase().includes(q) ||
        o.ch.toLowerCase().includes(q) ||
        o.st.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (orderSort === "latest") return b.id - a.id;
      if (orderSort === "oldest") return a.id - b.id;
      if (orderSort === "amount_high") return b.amount - a.amount;
      if (orderSort === "amount_low") return a.amount - b.amount;
      return 0;
    });

  const totalOrderPages = Math.ceil(filteredOrders.length / orderPageSize) || 1;
  const safeOrderPage = Math.min(orderPage, totalOrderPages);
  const orderStartIndex = (safeOrderPage - 1) * orderPageSize;
  const paginatedOrders = filteredOrders.slice(orderStartIndex, orderStartIndex + orderPageSize);


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
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: "1rem" }}>
          <div>
            <h1 style={{ marginTop: "0.25rem", fontSize: "1.75rem", fontWeight: 800, lineHeight: 1.2 }}>
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
                  onClick={() => setRange(r)}
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

        {/* KPI Cards Grid */}
        <section
          style={{
            marginTop: "1.5rem",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "1rem",
          }}
        >
          {kpis.map((k, i) => (
            <div
              key={k.label}
              className="animate-rise"
              style={{
                animationDelay: `${i * 50}ms`,
                borderRadius: "1.25rem",
                backgroundColor: "var(--card)",
                padding: "1.25rem",
                border: "1px solid rgba(50, 55, 65, 0.1)",
                boxShadow: "0 4px 16px -2px rgba(0,0,0,0.03)",
              }}
            >
              <p style={{ fontSize: "0.875rem", color: "var(--ink-soft)", fontWeight: 500 }}>{k.label}</p>
              <p
                style={{
                  marginTop: "0.35rem",
                  fontSize: "1.75rem",
                  fontWeight: 700,
                  fontFamily: "'Kanit', sans-serif",
                  color:
                    k.tone === "teal"
                      ? "var(--teal)"
                      : k.tone === "orange"
                      ? "#f97316"
                      : k.tone === "warm"
                      ? "var(--warm)"
                      : "var(--ink)",
                  letterSpacing: "-0.01em",
                }}
              >
                {k.value}
              </p>
              <p style={{ marginTop: "0.25rem", fontSize: "0.75rem", color: "var(--ink-soft)" }}>{k.sub}</p>
            </div>
          ))}
        </section>


        {/* Middle Row: Trend Chart + Channels / Queue */}
        <div
          style={{
            marginTop: "1.25rem",
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gap: "1rem",
          }}
        >
          {/* Revenue / Expense Trend Chart (Bar & Line Toggle) */}
          <section
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
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>แนวโน้มรายรับ / รายจ่าย</h2>

                {/* Chart Type Toggle (Bar / Line) */}
                <div
                  style={{
                    display: "flex",
                    borderRadius: "0.5rem",
                    backgroundColor: "var(--cream)",
                    padding: "2px",
                    border: "1px solid rgba(50, 55, 65, 0.1)",
                    fontFamily: "'Kanit', sans-serif",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setChartType("bar")}
                    title="กราฟแท่ง (Bar Chart)"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem",
                      padding: "0.25rem 0.6rem",
                      borderRadius: "0.35rem",
                      fontSize: "0.8rem",
                      fontWeight: chartType === "bar" ? 600 : 400,
                      fontFamily: "'Kanit', sans-serif",
                      border: "none",
                      cursor: "pointer",
                      backgroundColor: chartType === "bar" ? "var(--card)" : "transparent",
                      color: chartType === "bar" ? "var(--teal)" : "var(--ink-soft)",
                      boxShadow: chartType === "bar" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <BarChart2 size={14} />
                    <span style={{ fontFamily: "'Kanit', sans-serif" }}>แท่ง</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartType("line")}
                    title="กราฟเส้น (Line Chart)"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem",
                      padding: "0.25rem 0.6rem",
                      borderRadius: "0.35rem",
                      fontSize: "0.8rem",
                      fontWeight: chartType === "line" ? 600 : 400,
                      fontFamily: "'Kanit', sans-serif",
                      border: "none",
                      cursor: "pointer",
                      backgroundColor: chartType === "line" ? "var(--card)" : "transparent",
                      color: chartType === "line" ? "var(--teal)" : "var(--ink-soft)",
                      boxShadow: chartType === "line" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <LineChartIcon size={14} />
                    <span style={{ fontFamily: "'Kanit', sans-serif" }}>เส้น</span>
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

            {/* Chart Visualizations */}
            {chartType === "bar" ? (
              /* Bar visualization */
              <div style={{ marginTop: "auto", paddingTop: "1.5rem", display: "flex", height: "220px", alignItems: "flex-end", gap: "0.75rem" }}>
                {trend.map((t) => (
                  <div key={t.d} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", gap: "0.5rem", height: "100%" }}>
                    <div style={{ display: "flex", width: "100%", height: "100%", alignItems: "flex-end", justifyContent: "center", gap: "0.35rem", borderBottom: "1px solid rgba(50, 55, 65, 0.08)", paddingBottom: "2px" }}>
                      <div
                        style={{
                          width: "36%",
                          borderRadius: "4px 4px 0 0",
                          backgroundColor: "var(--teal)",
                          height: `${(t.rev / maxBar) * 100}%`,
                          transition: "height 0.5s ease",
                        }}
                      />
                      <div
                        style={{
                          width: "36%",
                          borderRadius: "4px 4px 0 0",
                          backgroundColor: "var(--warm)",
                          height: `${(t.exp / maxBar) * 100}%`,
                          transition: "height 0.5s ease",
                        }}
                      />
                    </div>
                    <span style={{ fontSize: "0.75rem", color: "var(--ink-soft)", fontWeight: 500 }}>{t.d}</span>
                  </div>
                ))}
              </div>
            ) : (
              /* Line visualization (SVG Curved Smooth Area & Lines) */
              <div style={{ marginTop: "auto", paddingTop: "1.5rem", display: "flex", flexDirection: "column", height: "220px", justifyContent: "flex-end" }}>
                <div style={{ position: "relative", width: "100%", height: "175px" }}>
                  <svg viewBox="0 0 600 160" preserveAspectRatio="none" style={{ width: "100%", height: "100%", overflow: "visible" }}>
                    <defs>
                      <linearGradient id="tealGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="var(--teal)" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="var(--teal)" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="warmGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="var(--warm)" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="var(--warm)" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Revenue Area */}
                    <polygon
                      points={`0,160 ${trend.map((t, idx) => `${(idx / (trend.length - 1)) * 600},${150 - (t.rev / maxBar) * 130}`).join(" ")} 600,160`}
                      fill="url(#tealGrad)"
                    />
                    {/* Expense Area */}
                    <polygon
                      points={`0,160 ${trend.map((t, idx) => `${(idx / (trend.length - 1)) * 600},${150 - (t.exp / maxBar) * 130}`).join(" ")} 600,160`}
                      fill="url(#warmGrad)"
                    />

                    {/* Revenue Line */}
                    <polyline
                      fill="none"
                      stroke="var(--teal)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={trend.map((t, idx) => `${(idx / (trend.length - 1)) * 600},${150 - (t.rev / maxBar) * 130}`).join(" ")}
                    />
                    {/* Expense Line */}
                    <polyline
                      fill="none"
                      stroke="var(--warm)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={trend.map((t, idx) => `${(idx / (trend.length - 1)) * 600},${150 - (t.exp / maxBar) * 130}`).join(" ")}
                    />

                    {/* Revenue Dots */}
                    {trend.map((t, idx) => {
                      const x = (idx / (trend.length - 1)) * 600;
                      const y = 150 - (t.rev / maxBar) * 130;
                      return (
                        <circle
                          key={`rev-${t.d}`}
                          cx={x}
                          cy={y}
                          r="4.5"
                          fill="var(--card)"
                          stroke="var(--teal)"
                          strokeWidth="2.5"
                        />
                      );
                    })}

                    {/* Expense Dots */}
                    {trend.map((t, idx) => {
                      const x = (idx / (trend.length - 1)) * 600;
                      const y = 150 - (t.exp / maxBar) * 130;
                      return (
                        <circle
                          key={`exp-${t.d}`}
                          cx={x}
                          cy={y}
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
                  {trend.map((t) => (
                    <span key={t.d} style={{ fontSize: "0.75rem", color: "var(--ink-soft)", fontWeight: 500, textAlign: "center", width: "30px" }}>
                      {t.d}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>



          {/* Right Column: Channels Section (Flanked Text Left/Right with Extra Large Center Pie Chart) */}
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            {/* Channel Split Section */}
            <section
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
                <span style={{ fontSize: "0.8rem", color: "var(--ink-soft)", fontWeight: 500 }}>ยอดรวม ฿24,850</span>
              </div>

              {/* Horizontal Trio: [Online Left] - [Pie Chart Center] - [Walk-in Right] */}
              <div
                style={{
                  margin: "auto 0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "0.5rem",
                  width: "100%",
                  padding: "0.25rem 0",
                }}
              >
                {/* Left: ออนไลน์ */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", minWidth: 0 }}>
                  <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--teal)" }}>
                    ออนไลน์
                  </div>
                  <span style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--teal)", fontFamily: "'Kanit', sans-serif", marginTop: "0.15rem", lineHeight: 1.1 }}>
                    58%
                  </span>
                  <span style={{ fontSize: "0.95rem", color: "var(--ink)", fontWeight: 600, fontFamily: "'Kanit', sans-serif", marginTop: "0.3rem" }}>
                    ฿14,413
                  </span>
                </div>

                {/* Center: Maximized Extra Large Thick Pie / Donut Chart */}
                <div style={{ position: "relative", width: "210px", height: "210px", flexShrink: 0 }}>
                  <svg
                    viewBox="-2 -2 40 40"
                    style={{
                      width: "100%",
                      height: "100%",
                      transform: "rotate(75.6deg)",
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
                    {/* Online Slice: 58% (Teal - Aligned directly facing Left) */}
                    <circle
                      cx="18"
                      cy="18"
                      r="14"
                      fill="transparent"
                      stroke="var(--teal)"
                      strokeWidth="8"
                      strokeDasharray="51.02 36.94"
                      strokeDashoffset="0"
                      style={{ transition: "stroke-dasharray 0.5s ease" }}
                    />
                    {/* Walk-in Slice: 42% (Warm - Aligned directly facing Right) */}
                    <circle
                      cx="18"
                      cy="18"
                      r="14"
                      fill="transparent"
                      stroke="var(--warm)"
                      strokeWidth="8"
                      strokeDasharray="36.94 51.02"
                      strokeDashoffset="-51.02"
                      style={{ transition: "stroke-dasharray 0.5s ease" }}
                    />
                  </svg>
                </div>

                {/* Right: หน้าร้าน */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", minWidth: 0, textAlign: "right" }}>
                  <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--warm)" }}>
                    หน้าร้าน
                  </div>
                  <span style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--warm)", fontFamily: "'Kanit', sans-serif", marginTop: "0.15rem", lineHeight: 1.1 }}>
                    42%
                  </span>
                  <span style={{ fontSize: "0.95rem", color: "var(--ink)", fontWeight: 600, fontFamily: "'Kanit', sans-serif", marginTop: "0.3rem" }}>
                    ฿10,437
                  </span>
                </div>
              </div>

            </section>
          </div>
        </div>





          {/* Bottom Row: Recent Orders & Top Selling Menu */}
          <div
            style={{
              marginTop: "1.25rem",
              display: "grid",
              gridTemplateColumns: "2fr 1fr",
              gap: "1rem",
            }}
          >
            {/* Recent Orders Table */}
            <section
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
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "0.75rem" }}>
                  <div>
                    <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>ออเดอร์ล่าสุด</h2>
                    <span style={{ fontSize: "0.75rem", color: "var(--ink-soft)" }}>
                      ทั้งหมด {filteredOrders.length} รายการ
                    </span>
                  </div>

                  {/* Search, Sort, and Max Item Controls */}
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5rem" }}>
                    {/* Search Input */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        backgroundColor: "var(--cream)",
                        padding: "0.35rem 0.65rem",
                        borderRadius: "0.5rem",
                        border: "1px solid rgba(50, 55, 65, 0.1)",
                      }}
                    >
                      <Search size={14} color="var(--ink-soft)" />
                      <input
                        type="text"
                        placeholder="ค้นหาเลขที่, คิว, ชื่อ..."
                        value={orderSearch}
                        onChange={(e) => {
                          setOrderSearch(e.target.value);
                          setOrderPage(1);
                        }}
                        style={{
                          border: "none",
                          background: "transparent",
                          outline: "none",
                          fontSize: "0.8rem",
                          width: "130px",
                          fontFamily: "'Kanit', sans-serif",
                          color: "var(--ink)",
                        }}
                      />
                    </div>

                    {/* Sort Dropdown */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <ArrowUpDown size={14} color="var(--ink-soft)" />
                      <select
                        value={orderSort}
                        onChange={(e) => {
                          setOrderSort(e.target.value as any);
                          setOrderPage(1);
                        }}
                        style={{
                          padding: "0.35rem 0.6rem",
                          borderRadius: "0.5rem",
                          fontSize: "0.8rem",
                          fontFamily: "'Kanit', sans-serif",
                          backgroundColor: "var(--cream)",
                          border: "1px solid rgba(50, 55, 65, 0.1)",
                          color: "var(--ink)",
                          cursor: "pointer",
                          outline: "none",
                        }}
                      >
                        <option value="latest">ล่าสุด</option>
                        <option value="oldest">เก่าสุด</option>
                        <option value="amount_high">ยอดเงิน (มาก → น้อย)</option>
                        <option value="amount_low">ยอดเงิน (น้อย → มาก)</option>
                      </select>
                    </div>

                    {/* Max Items Per Page */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <select
                        value={orderPageSize}
                        onChange={(e) => {
                          setOrderPageSize(Number(e.target.value));
                          setOrderPage(1);
                        }}
                        style={{
                          padding: "0.35rem 0.5rem",
                          borderRadius: "0.5rem",
                          fontSize: "0.8rem",
                          fontFamily: "'Kanit', sans-serif",
                          backgroundColor: "var(--cream)",
                          border: "1px solid rgba(50, 55, 65, 0.1)",
                          color: "var(--ink)",
                          cursor: "pointer",
                          outline: "none",
                        }}
                      >
                        <option value={5}>5 รายการ / หน้า</option>
                        <option value={10}>10 รายการ / หน้า</option>
                        <option value={20}>20 รายการ / หน้า</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Table */}
                <div style={{ marginTop: "0.85rem", overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(50, 55, 65, 0.1)", color: "var(--ink-soft)", fontSize: "0.75rem" }}>
                        <th style={{ padding: "0.5rem" }}>เลขที่</th>
                        <th style={{ padding: "0.5rem" }}>คิว</th>
                        <th style={{ padding: "0.5rem" }}>ลูกค้า</th>
                        <th style={{ padding: "0.5rem" }}>ช่องทาง</th>
                        <th style={{ padding: "0.5rem" }}>ยอด</th>
                        <th style={{ padding: "0.5rem" }}>สถานะ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedOrders.map((o) => {
                        const isWaiting = o.st === "รอตรวจสลิป";
                        const isPreparing = o.st === "กำลังทำ";
                        const isReady = o.st === "พร้อมรับ";
                        return (
                          <tr key={o.no} style={{ borderBottom: "1px solid rgba(50, 55, 65, 0.05)" }}>
                            <td className="font-mono" style={{ padding: "0.6rem 0.5rem", fontSize: "0.75rem" }}>
                              {o.no}
                            </td>
                            <td style={{ padding: "0.6rem 0.5rem", fontWeight: 700 }}>{o.q}</td>
                            <td style={{ padding: "0.6rem 0.5rem" }}>{o.name}</td>
                            <td style={{ padding: "0.6rem 0.5rem", color: o.ch === "ออนไลน์" ? "var(--teal)" : "#e05353", fontWeight: 600 }}>
                              {o.ch}
                            </td>
                            <td style={{ padding: "0.6rem 0.5rem", fontWeight: 700 }}>{o.total}</td>
                            <td style={{ padding: "0.6rem 0.5rem" }}>
                              <span
                                style={{
                                  display: "inline-block",
                                  borderRadius: "9999px",
                                  padding: "0.2rem 0.6rem",
                                  fontSize: "0.7rem",
                                  fontWeight: 600,
                                  backgroundColor: isWaiting
                                    ? "rgba(224, 83, 83, 0.15)"
                                    : isPreparing
                                    ? "rgba(75, 155, 140, 0.15)"
                                    : isReady
                                    ? "rgba(75, 155, 140, 0.25)"
                                    : "rgba(50, 55, 65, 0.08)",
                                  color: isWaiting
                                    ? "#e05353"
                                    : isPreparing || isReady
                                    ? "var(--teal)"
                                    : "var(--ink-soft)",
                                }}
                              >
                                {o.st}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {paginatedOrders.length === 0 && (
                        <tr>
                          <td colSpan={6} style={{ textAlign: "center", padding: "1.5rem", color: "var(--ink-soft)" }}>
                            ไม่พบออเดอร์ที่ค้นหา
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Order Pagination Controls */}
              {totalOrderPages > 1 && (
                <div
                  style={{
                    marginTop: "0.85rem",
                    paddingTop: "0.75rem",
                    borderTop: "1px solid rgba(50, 55, 65, 0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: "0.75rem",
                    color: "var(--ink-soft)",
                  }}
                >
                  <span>
                    หน้า {safeOrderPage} จาก {totalOrderPages}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <button
                      type="button"
                      onClick={() => setOrderPage((p) => Math.max(1, p - 1))}
                      disabled={safeOrderPage === 1}
                      style={{
                        padding: "0.25rem 0.5rem",
                        borderRadius: "0.35rem",
                        border: "1px solid rgba(50, 55, 65, 0.1)",
                        backgroundColor: "var(--cream)",
                        cursor: safeOrderPage === 1 ? "not-allowed" : "pointer",
                        opacity: safeOrderPage === 1 ? 0.4 : 1,
                        display: "flex",
                        alignItems: "center",
                        gap: "0.2rem",
                        fontSize: "0.75rem",
                        fontFamily: "'Kanit', sans-serif",
                      }}
                    >
                      <ChevronLeft size={13} /> ก่อนหน้า
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderPage((p) => Math.min(totalOrderPages, p + 1))}
                      disabled={safeOrderPage === totalOrderPages}
                      style={{
                        padding: "0.25rem 0.5rem",
                        borderRadius: "0.35rem",
                        border: "1px solid rgba(50, 55, 65, 0.1)",
                        backgroundColor: "var(--cream)",
                        cursor: safeOrderPage === totalOrderPages ? "not-allowed" : "pointer",
                        opacity: safeOrderPage === totalOrderPages ? 0.4 : 1,
                        display: "flex",
                        alignItems: "center",
                        gap: "0.2rem",
                        fontSize: "0.75rem",
                        fontFamily: "'Kanit', sans-serif",
                      }}
                    >
                      ถัดไป <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              )}
            </section>

          {/* Top Products */}
          <section
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
                    <div style={{ flex: 1, height: "0.45rem", borderRadius: "9999px", backgroundColor: "rgba(50, 55, 65, 0.08)" }}>
                      <div
                        style={{
                          height: "100%",
                          borderRadius: "9999px",
                          backgroundColor: "var(--teal)",
                          width: `${p.pct}%`,
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

