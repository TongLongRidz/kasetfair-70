"use client";

import React, { useState } from "react";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import {
  Search,
  Plus,
  MoreVertical,
  Eye,
  EyeOff,
  Edit3,
  Calendar,
  Clock,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Gift,
  CheckCircle2,
  XCircle,
  X,
  Sparkles,
  Users,
  Award,
} from "lucide-react";

interface Promotion {
  id: number;
  name_th: string;
  name_en: string;
  desc_th: string;
  desc_en: string;
  point_usage: number;
  all_limit: number | null; // NULL = ไม่จำกัด
  person_limit: number | null; // NULL = ไม่จำกัดต่อคน
  used_count: number; // สถิติแลกไปแล้ว
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}

const INITIAL_PROMOTIONS: Promotion[] = [
  {
    id: 1,
    name_th: "สะสมครบ 5 แต้ม ฟรี 1 แก้ว (เมนูใดก็ได้)",
    name_en: "Collect 5 Points Get 1 Free Any Cup",
    desc_th: "แลกรับเครื่องดื่มน้ำเต้าหู้รสชาติใดก็ได้ ขนาดปกติฟรี 1 แก้ว ไม่รวมท็อปปิ้ง",
    desc_en: "Redeem any standard soy milk drink for free, toppings excluded.",
    point_usage: 5,
    all_limit: 500,
    person_limit: 2,
    used_count: 142,
    start_date: "2026-09-01 00:00",
    end_date: "2026-09-15 23:59",
    is_active: true,
    created_at: "2026-09-01 08:00",
  },
  {
    id: 2,
    name_th: "สะสมครบ 10 แต้ม ฟรีเซ็ตคอมโบ 2 แก้ว + ท็อปปิ้ง",
    name_en: "Collect 10 Points Get Combo Set (2 Cups + Toppings)",
    desc_th: "แลกเซ็ตคอมโบสุดคุ้ม 2 แก้วพร้อมเลือกท็อปปิ้งได้ไม่อั้น 2 อย่าง",
    desc_en: "Redeem 2 cups combo set with 2 free toppings.",
    point_usage: 10,
    all_limit: 200,
    person_limit: 1,
    used_count: 48,
    start_date: "2026-09-01 00:00",
    end_date: "2026-09-15 23:59",
    is_active: true,
    created_at: "2026-09-01 08:30",
  },
  {
    id: 3,
    name_th: "แลกรับส่วนลดท็อปปิ้งฟรี 1 อย่าง (3 แต้ม)",
    name_en: "Free 1 Topping with 3 Points",
    desc_th: "ใช้ 3 แต้ม แลกรับท็อปปิ้งฟรี 1 ชนิดในแก้วใดก็ได้",
    desc_en: "Use 3 points to get 1 free topping on any cup.",
    point_usage: 3,
    all_limit: null,
    person_limit: null,
    used_count: 89,
    start_date: "2026-09-01 00:00",
    end_date: "2026-09-30 23:59",
    is_active: true,
    created_at: "2026-09-02 10:00",
  },
  {
    id: 4,
    name_th: "โปรเปิดบูธเกษตรแฟร์ 1 แต้ม แลกไข่มุกบราวน์ชูการ์",
    name_en: "Kaset Fair Special: 1 Point for Brown Sugar Boba",
    desc_th: "โปรโมชั่นพิเศษช่วงเปิดงานเกษตรแฟร์ 1 แต้มแลกไข่มุกฟรี 1 เสิร์ฟ",
    desc_en: "Special launch promotion: 1 point for 1 brown sugar boba serving.",
    point_usage: 1,
    all_limit: 100,
    person_limit: 1,
    used_count: 100,
    start_date: "2026-09-01 09:00",
    end_date: "2026-09-03 22:00",
    is_active: false,
    created_at: "2026-08-30 14:00",
  },
];

