"use client";

import React, { useState } from "react";
import Image from "next/image";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import {
  Search,
  Plus,
  MoreVertical,
  Eye,
  EyeOff,
  Edit3,
  Trash2,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  UploadCloud,
  MoveUp,
  MoveDown,
  Layers,
} from "lucide-react";

interface BannerItem {
  id: number;
  banner_id: number;
  image_url: string;
  order: number;
  is_active: boolean;
  created_at: string;
}

interface Banner {
  id: number;
  name_th: string;
  name_en: string;
  desc_th: string;
  desc_en: string;
  is_active: boolean;
  created_at: string;
  items: BannerItem[];
}

const INITIAL_BANNERS: Banner[] = [
  {
    id: 1,
    name_th: "แบนเนอร์หลักหน้าแรก (Home Hero Banner)",
    name_en: "Main Homepage Hero Banner",
    desc_th: "แสดงส่วนบนสุดของหน้าแรก ประชาสัมพันธ์งานเกษตรแฟร์ และเมนูแนะนำ",
    desc_en: "Top hero slider on storefront homepage for Kaset Fair 70 promotions.",
    is_active: true,
    created_at: "2026-09-01 09:00",
    items: [
      {
        id: 101,
        banner_id: 1,
        image_url: "/images/hero-soy.jpg",
        order: 1,
        is_active: true,
        created_at: "2026-09-01 09:05",
      },
      {
        id: 102,
        banner_id: 1,
        image_url: "/images/drink-matcha.jpg",
        order: 2,
        is_active: true,
        created_at: "2026-09-01 09:10",
      },
      {
        id: 103,
        banner_id: 1,
        image_url: "/images/drink-mango.jpg",
        order: 3,
        is_active: true,
        created_at: "2026-09-01 09:15",
      },
    ],
  },
  {
    id: 2,
    name_th: "แบนเนอร์โปรโมชั่นสะสมแต้ม (Reward Promotion Banner)",
    name_en: "Loyalty Points Promo Banner",
    desc_th: "แบนเนอร์แสดงในหน้าโปรโมชั่น และระบบสมาชิก",
    desc_en: "Banner displayed inside promotions and loyalty reward screen.",
    is_active: true,
    created_at: "2026-09-01 10:00",
    items: [
      {
        id: 201,
        banner_id: 2,
        image_url: "/images/drink-lychee.jpg",
        order: 1,
        is_active: true,
        created_at: "2026-09-01 10:05",
      },
      {
        id: 202,
        banner_id: 2,
        image_url: "/images/drink-pearl.jpg",
        order: 2,
        is_active: true,
        created_at: "2026-09-01 10:10",
      },
    ],
  },
  {
    id: 3,
    name_th: "แบนเนอร์กิจกรรม Flash Sale พิเศษ",
    name_en: "Flash Sale Special Campaign Banner",
    desc_th: "ใช้สำหรับช่วงเวลานาทีทองช่วงเย็นที่บูธเกษตรแฟร์",
    desc_en: "Special evening flash sale campaign at Kaset Fair stall.",
    is_active: false,
    created_at: "2026-09-02 14:00",
    items: [
      {
        id: 301,
        banner_id: 3,
        image_url: "/images/hero-soy.jpg",
        order: 1,
        is_active: true,
        created_at: "2026-09-02 14:10",
      },
    ],
  },
];

