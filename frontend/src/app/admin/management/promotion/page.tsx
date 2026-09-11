"use client";

import React, { useState, useEffect, useCallback } from "react";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import AuthGuard from "@/components/ui/AuthGuard";
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
  Award,
  Trash2,
  Loader2,
  Users,
} from "lucide-react";
import { getStoredToken } from "@/lib/auth";
import { useToast } from "@/components/ui/toast";
import AddEditPromotionModal from "./components/AddEditPromotionModal";

export interface Promotion {
  id: number;
  name_th: string;
  name_en: string;
  desc_th?: string | null;
  desc_en?: string | null;
  point_usage: number;
  all_limit: number | null; // NULL = ไม่จำกัด
  person_limit: number | null; // NULL = ไม่จำกัดต่อคน
  used_count: number; // สถิติแลกไปแล้ว
  start_date?: string | null;
  end_date?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

const ITEMS_PER_PAGE = 6;

export default function PromotionManagementPage() {
  const { success, error: toastError, info } = useToast();

  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Kebab Menu Action Popover State
  const [activeKebabId, setActiveKebabId] = useState<number | null>(null);

  // Add/Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Form State
  const [formNameTh, setFormNameTh] = useState("");
  const [formNameEn, setFormNameEn] = useState("");
  const [formDescTh, setFormDescTh] = useState("");
  const [formDescEn, setFormDescEn] = useState("");
  const [formPointUsage, setFormPointUsage] = useState<number>(5);
  const [formAllLimit, setFormAllLimit] = useState<string>("");
  const [formPersonLimit, setFormPersonLimit] = useState<string>("");
  const [formStartDate, setFormStartDate] = useState(new Date().toISOString().substring(0, 16));
  const [formEndDate, setFormEndDate] = useState("2026-09-15T23:59");
  const [formIsActive, setFormIsActive] = useState(true);

  // Delete Modal State (Matching toppings delete format)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [deleteItem, setDeleteItem] = useState<Promotion | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Helper to format Date
  const formatDateInput = (dateStr?: string | null) => {
    if (!dateStr) return "";
    return dateStr.replace(" ", "T").substring(0, 16);
  };

  const formatDateDisplay = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    return dateStr.substring(0, 10);
  };

