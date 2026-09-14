"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  Flame,
  Trash2,
  Loader2,
  AlertTriangle,
  ImageIcon,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { getStoredToken } from "@/lib/auth";
import { useToast } from "@/components/ui/toast";
import AddEditToppingModal from "./components/AddEditToppingModal";
import ImageCropModal from "@/components/ui/modals/ImageCropModal";

interface ToppingItem {
  id: number;
  nameTh: string;
  nameEn: string;
  price: number;
  image: string;
  allowHot: boolean;
  allowIced: boolean;
  isAvailable: boolean; // is_available (เปิด/ซ่อน)
  isSoldOut: boolean;   // is_sold_out (ขายหมด/มีของ)
  sortOrder: number;
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

  // Upload image & Crop state
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState<string>("");
  const [pendingCroppedBlob, setPendingCroppedBlob] = useState<Blob | null>(null);

  // Edit/Add Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedItem, setSelectedItem] = useState<ToppingItem | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [formNameTh, setFormNameTh] = useState("");
  const [formNameEn, setFormNameEn] = useState("");
  const [formPrice, setFormPrice] = useState<number | string>(10);
  const [formAllowHot, setFormAllowHot] = useState<boolean>(true);
  const [formAllowIced, setFormAllowIced] = useState<boolean>(true);
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formSortOrder, setFormSortOrder] = useState<number>(1);

  // Reordering State & API Call
  const [isReordering, setIsReordering] = useState(false);

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [deleteItem, setDeleteItem] = useState<ToppingItem | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Helper to format image URL (handle relative /uploads from backend)
  const getFullImageUrl = (url: string) => {
    if (!url) return "";
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
          allowHot: Boolean(t.allow_hot),
          allowIced: Boolean(t.allow_iced),
          image: t.image_url || "",
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

  // Handle File Selection (Open Crop Modal)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toastError("ขนาดไฟล์เกิน 10MB กรุณาเลือกไฟล์ที่เล็กลง", "ไฟล์มีขนาดใหญ่เกินไป");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setRawImageSrc(reader.result as string);
      setIsCropModalOpen(true);
    };
    reader.readAsDataURL(file);

    // Reset input so user can pick same file again if needed
    e.target.value = "";
  };

  // Handle Cropped Image Complete
  const handleCropComplete = (croppedBlob: Blob) => {
    setPendingCroppedBlob(croppedBlob);
    const localPreviewUrl = URL.createObjectURL(croppedBlob);
    setFormImageUrl(localPreviewUrl);
    setRawImageSrc("");
    setIsCropModalOpen(false);
  };

  // Remove / Clear image and delete from uploads directory on backend
  const handleRemoveImage = async () => {
    const oldUrl = formImageUrl;
    setFormImageUrl("");
    setPendingCroppedBlob(null);

    if (oldUrl && oldUrl.startsWith("/uploads/")) {
      try {
        const token = getStoredToken();
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585";
        await fetch(`${apiUrl}/api/v1/upload`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ url: oldUrl }),
        });
      } catch (err) {
        console.error("Error deleting image from server:", err);
      }
    }
  };

  // Save new sort order to backend
  const saveReorderedToppings = async (newOrderedToppings: ToppingItem[]) => {
    setIsReordering(true);
    try {
      const token = getStoredToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585";

      const payload = {
        items: newOrderedToppings.map((m, idx) => ({
          id: m.id,
          sort_order: idx + 1,
        })),
      };

      const res = await fetch(`${apiUrl}/api/v1/toppings/reorder`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        success("บันทึกลำดับท็อปปิ้งใหม่เรียบร้อยแล้ว", "สลับลำดับสำเร็จ");
      } else {
        const data = await res.json();
        toastError(data.error || "ไม่สามารถบันทึกลำดับได้", "เกิดข้อผิดพลาด");
        fetchToppings();
      }
    } catch {
      toastError("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์", "เกิดข้อผิดพลาด");
      fetchToppings();
    } finally {
      setIsReordering(false);
    }
  };

  // Move topping up/down (Press Up/Down buttons)
  const moveItem = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= toppings.length) return;

    const updated = [...toppings];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);

    const reorderedList = updated.map((item, idx) => ({
      ...item,
      sortOrder: idx + 1,
    }));

    setToppings(reorderedList);
    saveReorderedToppings(reorderedList);
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
    setFormAllowHot(true);
    setFormAllowIced(true);
    setFormImageUrl("");
    setPendingCroppedBlob(null);
    setFormSortOrder(toppings.length > 0 ? Math.max(...toppings.map((t) => t.sortOrder || 0)) + 1 : 1);
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
    setFormAllowHot(item.allowHot !== undefined ? item.allowHot : true);
    setFormAllowIced(item.allowIced !== undefined ? item.allowIced : true);
    setFormImageUrl(item.image);
    setPendingCroppedBlob(null);
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

    if (!formAllowHot && !formAllowIced) {
      setFormError("กรุณาเลือกประเภทเครื่องดื่มอย่างน้อย 1 ประเภท (ร้อน หรือ เย็น)");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = getStoredToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585";

      let finalImageUrl = formImageUrl;

      // If user selected/cropped a new image, upload it now
      if (pendingCroppedBlob) {
        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", pendingCroppedBlob, "topping_image.jpg");
        formData.append("folder", "toppings");

        const uploadRes = await fetch(`${apiUrl}/api/v1/upload`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        const uploadData = await uploadRes.json();
        if (uploadRes.ok && uploadData.url) {
          finalImageUrl = uploadData.url;
        } else {
          setFormError(uploadData.error || "เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ");
          toastError(uploadData.error || "เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ", "อัปโหลดไม่สำเร็จ");
          setIsSubmitting(false);
          setIsUploading(false);
          return;
        }
        setIsUploading(false);
      }

      const priceNum = Number(formPrice) || 0;

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
            price: priceNum,
            allow_hot: formAllowHot,
            allow_iced: formAllowIced,
            image_url: finalImageUrl.trim(),
            is_available: true,
            is_sold_out: false,
            sort_order: Number(formSortOrder) || 1,
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
            price: priceNum,
            allow_hot: formAllowHot,
            allow_iced: formAllowIced,
            image_url: finalImageUrl.trim(),
            sort_order: Number(formSortOrder) || 1,
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

      setPendingCroppedBlob(null);
      setIsModalOpen(false);
      fetchToppings();
    } catch {
      setFormError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
      toastError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้", "เกิดข้อผิดพลาด");
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
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
              จัดการท็อปปิ้ง
            </h1>
          </div>
        </div>

        {/* Filter and Search Bar Container */}
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
                { id: "available", label: "พร้อมขาย" },
                { id: "soldout", label: "ขายหมด" },
                { id: "hidden", label: "ซ่อนอยู่" },
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
                <option value="available">พร้อมขาย</option>
                <option value="soldout">ขายหมด</option>
                <option value="hidden">ซ่อนอยู่</option>
              </select>
            </div>

            {/* Right Side: Add Topping Button (left of search) & Search Box */}
            <div className="admin-search-wrapper">
              <button
                type="button"
                className="admin-add-btn"
                onClick={openAddModal}
              >
                <Plus size={16} />
                <span>เพิ่มท็อปปิ้งใหม่</span>
              </button>

              <div className="admin-search-box">
                <Search size={15} color="var(--ink-soft)" style={{ flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อท็อปปิ้ง (ไทย / อังกฤษ)..."
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
            <span style={{ fontSize: "0.95rem", fontWeight: 500 }}>กำลังโหลดรายการท็อปปิ้ง...</span>
          </div>
        )}

        {/* Toppings Cards Grid */}
        {!isLoading && (
          <div className="toppings-grid" style={{ marginTop: "1.5rem" }}>
            {toppings.map((item, index) => {
              const isKebabOpen = activeKebabId === item.id;
              const displayImg = getFullImageUrl(item.image);

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
                    opacity: !item.isAvailable ? 0.6 : 1,
                    transition: "border 0.2s ease, transform 0.15s ease, opacity 0.2s ease",
                    zIndex: isKebabOpen ? 50 : 1,
                  }}
                >
                  {/* Image & Top Badges (1:1 Aspect Ratio like menu page) */}
                  <div style={{ position: "relative", width: "100%", aspectRatio: "1/1", backgroundColor: "#f0ece1", borderTopLeftRadius: "1.25rem", borderTopRightRadius: "1.25rem" }}>
                    {/* Inner wrapper for image overflow clipping */}
                    <div style={{ position: "absolute", inset: 0, overflow: "hidden", borderTopLeftRadius: "1.25rem", borderTopRightRadius: "1.25rem" }}>
                      {displayImg ? (
                        <Image
                          src={displayImg}
                          alt={item.nameTh}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px"
                          unoptimized={displayImg.startsWith("http")}
                          draggable={false}
                          style={{
                            objectFit: "cover",
                            filter: item.isSoldOut || !item.isAvailable ? "grayscale(80%)" : "none",
                            userSelect: "none",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "#ebe6d8",
                            color: "var(--ink-soft)",
                            gap: "0.35rem",
                            opacity: 0.6,
                          }}
                        >
                          <ImageIcon size={32} strokeWidth={1.5} />
                          <span style={{ fontSize: "0.7rem", fontWeight: 500 }}>ไม่มีรูปภาพ</span>
                        </div>
                      )}

                      {/* Dimmed Overlay if Sold Out or Hidden */}
                      {item.isSoldOut ? (
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
                            สินค้าหมด (Sold Out)
                          </span>
                        </div>
                      ) : !item.isAvailable ? (
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            backgroundColor: "rgba(0, 0, 0, 0.5)",
                            backdropFilter: "blur(2px)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <span
                            style={{
                              backgroundColor: "rgba(50, 55, 65, 0.9)",
                              color: "#fff",
                              padding: "0.35rem 1rem",
                              borderRadius: "9999px",
                              fontWeight: 700,
                              fontSize: "0.85rem",
                              boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.35rem",
                            }}
                          >
                            <EyeOff size={15} />
                            <span>ซ่อนอยู่ (Hidden)</span>
                          </span>
                        </div>
                      ) : null}
                    </div>

                    {/* Order Badge (Top-Left) */}
                    <div
                      style={{
                        position: "absolute",
                        top: "0.75rem",
                        left: "0.75rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        zIndex: 10,
                      }}
                    >
                      <div
                        style={{
                          backgroundColor: "rgba(30, 30, 30, 0.85)",
                          backdropFilter: "blur(4px)",
                          color: "#fff",
                          padding: "0.25rem 0.6rem",
                          borderRadius: "9999px",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          gap: "0.25rem",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                        }}
                      >
                        <span>#{item.sortOrder || index + 1}</span>
                      </div>
                    </div>

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
                            width: "215px",
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
                          {/* Row 1: 2 Columns for Order Adjustment */}
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.35rem" }}>
                            {/* Column 1: Move Up */}
                            <button
                              type="button"
                              disabled={index === 0 || isReordering}
                              onClick={() => {
                                moveItem(index, "up");
                                setActiveKebabId(null);
                              }}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "0.3rem",
                                padding: "0.45rem 0.3rem",
                                fontSize: "0.8rem",
                                fontWeight: 500,
                                border: "1px solid rgba(50, 55, 65, 0.1)",
                                borderRadius: "0.45rem",
                                backgroundColor: index === 0 ? "rgba(50, 55, 65, 0.04)" : "var(--cream)",
                                color: index === 0 ? "rgba(50, 55, 65, 0.3)" : "var(--ink)",
                                cursor: index === 0 || isReordering ? "not-allowed" : "pointer",
                                fontFamily: "'Kanit', sans-serif",
                                transition: "all 0.15s ease",
                              }}
                              title="ปรับขึ้น"
                            >
                              <ArrowUp size={14} color={index === 0 ? "rgba(50, 55, 65, 0.3)" : "var(--teal)"} />
                              <span>ปรับขึ้น</span>
                            </button>

                            {/* Column 2: Move Down */}
                            <button
                              type="button"
                              disabled={index === toppings.length - 1 || isReordering}
                              onClick={() => {
                                moveItem(index, "down");
                                setActiveKebabId(null);
                              }}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "0.3rem",
                                padding: "0.45rem 0.3rem",
                                fontSize: "0.8rem",
                                fontWeight: 500,
                                border: "1px solid rgba(50, 55, 65, 0.1)",
                                borderRadius: "0.45rem",
                                backgroundColor: index === toppings.length - 1 ? "rgba(50, 55, 65, 0.04)" : "var(--cream)",
                                color: index === toppings.length - 1 ? "rgba(50, 55, 65, 0.3)" : "var(--ink)",
                                cursor: index === toppings.length - 1 || isReordering ? "not-allowed" : "pointer",
                                fontFamily: "'Kanit', sans-serif",
                                transition: "all 0.15s ease",
                              }}
                              title="ปรับลง"
                            >
                              <ArrowDown size={14} color={index === toppings.length - 1 ? "rgba(50, 55, 65, 0.3)" : "var(--teal)"} />
                              <span>ปรับลง</span>
                            </button>
                          </div>

                          <div style={{ height: "1px", backgroundColor: "rgba(50, 55, 65, 0.08)", margin: "0.15rem 0" }} />

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
                            <span>แก้ไขข้อมูลท็อปปิ้ง</span>
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
                            <span>ลบรายการท็อปปิ้ง</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Content Details (Styled exactly like menu card) */}
                  <div style={{ padding: "0.85rem", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.35rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", flexWrap: "wrap" }}>
                          {item.allowHot && (
                            <span style={{ fontSize: "0.65rem", padding: "0.1rem 0.35rem", borderRadius: "0.25rem", backgroundColor: "rgba(224, 83, 83, 0.1)", color: "#e05353", fontWeight: 600 }}>
                              ร้อน
                            </span>
                          )}
                          {item.allowIced && (
                            <span style={{ fontSize: "0.65rem", padding: "0.1rem 0.35rem", borderRadius: "0.25rem", backgroundColor: "rgba(2, 132, 199, 0.12)", color: "#0284c7", fontWeight: 600 }}>
                              เย็น
                            </span>
                          )}
                        </div>

                        {item.isSoldOut && (
                          <span style={{ color: "#e05353", fontSize: "0.7rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.2rem" }}>
                            <XCircle size={12} /> หมด
                          </span>
                        )}
                        {!item.isAvailable && (
                          <span style={{ color: "var(--ink-soft)", fontSize: "0.7rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.2rem" }}>
                            <EyeOff size={12} /> ซ่อน
                          </span>
                        )}
                      </div>

                      <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--ink)", marginTop: "0.15rem" }}>
                        {item.nameTh}
                      </h3>
                      <p className="font-mono" style={{ fontSize: "0.7rem", color: "var(--ink-soft)", marginTop: "0.1rem" }}>
                        {item.nameEn}
                      </p>
                    </div>

                    {/* Bottom Price & Sales Info (Matching menu card) */}
                    <div style={{ marginTop: "0.75rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.35rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
                        <span className="font-display" style={{ fontSize: "1.1rem", color: "var(--ink)", fontWeight: 700 }}>
                          +{item.price}฿
                        </span>
                      </div>

                      {item.orderCount !== undefined && item.orderCount > 0 && (
                        <span style={{ color: "var(--ink-soft)", fontSize: "0.75rem", fontWeight: 500, display: "flex", alignItems: "center", gap: "0.25rem" }}>
                          <Flame size={13} color="var(--teal)" />
                          ขายแล้ว {item.orderCount}
                        </span>
                      )}
                    </div>
                  </div>
                </article>
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
          formAllowHot={formAllowHot}
          setFormAllowHot={setFormAllowHot}
          formAllowIced={formAllowIced}
          setFormAllowIced={setFormAllowIced}
          formSortOrder={formSortOrder}
          formImageUrl={formImageUrl}
          setFormImageUrl={setFormImageUrl}
          formError={formError}
          isSubmitting={isSubmitting}
          isUploading={isUploading}
          onFileUpload={handleFileSelect}
          onRemoveImage={handleRemoveImage}
        />

        {/* Image Crop Modal (1:1 Ratio) */}
        <ImageCropModal
          isOpen={isCropModalOpen}
          imageSrc={rawImageSrc}
          onClose={() => {
            setIsCropModalOpen(false);
            setRawImageSrc("");
          }}
          onCropComplete={handleCropComplete}
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