export default function BannerManagementPage() {
  const [banners, setBanners] = useState<Banner[]>(INITIAL_BANNERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [sortBy, setSortBy] = useState<"created_desc" | "items_count" | "name_asc">("created_desc");
  const [pageSize, setPageSize] = useState<number>(6);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Kebab Action State
  const [activeKebabId, setActiveKebabId] = useState<number | null>(null);

  // Banner Group Modal (Add / Edit)
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [formNameTh, setFormNameTh] = useState("");
  const [formNameEn, setFormNameEn] = useState("");
  const [formDescTh, setFormDescTh] = useState("");
  const [formDescEn, setFormDescEn] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);

  // Banner Items Management Modal
  const [managingItemsBanner, setManagingItemsBanner] = useState<Banner | null>(null);
  const [newItemUrl, setNewItemUrl] = useState("/images/hero-soy.jpg");

  // Open Group Modal for Add
  const handleOpenAdd = () => {
    setEditingBanner(null);
    setFormNameTh("");
    setFormNameEn("");
    setFormDescTh("");
    setFormDescEn("");
    setFormIsActive(true);
    setIsGroupModalOpen(true);
  };

  // Open Group Modal for Edit
  const handleOpenEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormNameTh(banner.name_th);
    setFormNameEn(banner.name_en);
    setFormDescTh(banner.desc_th);
    setFormDescEn(banner.desc_en);
    setFormIsActive(banner.is_active);
    setIsGroupModalOpen(true);
    setActiveKebabId(null);
  };

  // Toggle Banner Group Active
  const handleToggleActive = (id: number) => {
    setBanners((prev) =>
      prev.map((b) => (b.id === id ? { ...b, is_active: !b.is_active } : b))
    );
    setActiveKebabId(null);
  };

  // Submit Banner Group Form
  const handleSubmitGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNameTh.trim() || !formNameEn.trim()) return;

    if (editingBanner) {
      setBanners((prev) =>
        prev.map((b) =>
          b.id === editingBanner.id
            ? {
                ...b,
                name_th: formNameTh.trim(),
                name_en: formNameEn.trim(),
                desc_th: formDescTh.trim(),
                desc_en: formDescEn.trim(),
                is_active: formIsActive,
              }
            : b
        )
      );
    } else {
      const newB: Banner = {
        id: Date.now(),
        name_th: formNameTh.trim(),
        name_en: formNameEn.trim(),
        desc_th: formDescTh.trim(),
        desc_en: formDescEn.trim(),
        is_active: formIsActive,
        created_at: new Date().toISOString().replace("T", " ").substring(0, 16),
        items: [],
      };
      setBanners([newB, ...banners]);
    }
    setIsGroupModalOpen(false);
  };

  // Manage Banner Items Actions
  const handleAddItemToBanner = (bannerId: number) => {
    if (!newItemUrl.trim()) return;

    setBanners((prev) =>
      prev.map((b) => {
        if (b.id === bannerId) {
          const newItem: BannerItem = {
            id: Date.now(),
            banner_id: bannerId,
            image_url: newItemUrl.trim(),
            order: b.items.length + 1,
            is_active: true,
            created_at: new Date().toISOString().replace("T", " ").substring(0, 16),
          };
          const updated = { ...b, items: [...b.items, newItem] };
          if (managingItemsBanner?.id === bannerId) setManagingItemsBanner(updated);
          return updated;
        }
        return b;
      })
    );
  };

  const handleToggleItemActive = (bannerId: number, itemId: number) => {
    setBanners((prev) =>
      prev.map((b) => {
        if (b.id === bannerId) {
          const updatedItems = b.items.map((it) =>
            it.id === itemId ? { ...it, is_active: !it.is_active } : it
          );
          const updated = { ...b, items: updatedItems };
          if (managingItemsBanner?.id === bannerId) setManagingItemsBanner(updated);
          return updated;
        }
        return b;
      })
    );
  };

  const handleDeleteItem = (bannerId: number, itemId: number) => {
    setBanners((prev) =>
      prev.map((b) => {
        if (b.id === bannerId) {
          const filtered = b.items
            .filter((it) => it.id !== itemId)
            .map((it, idx) => ({ ...it, order: idx + 1 }));
          const updated = { ...b, items: filtered };
          if (managingItemsBanner?.id === bannerId) setManagingItemsBanner(updated);
          return updated;
        }
        return b;
      })
    );
  };

  const handleMoveItemOrder = (bannerId: number, index: number, direction: "up" | "down") => {
    setBanners((prev) =>
      prev.map((b) => {
        if (b.id === bannerId) {
          const targetIndex = direction === "up" ? index - 1 : index + 1;
          if (targetIndex < 0 || targetIndex >= b.items.length) return b;

          const reordered = [...b.items];
          const [moved] = reordered.splice(index, 1);
          reordered.splice(targetIndex, 0, moved);

          const updatedItems = reordered.map((it, idx) => ({ ...it, order: idx + 1 }));
          const updated = { ...b, items: updatedItems };
          if (managingItemsBanner?.id === bannerId) setManagingItemsBanner(updated);
          return updated;
        }
        return b;
      })
    );
  };

  // Filter & Sort
  const filteredBanners = banners
    .filter((b) => {
      if (statusFilter === "active" && !b.is_active) return false;
      if (statusFilter === "inactive" && b.is_active) return false;

      const q = searchQuery.toLowerCase();
      return (
        b.name_th.toLowerCase().includes(q) ||
        b.name_en.toLowerCase().includes(q) ||
        b.desc_th.toLowerCase().includes(q) ||
        b.desc_en.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === "created_desc") return b.created_at.localeCompare(a.created_at);
      if (sortBy === "items_count") return b.items.length - a.items.length;
      if (sortBy === "name_asc") return a.name_th.localeCompare(b.name_th);
      return 0;
    });

  // Pagination Calculation
  const totalPages = Math.ceil(filteredBanners.length / pageSize) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedBanners = filteredBanners.slice(startIndex, startIndex + pageSize);

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
              จัดการแบนเนอร์ประชาสัมพันธ์
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
            <span>สร้างกลุ่มแบนเนอร์ใหม่</span>
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
              placeholder="ค้นหาชื่อกลุ่มแบนเนอร์ หรือรายละเอียด..."
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
                <option value="items_count">จำนวนรูปภาพ (มาก → น้อย)</option>
                <option value="name_asc">ชื่อแบนเนอร์ (ก-ฮ)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Banners Grid List */}
        <div style={{ marginTop: "1.25rem", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "1.25rem" }}>
          {paginatedBanners.map((banner) => (
            <div
              key={banner.id}
              style={{
                backgroundColor: "var(--card)",
                borderRadius: "1.25rem",
                border: banner.is_active ? "1px solid rgba(50, 55, 65, 0.1)" : "1px dashed rgba(50, 55, 65, 0.2)",
                padding: "1.25rem",
                boxShadow: "0 4px 16px -2px rgba(0,0,0,0.04)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                opacity: banner.is_active ? 1 : 0.65,
                position: "relative",
                transition: "all 0.15s ease",
              }}
            >
              <div>
                {/* Top Info + Status + Kebab */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.3rem",
                        backgroundColor: "rgba(75, 155, 140, 0.15)",
                        color: "var(--teal)",
                        padding: "0.3rem 0.65rem",
                        borderRadius: "9999px",
                        fontWeight: 700,
                        fontSize: "0.85rem",
                      }}
                    >
                      <Layers size={14} />
                      {banner.items.length} รูปภาพ
                    </span>

                    {banner.is_active ? (
                      <span style={{ fontSize: "0.75rem", color: "#22c55e", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                        <CheckCircle2 size={13} /> แสดงผล
                      </span>
                    ) : (
                      <span style={{ fontSize: "0.75rem", color: "var(--ink-soft)", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                        <XCircle size={13} /> ปิดซ่อน
                      </span>
                    )}
                  </div>

                  {/* Kebab Action Menu */}
                  <div style={{ position: "relative" }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveKebabId(activeKebabId === banner.id ? null : banner.id);
                      }}
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "0.5rem",
                        border: "none",
                        backgroundColor: activeKebabId === banner.id ? "rgba(50, 55, 65, 0.08)" : "transparent",
                        color: "var(--ink-soft)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                      }}
                    >
                      <MoreVertical size={18} />
                    </button>

                    {activeKebabId === banner.id && (
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
                          minWidth: "170px",
                          zIndex: 20,
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.15rem",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setManagingItemsBanner(banner);
                            setActiveKebabId(null);
                          }}
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
                          <ImageIcon size={15} color="var(--teal)" />
                          <span>จัดการรูปภาพสไลด์</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEdit(banner)}
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
                          <span>แก้ไขกลุ่มแบนเนอร์</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleActive(banner.id)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            padding: "0.5rem 0.75rem",
                            border: "none",
                            backgroundColor: "transparent",
                            color: banner.is_active ? "var(--ink-soft)" : "var(--teal)",
                            fontSize: "0.85rem",
                            borderRadius: "0.5rem",
                            cursor: "pointer",
                            textAlign: "left",
                            fontFamily: "'Kanit', sans-serif",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(50, 55, 65, 0.05)")}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                        >
                          {banner.is_active ? <EyeOff size={15} /> : <Eye size={15} />}
                          <span>{banner.is_active ? "ปิดการแสดงผล" : "เปิดการแสดงผล"}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Banner Name */}
                <div style={{ marginTop: "0.85rem" }}>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--ink)", lineHeight: 1.3 }}>
                    {banner.name_th}
                  </h3>
                  <p style={{ fontSize: "0.8rem", color: "var(--ink-soft)", marginTop: "2px", fontWeight: 500 }}>
                    {banner.name_en}
                  </p>
                </div>

                {/* Description */}
                {banner.desc_th && (
                  <p style={{ marginTop: "0.6rem", fontSize: "0.825rem", color: "var(--ink)", lineHeight: 1.4, backgroundColor: "var(--cream)", padding: "0.6rem 0.75rem", borderRadius: "0.6rem" }}>
                    {banner.desc_th}
                  </p>
                )}

                {/* Image Previews Strip */}
                <div style={{ marginTop: "0.85rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--ink-soft)", fontWeight: 600 }}>รูปภาพในกลุ่ม:</span>
                    <button
                      type="button"
                      onClick={() => setManagingItemsBanner(banner)}
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--teal)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontWeight: 600,
                        fontFamily: "'Kanit', sans-serif",
                      }}
                    >
                      + จัดการรูปภาพ
                    </button>
                  </div>

                  <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "4px" }}>
                    {banner.items.map((item, idx) => (
                      <div
                        key={item.id}
                        style={{
                          position: "relative",
                          width: "75px",
                          height: "48px",
                          borderRadius: "0.5rem",
                          overflow: "hidden",
                          flexShrink: 0,
                          border: item.is_active ? "1px solid rgba(75, 155, 140, 0.4)" : "1px dashed rgba(50, 55, 65, 0.3)",
                          opacity: item.is_active ? 1 : 0.4,
                        }}
                      >
                        <Image
                          src={item.image_url}
                          alt={`Banner Item ${idx + 1}`}
                          fill
                          sizes="75px"
                          style={{ objectFit: "cover" }}
                        />
                        <span
                          style={{
                            position: "absolute",
                            bottom: 2,
                            right: 2,
                            backgroundColor: "rgba(0,0,0,0.6)",
                            color: "#fff",
                            fontSize: "0.65rem",
                            padding: "0 4px",
                            borderRadius: "3px",
                            fontWeight: 600,
                          }}
                        >
                          #{item.order}
                        </span>
                      </div>
                    ))}

                    {banner.items.length === 0 && (
                      <div style={{ width: "100%", padding: "0.75rem", backgroundColor: "rgba(50,55,65,0.03)", borderRadius: "0.5rem", textAlign: "center", fontSize: "0.75rem", color: "var(--ink-soft)" }}>
                        ยังไม่มีรูปภาพในแบนเนอร์นี้
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid rgba(50, 55, 65, 0.08)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem", color: "var(--ink-soft)" }}>
                <span>สร้างเมื่อ: {banner.created_at.substring(0, 10)}</span>
                <span className="font-mono" style={{ fontSize: "0.7rem" }}>ID: #{banner.id}</span>
              </div>
            </div>
          ))}

          {paginatedBanners.length === 0 && (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "4rem 1rem", backgroundColor: "var(--card)", borderRadius: "1.25rem", border: "1px dashed rgba(50, 55, 65, 0.15)", color: "var(--ink-soft)" }}>
              <ImageIcon size={36} color="var(--ink-soft)" style={{ margin: "0 auto 0.75rem", opacity: 0.5 }} />
              <p style={{ fontSize: "1rem", fontWeight: 600 }}>ไม่พบกลุ่มแบนเนอร์ที่ค้นหา</p>
              <p style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>ลองเปลี่ยนคำค้นหา หรือกดปุ่มสร้างกลุ่มแบนเนอร์ใหม่</p>
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        {filteredBanners.length > 0 && (
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
                แสดงรายการที่ {startIndex + 1} - {Math.min(startIndex + pageSize, filteredBanners.length)} จากทั้งหมด {filteredBanners.length} รายการ
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
                  <option value={12}>12 รายการ / หน้า</option>
                  <option value={24}>24 รายการ / หน้า</option>
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

        {/* Add / Edit Banner Group Modal */}
        {isGroupModalOpen && (
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
                maxWidth: "520px",
                padding: "1.75rem",
                boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
                border: "1px solid rgba(50, 55, 65, 0.1)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Layers size={20} color="var(--teal)" />
                  {editingBanner ? "แก้ไขกลุ่มแบนเนอร์" : "สร้างกลุ่มแบนเนอร์ใหม่"}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsGroupModalOpen(false)}
                  style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--ink-soft)" }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmitGroup} style={{ marginTop: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.35rem" }}>
                    ชื่อกลุ่มแบนเนอร์ภาษาไทย (name_th) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น แบนเนอร์หลักหน้าแรก"
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

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.35rem" }}>
                    ชื่อกลุ่มแบนเนอร์ภาษาอังกฤษ (name_en) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Main Homepage Hero Banner"
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

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.35rem" }}>
                    รายละเอียดภาษาไทย (desc_th)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="คำอธิบายตำแหน่งการแสดงผล..."
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

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.35rem" }}>
                    รายละเอียดภาษาอังกฤษ (desc_en)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="English description..."
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

                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <input
                    type="checkbox"
                    id="formIsActive"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    style={{ width: "18px", height: "18px", accentColor: "var(--teal)", cursor: "pointer" }}
                  />
                  <label htmlFor="formIsActive" style={{ fontSize: "0.875rem", fontWeight: 600, cursor: "pointer" }}>
                    เปิดใช้งานกลุ่มแบนเนอร์นี้ (is_active)
                  </label>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
                  <button
                    type="button"
                    onClick={() => setIsGroupModalOpen(false)}
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
                    {editingBanner ? "บันทึกการแก้ไข" : "สร้างกลุ่มแบนเนอร์"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Manage Banner Items (Slides) Modal */}
        {managingItemsBanner && (
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
                maxWidth: "680px",
                maxHeight: "90vh",
                overflowY: "auto",
                padding: "1.75rem",
                boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
                border: "1px solid rgba(50, 55, 65, 0.1)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <ImageIcon size={20} color="var(--teal)" />
                    จัดการรูปภาพสไลด์ในแบนเนอร์
                  </h3>
                  <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)", marginTop: "2px" }}>
                    กลุ่ม: <strong style={{ color: "var(--teal)" }}>{managingItemsBanner.name_th}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setManagingItemsBanner(null)}
                  style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--ink-soft)" }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Add New Item Image Form */}
              <div style={{ marginTop: "1.25rem", padding: "1rem", backgroundColor: "var(--cream)", borderRadius: "0.75rem", border: "1px solid rgba(50, 55, 65, 0.1)" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem" }}>
                  เพิ่มรูปภาพสไลด์ใหม่ (image_url)
                </label>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <select
                    value={newItemUrl}
                    onChange={(e) => setNewItemUrl(e.target.value)}
                    style={{
                      flex: 1,
                      padding: "0.55rem 0.75rem",
                      borderRadius: "0.6rem",
                      border: "1px solid rgba(50, 55, 65, 0.15)",
                      backgroundColor: "var(--card)",
                      fontFamily: "'Kanit', sans-serif",
                      fontSize: "0.85rem",
                      outline: "none",
                    }}
                  >
                    <option value="/images/hero-soy.jpg">น้ำเต้าหู้ดั้งเดิม (hero-soy.jpg)</option>
                    <option value="/images/drink-matcha.jpg">น้ำเต้าหู้มัทฉะ (drink-matcha.jpg)</option>
                    <option value="/images/drink-mango.jpg">น้ำเต้าหู้ชาไทย (drink-mango.jpg)</option>
                    <option value="/images/drink-lychee.jpg">น้ำเต้าหู้นมเย็น (drink-lychee.jpg)</option>
                    <option value="/images/drink-pearl.jpg">ท็อปปิ้งไข่มุก (drink-pearl.jpg)</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => handleAddItemToBanner(managingItemsBanner.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      backgroundColor: "var(--teal)",
                      color: "#fff",
                      padding: "0.55rem 1rem",
                      borderRadius: "0.6rem",
                      border: "none",
                      fontWeight: 600,
                      fontSize: "0.85rem",
                      cursor: "pointer",
                      fontFamily: "'Kanit', sans-serif",
                    }}
                  >
                    <UploadCloud size={16} />
                    <span>เพิ่มรูปภาพ</span>
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div style={{ marginTop: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <h4 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--ink)" }}>
                  รายการรูปภาพทั้งหมด ({managingItemsBanner.items.length} ภาพ)
                </h4>

                {managingItemsBanner.items.map((item, index) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.75rem 1rem",
                      backgroundColor: "var(--card)",
                      borderRadius: "0.75rem",
                      border: "1px solid rgba(50, 55, 65, 0.1)",
                      gap: "1rem",
                      opacity: item.is_active ? 1 : 0.5,
                    }}
                  >
                    {/* Left Info */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <span className="font-mono" style={{ fontWeight: 700, color: "var(--teal)", fontSize: "0.9rem", width: "24px" }}>
                        #{item.order}
                      </span>

                      <div style={{ position: "relative", width: "65px", height: "42px", borderRadius: "0.4rem", overflow: "hidden", flexShrink: 0 }}>
                        <Image
                          src={item.image_url}
                          alt={`Slide ${item.order}`}
                          fill
                          sizes="65px"
                          style={{ objectFit: "cover" }}
                        />
                      </div>

                      <div>
                        <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--ink)" }}>
                          {item.image_url}
                        </p>
                        <p style={{ fontSize: "0.75rem", color: "var(--ink-soft)" }}>
                          {item.is_active ? "🟢 กำลังแสดงผล" : "⚪ ซ่อนอยู่"}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons: Move Up/Down, Toggle Active, Delete */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      {/* Move Up */}
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => handleMoveItemOrder(managingItemsBanner.id, index, "up")}
                        title="เลื่อนขึ้น"
                        style={{
                          width: "30px",
                          height: "30px",
                          borderRadius: "0.4rem",
                          border: "1px solid rgba(50, 55, 65, 0.1)",
                          backgroundColor: "transparent",
                          color: index === 0 ? "rgba(50,55,65,0.2)" : "var(--ink)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: index === 0 ? "not-allowed" : "pointer",
                        }}
                      >
                        <MoveUp size={14} />
                      </button>

                      {/* Move Down */}
                      <button
                        type="button"
                        disabled={index === managingItemsBanner.items.length - 1}
                        onClick={() => handleMoveItemOrder(managingItemsBanner.id, index, "down")}
                        title="เลื่อนลง"
                        style={{
                          width: "30px",
                          height: "30px",
                          borderRadius: "0.4rem",
                          border: "1px solid rgba(50, 55, 65, 0.1)",
                          backgroundColor: "transparent",
                          color: index === managingItemsBanner.items.length - 1 ? "rgba(50,55,65,0.2)" : "var(--ink)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: index === managingItemsBanner.items.length - 1 ? "not-allowed" : "pointer",
                        }}
                      >
                        <MoveDown size={14} />
                      </button>

                      {/* Toggle Active */}
                      <button
                        type="button"
                        onClick={() => handleToggleItemActive(managingItemsBanner.id, item.id)}
                        title={item.is_active ? "ซ่อนรูปนี้" : "แสดงรูปนี้"}
                        style={{
                          width: "30px",
                          height: "30px",
                          borderRadius: "0.4rem",
                          border: "1px solid rgba(50, 55, 65, 0.1)",
                          backgroundColor: "transparent",
                          color: item.is_active ? "var(--teal)" : "var(--ink-soft)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                        }}
                      >
                        {item.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(managingItemsBanner.id, item.id)}
                        title="ลบรูปภาพ"
                        style={{
                          width: "30px",
                          height: "30px",
                          borderRadius: "0.4rem",
                          border: "1px solid rgba(239, 68, 68, 0.2)",
                          backgroundColor: "transparent",
                          color: "#ef4444",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}

                {managingItemsBanner.items.length === 0 && (
                  <p style={{ textAlign: "center", padding: "2rem", color: "var(--ink-soft)", fontSize: "0.85rem" }}>
                    ยังไม่มีรูปภาพในกลุ่มนี้ เพิ่มรูปภาพแรกที่ฟอร์มด้านบน
                  </p>
                )}
              </div>

              {/* Close Button */}
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.5rem" }}>
                <button
                  type="button"
                  onClick={() => setManagingItemsBanner(null)}
                  style={{
                    padding: "0.6rem 1.5rem",
                    borderRadius: "0.6rem",
                    border: "none",
                    backgroundColor: "var(--teal)",
                    color: "#fff",
                    cursor: "pointer",
                    fontFamily: "'Kanit', sans-serif",
                    fontWeight: 600,
                  }}
                >
                  เสร็จสิ้น
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