  // Close kebab when clicking outside (using .promotion-kebab-container)
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".promotion-kebab-container")) {
        setActiveKebabId(null);
      }
    };
    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, []);

  // Fetch Promotions from Backend API
  const fetchPromotions = useCallback(async () => {
    setIsLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585";
      const params = new URLSearchParams({
        page: currentPage.toString(),
        page_size: ITEMS_PER_PAGE.toString(),
      });
      if (searchQuery.trim()) params.append("q", searchQuery.trim());
      if (statusFilter !== "all") params.append("status", statusFilter);

      const res = await fetch(`${apiUrl}/api/v1/promotions?${params.toString()}`);
      if (res.ok) {
        const result = await res.json();
        setPromotions(result.data || []);
        if (result.pagination) {
          setTotal(result.pagination.total_items || 0);
          setTotalPages(result.pagination.total_pages || 1);
        }
      } else {
        setPromotions([]);
        setTotal(0);
        setTotalPages(1);
      }
    } catch (err) {
      console.error("Failed to fetch promotions", err);
      setPromotions([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchQuery, statusFilter]);

  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  // Open Modal for Add
  const openAddModal = () => {
    setModalMode("create");
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
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const openEditModal = (promo: Promotion) => {
    setModalMode("edit");
    setEditingPromotion(promo);
    setFormNameTh(promo.name_th);
    setFormNameEn(promo.name_en);
    setFormDescTh(promo.desc_th || "");
    setFormDescEn(promo.desc_en || "");
    setFormPointUsage(promo.point_usage);
    setFormAllLimit(promo.all_limit !== null ? String(promo.all_limit) : "");
    setFormPersonLimit(promo.person_limit !== null ? String(promo.person_limit) : "");
    setFormStartDate(formatDateInput(promo.start_date));
    setFormEndDate(formatDateInput(promo.end_date));
    setFormIsActive(promo.is_active);
    setFormError(null);
    setIsModalOpen(true);
    setActiveKebabId(null);
  };

  // Toggle Visibility (ซ่อน / แสดง)
  const toggleVisibility = async (promo: Promotion) => {
    setActiveKebabId(null);
    const newStatus = !promo.is_active;

    // Optimistic update
    setPromotions((prev) =>
      prev.map((p) => (p.id === promo.id ? { ...p, is_active: newStatus } : p))
    );

    try {
      const token = getStoredToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585";

      const res = await fetch(`${apiUrl}/api/v1/promotions/${promo.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_active: newStatus }),
      });

      if (res.ok) {
        if (newStatus) {
          success(`เปิดแสดงโปรโมชั่น "${promo.name_th}" แล้ว`, "เปิดโปรโมชั่น");
        } else {
          info(`ซ่อนโปรโมชั่น "${promo.name_th}" เรียบร้อยแล้ว`, "ซ่อนโปรโมชั่น");
        }
      } else {
        toastError("ไม่สามารถเปลี่ยนสถานะโปรโมชั่นได้", "เกิดข้อผิดพลาด");
        fetchPromotions();
      }
    } catch {
      toastError("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์", "เกิดข้อผิดพลาด");
      fetchPromotions();
    }
  };

  // Submit Add / Edit Form (POST / PUT API)
  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNameTh.trim() || !formNameEn.trim()) {
      setFormError("กรุณากรอกชื่อโปรโมชั่นทั้งภาษาไทยและภาษาอังกฤษ");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const token = getStoredToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585";

      const payload = {
        name_th: formNameTh.trim(),
        name_en: formNameEn.trim(),
        desc_th: formDescTh.trim() ? formDescTh.trim() : null,
        desc_en: formDescEn.trim() ? formDescEn.trim() : null,
        point_usage: formPointUsage,
        all_limit: formAllLimit ? Number(formAllLimit) : null,
        person_limit: formPersonLimit ? Number(formPersonLimit) : null,
        start_date: formStartDate ? new Date(formStartDate).toISOString() : null,
        end_date: formEndDate ? new Date(formEndDate).toISOString() : null,
        is_active: formIsActive,
      };

      if (modalMode === "edit" && editingPromotion) {
        const res = await fetch(`${apiUrl}/api/v1/promotions/${editingPromotion.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) {
          setFormError(data.error || "ไม่สามารถแก้ไขโปรโมชั่นได้");
          return;
        }

        success("แก้ไขข้อมูลโปรโมชั่นสำเร็จ!", "แก้ไขโปรโมชั่น");
      } else {
        const res = await fetch(`${apiUrl}/api/v1/promotions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) {
          setFormError(data.error || "ไม่สามารถสร้างโปรโมชั่นได้");
          return;
        }

        success("สร้างโปรโมชั่นใหม่สำเร็จ!", "เพิ่มโปรโมชั่น");
      }

      setIsModalOpen(false);
      fetchPromotions();
    } catch (err: any) {
      setFormError(err?.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Delete Modal
  const openDeleteModal = (promo: Promotion) => {
    setDeleteItem(promo);
    setDeleteConfirmText("");
    setDeleteError(null);
    setIsDeleteModalOpen(true);
    setActiveKebabId(null);
  };

  // Submit Delete (DELETE API)
  const handleDeleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteItem) return;
    setDeleteError(null);

    if (deleteConfirmText.trim().toLowerCase() !== "delete this promotion") {
      setDeleteError('กรุณาพิมพ์ "delete this promotion" เพื่อยืนยันการลบ');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = getStoredToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585";

      const res = await fetch(`${apiUrl}/api/v1/promotions/${deleteItem.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        setDeleteError(data.error || "เกิดข้อผิดพลาดในการลบโปรโมชั่น");
        toastError(data.error || "เกิดข้อผิดพลาดในการลบโปรโมชั่น", "ลบไม่สำเร็จ");
        return;
      }

      success(`ลบโปรโมชั่น "${deleteItem.name_th}" ออกจากระบบแล้ว`, "ลบโปรโมชั่นสำเร็จ");
      setIsDeleteModalOpen(false);
      fetchPromotions();
    } catch {
      setDeleteError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
      toastError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้", "เกิดข้อผิดพลาด");
    } finally {
      setIsSubmitting(false);
    }
  };

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  return (
    <AuthGuard>
      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          backgroundColor: "var(--cream)",
          color: "var(--ink)",
          fontFamily: "'Kanit', sans-serif",
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
          </div>

          {/* Filter and Search Bar Container (Matching Toppings Layout) */}
          <div
            style={{
              marginTop: "1.5rem",
              backgroundColor: "var(--card)",
              padding: "1.5rem",
              borderRadius: "1.25rem",
              border: "1px solid rgba(50, 55, 65, 0.1)",
              boxShadow: "0 4px 20px -2px rgba(0,0,0,0.03)",
            }}
          >
            {/* Controls Bar: Filter Tabs / Dropdown on Left & Add Button / Search on Right */}
            <div className="admin-controls-bar" style={{ marginBottom: 0 }}>
              {/* Left Side: Filter Tabs (Desktop) */}
              <div className="admin-filter-tabs">
                {[
                  { id: "all", label: "ทั้งหมด" },
                  { id: "active", label: "เปิดใช้งาน" },
                  { id: "inactive", label: "ปิดใช้งาน" },
                ].map((tab) => {
                  const isSelected = statusFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setStatusFilter(tab.id as any);
                        setCurrentPage(1);
                      }}
                      style={{
                        padding: "0.4rem 0.85rem",
                        borderRadius: "0.5rem",
                        fontSize: "0.8rem",
                        fontWeight: isSelected ? 700 : 500,
                        fontFamily: "'Kanit', sans-serif",
                        border: "none",
                        cursor: "pointer",
                        backgroundColor: isSelected ? "var(--ink)" : "transparent",
                        color: isSelected ? "var(--cream)" : "var(--ink-soft)",
                        transition: "all 0.15s ease",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Left Side: Filter Dropdown (Mobile) */}
              <div className="admin-filter-dropdown-wrapper">
                <select
                  className="admin-filter-select"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as any);
                    setCurrentPage(1);
                  }}
                >
                  <option value="all">ทั้งหมด</option>
                  <option value="active">เปิดใช้งาน</option>
                  <option value="inactive">ปิดใช้งาน</option>
                </select>
              </div>

              {/* Right Side: Add Promotion Button (left of search) & Search Box */}
              <div className="admin-search-wrapper">
                <button
                  type="button"
                  className="admin-add-btn"
                  onClick={openAddModal}
                >
                  <Plus size={16} />
                  <span>เพิ่มโปรโมชั่นใหม่</span>
                </button>

                <div className="admin-search-box">
                  <Search size={15} color="var(--ink-soft)" style={{ flexShrink: 0 }} />
                  <input
                    type="text"
                    placeholder="ค้นหาชื่อโปรโมชั่น (ไทย / อังกฤษ)..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "4rem 0", gap: "0.5rem", color: "var(--teal)" }}>
              <Loader2 size={24} className="animate-spin" />
              <span style={{ fontSize: "0.95rem", fontWeight: 500 }}>กำลังโหลดรายการโปรโมชั่น...</span>
            </div>
          )}

          {/* Promotions Cards Grid (Matching Toppings Layout) */}
          {!isLoading && (
            <div className="promotions-grid" style={{ marginTop: "1.5rem" }}>
              {promotions.map((item, index) => {
                const isKebabOpen = activeKebabId === item.id;
                const isQuotaFull = item.all_limit !== null && item.used_count >= item.all_limit;

                // Check expired / upcoming date status
                const now = new Date();
                const isExpired = item.end_date ? new Date(item.end_date) < now : false;
                const isUpcoming = item.start_date ? new Date(item.start_date) > now : false;

                return (
                  <article
                    key={item.id}
                    className="animate-rise"
                    style={{
                      animationDelay: `${50 + index * 40}ms`,
                      backgroundColor: "var(--card)",
                      borderRadius: "1.25rem",
                      border: "1px solid rgba(50, 55, 65, 0.1)",
                      boxShadow: "0 4px 16px -2px rgba(0,0,0,0.03)",
                      display: "flex",
                      flexDirection: "column",
                      position: "relative",
                      opacity: !item.is_active || isExpired ? 0.65 : 1,
                      transition: "border 0.2s ease, transform 0.15s ease, opacity 0.2s ease",
                      zIndex: isKebabOpen ? 50 : 1,
                    }}
                  >
                    {/* Top Banner Card Header with Points badge & Kebab button */}
                    <div
                      style={{
                        position: "relative",
                        width: "100%",
                        padding: "1.25rem 1rem 0.9rem 1rem",
                        backgroundColor: isExpired
                          ? "rgba(239, 68, 68, 0.06)"
                          : isUpcoming
                          ? "rgba(234, 179, 8, 0.08)"
                          : "rgba(75, 155, 140, 0.08)",
                        borderTopLeftRadius: "1.25rem",
                        borderTopRightRadius: "1.25rem",
                        borderBottom: "1px solid rgba(50, 55, 65, 0.06)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      {/* Point Badge & Status Tag */}
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.3rem",
                            backgroundColor: isExpired ? "rgba(50, 55, 65, 0.65)" : "var(--teal)",
                            color: "#fff",
                            padding: "0.25rem 0.65rem",
                            borderRadius: "9999px",
                            fontWeight: 700,
                            fontSize: "0.85rem",
                            boxShadow: isExpired ? "none" : "0 2px 6px rgba(75, 155, 140, 0.25)",
                          }}
                        >
                          <Award size={14} />
                          {item.point_usage} แต้ม
                        </span>

                        {/* Expired / Upcoming / Active Status Badge */}
                        {isExpired ? (
                          <span
                            style={{
                              fontSize: "0.7rem",
                              backgroundColor: "rgba(220, 38, 38, 0.12)",
                              color: "#dc2626",
                              padding: "0.18rem 0.55rem",
                              borderRadius: "9999px",
                              fontWeight: 700,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.25rem",
                            }}
                          >
                            <Clock size={12} />
                            หมดเวลาใช้งาน
                          </span>
                        ) : isUpcoming ? (
                          <span
                            style={{
                              fontSize: "0.7rem",
                              backgroundColor: "rgba(234, 179, 8, 0.15)",
                              color: "#ca8a04",
                              padding: "0.18rem 0.55rem",
                              borderRadius: "9999px",
                              fontWeight: 700,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.25rem",
                            }}
                          >
                            <Clock size={12} />
                            ยังไม่เริ่ม
                          </span>
                        ) : item.is_active ? (
                          <span style={{ fontSize: "0.7rem", color: "#22c55e", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "0.2rem" }}>
                            <CheckCircle2 size={12} /> เปิดใช้งาน
                          </span>
                        ) : (
                          <span style={{ fontSize: "0.7rem", color: "var(--ink-soft)", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: "0.2rem" }}>
                            <XCircle size={12} /> ปิดใช้งาน
                          </span>
                        )}

                        {isQuotaFull && !isExpired && (
                          <span style={{ fontSize: "0.65rem", backgroundColor: "rgba(224, 83, 83, 0.12)", color: "#e05353", padding: "0.15rem 0.45rem", borderRadius: "0.35rem", fontWeight: 700 }}>
                            สิทธิ์เต็ม
                          </span>
                        )}
                      </div>

                      {/* Kebab Menu Button (Top Right) */}
                      <div className="promotion-kebab-container" style={{ position: "relative" }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveKebabId(isKebabOpen ? null : item.id);
                          }}
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            backgroundColor: "rgba(255, 255, 255, 0.9)",
                            border: "1px solid rgba(0,0,0,0.1)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                            transition: "all 0.15s ease",
                          }}
                          title="ตัวเลือกเพิ่มเติม"
                        >
                          <MoreVertical size={16} color="var(--ink)" />
                        </button>

                        {/* Kebab Popover Dropdown (Matching Toppings Layout) */}
                        {isKebabOpen && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              position: "absolute",
                              top: "38px",
                              right: 0,
                              width: "205px",
                              backgroundColor: "var(--card)",
                              borderRadius: "0.75rem",
                              border: "1px solid rgba(50, 55, 65, 0.15)",
                              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                              padding: "0.4rem",
                              display: "flex",
                              flexDirection: "column",
                              gap: "0.3rem",
                              zIndex: 50,
                            }}
                          >
                            {/* Option 1: Edit */}
                            <button
                              type="button"
                              onClick={() => openEditModal(item)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.6rem",
                                width: "100%",
                                padding: "0.5rem 0.75rem",
                                fontSize: "0.85rem",
                                border: "none",
                                borderRadius: "0.5rem",
                                backgroundColor: "transparent",
                                color: "var(--ink)",
                                cursor: "pointer",
                                textAlign: "left",
                                fontFamily: "'Kanit', sans-serif",
                                transition: "background-color 0.15s ease",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--cream)")}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                            >
                              <Edit3 size={15} color="var(--teal)" />
                              <span>แก้ไขโปรโมชั่น</span>
                            </button>

                            {/* Option 2: Toggle Visibility */}
                            <button
                              type="button"
                              onClick={() => toggleVisibility(item)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.6rem",
                                width: "100%",
                                padding: "0.5rem 0.75rem",
                                fontSize: "0.85rem",
                                border: "none",
                                borderRadius: "0.5rem",
                                backgroundColor: "transparent",
                                color: item.is_active ? "var(--ink-soft)" : "var(--teal)",
                                cursor: "pointer",
                                textAlign: "left",
                                fontFamily: "'Kanit', sans-serif",
                                transition: "background-color 0.15s ease",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--cream)")}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                            >
                              {item.is_active ? (
                                <>
                                  <EyeOff size={15} color="var(--ink-soft)" />
                                  <span>ปิดโปรโมชั่นนี้</span>
                                </>
                              ) : (
                                <>
                                  <Eye size={15} color="var(--teal)" />
                                  <span>เปิดแสดงโปรโมชั่น</span>
                                </>
                              )}
                            </button>

                            <div style={{ height: "1px", backgroundColor: "rgba(50, 55, 65, 0.08)", margin: "0.2rem 0" }} />

                            {/* Option 3: Delete */}
                            <button
                              type="button"
                              onClick={() => openDeleteModal(item)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.6rem",
                                width: "100%",
                                padding: "0.5rem 0.75rem",
                                fontSize: "0.85rem",
                                border: "none",
                                borderRadius: "0.5rem",
                                backgroundColor: "transparent",
                                color: "#dc2626",
                                cursor: "pointer",
                                textAlign: "left",
                                fontFamily: "'Kanit', sans-serif",
                                transition: "background-color 0.15s ease",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(220, 38, 38, 0.08)")}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                            >
                              <Trash2 size={15} color="#dc2626" />
                              <span>ลบโปรโมชั่น</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Content Details */}
                    <div style={{ padding: "1rem", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                      <div>
                        <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--ink)", lineHeight: 1.35 }}>
                          {item.name_th}
                        </h3>
                        <p className="font-mono" style={{ fontSize: "0.75rem", color: "var(--ink-soft)", marginTop: "0.2rem" }}>
                          {item.name_en}
                        </p>

                        {/* Description */}
                        {item.desc_th && (
                          <p style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "var(--ink)", lineHeight: 1.4, backgroundColor: "var(--cream)", padding: "0.5rem 0.65rem", borderRadius: "0.5rem" }}>
                            {item.desc_th}
                          </p>
                        )}
                      </div>

                      {/* Quota Limits and Redemption Stats */}
                      <div style={{ marginTop: "0.85rem" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem", marginBottom: "0.6rem" }}>
                          <div style={{ padding: "0.45rem 0.55rem", borderRadius: "0.5rem", backgroundColor: "var(--cream)", border: "1px solid rgba(50,55,65,0.06)" }}>
                            <span style={{ fontSize: "0.7rem", color: "var(--ink-soft)", display: "block" }}>โควตารวม</span>
                            <span style={{ fontSize: "0.825rem", fontWeight: 700, color: "var(--ink)" }}>
                              {item.all_limit !== null ? `${item.all_limit} สิทธิ์` : "ไม่จำกัด"}
                            </span>
                          </div>

                          <div style={{ padding: "0.45rem 0.55rem", borderRadius: "0.5rem", backgroundColor: "var(--cream)", border: "1px solid rgba(50,55,65,0.06)" }}>
                            <span style={{ fontSize: "0.7rem", color: "var(--ink-soft)", display: "block" }}>จำกัดต่อคน</span>
                            <span style={{ fontSize: "0.825rem", fontWeight: 700, color: "var(--ink)" }}>
                              {item.person_limit !== null ? `${item.person_limit} สิทธิ์/คน` : "ไม่จำกัด"}
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--ink-soft)", marginBottom: "3px" }}>
                          <span>แลกแล้ว</span>
                          <span style={{ fontWeight: 600, color: "var(--teal)" }}>
                            {item.used_count} {item.all_limit !== null ? `/ ${item.all_limit}` : "ครั้ง"}
                          </span>
                        </div>
                        {item.all_limit !== null && (
                          <div style={{ width: "100%", height: "5px", backgroundColor: "rgba(50, 55, 65, 0.08)", borderRadius: "9999px", overflow: "hidden", marginBottom: "0.6rem" }}>
                            <div
                              style={{
                                height: "100%",
                                width: `${Math.min(100, (item.used_count / item.all_limit) * 100)}%`,
                                backgroundColor: isQuotaFull ? "#e05353" : "var(--teal)",
                                borderRadius: "9999px",
                              }}
                            />
                          </div>
                        )}

                        {/* Date Footer */}
                        <div style={{ paddingTop: "0.5rem", borderTop: "1px solid rgba(50, 55, 65, 0.06)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.725rem", color: isExpired ? "#dc2626" : "var(--ink-soft)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", flexWrap: "wrap" }}>
                            <Calendar size={12} color={isExpired ? "#dc2626" : "currentColor"} />
                            <span style={{ fontWeight: isExpired ? 600 : 400 }}>{formatDateDisplay(item.start_date)} - {formatDateDisplay(item.end_date)}</span>
                            {isExpired && (
                              <span style={{ fontSize: "0.65rem", backgroundColor: "rgba(220, 38, 38, 0.12)", color: "#dc2626", padding: "0.1rem 0.35rem", borderRadius: "0.25rem", fontWeight: 700 }}>
                                เลยกำหนด
                              </span>
                            )}
                          </div>
                          <span className="font-mono" style={{ fontSize: "0.675rem" }}>#{item.id}</span>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* Empty State (Matching Toppings Layout) */}
          {!isLoading && promotions.length === 0 && (
            <div
              style={{
                marginTop: "2.5rem",
                padding: "3.5rem 1rem",
                backgroundColor: "var(--card)",
                borderRadius: "1.25rem",
                textAlign: "center",
                border: "1px dashed rgba(50, 55, 65, 0.15)",
              }}
            >
              <p style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--ink)" }}>ไม่พบรายการโปรโมชั่น</p>
              <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)", marginTop: "0.35rem" }}>
                ลองเปลี่ยนคำค้นหา หรือกดปุ่ม "เพิ่มโปรโมชั่นใหม่" เพื่อสร้างรายการแรก
              </p>
            </div>
          )}

          {/* Pagination Section (Matching Toppings Layout) */}
          {!isLoading && total > 0 && (
            <div
              style={{
                marginTop: "2rem",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1rem",
                paddingTop: "1rem",
                borderTop: "1px solid rgba(50, 55, 65, 0.1)",
              }}
            >
              <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)" }}>
                แสดงรายการที่ {startIndex + 1} - {Math.min(startIndex + ITEMS_PER_PAGE, total)} จากทั้งหมด {total} รายการ
              </p>

              {/* Pagination Controls */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "36px",
                    height: "36px",
                    borderRadius: "0.5rem",
                    border: "1px solid rgba(50, 55, 65, 0.1)",
                    backgroundColor: "var(--card)",
                    color: currentPage === 1 ? "rgba(50,55,65,0.3)" : "var(--ink)",
                    cursor: currentPage === 1 ? "not-allowed" : "pointer",
                  }}
                >
                  <ChevronLeft size={18} />
                </button>

                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pageNum = idx + 1;
                  const isActive = pageNum === currentPage;
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "0.5rem",
                        border: isActive ? "none" : "1px solid rgba(50, 55, 65, 0.1)",
                        backgroundColor: isActive ? "var(--teal)" : "var(--card)",
                        color: isActive ? "#fff" : "var(--ink)",
                        fontWeight: isActive ? 700 : 500,
                        fontSize: "0.875rem",
                        cursor: "pointer",
                        fontFamily: "'Kanit', sans-serif",
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "36px",
                    height: "36px",
                    borderRadius: "0.5rem",
                    border: "1px solid rgba(50, 55, 65, 0.1)",
                    backgroundColor: "var(--card)",
                    color: currentPage === totalPages ? "rgba(50,55,65,0.3)" : "var(--ink)",
                    cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                  }}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* Create / Edit Modal */}
          <AddEditPromotionModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSubmit={handleSaveModal}
            mode={modalMode}
            formNameTh={formNameTh}
            setFormNameTh={setFormNameTh}
            formNameEn={formNameEn}
            setFormNameEn={setFormNameEn}
            formDescTh={formDescTh}
            setFormDescTh={setFormDescTh}
            formDescEn={formDescEn}
            setFormDescEn={setFormDescEn}
            formPointUsage={formPointUsage}
            setFormPointUsage={setFormPointUsage}
            formAllLimit={formAllLimit}
            setFormAllLimit={setFormAllLimit}
            formPersonLimit={formPersonLimit}
            setFormPersonLimit={setFormPersonLimit}
            formStartDate={formStartDate}
            setFormStartDate={setFormStartDate}
            formEndDate={formEndDate}
            setFormEndDate={setFormEndDate}
            formIsActive={formIsActive}
            setFormIsActive={setFormIsActive}
            formError={formError}
            isSubmitting={isSubmitting}
          />

          {/* Delete Confirm Modal (Matching toppings delete format) */}
          {isDeleteModalOpen && deleteItem && (
            <div
              className="animate-fade-in"
              style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(0,0,0,0.5)",
                backdropFilter: "blur(4px)",
                display: "grid",
                placeItems: "center",
                zIndex: 100,
                padding: "1rem",
              }}
            >
              <div
                className="animate-modal-pop"
                style={{
                  backgroundColor: "var(--card)",
                  borderRadius: "1.25rem",
                  maxWidth: "440px",
                  width: "100%",
                  padding: "1.75rem",
                  boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "#dc2626", marginBottom: "1rem" }}>
                  <div
                    style={{
                      width: "2.5rem",
                      height: "2.5rem",
                      borderRadius: "0.75rem",
                      backgroundColor: "rgba(220, 38, 38, 0.12)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Trash2 size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0, color: "var(--ink)" }}>
                      ยืนยันการลบโปรโมชั่น
                    </h3>
                    <p style={{ fontSize: "0.8rem", color: "var(--ink-soft)", margin: 0 }}>
                      การดำเนินการนี้ไม่สามารถย้อนกลับได้
                    </p>
                  </div>
                </div>

                <p style={{ fontSize: "0.85rem", color: "var(--ink)", lineHeight: 1.5, marginBottom: "1rem" }}>
                  คุณแน่ใจหรือไม่ว่าต้องการลบโปรโมชั่น <strong>"{deleteItem.name_th}"</strong> ออกจากระบบ?
                </p>

                <div style={{ marginBottom: "1.25rem" }}>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.35rem" }}>
                    พิมพ์คำว่า <code style={{ backgroundColor: "rgba(220, 38, 38, 0.1)", color: "#dc2626", padding: "0.1rem 0.35rem", borderRadius: "0.25rem" }}>delete this promotion</code> เพื่อยืนยัน:
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="delete this promotion"
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

                {deleteError && (
                  <div style={{ marginBottom: "1rem", padding: "0.6rem", backgroundColor: "rgba(220, 38, 38, 0.1)", borderRadius: "0.5rem", color: "#dc2626", fontSize: "0.8rem" }}>
                    {deleteError}
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(false)}
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
                    type="button"
                    onClick={handleDeleteSubmit}
                    disabled={isSubmitting || deleteConfirmText.trim().toLowerCase() !== "delete this promotion"}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.6rem 1.5rem",
                      borderRadius: "0.6rem",
                      border: "none",
                      backgroundColor: "#dc2626",
                      color: "#fff",
                      cursor: (isSubmitting || deleteConfirmText.trim().toLowerCase() !== "delete this promotion") ? "not-allowed" : "pointer",
                      opacity: (deleteConfirmText.trim().toLowerCase() !== "delete this promotion") ? 0.6 : 1,
                      fontFamily: "'Kanit', sans-serif",
                      fontWeight: 600,
                    }}
                  >
                    {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                    <span>ลบโปรโมชั่นทันที</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}
