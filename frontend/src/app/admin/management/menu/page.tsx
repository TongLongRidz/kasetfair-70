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
  Sparkles,
  Star,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  Flame,
  Trash2,
  Loader2,
  AlertTriangle,
  Upload,
  ImageIcon,
  GripVertical,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { getStoredToken } from "@/lib/auth";
import { useToast } from "@/components/ui/toast";
import AddEditMenuModal from "./components/AddEditMenuModal";
import ImageCropModal from "@/components/ui/modals/ImageCropModal";

interface MenuItem {
  id: number;
  name: string;
  nameEn: string;
  category: string;
  categoryName: string;
  priceHot?: number | null;
  priceIced?: number | null;
  description: string;
  descEn?: string;
  image: string;
  isAvailable: boolean; // is_available (ซ่อน / แสดง)
  isSoldOut: boolean;   // is_sold_out (ขายหมด / มีของ)
  isRecommended: boolean; // is_recommended (แนะนำ)
  sortOrder: number;    // sort_order (ลำดับการแสดงผล)
  orderCount?: number;
  baseProductId?: number;
  toppingIds?: number[];
  comboRecipes?: any[];
}

const ITEMS_PER_PAGE = 5;

export default function MenuManagementPage() {
  const { success, error: toastError, info } = useToast();

  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "available" | "hidden" | "soldout">("all");
  const [activeKebabId, setActiveKebabId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Upload image state
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [formNameTh, setFormNameTh] = useState("");
  const [formNameEn, setFormNameEn] = useState("");
  const [formCategory, setFormCategory] = useState<"flavours" | "combos">("flavours");
  const [formPriceHot, setFormPriceHot] = useState<number | string>("");
  const [formPriceIced, setFormPriceIced] = useState<number | string>("");
  const [formDescription, setFormDescription] = useState("");
  const [formDescEn, setFormDescEn] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formIsRecommended, setFormIsRecommended] = useState(false);
  const [formIsSoldOut, setFormIsSoldOut] = useState(false);
  const [formBaseProductId, setFormBaseProductId] = useState<number | "">("");
  const [selectedToppingIds, setSelectedToppingIds] = useState<number[]>([]);
  const [formSortOrder, setFormSortOrder] = useState<number>(1);

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [deleteItem, setDeleteItem] = useState<MenuItem | null>(null);
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

  // Fetch Products from API
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585";
      const params = new URLSearchParams({
        page: currentPage.toString(),
        page_size: ITEMS_PER_PAGE.toString(),
      });
      if (searchQuery.trim()) params.append("q", searchQuery.trim());
      if (selectedCategory !== "all") params.append("category", selectedCategory);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const res = await fetch(`${apiUrl}/api/v1/products?${params.toString()}`);
      if (res.ok) {
        const result = await res.json();
        const mapped: MenuItem[] = (result.data || []).map((p: any) => {
          const recipes = p.combo_recipes || [];
          const firstBaseId = recipes.length > 0 && recipes[0].base_product_id ? recipes[0].base_product_id : undefined;
          const topIds = recipes.map((r: any) => r.topping_id).filter(Boolean);

          return {
            id: p.id,
            name: p.name_th,
            nameEn: p.name_en || "",
            category: p.is_combo ? "combos" : "flavours",
            categoryName: p.is_combo ? "เมนูคอมโบ" : "รสชาติหลัก",
            priceHot: p.price_hot,
            priceIced: p.price_iced,
            description: p.desc_th || "",
            descEn: p.desc_en || "",
            image: p.image_url || "",
            isAvailable: p.is_available,
            isSoldOut: p.is_sold_out,
            isRecommended: p.is_recommended,
            sortOrder: p.sort_order || 0,
            orderCount: p.order_count || 0,
            baseProductId: firstBaseId,
            toppingIds: topIds,
            comboRecipes: recipes,
          };
        });
        setMenus(mapped);
        setTotal(result.total || 0);
        setTotalPages(result.total_pages || 1);
      } else {
        setMenus([]);
        setTotal(0);
        setTotalPages(1);
      }
    } catch {
      setMenus([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchQuery, selectedCategory, statusFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Close kebab menu when clicking outside
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".menu-kebab-container")) {
        setActiveKebabId(null);
      }
    };
    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, []);

  // Image Cropping & Pending Blob State
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState<string>("");
  const [pendingCroppedBlob, setPendingCroppedBlob] = useState<Blob | null>(null);

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

  // Handle Cropped Image Complete (Store blob & set local preview only, DO NOT upload yet)
  const handleCropComplete = (croppedBlob: Blob) => {
    setPendingCroppedBlob(croppedBlob);
    const localPreviewUrl = URL.createObjectURL(croppedBlob);
    setFormImageUrl(localPreviewUrl);
    setRawImageSrc("");
    setIsCropModalOpen(false);
  };

  // Reordering State & API Call
  const [isReordering, setIsReordering] = useState(false);

  // Save new sort order to backend
  const saveReorderedMenus = async (newOrderedMenus: MenuItem[]) => {
    setIsReordering(true);
    try {
      const token = getStoredToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585";

      const payload = {
        items: newOrderedMenus.map((m, idx) => ({
          id: m.id,
          sort_order: idx + 1,
        })),
      };

      const res = await fetch(`${apiUrl}/api/v1/products/reorder`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        success("บันทึกลำดับเมนูใหม่เรียบร้อยแล้ว", "สลับลำดับสำเร็จ");
      } else {
        const data = await res.json();
        toastError(data.error || "ไม่สามารถบันทึกลำดับได้", "เกิดข้อผิดพลาด");
        fetchProducts();
      }
    } catch {
      toastError("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์", "เกิดข้อผิดพลาด");
      fetchProducts();
    } finally {
      setIsReordering(false);
    }
  };

  // Move menu up/down (Press Up/Down buttons)
  const moveMenuItem = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= menus.length) return;

    const updated = [...menus];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);

    const reorderedList = updated.map((item, idx) => ({
      ...item,
      sortOrder: idx + 1,
    }));

    setMenus(reorderedList);
    saveReorderedMenus(reorderedList);
  };

  // Toggle Visibility (Icon ตา: ซ่อน / แสดง)
  const toggleVisibility = async (item: MenuItem) => {
    setActiveKebabId(null);
    const newStatus = !item.isAvailable;
    // Optimistic update
    setMenus((prev) =>
      prev.map((m) => (m.id === item.id ? { ...m, isAvailable: newStatus } : m))
    );

    try {
      const token = getStoredToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585";
      const res = await fetch(`${apiUrl}/api/v1/products/${item.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_available: newStatus }),
      });

      if (res.ok) {
        if (newStatus) {
          success(`เปิดแสดงเมนู "${item.name}" บนหน้าร้านแล้ว`, "เปิดแสดงเมนู");
        } else {
          info(`ซ่อนเมนู "${item.name}" จากหน้าร้านแล้ว`, "ซ่อนเมนู");
        }
      } else {
        toastError("ไม่สามารถเปลี่ยนสถานะเมนูได้", "เกิดข้อผิดพลาด");
        fetchProducts();
      }
    } catch {
      toastError("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์", "เกิดข้อผิดพลาด");
      fetchProducts();
    }
  };

  // Toggle Sold Out (เปิด / ปิด ขายหมด)
  const toggleSoldOut = async (item: MenuItem) => {
    setActiveKebabId(null);
    const newStatus = !item.isSoldOut;
    // Optimistic update
    setMenus((prev) =>
      prev.map((m) => (m.id === item.id ? { ...m, isSoldOut: newStatus } : m))
    );

    try {
      const token = getStoredToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585";
      const res = await fetch(`${apiUrl}/api/v1/products/${item.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_sold_out: newStatus }),
      });

      if (res.ok) {
        if (newStatus) {
          info(`ตั้งค่าเมนู "${item.name}" เป็นสินค้าหมด (Sold Out)`, "สินค้าหมด");
        } else {
          success(`ตั้งค่าเมนู "${item.name}" เป็นพร้อมขาย (In Stock)`, "พร้อมขาย");
        }
      } else {
        toastError("ไม่สามารถเปลี่ยนสถานะสินค้าได้", "เกิดข้อผิดพลาด");
        fetchProducts();
      }
    } catch {
      toastError("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์", "เกิดข้อผิดพลาด");
      fetchProducts();
    }
  };

  // Toggle Recommended (เปิด / ปิด แนะนำ)
  const toggleRecommended = async (item: MenuItem) => {
    setActiveKebabId(null);
    const newStatus = !item.isRecommended;
    // Optimistic update
    setMenus((prev) =>
      prev.map((m) => (m.id === item.id ? { ...m, isRecommended: newStatus } : m))
    );

    try {
      const token = getStoredToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585";
      const res = await fetch(`${apiUrl}/api/v1/products/${item.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_recommended: newStatus }),
      });

      if (res.ok) {
        if (newStatus) {
          success(`ตั้งค่าเมนู "${item.name}" เป็นเมนูแนะนำแล้ว`, "เมนูแนะนำ");
        } else {
          info(`ยกเลิกสถานะแนะนำเมนู "${item.name}" แล้ว`, "ยกเลิกแนะนำ");
        }
        fetchProducts();
      } else {
        toastError("ไม่สามารถเปลี่ยนสถานะเมนูแนะนำได้", "เกิดข้อผิดพลาด");
        fetchProducts();
      }
    } catch {
      toastError("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์", "เกิดข้อผิดพลาด");
      fetchProducts();
    }
  };

  // Open Create Modal
  const openCreateModal = () => {
    setSelectedItem(null);
    setModalMode("create");
    setFormNameTh("");
    setFormNameEn("");
    setFormCategory("flavours");
    setFormPriceHot("");
    setFormPriceIced("");
    setFormDescription("");
    setFormDescEn("");
    setFormImageUrl("");
    setPendingCroppedBlob(null);
    setFormIsRecommended(false);
    setFormIsSoldOut(false);
    setFormBaseProductId("");
    setSelectedToppingIds([]);
    setFormSortOrder(menus.length > 0 ? Math.max(...menus.map((m) => m.sortOrder || 0)) + 1 : 1);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (item: MenuItem) => {
    setSelectedItem(item);
    setModalMode("edit");
    setFormNameTh(item.name);
    setFormNameEn(item.nameEn);
    setFormCategory(item.category === "combos" ? "combos" : "flavours");
    setFormPriceHot(item.priceHot !== null && item.priceHot !== undefined ? item.priceHot : "");
    setFormPriceIced(item.priceIced !== null && item.priceIced !== undefined ? item.priceIced : "");
    setFormDescription(item.description);
    setFormDescEn(item.descEn || "");
    setFormImageUrl(item.image);
    setPendingCroppedBlob(null);
    setFormIsRecommended(item.isRecommended);
    setFormIsSoldOut(item.isSoldOut);
    setFormBaseProductId(item.baseProductId || "");
    setSelectedToppingIds(item.toppingIds || []);
    setFormSortOrder(item.sortOrder || 1);
    setFormError(null);
    setIsModalOpen(true);
    setActiveKebabId(null);
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

  // Open Delete Modal
  const openDeleteModal = (item: MenuItem) => {
    setDeleteItem(item);
    setDeleteConfirmText("");
    setDeleteError(null);
    setIsDeleteModalOpen(true);
    setActiveKebabId(null);
  };

  // Save Modal Form (Create / Edit) - Upload image only here
  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formNameTh.trim()) {
      setFormError("กรุณากรอกชื่อเมนูภาษาไทย");
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
        formData.append("file", pendingCroppedBlob, "menu_image.jpg");
        formData.append("folder", "menu");

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

      const hotPriceNum = formPriceHot !== "" ? Number(formPriceHot) : null;
      const icedPriceNum = formPriceIced !== "" ? Number(formPriceIced) : null;
      const baseProdId = formBaseProductId !== "" ? Number(formBaseProductId) : null;

      if (modalMode === "create") {
        const res = await fetch(`${apiUrl}/api/v1/products`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name_th: formNameTh.trim(),
            name_en: formNameEn.trim(),
            desc_th: formDescription.trim(),
            desc_en: formDescEn.trim(),
            price_hot: hotPriceNum,
            price_iced: icedPriceNum,
            image_url: finalImageUrl.trim(),
            is_combo: formCategory === "combos" || selectedToppingIds.length > 0 || baseProdId !== null,
            is_available: true,
            is_sold_out: formIsSoldOut,
            is_recommended: formIsRecommended,
            sort_order: Number(formSortOrder) || 1,
            base_product_id: baseProdId,
            topping_ids: selectedToppingIds,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setFormError(data.error || "เกิดข้อผิดพลาดในการสร้างเมนู");
          toastError(data.error || "เกิดข้อผิดพลาดในการสร้างเมนู", "สร้างไม่สำเร็จ");
          return;
        }

        success(`เพิ่มเมนู "${formNameTh.trim()}" สำเร็จเรียบร้อย`, "สร้างเมนูสำเร็จ");
      } else if (selectedItem) {
        const res = await fetch(`${apiUrl}/api/v1/products/${selectedItem.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name_th: formNameTh.trim(),
            name_en: formNameEn.trim(),
            desc_th: formDescription.trim(),
            desc_en: formDescEn.trim(),
            price_hot: hotPriceNum,
            price_iced: icedPriceNum,
            image_url: finalImageUrl.trim(),
            is_combo: formCategory === "combos" || selectedToppingIds.length > 0 || baseProdId !== null,
            is_sold_out: formIsSoldOut,
            is_recommended: formIsRecommended,
            sort_order: Number(formSortOrder) || 1,
            base_product_id: baseProdId,
            topping_ids: selectedToppingIds,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setFormError(data.error || "เกิดข้อผิดพลาดในการแก้ไขเมนู");
          toastError(data.error || "เกิดข้อผิดพลาดในการแก้ไขเมนู", "แก้ไขไม่สำเร็จ");
          return;
        }

        success(`อัปเดตข้อมูลเมนู "${formNameTh.trim()}" เรียบร้อยแล้ว`, "บันทึกสำเร็จ");
      }

      setPendingCroppedBlob(null);
      setIsModalOpen(false);
      fetchProducts();
    } catch {
      setFormError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
      toastError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้", "เกิดข้อผิดพลาด");
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  // Delete Product
  const handleDeleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteItem) return;
    setDeleteError(null);

    if (deleteConfirmText.trim().toLowerCase() !== "delete this menu") {
      setDeleteError('กรุณาพิมพ์ "delete this menu" เพื่อยืนยันการลบ');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = getStoredToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585";
      const res = await fetch(`${apiUrl}/api/v1/products/${deleteItem.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        setDeleteError(data.error || "เกิดข้อผิดพลาดในการลบเมนู");
        toastError(data.error || "เกิดข้อผิดพลาดในการลบเมนู", "ลบไม่สำเร็จ");
        return;
      }

      success(`ลบเมนู "${deleteItem.name}" ออกจากระบบแล้ว`, "ลบเมนูสำเร็จ");
      setIsDeleteModalOpen(false);
      fetchProducts();
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
              จัดการเมนูเครื่องดื่ม
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
                { id: "all", label: "ทุกเมนู" },
                { id: "flavours", label: "รสชาติหลัก" },
                { id: "combos", label: "เมนูคอมโบ" },
              ].map((tab) => {
                const isSelected = selectedCategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(tab.id);
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
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="all">ทั้งหมด</option>
                <option value="flavours">รสชาติหลัก</option>
                <option value="combos">เมนูคอมโบ</option>
              </select>
            </div>

            {/* Right Side: Add Menu Button (left of search) & Search Box */}
            <div className="admin-search-wrapper">
              <button
                type="button"
                className="admin-add-btn"
                onClick={openCreateModal}
              >
                <Plus size={16} />
                <span>เพิ่มเมนูใหม่</span>
              </button>

              <div className="admin-search-box">
                <Search size={15} color="var(--ink-soft)" style={{ flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อเมนู (ไทย/อังกฤษ)..."
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
            <span style={{ fontSize: "0.95rem", fontWeight: 500 }}>กำลังโหลดรายการเมนู...</span>
          </div>
        )}

        {/* Menu Cards Grid */}
        {!isLoading && (
          <div className="menu-products-grid" style={{ marginTop: "1.5rem" }}>
            {menus.map((item, index) => {
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
                  {/* Image & Top Badges (1:1 Aspect Ratio like page.tsx) */}
                  <div style={{ position: "relative", width: "100%", aspectRatio: "1/1", backgroundColor: "#f0ece1", borderTopLeftRadius: "1.25rem", borderTopRightRadius: "1.25rem" }}>
                    {/* Inner wrapper for image overflow clipping */}
                    <div style={{ position: "absolute", inset: 0, overflow: "hidden", borderTopLeftRadius: "1.25rem", borderTopRightRadius: "1.25rem" }}>
                      {displayImg ? (
                        <Image
                          src={displayImg}
                          alt={item.name}
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

                      {/* Recommended Badge */}
                      {item.isRecommended && item.isAvailable && (
                        <div
                          style={{
                            backgroundColor: "var(--warm)",
                            color: "var(--ink)",
                            padding: "0.2rem 0.65rem",
                            borderRadius: "9999px",
                            fontSize: "0.725rem",
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            gap: "0.25rem",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                          }}
                        >
                          <span>แนะนำ</span>
                        </div>
                      )}
                    </div>

                    {/* Kebab Menu Button (Top Right) */}
                    <div className="menu-kebab-container" style={{ position: "absolute", top: "0.75rem", right: "0.75rem", zIndex: 10 }}>
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
                                moveMenuItem(index, "up");
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
                              disabled={index === menus.length - 1 || isReordering}
                              onClick={() => {
                                moveMenuItem(index, "down");
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
                                backgroundColor: index === menus.length - 1 ? "rgba(50, 55, 65, 0.04)" : "var(--cream)",
                                color: index === menus.length - 1 ? "rgba(50, 55, 65, 0.3)" : "var(--ink)",
                                cursor: index === menus.length - 1 || isReordering ? "not-allowed" : "pointer",
                                fontFamily: "'Kanit', sans-serif",
                                transition: "all 0.15s ease",
                              }}
                              title="ปรับลง"
                            >
                              <ArrowDown size={14} color={index === menus.length - 1 ? "rgba(50, 55, 65, 0.3)" : "var(--teal)"} />
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
                            <span>แก้ไขข้อมูลเมนู</span>
                          </button>

                          {/* Option 2: Recommended Toggle */}
                          <button
                            type="button"
                            onClick={() => toggleRecommended(item)}
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
                              color: item.isRecommended ? "#f59e0b" : "var(--teal)",
                              cursor: "pointer",
                              textAlign: "left",
                              fontFamily: "'Kanit', sans-serif",
                              transition: "background-color 0.15s ease",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--cream)")}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                          >
                            <Star
                              size={15}
                              color={item.isRecommended ? "#f59e0b" : "var(--teal)"}
                              fill={item.isRecommended ? "#f59e0b" : "none"}
                            />
                            <span>{item.isRecommended ? "ยกเลิกแนะนำ" : "ตั้งเป็นเมนูแนะนำ"}</span>
                          </button>

                          {/* Option 3: Sold Out Toggle */}
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

                          {/* Option 4: Eye / EyeOff Toggle */}
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
                                <span>ซ่อนเมนูนี้</span>
                              </>
                            ) : (
                              <>
                                <Eye size={15} color="var(--teal)" />
                                <span>เปิดแสดงเมนู</span>
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
                            <span>ลบรายการเมนู</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Content Details (Styled exactly like page.tsx) */}
                  <div style={{ padding: "0.85rem", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.35rem" }}>
                        <span style={{ fontSize: "0.7rem", color: "var(--teal)", fontWeight: 600 }}>
                          {item.categoryName}
                        </span>
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
                        {item.name}
                      </h3>
                      <p className="font-mono" style={{ fontSize: "0.7rem", color: "var(--ink-soft)", marginTop: "0.1rem" }}>
                        {item.nameEn}
                      </p>
                      <p
                        style={{
                          marginTop: "0.35rem",
                          fontSize: "0.75rem",
                          color: "var(--ink-soft)",
                          lineHeight: 1.35,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {item.description}
                      </p>
                    </div>

                    {/* Bottom Price & Sales Info (Aligned with page.tsx - No border line, No พร้อมขาย) */}
                    <div style={{ marginTop: "0.75rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.35rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        {item.priceHot !== null && item.priceHot !== undefined && (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
                            <span style={{ fontSize: "0.7rem", color: "var(--ink-soft)" }}>ร้อน</span>
                            <span className="font-display" style={{ fontSize: "1.1rem", color: "var(--ink)", fontWeight: 700 }}>
                              {item.priceHot}฿
                            </span>
                          </div>
                        )}
                        {item.priceHot !== null && item.priceHot !== undefined && item.priceIced !== null && item.priceIced !== undefined && (
                          <span style={{ color: "var(--ink-soft)", opacity: 0.4 }}>/</span>
                        )}
                        {item.priceIced !== null && item.priceIced !== undefined && (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
                            <span style={{ fontSize: "0.7rem", color: "var(--ink-soft)" }}>เย็น</span>
                            <span className="font-display" style={{ fontSize: "1.1rem", color: "var(--ink)", fontWeight: 700 }}>
                              {item.priceIced}฿
                            </span>
                          </div>
                        )}
                        {item.priceHot === null && item.priceIced === null && (
                          <span style={{ fontSize: "0.85rem", color: "var(--ink-soft)" }}>-</span>
                        )}
                      </div>

                      {item.orderCount !== undefined && item.orderCount > 0 && (
                        <span style={{ color: "var(--ink-soft)", fontSize: "0.75rem", fontWeight: 500, display: "flex", alignItems: "center", gap: "0.25rem" }}>
                          <Flame size={13} color="var(--teal)" />
                          ขายแล้ว {item.orderCount} แก้ว
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
        {!isLoading && menus.length === 0 && (
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
            <p style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--ink)" }}>ไม่พบรายการเมนู</p>
            <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)", marginTop: "0.35rem" }}>
              ลองเปลี่ยนคำค้นหา หรือกดปุ่ม "เพิ่มเมนูใหม่" เพื่อสร้างรายการแรก
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
        <AddEditMenuModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSaveModal}
          mode={modalMode}
          formNameTh={formNameTh}
          setFormNameTh={setFormNameTh}
          formNameEn={formNameEn}
          setFormNameEn={setFormNameEn}
          formCategory={formCategory}
          setFormCategory={setFormCategory}
          formPriceHot={formPriceHot}
          setFormPriceHot={setFormPriceHot}
          formPriceIced={formPriceIced}
          setFormPriceIced={setFormPriceIced}
          formSortOrder={formSortOrder}
          formDescription={formDescription}
          setFormDescription={setFormDescription}
          formDescEn={formDescEn}
          setFormDescEn={setFormDescEn}
          formImageUrl={formImageUrl}
          setFormImageUrl={setFormImageUrl}
          formIsRecommended={formIsRecommended}
          setFormIsRecommended={setFormIsRecommended}
          formBaseProductId={formBaseProductId}
          setFormBaseProductId={setFormBaseProductId}
          selectedToppingIds={selectedToppingIds}
          setSelectedToppingIds={setSelectedToppingIds}
          formError={formError}
          isSubmitting={isSubmitting}
          isUploading={isUploading}
          onFileUpload={handleFileSelect}
          onRemoveImage={handleRemoveImage}
        />

        {/* 1:1 Image Crop Modal */}
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
                    ยืนยันการลบเมนู
                  </h3>
                  <p style={{ fontSize: "0.8rem", color: "var(--ink-soft)", margin: 0 }}>
                    การดำเนินการนี้ไม่สามารถย้อนกลับได้
                  </p>
                </div>
              </div>

              <p style={{ fontSize: "0.85rem", color: "var(--ink)", lineHeight: 1.5, marginBottom: "1rem" }}>
                คุณแน่ใจหรือไม่ว่าต้องการลบเมนู <strong>"{deleteItem.name}"</strong> ออกจากระบบ?
              </p>

              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.35rem" }}>
                  พิมพ์คำว่า <code style={{ backgroundColor: "rgba(220, 38, 38, 0.1)", color: "#dc2626", padding: "0.1rem 0.35rem", borderRadius: "0.25rem" }}>delete this menu</code> เพื่อยืนยัน:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="delete this menu"
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
                  disabled={isSubmitting || deleteConfirmText.trim().toLowerCase() !== "delete this menu"}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.6rem 1.5rem",
                    borderRadius: "0.6rem",
                    border: "none",
                    backgroundColor: "#dc2626",
                    color: "#fff",
                    cursor: (isSubmitting || deleteConfirmText.trim().toLowerCase() !== "delete this menu") ? "not-allowed" : "pointer",
                    opacity: (deleteConfirmText.trim().toLowerCase() !== "delete this menu") ? 0.6 : 1,
                    fontFamily: "'Kanit', sans-serif",
                    fontWeight: 600,
                  }}
                >
                  {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                  <span>ลบเมนูทันที</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
