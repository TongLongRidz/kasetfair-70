"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import {
  Search,
  Plus,
  MoreVertical,
  Eye,
  EyeOff,
  Edit3,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  Candy,
  Flame,
  Trash2,
  Loader2,
  AlertTriangle,
  Upload,
  ImageIcon,
} from "lucide-react";
import { getStoredToken } from "@/lib/auth";
import { useToast } from "@/components/ui/toast";
import AddEditToppingModal from "./components/AddEditToppingModal";

interface ToppingItem {
  id: number;
  nameTh: string;
  nameEn: string;
  price: number;
  image: string;
  isAvailable: boolean; // is_available (เปิด/ซ่อน)
  isSoldOut: boolean;   // is_sold_out (ขายหมด/มีของ)
  sortOrder: number;
  icedOnly?: boolean;
  orderCount?: number;
}

const ITEMS_PER_PAGE = 6;

export default function ToppingsManagementPage() {
  const { success, error: toastError, info } = useToast();

  const [toppings, setToppings] = useState<ToppingItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "available" | "hidden" | "soldout">("all");
  const [activeKebabId, setActiveKebabId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Upload image state
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit/Add Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedItem, setSelectedItem] = useState<ToppingItem | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [formNameTh, setFormNameTh] = useState("");
  const [formNameEn, setFormNameEn] = useState("");
  const [formPrice, setFormPrice] = useState<number>(10);
  const [formImageUrl, setFormImageUrl] = useState("/images/drink-pearl.jpg");
  const [formSortOrder, setFormSortOrder] = useState<number>(1);

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [deleteItem, setDeleteItem] = useState<ToppingItem | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Helper to format image URL (handle relative /uploads from backend)
  const getFullImageUrl = (url: string) => {
    if (!url) return "/images/drink-pearl.jpg";
    if (url.startsWith("/uploads/")) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585";
      return `${apiUrl}${url}`;
    }
    return url;
  };

  // Fetch Toppings from API
  const fetchToppings = useCallback(async () => {
    setIsLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585";
      const params = new URLSearchParams({
        page: currentPage.toString(),
        page_size: ITEMS_PER_PAGE.toString(),
      });
      if (searchQuery.trim()) params.append("q", searchQuery.trim());
      if (statusFilter !== "all") params.append("status", statusFilter);

      const res = await fetch(`${apiUrl}/api/v1/toppings?${params.toString()}`);
      if (res.ok) {
        const result = await res.json();
        const mapped: ToppingItem[] = (result.data || []).map((t: any) => ({
          id: t.id,
          nameTh: t.name_th,
          nameEn: t.name_en || "",
          price: t.price,
          image: t.image_url || "/images/drink-pearl.jpg",
          isAvailable: t.is_available,
          isSoldOut: t.is_sold_out,
          sortOrder: t.sort_order || 0,
          orderCount: t.order_count || 0,
        }));
        setToppings(mapped);
        setTotal(result.total || 0);
        setTotalPages(result.total_pages || 1);
      } else {
        setToppings([]);
        setTotal(0);
        setTotalPages(1);
      }
    } catch {
      setToppings([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchQuery, statusFilter]);

  useEffect(() => {
    fetchToppings();
  }, [fetchToppings]);

  // Close kebab when clicked outside
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".topping-kebab-container")) {
        setActiveKebabId(null);
      }
    };
    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, []);

  // Handle File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toastError("ขนาดไฟล์เกิน 5MB กรุณาเลือกไฟล์ที่เล็กลง", "อัปโหลดล้มเหลว");
      return;
    }

    setIsUploading(true);
    try {
      const token = getStoredToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585";
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${apiUrl}/api/v1/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setFormImageUrl(data.url);
        success("อัปโหลดรูปภาพสำเร็จเรียบร้อย", "สำเร็จ");
      } else {
        toastError(data.error || "อัปโหลดรูปภาพไม่สำเร็จ", "เกิดข้อผิดพลาด");
      }
    } catch {
      toastError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์เพื่ออัปโหลดได้", "เกิดข้อผิดพลาด");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Toggle Visibility (Icon ตา: ซ่อน / แสดง)
  const toggleVisibility = async (item: ToppingItem) => {
    setActiveKebabId(null);
    const newStatus = !item.isAvailable;
    // Optimistic update
    setToppings((prev) =>
      prev.map((t) => (t.id === item.id ? { ...t, isAvailable: newStatus } : t))
    );

    try {
      const token = getStoredToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585";
      const res = await fetch(`${apiUrl}/api/v1/toppings/${item.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_available: newStatus }),
      });

      if (res.ok) {
        if (newStatus) {
          success(`เปิดแสดงท็อปปิ้ง "${item.nameTh}" บนหน้าร้านแล้ว`, "เปิดแสดงท็อปปิ้ง");
        } else {
          info(`ซ่อนท็อปปิ้ง "${item.nameTh}" จากหน้าร้านแล้ว`, "ซ่อนท็อปปิ้ง");
        }
      } else {
        toastError("ไม่สามารถเปลี่ยนสถานะท็อปปิ้งได้", "เกิดข้อผิดพลาด");
        fetchToppings();
      }
    } catch {
      toastError("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์", "เกิดข้อผิดพลาด");
      fetchToppings();
    }
  };

  // Toggle Sold Out (เปิด / ปิด ขายหมด)
  const toggleSoldOut = async (item: ToppingItem) => {
    setActiveKebabId(null);
    const newStatus = !item.isSoldOut;
    // Optimistic update
    setToppings((prev) =>
      prev.map((t) => (t.id === item.id ? { ...t, isSoldOut: newStatus } : t))
    );

    try {
      const token = getStoredToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585";
      const res = await fetch(`${apiUrl}/api/v1/toppings/${item.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_sold_out: newStatus }),
      });

      if (res.ok) {
        if (newStatus) {
          info(`ตั้งค่าท็อปปิ้ง "${item.nameTh}" เป็นสินค้าหมด (Sold Out)`, "ท็อปปิ้งหมด");
        } else {
          success(`ตั้งค่าท็อปปิ้ง "${item.nameTh}" เป็นพร้อมขาย (In Stock)`, "พร้อมขาย");
        }
      } else {
        toastError("ไม่สามารถเปลี่ยนสถานะท็อปปิ้งได้", "เกิดข้อผิดพลาด");
        fetchToppings();
      }
    } catch {
      toastError("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์", "เกิดข้อผิดพลาด");
      fetchToppings();
    }
  };

  // Open Add Modal
  const openAddModal = () => {
    setSelectedItem(null);
    setModalMode("create");
    setFormNameTh("");
    setFormNameEn("");
    setFormPrice(10);
    setFormImageUrl("/images/drink-pearl.jpg");
    setFormSortOrder(total + 1);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (item: ToppingItem) => {
    setSelectedItem(item);
    setModalMode("edit");
    setFormNameTh(item.nameTh);
    setFormNameEn(item.nameEn);
    setFormPrice(item.price);
    setFormImageUrl(item.image);
    setFormSortOrder(item.sortOrder);
    setFormError(null);
    setIsModalOpen(true);
    setActiveKebabId(null);
  };

  // Open Delete Modal
  const openDeleteModal = (item: ToppingItem) => {
    setDeleteItem(item);
    setDeleteConfirmText("");
    setDeleteError(null);
    setIsDeleteModalOpen(true);
    setActiveKebabId(null);
  };

  // Save Modal Form (Create / Edit)
  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formNameTh.trim()) {
      setFormError("กรุณากรอกชื่อท็อปปิ้งภาษาไทย");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = getStoredToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585";

      if (modalMode === "create") {
        const res = await fetch(`${apiUrl}/api/v1/toppings`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name_th: formNameTh.trim(),
            name_en: formNameEn.trim(),
            price: Number(formPrice),
            image_url: formImageUrl.trim() || "/images/drink-pearl.jpg",
            is_available: true,
            is_sold_out: false,
            sort_order: Number(formSortOrder),
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setFormError(data.error || "เกิดข้อผิดพลาดในการสร้างท็อปปิ้ง");
          toastError(data.error || "เกิดข้อผิดพลาดในการสร้างท็อปปิ้ง", "สร้างไม่สำเร็จ");
          return;
        }

        success(`เพิ่มท็อปปิ้ง "${formNameTh.trim()}" สำเร็จเรียบร้อย`, "สร้างท็อปปิ้งสำเร็จ");
      } else if (selectedItem) {
        const res = await fetch(`${apiUrl}/api/v1/toppings/${selectedItem.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name_th: formNameTh.trim(),
            name_en: formNameEn.trim(),
            price: Number(formPrice),
            image_url: formImageUrl.trim(),
            sort_order: Number(formSortOrder),
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setFormError(data.error || "เกิดข้อผิดพลาดในการแก้ไขท็อปปิ้ง");
          toastError(data.error || "เกิดข้อผิดพลาดในการแก้ไขท็อปปิ้ง", "แก้ไขไม่สำเร็จ");
          return;
        }

        success(`อัปเดตข้อมูลท็อปปิ้ง "${formNameTh.trim()}" เรียบร้อยแล้ว`, "บันทึกสำเร็จ");
      }

      setIsModalOpen(false);
      fetchToppings();
    } catch {
      setFormError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
      toastError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้", "เกิดข้อผิดพลาด");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Topping
  const handleDeleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteItem) return;
    setDeleteError(null);

    if (deleteConfirmText.trim().toLowerCase() !== "delete this topping") {
      setDeleteError('กรุณาพิมพ์ "delete this topping" เพื่อยืนยันการลบ');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = getStoredToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585";
      const res = await fetch(`${apiUrl}/api/v1/toppings/${deleteItem.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        setDeleteError(data.error || "เกิดข้อผิดพลาดในการลบท็อปปิ้ง");
        toastError(data.error || "เกิดข้อผิดพลาดในการลบท็อปปิ้ง", "ลบไม่สำเร็จ");
        return;
      }

      success(`ลบท็อปปิ้ง "${deleteItem.nameTh}" ออกจากระบบแล้ว`, "ลบท็อปปิ้งสำเร็จ");
      setIsDeleteModalOpen(false);
      fetchToppings();
    } catch {
      setDeleteError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
      toastError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้", "เกิดข้อผิดพลาด");
    } finally {
      setIsSubmitting(false);
    }
  };

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  return (
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
              จัดการท็อปปิ้งเสริม
            </h1>
          </div>

          {/* Add Topping Button */}
          <button
            type="button"
            onClick={openAddModal}
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
            <span>เพิ่มท็อปปิ้งใหม่</span>
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
              placeholder="ค้นหาชื่อท็อปปิ้ง (ไทย / อังกฤษ)..."
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

          {/* Status Filters */}
          <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              style={{
                padding: "0.45rem 0.85rem",
                minWidth: "150px",
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
              <option value="all">สถานะทั้งหมด</option>
              <option value="available">พร้อมขาย</option>
              <option value="soldout">ขายหมด (Sold out)</option>
              <option value="hidden">ซ่อนท็อปปิ้ง</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "4rem 0", gap: "0.5rem", color: "var(--teal)" }}>
            <Loader2 size={24} className="animate-spin" />
            <span style={{ fontSize: "0.95rem", fontWeight: 500 }}>กำลังโหลดรายการท็อปปิ้ง...</span>
          </div>
        )}

        {/* Toppings Cards Grid */}
        {!isLoading && (
          <div
            style={{
              marginTop: "1.5rem",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: "1.25rem",
            }}
          >
            {toppings.map((item) => {
              const isKebabOpen = activeKebabId === item.id;
              const displayImg = getFullImageUrl(item.image);

              return (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: "var(--card)",
                    borderRadius: "1.25rem",
                    border: "1px solid rgba(50, 55, 65, 0.1)",
                    boxShadow: "0 4px 16px -2px rgba(0,0,0,0.03)",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                    opacity: !item.isAvailable ? 0.6 : 1,
                    transition: "all 0.2s ease",
                  }}
                >
                  {/* Image & Top Badges */}
                  <div style={{ position: "relative", width: "100%", height: "180px", backgroundColor: "#f0ece1" }}>
                    <Image
                      src={displayImg}
                      alt={item.nameTh}
                      fill
                      unoptimized={displayImg.startsWith("http")}
                      style={{
                        objectFit: "cover",
                        filter: item.isSoldOut ? "grayscale(80%)" : "none",
                      }}
                    />

                    {/* Dimmed Overlay if Sold Out */}
                    {item.isSoldOut && (
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          backgroundColor: "rgba(0, 0, 0, 0.45)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <span
                          style={{
                            backgroundColor: "#e05353",
                            color: "#fff",
                            padding: "0.35rem 1rem",
                            borderRadius: "9999px",
                            fontWeight: 700,
                            fontSize: "0.85rem",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                          }}
                        >
                          ท็อปปิ้งหมด (Sold Out)
                        </span>
                      </div>
                    )}

                    {/* Hidden Badge */}
                    {!item.isAvailable && (
                      <div
                        style={{
                          position: "absolute",
                          top: "0.75rem",
                          left: "0.75rem",
                          backgroundColor: "rgba(30, 30, 30, 0.75)",
                          color: "#fff",
                          padding: "0.2rem 0.6rem",
                          borderRadius: "9999px",
                          fontSize: "0.75rem",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.25rem",
                          backdropFilter: "blur(4px)",
                        }}
                      >
                        <EyeOff size={13} />
                        <span>ซ่อนจากหน้าร้าน</span>
                      </div>
                    )}

                    {/* Kebab Menu Button (Top Right) */}
                    <div className="topping-kebab-container" style={{ position: "absolute", top: "0.75rem", right: "0.75rem", zIndex: 10 }}>
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

                      {/* Kebab Popover Dropdown */}
                      {isKebabOpen && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            position: "absolute",
                            top: "38px",
                            right: 0,
                            width: "185px",
                            backgroundColor: "var(--card)",
                            borderRadius: "0.75rem",
                            border: "1px solid rgba(50, 55, 65, 0.15)",
                            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                            padding: "0.35rem",
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.2rem",
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
                            <span>แก้ไขท็อปปิ้ง</span>
                          </button>

                          {/* Option 2: Sold Out Toggle */}
                          <button
                            type="button"
                            onClick={() => toggleSoldOut(item)}
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
                              color: item.isSoldOut ? "var(--teal)" : "#e05353",
                              cursor: "pointer",
                              textAlign: "left",
                              fontFamily: "'Kanit', sans-serif",
                              transition: "background-color 0.15s ease",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--cream)")}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                          >
                            {item.isSoldOut ? (
                              <>
                                <CheckCircle2 size={15} color="var(--teal)" />
                                <span>ตั้งเป็น "มีสินค้า"</span>
                              </>
                            ) : (
                              <>
                                <XCircle size={15} color="#e05353" />
                                <span>ตั้งเป็น "ขายหมด"</span>
                              </>
                            )}
                          </button>

                          {/* Option 3: Eye / EyeOff Toggle */}
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
                              color: item.isAvailable ? "var(--ink-soft)" : "var(--teal)",
                              cursor: "pointer",
                              textAlign: "left",
                              fontFamily: "'Kanit', sans-serif",
                              transition: "background-color 0.15s ease",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--cream)")}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                          >
                            {item.isAvailable ? (
                              <>
                                <EyeOff size={15} color="var(--ink-soft)" />
                                <span>ซ่อนท็อปปิ้งนี้</span>
                              </>
                            ) : (
                              <>
                                <Eye size={15} color="var(--teal)" />
                                <span>เปิดแสดงท็อปปิ้ง</span>
                              </>
                            )}
                          </button>

                          <div style={{ height: "1px", backgroundColor: "rgba(50, 55, 65, 0.08)", margin: "0.2rem 0" }} />

                          {/* Option 4: Delete */}
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
                            <span>ลบท็อปปิ้ง</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Content Details */}
                  <div style={{ padding: "1.1rem 1.25rem", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                        <div>
                          <span style={{ fontSize: "0.75rem", color: "var(--teal)", fontWeight: 600 }}>
                            ท็อปปิ้งเสริม
                          </span>
                          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginTop: "0.15rem", lineHeight: 1.3 }}>
                            {item.nameTh}
                          </h3>
                          <p style={{ fontSize: "0.75rem", color: "var(--ink-soft)", marginTop: "1px" }}>
                            {item.nameEn}
                          </p>
                        </div>

                        {/* Price Badge */}
                        <div style={{ textAlign: "right" }}>
                          <span style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--teal)", fontFamily: "'Kanit', sans-serif" }}>
                            +฿{item.price}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Bottom Status Bar */}
                    <div
                      style={{
                        marginTop: "1rem",
                        paddingTop: "0.75rem",
                        borderTop: "1px solid rgba(50, 55, 65, 0.08)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        fontSize: "0.75rem",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        {/* Status Tag */}
                        {item.isSoldOut ? (
                          <span style={{ color: "#e05353", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.25rem" }}>
                            <XCircle size={13} /> ขายหมด
                          </span>
                        ) : !item.isAvailable ? (
                          <span style={{ color: "var(--ink-soft)", fontWeight: 500, display: "flex", alignItems: "center", gap: "0.25rem" }}>
                            <EyeOff size={13} /> ซ่อนอยู่
                          </span>
                        ) : (
                          <span style={{ color: "var(--teal)", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.25rem" }}>
                            <CheckCircle2 size={13} /> พร้อมขาย
                          </span>
                        )}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <span
                          style={{
                            padding: "0.15rem 0.45rem",
                            borderRadius: "0.35rem",
                            backgroundColor: "var(--cream)",
                            border: "1px solid rgba(50, 55, 65, 0.12)",
                            color: "var(--ink-soft)",
                            fontSize: "0.7rem",
                            fontWeight: 600,
                          }}
                        >
                          ลำดับ: #{item.sortOrder || 0}
                        </span>

                        {item.orderCount !== undefined && item.orderCount > 0 && (
                          <span style={{ color: "var(--ink-soft)", fontWeight: 500, display: "flex", alignItems: "center", gap: "0.25rem" }}>
                            <Flame size={13} color="var(--teal)" />
                            ขายแล้ว {item.orderCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && toppings.length === 0 && (
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
            <p style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--ink)" }}>ไม่พบรายการท็อปปิ้ง</p>
            <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)", marginTop: "0.35rem" }}>
              ลองเปลี่ยนคำค้นหา หรือกดปุ่ม "เพิ่มท็อปปิ้งใหม่" เพื่อสร้างรายการแรก
            </p>
          </div>
        )}

        {/* Pagination Section */}
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
        <AddEditToppingModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSaveModal}
          mode={modalMode}
          formNameTh={formNameTh}
          setFormNameTh={setFormNameTh}
          formNameEn={formNameEn}
          setFormNameEn={setFormNameEn}
          formPrice={formPrice}
          setFormPrice={setFormPrice}
          formSortOrder={formSortOrder}
          setFormSortOrder={setFormSortOrder}
          formImageUrl={formImageUrl}
          setFormImageUrl={setFormImageUrl}
          formError={formError}
          isSubmitting={isSubmitting}
          isUploading={isUploading}
          onFileUpload={handleFileUpload}
        />

        {/* Delete Confirm Modal */}
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
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0, color: "var(--ink)" }}>
                    ยืนยันการลบท็อปปิ้ง
                  </h3>
                  <p style={{ fontSize: "0.8rem", color: "var(--ink-soft)", margin: 0 }}>
                    การดำเนินการนี้ไม่สามารถย้อนกลับได้
                  </p>
                </div>
              </div>

              <p style={{ fontSize: "0.85rem", color: "var(--ink)", lineHeight: 1.5, marginBottom: "1rem" }}>
                คุณแน่ใจหรือไม่ว่าต้องการลบท็อปปิ้ง <strong>"{deleteItem.nameTh}"</strong> ออกจากระบบ?
              </p>

              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.35rem" }}>
                  พิมพ์คำว่า <code style={{ backgroundColor: "rgba(220, 38, 38, 0.1)", color: "#dc2626", padding: "0.1rem 0.35rem", borderRadius: "0.25rem" }}>delete this topping</code> เพื่อยืนยัน:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="delete this topping"
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
                  disabled={isSubmitting || deleteConfirmText.trim().toLowerCase() !== "delete this topping"}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.6rem 1.5rem",
                    borderRadius: "0.6rem",
                    border: "none",
                    backgroundColor: "#dc2626",
                    color: "#fff",
                    cursor: (isSubmitting || deleteConfirmText.trim().toLowerCase() !== "delete this topping") ? "not-allowed" : "pointer",
                    opacity: (deleteConfirmText.trim().toLowerCase() !== "delete this topping") ? 0.6 : 1,
                    fontFamily: "'Kanit', sans-serif",
                    fontWeight: 600,
                  }}
                >
                  {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                  <span>ลบท็อปปิ้งทันที</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