export default function PromotionManagementPage() {
  const [promotions, setPromotions] = useState<Promotion[]>(INITIAL_PROMOTIONS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [sortBy, setSortBy] = useState<"created_desc" | "points_asc" | "points_desc" | "used_desc">("created_desc");
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Kebab Menu Action Popover State
  const [activeKebabId, setActiveKebabId] = useState<number | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);

  // Form State
  const [formNameTh, setFormNameTh] = useState("");
  const [formNameEn, setFormNameEn] = useState("");
  const [formDescTh, setFormDescTh] = useState("");
  const [formDescEn, setFormDescEn] = useState("");
  const [formPointUsage, setFormPointUsage] = useState<number>(5);
  const [formAllLimit, setFormAllLimit] = useState<string>("");
  const [formPersonLimit, setFormPersonLimit] = useState<string>("");
  const [formStartDate, setFormStartDate] = useState("2026-09-01T00:00");
  const [formEndDate, setFormEndDate] = useState("2026-09-15T23:59");
  const [formIsActive, setFormIsActive] = useState(true);

  // Open Modal for Add
  const handleOpenAdd = () => {
    setEditingPromotion(null);
    setFormNameTh("");
    setFormNameEn("");
    setFormDescTh("");
    setFormDescEn("");
    setFormPointUsage(5);
    setFormAllLimit("");
    setFormPersonLimit("");
    setFormStartDate(new Date().toISOString().substring(0, 16));
    setFormEndDate("2026-09-15T23:59");
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEdit = (promo: Promotion) => {
    setEditingPromotion(promo);
    setFormNameTh(promo.name_th);
    setFormNameEn(promo.name_en);
    setFormDescTh(promo.desc_th);
    setFormDescEn(promo.desc_en);
    setFormPointUsage(promo.point_usage);
    setFormAllLimit(promo.all_limit !== null ? String(promo.all_limit) : "");
    setFormPersonLimit(promo.person_limit !== null ? String(promo.person_limit) : "");
    setFormStartDate(promo.start_date.replace(" ", "T"));
    setFormEndDate(promo.end_date.replace(" ", "T"));
    setFormIsActive(promo.is_active);
    setIsModalOpen(true);
    setActiveKebabId(null);
  };

  // Toggle Active Status
  const handleToggleActive = (id: number) => {
    setPromotions((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_active: !p.is_active } : p))
    );
    setActiveKebabId(null);
  };

  // Submit Form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNameTh.trim() || !formNameEn.trim()) return;

    if (editingPromotion) {
      setPromotions((prev) =>
        prev.map((p) =>
          p.id === editingPromotion.id
            ? {
                ...p,
                name_th: formNameTh.trim(),
                name_en: formNameEn.trim(),
                desc_th: formDescTh.trim(),
                desc_en: formDescEn.trim(),
                point_usage: formPointUsage,
                all_limit: formAllLimit ? Number(formAllLimit) : null,
                person_limit: formPersonLimit ? Number(formPersonLimit) : null,
                start_date: formStartDate.replace("T", " "),
                end_date: formEndDate.replace("T", " "),
                is_active: formIsActive,
              }
            : p
        )
      );
    } else {
      const newPromo: Promotion = {
        id: Date.now(),
        name_th: formNameTh.trim(),
        name_en: formNameEn.trim(),
        desc_th: formDescTh.trim(),
        desc_en: formDescEn.trim(),
        point_usage: formPointUsage,
        all_limit: formAllLimit ? Number(formAllLimit) : null,
        person_limit: formPersonLimit ? Number(formPersonLimit) : null,
        used_count: 0,
        start_date: formStartDate.replace("T", " "),
        end_date: formEndDate.replace("T", " "),
        is_active: formIsActive,
        created_at: new Date().toISOString().replace("T", " ").substring(0, 16),
      };
      setPromotions([newPromo, ...promotions]);
    }
    setIsModalOpen(false);
  };

  // Filter & Sort
  const filteredPromotions = promotions
    .filter((p) => {
      if (statusFilter === "active" && !p.is_active) return false;
      if (statusFilter === "inactive" && p.is_active) return false;

      const q = searchQuery.toLowerCase();
      return (
        p.name_th.toLowerCase().includes(q) ||
        p.name_en.toLowerCase().includes(q) ||
        p.desc_th.toLowerCase().includes(q) ||
        p.desc_en.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === "created_desc") return b.created_at.localeCompare(a.created_at);
      if (sortBy === "points_asc") return a.point_usage - b.point_usage;
      if (sortBy === "points_desc") return b.point_usage - a.point_usage;
      if (sortBy === "used_desc") return b.used_count - a.used_count;
      return 0;
    });

  // Pagination Calculation
  const totalPages = Math.ceil(filteredPromotions.length / pageSize) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedPromotions = filteredPromotions.slice(startIndex, startIndex + pageSize);

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "var(--cream)",
        color: "var(--ink)",
        fontFamily: "'Kanit', sans-serif",
      }}
      onClick={() => {
        if (activeKebabId !== null) setActiveKebabId(null);
      }}
    >
      <AdminSidebar />

      <main style={{ flex: 1, padding: "1.75rem 2.5rem", overflowY: "auto", minWidth: 0 }}>
        {/* Header Section */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, lineHeight: 1.2 }}>
              จัดการโปรโมชั่น
            </h1>
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              backgroundColor: "var(--teal)",
              color: "#fff",
              padding: "0.6rem 1.25rem",
              borderRadius: "0.75rem",
              border: "none",
              fontWeight: 600,
              fontSize: "0.9rem",
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(75, 155, 140, 0.25)",
              transition: "transform 0.15s ease",
            }}
          >
            <Plus size={18} />
            <span>สร้างโปรโมชั่นใหม่</span>
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div
          style={{
            marginTop: "1.5rem",
            backgroundColor: "var(--card)",
            padding: "1rem 1.25rem",
            borderRadius: "1rem",
            border: "1px solid rgba(50, 55, 65, 0.1)",
            display: "flex",
            flexWrap: "wrap",
            gap: "1rem",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Search Input */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              backgroundColor: "var(--cream)",
              padding: "0.5rem 0.85rem",
              borderRadius: "0.75rem",
              border: "1px solid rgba(50, 55, 65, 0.1)",
              flex: "1 1 240px",
              maxWidth: "360px",
            }}
          >
            <Search size={18} color="var(--ink-soft)" />
            <input
              type="text"
              placeholder="ค้นหาชื่อโปรโมชั่น หรือรายละเอียด..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                border: "none",
                background: "transparent",
                outline: "none",
                fontSize: "0.875rem",
                width: "100%",
                fontFamily: "'Kanit', sans-serif",
                color: "var(--ink)",
              }}
            />
          </div>

          {/* Filter Status & Sort Controls */}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.75rem" }}>
            {/* Status Filter */}
            <div style={{ display: "flex", backgroundColor: "var(--cream)", padding: "0.25rem", borderRadius: "0.6rem", border: "1px solid rgba(50, 55, 65, 0.1)" }}>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter("all");
                  setCurrentPage(1);
                }}
                style={{
                  padding: "0.3rem 0.75rem",
                  borderRadius: "0.45rem",
                  border: "none",
                  backgroundColor: statusFilter === "all" ? "var(--card)" : "transparent",
                  color: statusFilter === "all" ? "var(--teal)" : "var(--ink-soft)",
                  fontWeight: statusFilter === "all" ? 700 : 500,
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  boxShadow: statusFilter === "all" ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                }}
              >
                ทั้งหมด
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter("active");
                  setCurrentPage(1);
                }}
                style={{
                  padding: "0.3rem 0.75rem",
                  borderRadius: "0.45rem",
                  border: "none",
                  backgroundColor: statusFilter === "active" ? "var(--card)" : "transparent",
                  color: statusFilter === "active" ? "var(--teal)" : "var(--ink-soft)",
                  fontWeight: statusFilter === "active" ? 700 : 500,
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  boxShadow: statusFilter === "active" ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                }}
              >
                เปิดใช้งาน
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter("inactive");
                  setCurrentPage(1);
                }}
                style={{
                  padding: "0.3rem 0.75rem",
                  borderRadius: "0.45rem",
                  border: "none",
                  backgroundColor: statusFilter === "inactive" ? "var(--card)" : "transparent",
                  color: statusFilter === "inactive" ? "var(--teal)" : "var(--ink-soft)",
                  fontWeight: statusFilter === "inactive" ? 700 : 500,
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  boxShadow: statusFilter === "inactive" ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                }}
              >
                ปิดใช้งาน
              </button>
            </div>

            {/* Sort Dropdown */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <ArrowUpDown size={15} color="var(--ink-soft)" />
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as any);
                  setCurrentPage(1);
                }}
                style={{
                  padding: "0.45rem 0.75rem",
                  borderRadius: "0.6rem",
                  fontSize: "0.85rem",
                  fontFamily: "'Kanit', sans-serif",
                  backgroundColor: "var(--cream)",
                  border: "1px solid rgba(50, 55, 65, 0.1)",
                  color: "var(--ink)",
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                <option value="created_desc">วันที่สร้างล่าสุด</option>
                <option value="points_asc">แต้มที่ใช้ (น้อย → มาก)</option>
                <option value="points_desc">แต้มที่ใช้ (มาก → น้อย)</option>
                <option value="used_desc">จำนวนครั้งที่แลกมากสุด</option>
              </select>
            </div>
          </div>
        </div>

        {/* Promotions Card Grid List */}
        <div style={{ marginTop: "1.25rem", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1.25rem" }}>
          {paginatedPromotions.map((promo) => {
            const isQuotaFull = promo.all_limit !== null && promo.used_count >= promo.all_limit;

            return (
              <div
                key={promo.id}
                style={{
                  backgroundColor: "var(--card)",
                  borderRadius: "1.25rem",
                  border: promo.is_active ? "1px solid rgba(50, 55, 65, 0.1)" : "1px dashed rgba(50, 55, 65, 0.2)",
                  padding: "1.25rem",
                  boxShadow: "0 4px 16px -2px rgba(0,0,0,0.04)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  opacity: promo.is_active ? 1 : 0.65,
                  position: "relative",
                  transition: "all 0.15s ease",
                }}
              >
                <div>
                  {/* Top Bar: Point Badge + Status + Kebab */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.3rem",
                          backgroundColor: "rgba(75, 155, 140, 0.15)",
                          color: "var(--teal)",
                          padding: "0.3rem 0.75rem",
                          borderRadius: "9999px",
                          fontWeight: 700,
                          fontSize: "0.9rem",
                        }}
                      >
                        <Award size={14} />
                        {promo.point_usage} แต้ม
                      </span>

                      {promo.is_active ? (
                        <span style={{ fontSize: "0.75rem", color: "#22c55e", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                          <CheckCircle2 size={13} /> เปิดใช้งาน
                        </span>
                      ) : (
                        <span style={{ fontSize: "0.75rem", color: "var(--ink-soft)", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                          <XCircle size={13} /> ปิดใช้งาน
                        </span>
                      )}

                      {isQuotaFull && (
                        <span style={{ fontSize: "0.7rem", backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#ef4444", padding: "0.2rem 0.5rem", borderRadius: "0.4rem", fontWeight: 600 }}>
                          สิทธิ์เต็ม
                        </span>
                      )}
                    </div>

                    {/* Kebab Action Menu */}
                    <div style={{ position: "relative" }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveKebabId(activeKebabId === promo.id ? null : promo.id);
                        }}
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "0.5rem",
                          border: "none",
                          backgroundColor: activeKebabId === promo.id ? "rgba(50, 55, 65, 0.08)" : "transparent",
                          color: "var(--ink-soft)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                        }}
                      >
                        <MoreVertical size={18} />
                      </button>

                      {activeKebabId === promo.id && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            position: "absolute",
                            right: 0,
                            top: "38px",
                            backgroundColor: "var(--card)",
                            borderRadius: "0.75rem",
                            boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
                            border: "1px solid rgba(50, 55, 65, 0.1)",
                            padding: "0.35rem",
                            minWidth: "160px",
                            zIndex: 20,
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.15rem",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(promo)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                              padding: "0.5rem 0.75rem",
                              border: "none",
                              backgroundColor: "transparent",
                              color: "var(--ink)",
                              fontSize: "0.85rem",
                              borderRadius: "0.5rem",
                              cursor: "pointer",
                              textAlign: "left",
                              fontFamily: "'Kanit', sans-serif",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(50, 55, 65, 0.05)")}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                          >
                            <Edit3 size={15} color="var(--teal)" />
                            <span>แก้ไขโปรโมชั่น</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleActive(promo.id)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                              padding: "0.5rem 0.75rem",
                              border: "none",
                              backgroundColor: "transparent",
                              color: promo.is_active ? "var(--ink-soft)" : "var(--teal)",
                              fontSize: "0.85rem",
                              borderRadius: "0.5rem",
                              cursor: "pointer",
                              textAlign: "left",
                              fontFamily: "'Kanit', sans-serif",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(50, 55, 65, 0.05)")}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                          >
                            {promo.is_active ? <EyeOff size={15} /> : <Eye size={15} />}
                            <span>{promo.is_active ? "ปิดโปรโมชั่น" : "เปิดโปรโมชั่น"}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Promotion Name */}
                  <div style={{ marginTop: "0.85rem" }}>
                    <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--ink)", lineHeight: 1.3 }}>
                      {promo.name_th}
                    </h3>
                    <p style={{ fontSize: "0.8rem", color: "var(--ink-soft)", marginTop: "2px", fontWeight: 500 }}>
                      {promo.name_en}
                    </p>
                  </div>

                  {/* Description */}
                  {promo.desc_th && (
                    <p style={{ marginTop: "0.6rem", fontSize: "0.825rem", color: "var(--ink)", lineHeight: 1.4, backgroundColor: "var(--cream)", padding: "0.6rem 0.75rem", borderRadius: "0.6rem" }}>
                      {promo.desc_th}
                    </p>
                  )}

                  {/* Limits and Quota Info */}
                  <div style={{ marginTop: "0.85rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                    <div style={{ padding: "0.5rem", borderRadius: "0.5rem", border: "1px solid rgba(50,55,65,0.08)" }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--ink-soft)", display: "block" }}>โควตาทั้งหมด</span>
                      <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--ink)" }}>
                        {promo.all_limit !== null ? `${promo.all_limit} สิทธิ์` : "ไม่จำกัด"}
                      </span>
                    </div>

                    <div style={{ padding: "0.5rem", borderRadius: "0.5rem", border: "1px solid rgba(50,55,65,0.08)" }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--ink-soft)", display: "block" }}>จำกัดต่อคน</span>
                      <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--ink)" }}>
                        {promo.person_limit !== null ? `${promo.person_limit} สิทธิ์/คน` : "ไม่จำกัด"}
                      </span>
                    </div>
                  </div>

                  {/* Redemption Count Progress */}
                  <div style={{ marginTop: "0.75rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--ink-soft)", marginBottom: "4px" }}>
                      <span>แลกไปแล้ว</span>
                      <span style={{ fontWeight: 600, color: "var(--teal)" }}>
                        {promo.used_count} {promo.all_limit !== null ? `/ ${promo.all_limit}` : "ครั้ง"}
                      </span>
                    </div>
                    {promo.all_limit !== null && (
                      <div style={{ width: "100%", height: "6px", backgroundColor: "rgba(50, 55, 65, 0.08)", borderRadius: "9999px", overflow: "hidden" }}>
                        <div
                          style={{
                            height: "100%",
                            width: `${Math.min(100, (promo.used_count / promo.all_limit) * 100)}%`,
                            backgroundColor: isQuotaFull ? "#ef4444" : "var(--teal)",
                            borderRadius: "9999px",
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Dates */}
                <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid rgba(50, 55, 65, 0.08)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem", color: "var(--ink-soft)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <Calendar size={13} />
                    <span>{promo.start_date.substring(0, 10)} - {promo.end_date.substring(0, 10)}</span>
                  </div>
                  <span className="font-mono" style={{ fontSize: "0.7rem" }}>ID: #{promo.id}</span>
                </div>
              </div>
            );
          })}

          {paginatedPromotions.length === 0 && (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "4rem 1rem", backgroundColor: "var(--card)", borderRadius: "1.25rem", border: "1px dashed rgba(50, 55, 65, 0.15)", color: "var(--ink-soft)" }}>
              <Gift size={36} color="var(--ink-soft)" style={{ margin: "0 auto 0.75rem", opacity: 0.5 }} />
              <p style={{ fontSize: "1rem", fontWeight: 600 }}>ไม่พบโปรโมชั่นที่ค้นหา</p>
              <p style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>ลองเปลี่ยนคำค้นหา หรือกดปุ่มสร้างโปรโมชั่นใหม่</p>
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        {filteredPromotions.length > 0 && (
          <div
            style={{
              marginTop: "1.5rem",
              backgroundColor: "var(--card)",
              borderRadius: "1rem",
              border: "1px solid rgba(50, 55, 65, 0.1)",
              padding: "1rem 1.25rem",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem",
              fontSize: "0.85rem",
              color: "var(--ink-soft)",
            }}
          >
            {/* Info and Page Size Selector */}
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "1rem" }}>
              <span>
                แสดงรายการที่ {startIndex + 1} - {Math.min(startIndex + pageSize, filteredPromotions.length)} จากทั้งหมด {filteredPromotions.length} รายการ
              </span>

              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span style={{ fontSize: "0.8rem" }}>แสดง:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  style={{
                    padding: "0.3rem 0.5rem",
                    borderRadius: "0.5rem",
                    fontSize: "0.8rem",
                    fontFamily: "'Kanit', sans-serif",
                    backgroundColor: "var(--cream)",
                    border: "1px solid rgba(50, 55, 65, 0.15)",
                    color: "var(--ink)",
                    cursor: "pointer",
                    outline: "none",
                  }}
                >
                  <option value={6}>6 รายการ / หน้า</option>
                  <option value={10}>10 รายการ / หน้า</option>
                  <option value={20}>20 รายการ / หน้า</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage === 1}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "34px",
                  height: "34px",
                  borderRadius: "0.5rem",
                  border: "1px solid rgba(50, 55, 65, 0.1)",
                  backgroundColor: "var(--cream)",
                  color: safeCurrentPage === 1 ? "rgba(50,55,65,0.3)" : "var(--ink)",
                  cursor: safeCurrentPage === 1 ? "not-allowed" : "pointer",
                }}
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: totalPages }).map((_, idx) => {
                const pNum = idx + 1;
                const isActive = pNum === safeCurrentPage;
                return (
                  <button
                    key={pNum}
                    type="button"
                    onClick={() => setCurrentPage(pNum)}
                    style={{
                      width: "34px",
                      height: "34px",
                      borderRadius: "0.5rem",
                      border: isActive ? "none" : "1px solid rgba(50, 55, 65, 0.1)",
                      backgroundColor: isActive ? "var(--teal)" : "var(--cream)",
                      color: isActive ? "#fff" : "var(--ink)",
                      fontWeight: isActive ? 700 : 500,
                      fontSize: "0.8rem",
                      cursor: "pointer",
                      fontFamily: "'Kanit', sans-serif",
                    }}
                  >
                    {pNum}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage === totalPages}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "34px",
                  height: "34px",
                  borderRadius: "0.5rem",
                  border: "1px solid rgba(50, 55, 65, 0.1)",
                  backgroundColor: "var(--cream)",
                  color: safeCurrentPage === totalPages ? "rgba(50,55,65,0.3)" : "var(--ink)",
                  cursor: safeCurrentPage === totalPages ? "not-allowed" : "pointer",
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Add / Edit Promotion Modal */}
        {isModalOpen && (
          <div
            className="animate-fade-in"
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 100,
              padding: "1rem",
            }}
          >
            <div
              className="animate-modal-pop"
              style={{
                backgroundColor: "var(--card)",
                borderRadius: "1.25rem",
                width: "100%",
                maxWidth: "560px",
                maxHeight: "90vh",
                overflowY: "auto",
                padding: "1.75rem",
                boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
                border: "1px solid rgba(50, 55, 65, 0.1)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Gift size={20} color="var(--teal)" />
                  {editingPromotion ? "แก้ไขโปรโมชั่น" : "สร้างโปรโมชั่นใหม่"}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--ink-soft)" }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} style={{ marginTop: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                {/* Thai Name */}
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.35rem" }}>
                    ชื่อโปรโมชั่นภาษาไทย (name_th) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น สะสมครบ 5 แต้ม ฟรี 1 แก้ว"
                    value={formNameTh}
                    onChange={(e) => setFormNameTh(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.6rem 0.85rem",
                      borderRadius: "0.6rem",
                      border: "1px solid rgba(50, 55, 65, 0.15)",
                      backgroundColor: "var(--cream)",
                      fontFamily: "'Kanit', sans-serif",
                      fontSize: "0.9rem",
                      outline: "none",
                    }}
                  />
                </div>

                {/* English Name */}
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.35rem" }}>
                    ชื่อโปรโมชั่นภาษาอังกฤษ (name_en) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Collect 5 Points Get 1 Free"
                    value={formNameEn}
                    onChange={(e) => setFormNameEn(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.6rem 0.85rem",
                      borderRadius: "0.6rem",
                      border: "1px solid rgba(50, 55, 65, 0.15)",
                      backgroundColor: "var(--cream)",
                      fontFamily: "'Kanit', sans-serif",
                      fontSize: "0.9rem",
                      outline: "none",
                    }}
                  />
                </div>

                {/* Point Usage */}
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.35rem" }}>
                    จำนวนแต้มที่ใช้แลก (point_usage) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formPointUsage}
                    onChange={(e) => setFormPointUsage(Math.max(1, Number(e.target.value)))}
                    style={{
                      width: "100%",
                      padding: "0.6rem 0.85rem",
                      borderRadius: "0.6rem",
                      border: "1px solid rgba(50, 55, 65, 0.15)",
                      backgroundColor: "var(--cream)",
                      fontFamily: "'Kanit', sans-serif",
                      fontSize: "0.9rem",
                      outline: "none",
                    }}
                  />
                </div>

                {/* Quota Limits (All limit & Person limit) */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.35rem" }}>
                      โควตารวมทั้งหมด (all_limit)
                    </label>
                    <input
                      type="number"
                      min={1}
                      placeholder="ว่างไว้ = ไม่จำกัด"
                      value={formAllLimit}
                      onChange={(e) => setFormAllLimit(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.6rem 0.85rem",
                        borderRadius: "0.6rem",
                        border: "1px solid rgba(50, 55, 65, 0.15)",
                        backgroundColor: "var(--cream)",
                        fontFamily: "'Kanit', sans-serif",
                        fontSize: "0.85rem",
                        outline: "none",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.35rem" }}>
                      จำกัดต่อคน (person_limit)
                    </label>
                    <input
                      type="number"
                      min={1}
                      placeholder="ว่างไว้ = ไม่จำกัด"
                      value={formPersonLimit}
                      onChange={(e) => setFormPersonLimit(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.6rem 0.85rem",
                        borderRadius: "0.6rem",
                        border: "1px solid rgba(50, 55, 65, 0.15)",
                        backgroundColor: "var(--cream)",
                        fontFamily: "'Kanit', sans-serif",
                        fontSize: "0.85rem",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>

                {/* Dates (Start & End) */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.35rem" }}>
                      วันเวลาเริ่มต้น (start_date)
                    </label>
                    <input
                      type="datetime-local"
                      value={formStartDate}
                      onChange={(e) => setFormStartDate(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.55rem 0.75rem",
                        borderRadius: "0.6rem",
                        border: "1px solid rgba(50, 55, 65, 0.15)",
                        backgroundColor: "var(--cream)",
                        fontFamily: "'Kanit', sans-serif",
                        fontSize: "0.8rem",
                        outline: "none",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.35rem" }}>
                      วันเวลาสิ้นสุด (end_date)
                    </label>
                    <input
                      type="datetime-local"
                      value={formEndDate}
                      onChange={(e) => setFormEndDate(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.55rem 0.75rem",
                        borderRadius: "0.6rem",
                        border: "1px solid rgba(50, 55, 65, 0.15)",
                        backgroundColor: "var(--cream)",
                        fontFamily: "'Kanit', sans-serif",
                        fontSize: "0.8rem",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>

                {/* Thai Description */}
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.35rem" }}>
                    รายละเอียดเงื่อนไขภาษาไทย (desc_th)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="รายละเอียดเพิ่มเติมและเงื่อนไขการแลกสิทธิ์..."
                    value={formDescTh}
                    onChange={(e) => setFormDescTh(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.6rem 0.85rem",
                      borderRadius: "0.6rem",
                      border: "1px solid rgba(50, 55, 65, 0.15)",
                      backgroundColor: "var(--cream)",
                      fontFamily: "'Kanit', sans-serif",
                      fontSize: "0.85rem",
                      outline: "none",
                      resize: "vertical",
                    }}
                  />
                </div>

                {/* English Description */}
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.35rem" }}>
                    รายละเอียดเงื่อนไขภาษาอังกฤษ (desc_en)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="English terms and conditions..."
                    value={formDescEn}
                    onChange={(e) => setFormDescEn(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.6rem 0.85rem",
                      borderRadius: "0.6rem",
                      border: "1px solid rgba(50, 55, 65, 0.15)",
                      backgroundColor: "var(--cream)",
                      fontFamily: "'Kanit', sans-serif",
                      fontSize: "0.85rem",
                      outline: "none",
                      resize: "vertical",
                    }}
                  />
                </div>

                {/* Is Active Toggle */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <input
                    type="checkbox"
                    id="formIsActive"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    style={{ width: "18px", height: "18px", accentColor: "var(--teal)", cursor: "pointer" }}
                  />
                  <label htmlFor="formIsActive" style={{ fontSize: "0.875rem", fontWeight: 600, cursor: "pointer" }}>
                    เปิดใช้งานโปรโมชั่นนี้ทันที (is_active)
                  </label>
                </div>

                {/* Buttons */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    style={{
                      padding: "0.6rem 1.25rem",
                      borderRadius: "0.6rem",
                      border: "1px solid rgba(50, 55, 65, 0.15)",
                      backgroundColor: "transparent",
                      color: "var(--ink)",
                      cursor: "pointer",
                      fontFamily: "'Kanit', sans-serif",
                      fontWeight: 500,
                    }}
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: "0.6rem 1.5rem",
                      borderRadius: "0.6rem",
                      border: "none",
                      backgroundColor: "var(--teal)",
                      color: "#fff",
                      cursor: "pointer",
                      fontFamily: "'Kanit', sans-serif",
                      fontWeight: 600,
                      boxShadow: "0 2px 8px rgba(75, 155, 140, 0.25)",
                    }}
                  >
                    {editingPromotion ? "บันทึกการแก้ไข" : "สร้างโปรโมชั่น"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
