"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import { getStoredToken } from "@/lib/auth";
import { useToast } from "@/components/ui/toast";
import CustomDropdown from "@/components/ui/CustomDropdown";
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
  LayoutGrid,
  Table as TableIcon,
  Loader2,
  Save,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

export interface BannerItem {
  id: number;
  banner_id: number;
  image_url: string;
  order: number;
  is_active: boolean;
  created_at: string;
}

export interface Banner {
  id: number;
  name_th: string;
  name_en: string;
  desc_th: string;
  desc_en: string;
  is_active: boolean;
  created_at: string;
  items: BannerItem[];
}

const DEFAULT_INITIAL_BANNERS: Banner[] = [
  {
    id: 1,
    name_th: "แบนเนอร์หลักหน้าแรก (Home Hero Banner)",
    name_en: "Main Homepage Hero Banner",
    desc_th: "แสดงส่วนบนสุดของหน้าแรก ประชาสัมพันธ์งานเกษตรแฟร์ 70 ปี และเมนูแนะนำ",
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
    name_th: "แบนเนอร์โปรโมชั่นสวัสดิการ & สมาชิก (Reward Promotion Banner)",
    name_en: "Loyalty Points & Welfare Promo Banner",
    desc_th: "แบนเนอร์แสดงในหน้าโปรโมชั่น สวัสดิการนิสิต/บุคลากร และระบบสมาชิก",
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
    name_th: "แบนเนอร์กิจกรรม Flash Sale พิเศษช่วงเย็น",
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
  const { success, error: toastError, info } = useToast();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  // View Mode: Table View vs Grid View
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [sortBy, setSortBy] = useState<"created_desc" | "items_count" | "name_asc">("created_desc");
  const [pageSize, setPageSize] = useState<number>(10);
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
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const directUploadRef = useRef<HTMLInputElement>(null);
  const [uploadTargetBannerId, setUploadTargetBannerId] = useState<number | null>(null);

  // ---------------------------------------------------------------------------
  // Backend API Integration: Load Banners from System Settings
  // ---------------------------------------------------------------------------
  const fetchBanners = async () => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585";
      const res = await fetch(`${apiUrl}/api/v1/settings/banner_management_data`);

      if (res.ok) {
        const data = await res.json();
        if (data.value) {
          try {
            const parsed: Banner[] = JSON.parse(data.value);
            if (Array.isArray(parsed)) {
              setBanners(parsed);
              return;
            }
          } catch (e) {
            console.error("Failed to parse banner settings JSON:", e);
          }
        }
      }

      setBanners([]);
    } catch (err) {
      console.error("Failed to fetch banners from backend API:", err);
      setBanners([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  // Sync / Save updated banners array to Backend API System Settings
  const syncBannersToBackend = async (updatedBanners: Banner[], successMsg?: string) => {
    setSaving(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585";
      const token = getStoredToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const jsonString = JSON.stringify(updatedBanners);
      const res = await fetch(`${apiUrl}/api/v1/settings/banner_management_data`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          value: jsonString,
          description: "ข้อมูลแบนเนอร์ประชาสัมพันธ์และการจัดลำดับสไลด์ภาพ",
        }),
      });

      if (res.ok) {
        setBanners(updatedBanners);
        if (successMsg) {
          success(successMsg, "บันทึกข้อมูลสำเร็จ");
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        toastError(errJson.error || "ไม่สามารถบันทึกข้อมูลแบนเนอร์ใน Database ได้", "เกิดข้อผิดพลาด");
      }
    } catch (err) {
      console.error("Failed to sync banners to backend:", err);
      toastError("เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์", "เกิดข้อผิดพลาด");
    } finally {
      setSaving(false);
    }
  };

  // Close kebab menu when clicking outside
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".kebab-container")) {
        setActiveKebabId(null);
      }
    };
    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, []);

  // ---------------------------------------------------------------------------
  // Modal & Item Operations
  // ---------------------------------------------------------------------------
  const handleOpenAdd = () => {
    setEditingBanner(null);
    setFormNameTh("");
    setFormNameEn("");
    setFormDescTh("");
    setFormDescEn("");
    setFormIsActive(true);
    setIsGroupModalOpen(true);
  };

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

  const handleToggleActive = (id: number) => {
    const updated = banners.map((b) =>
      b.id === id ? { ...b, is_active: !b.is_active } : b
    );
    const target = banners.find((b) => b.id === id);
    const newStatus = target ? !target.is_active : true;
    syncBannersToBackend(
      updated,
      newStatus ? `เปิดการแสดงผลแบนเนอร์ #${id} เรียบร้อยแล้ว` : `ปิดการแสดงผลแบนเนอร์ #${id} เรียบร้อยแล้ว`
    );
    setActiveKebabId(null);
  };

  const handleDeleteBannerGroup = (id: number) => {
    const target = banners.find((b) => b.id === id);
    if (!confirm(`คุณต้องการลบกลุ่มแบนเนอร์ "${target?.name_th || `#${id}`}" ใช่หรือไม่?`)) return;

    const updated = banners.filter((b) => b.id !== id);
    syncBannersToBackend(updated, `ลบกลุ่มแบนเนอร์ #${id} เรียบร้อยแล้ว`);
    setActiveKebabId(null);
  };

  const handleSubmitGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNameTh.trim() || !formNameEn.trim()) {
      toastError("กรุณาระบุชื่อกลุ่มแบนเนอร์ภาษาไทยและภาษาอังกฤษ", "ข้อมูลไม่ครบถ้วน");
      return;
    }

    let updated: Banner[];
    if (editingBanner) {
      updated = banners.map((b) =>
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
      );
    } else {
      const newId = Date.now();
      const newB: Banner = {
        id: newId,
        name_th: formNameTh.trim(),
        name_en: formNameEn.trim(),
        desc_th: formDescTh.trim(),
        desc_en: formDescEn.trim(),
        is_active: formIsActive,
        created_at: new Date().toISOString().replace("T", " ").substring(0, 16),
        items: [],
      };
      updated = [newB, ...banners];
    }

    setIsGroupModalOpen(false);
    syncBannersToBackend(
      updated,
      editingBanner ? "แก้ไขข้อมูลกลุ่มแบนเนอร์สำเร็จ" : "สร้างกลุ่มแบนเนอร์ใหม่สำเร็จ"
    );
  };

  // Upload image file via Backend API POST /api/v1/upload
  const handleFileUpload = async (file: File, targetBannerId?: number) => {
    setUploadingImage(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585";
      const token = getStoredToken();

      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "banners");

      const res = await fetch(`${apiUrl}/api/v1/upload`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      if (res.ok) {
        const json = await res.json();
        const rawUrl = json.url || "";
        const fullUrl = rawUrl.startsWith("http")
          ? rawUrl
          : `${apiUrl}${rawUrl.startsWith("/") ? "" : "/"}${rawUrl}`;

        if (targetBannerId) {
          // Direct item upload into specific banner group
          const updated = banners.map((b) => {
            if (b.id === targetBannerId) {
              const newItem: BannerItem = {
                id: Date.now(),
                banner_id: targetBannerId,
                image_url: fullUrl,
                order: b.items.length + 1,
                is_active: true,
                created_at: new Date().toISOString().replace("T", " ").substring(0, 16),
              };
              return { ...b, items: [...b.items, newItem] };
            }
            return b;
          });

          if (managingItemsBanner?.id === targetBannerId) {
            const currentB = updated.find((b) => b.id === targetBannerId);
            if (currentB) setManagingItemsBanner(currentB);
          }

          syncBannersToBackend(updated, "อัพโหลดและเพิ่มรูปภาพลงในแบนเนอร์เรียบร้อยแล้ว");
        } else {
          setNewItemUrl(fullUrl);
          success("อัพโหลดรูปภาพเข้าสู่ระบบเรียบร้อยแล้ว", "อัพโหลดไฟล์");
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        toastError(errJson.error || "เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ", "เกิดข้อผิดพลาด");
      }
    } catch (err) {
      console.error("Failed to upload image file:", err);
      toastError("เกิดข้อผิดพลาดในการส่งไฟล์ไปยังเซิร์ฟเวอร์", "เกิดข้อผิดพลาด");
    } finally {
      setUploadingImage(false);
      setUploadTargetBannerId(null);
    }
  };

  const handleAddItemToBanner = (bannerId: number) => {
    if (!newItemUrl.trim()) return;

    const updated = banners.map((b) => {
      if (b.id === bannerId) {
        const newItem: BannerItem = {
          id: Date.now(),
          banner_id: bannerId,
          image_url: newItemUrl.trim(),
          order: b.items.length + 1,
          is_active: true,
          created_at: new Date().toISOString().replace("T", " ").substring(0, 16),
        };
        const newB = { ...b, items: [...b.items, newItem] };
        if (managingItemsBanner?.id === bannerId) setManagingItemsBanner(newB);
        return newB;
      }
      return b;
    });

    syncBannersToBackend(updated, "เพิ่มรูปภาพเข้าสู่แบนเนอร์เรียบร้อยแล้ว");
  };

  const handleToggleItemActive = (bannerId: number, itemId: number) => {
    const updated = banners.map((b) => {
      if (b.id === bannerId) {
        const updatedItems = b.items.map((it) =>
          it.id === itemId ? { ...it, is_active: !it.is_active } : it
        );
        const newB = { ...b, items: updatedItems };
        if (managingItemsBanner?.id === bannerId) setManagingItemsBanner(newB);
        return newB;
      }
      return b;
    });

    syncBannersToBackend(updated);
  };

  const handleDeleteItem = (bannerId: number, itemId: number) => {
    const updated = banners.map((b) => {
      if (b.id === bannerId) {
        const filtered = b.items
          .filter((it) => it.id !== itemId)
          .map((it, idx) => ({ ...it, order: idx + 1 }));
        const newB = { ...b, items: filtered };
        if (managingItemsBanner?.id === bannerId) setManagingItemsBanner(newB);
        return newB;
      }
      return b;
    });

    syncBannersToBackend(updated, "ลบรูปภาพสไลด์เรียบร้อยแล้ว");
  };

  const handleMoveItemOrder = (bannerId: number, index: number, direction: "up" | "down") => {
    const updated = banners.map((b) => {
      if (b.id === bannerId) {
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= b.items.length) return b;

        const reordered = [...b.items];
        const [moved] = reordered.splice(index, 1);
        reordered.splice(targetIndex, 0, moved);

        const updatedItems = reordered.map((it, idx) => ({ ...it, order: idx + 1 }));
        const newB = { ...b, items: updatedItems };
        if (managingItemsBanner?.id === bannerId) setManagingItemsBanner(newB);
        return newB;
      }
      return b;
    });

    syncBannersToBackend(updated);
  };

  // Format Helper
  const renderFormattedDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    const datePart = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr.split(" ")[0];
    const rawTime = dateStr.includes("T") ? dateStr.split("T")[1]?.substring(0, 5) : dateStr.split(" ")[1]?.substring(0, 5) || "";

    return (
      <div style={{ lineHeight: 1.25 }}>
        <div className="font-mono" style={{ color: "var(--ink)", fontWeight: 500, fontSize: "0.8rem" }}>
          {datePart}
        </div>
        {rawTime && (
          <div className="font-mono" style={{ fontSize: "0.725rem", color: "var(--ink-soft)", marginTop: "1px" }}>
            {rawTime}
          </div>
        )}
      </div>
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

  const activeBannersCount = banners.filter((b) => b.is_active).length;
  const totalImagesCount = banners.reduce((acc, b) => acc + b.items.length, 0);

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

      {/* Hidden File Input for Direct Upload */}
      <input
        type="file"
        ref={directUploadRef}
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleFileUpload(file, uploadTargetBannerId || undefined);
          }
        }}
      />

      <main style={{ flex: 1, padding: "1.75rem 2.5rem", minWidth: 0 }}>
        {/* Header Section */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, lineHeight: 1.2, margin: 0 }}>
              จัดการแบนเนอร์ประชาสัมพันธ์
            </h1>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {/* View Mode Switcher */}
            <div style={{ display: "flex", backgroundColor: "var(--card)", padding: "0.25rem", borderRadius: "0.75rem", border: "1px solid rgba(50,55,65,0.12)" }}>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  padding: "0.4rem 0.75rem",
                  borderRadius: "0.5rem",
                  border: "none",
                  backgroundColor: viewMode === "table" ? "var(--ink)" : "transparent",
                  color: viewMode === "table" ? "var(--cream)" : "var(--ink-soft)",
                  fontSize: "0.8rem",
                  fontWeight: viewMode === "table" ? 700 : 500,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  fontFamily: "'Kanit', sans-serif",
                }}
              >
                <TableIcon size={15} />
                <span>ตาราง (Table)</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  padding: "0.4rem 0.75rem",
                  borderRadius: "0.5rem",
                  border: "none",
                  backgroundColor: viewMode === "grid" ? "var(--ink)" : "transparent",
                  color: viewMode === "grid" ? "var(--cream)" : "var(--ink-soft)",
                  fontSize: "0.8rem",
                  fontWeight: viewMode === "grid" ? 700 : 500,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  fontFamily: "'Kanit', sans-serif",
                }}
              >
                <LayoutGrid size={15} />
                <span>การ์ด (Grid)</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleOpenAdd}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                backgroundColor: "var(--teal)",
                color: "#fff",
                padding: "0.6rem 1.15rem",
                borderRadius: "0.75rem",
                border: "none",
                fontWeight: 700,
                fontSize: "0.875rem",
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(75, 155, 140, 0.25)",
                transition: "transform 0.15s ease",
                fontFamily: "'Kanit', sans-serif",
              }}
            >
              <Plus size={18} />
              <span>สร้างกลุ่มแบนเนอร์ใหม่</span>
            </button>
          </div>
        </div>

        {/* Top Summary Cards */}
        <div className="admin-kpi-grid" style={{ marginTop: "1.25rem", marginBottom: "1.25rem" }}>
          <div
            className="admin-kpi-card animate-rise"
            style={{
              borderRadius: "1.25rem",
              backgroundColor: "var(--card)",
              padding: "1.1rem 1.25rem",
              border: "1px solid rgba(50, 55, 65, 0.09)",
              boxShadow: "0 2px 12px -2px rgba(0,0,0,0.03)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <p style={{ fontSize: "0.825rem", color: "var(--ink-soft)", fontWeight: 500, margin: 0 }}>
              กลุ่มแบนเนอร์ทั้งหมด
            </p>
            <p className="font-display" style={{ fontSize: "1.85rem", fontWeight: 800, color: "var(--ink)", margin: "0.35rem 0", lineHeight: 1.1 }}>
              {banners.length} <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--ink-soft)" }}>กลุ่ม</span>
            </p>
            <p style={{ fontSize: "0.75rem", color: "var(--ink-soft)", margin: 0 }}>
              เปิดใช้งานอยู่ {activeBannersCount} กลุ่ม
            </p>
          </div>

          <div
            className="admin-kpi-card animate-rise"
            style={{
              borderRadius: "1.25rem",
              backgroundColor: "var(--card)",
              padding: "1.1rem 1.25rem",
              border: "1px solid rgba(50, 55, 65, 0.09)",
              boxShadow: "0 2px 12px -2px rgba(0,0,0,0.03)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <p style={{ fontSize: "0.825rem", color: "var(--ink-soft)", fontWeight: 500, margin: 0 }}>
              รูปภาพสไลด์ทั้งหมด
            </p>
            <p className="font-display" style={{ fontSize: "1.85rem", fontWeight: 800, color: "var(--teal)", margin: "0.35rem 0", lineHeight: 1.1 }}>
              {totalImagesCount} <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--ink-soft)" }}>รูปภาพ</span>
            </p>
            <p style={{ fontSize: "0.75rem", color: "var(--ink-soft)", margin: 0 }}>
              เฉลี่ย {banners.length ? (totalImagesCount / banners.length).toFixed(1) : 0} รูปภาพ/กลุ่ม
            </p>
          </div>
        </div>

        {/* Container */}
        <section
          style={{
            borderRadius: "1.25rem",
            backgroundColor: "var(--card)",
            padding: "1.5rem",
            border: "1px solid rgba(50, 55, 65, 0.1)",
            boxShadow: "0 4px 20px -2px rgba(0,0,0,0.03)",
          }}
        >
          {/* Controls Bar: Filter Tabs & Search / Sort */}
          <div className="admin-controls-bar">
            {/* Filter Tabs (Desktop) */}
            <div className="admin-filter-tabs">
              {[
                { id: "all", label: `ทั้งหมด (${banners.length})` },
                { id: "active", label: `เปิดใช้งาน (${activeBannersCount})` },
                { id: "inactive", label: `ปิดใช้งาน (${banners.length - activeBannersCount})` },
              ].map((tab) => {
                const isSelected = statusFilter === tab.id;
                return (
                  <button
                    key={tab.id}
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

            {/* Filter Dropdown (Mobile) */}
            <div className="admin-filter-dropdown-wrapper">
              <CustomDropdown
                value={statusFilter}
                onChange={(val) => {
                  setStatusFilter(val as any);
                  setCurrentPage(1);
                }}
                minWidth="150px"
                options={[
                  { value: "all", label: `ทั้งหมด (${banners.length})` },
                  { value: "active", label: `เปิดใช้งาน (${activeBannersCount})` },
                  { value: "inactive", label: `ปิดใช้งาน (${banners.length - activeBannersCount})` },
                ]}
              />
            </div>

            {/* Search & Sort Controls */}
            <div className="admin-search-wrapper" style={{ gap: "0.75rem" }}>
              <div className="admin-search-box">
                <Search size={15} color="var(--ink-soft)" style={{ flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อแบนเนอร์ หรือรายละเอียด..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>

              <CustomDropdown
                value={sortBy}
                onChange={(val) => {
                  setSortBy(val as any);
                  setCurrentPage(1);
                }}
                minWidth="200px"
                options={[
                  { value: "created_desc", label: "เรียงตาม: วันที่สร้าง (ล่าสุด)" },
                  { value: "name_asc", label: "เรียงตาม: ชื่อแบนเนอร์ (A-Z)" },
                  { value: "items_count", label: "เรียงตาม: จำนวนรูปสไลด์" },
                ]}
              />
            </div>
          </div>

          {/* ============================================================== */}
          {/* VIEW MODE 1: TABLE VIEW                                       */}
          {/* ============================================================== */}
          {viewMode === "table" && (
            <div className="admin-table-view" style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem", tableLayout: "fixed" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(50, 55, 65, 0.12)", color: "var(--ink)", fontSize: "0.825rem" }}>
                    <th style={{ width: "6%", padding: "0.75rem 0.6rem" }}>#</th>
                    <th style={{ width: "24%", padding: "0.75rem 0.6rem" }}>กลุ่มแบนเนอร์ / รายละเอียด</th>
                    <th style={{ width: "32%", padding: "0.75rem 0.6rem" }}>สไลด์รูปภาพประชาสัมพันธ์</th>
                    <th style={{ width: "12%", padding: "0.75rem 0.6rem", textAlign: "center" }}>สถานะ</th>
                    <th style={{ width: "14%", padding: "0.75rem 0.6rem" }}>วันที่สร้าง</th>
                    <th style={{ width: "12%", padding: "0.75rem 0.6rem", textAlign: "center" }}>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", padding: "3rem", color: "var(--ink-soft)" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                          <Loader2 size={18} className="animate-spin" />
                          <span>กำลังดึงข้อมูลแบนเนอร์จาก Backend Database...</span>
                        </div>
                      </td>
                    </tr>
                  ) : paginatedBanners.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", padding: "3rem", color: "var(--ink-soft)" }}>
                        ไม่พบกลุ่มแบนเนอร์ที่ตรงตามเงื่อนไข
                      </td>
                    </tr>
                  ) : (
                    paginatedBanners.map((banner) => (
                      <tr
                        key={banner.id}
                        className="hover:bg-[rgba(50,55,65,0.025)]"
                        style={{
                          borderBottom: "1px solid rgba(50, 55, 65, 0.06)",
                          transition: "background-color 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
                          opacity: banner.is_active ? 1 : 0.75,
                        }}
                      >
                        {/* ID */}
                        <td style={{ padding: "0.85rem 0.6rem" }}>
                          <span className="font-mono" style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--ink-soft)" }}>
                            #{banner.id}
                          </span>
                        </td>

                        {/* Name & Desc */}
                        <td style={{ padding: "0.85rem 0.6rem" }}>
                          <div style={{ fontWeight: 700, color: "var(--ink)", fontSize: "0.9rem", lineHeight: 1.3 }}>
                            {banner.name_th}
                          </div>
                          <div style={{ fontSize: "0.775rem", color: "var(--ink-soft)", marginTop: "2px" }}>
                            {banner.name_en}
                          </div>
                          {banner.desc_th && (
                            <div style={{ fontSize: "0.75rem", color: "var(--ink-soft)", marginTop: "4px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                              {banner.desc_th}
                            </div>
                          )}
                        </td>

                        {/* Images Strip */}
                        <td style={{ padding: "0.85rem 0.6rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                            <span
                              style={{
                                fontSize: "0.75rem",
                                padding: "0.2rem 0.55rem",
                                borderRadius: "9999px",
                                backgroundColor: "rgba(75, 155, 140, 0.12)",
                                color: "var(--teal)",
                                fontWeight: 700,
                                border: "1px solid rgba(75, 155, 140, 0.2)",
                              }}
                            >
                              {banner.items.length} รูป
                            </span>

                            <div style={{ display: "flex", gap: "0.35rem", overflowX: "auto", maxWidth: "260px", paddingBottom: "2px" }}>
                              {banner.items.map((item, idx) => (
                                <div
                                  key={item.id}
                                  style={{
                                    position: "relative",
                                    width: "56px",
                                    height: "36px",
                                    borderRadius: "0.45rem",
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
                                    sizes="56px"
                                    style={{ objectFit: "cover" }}
                                  />
                                  <span
                                    style={{
                                      position: "absolute",
                                      bottom: 1,
                                      right: 1,
                                      backgroundColor: "rgba(0,0,0,0.65)",
                                      color: "#fff",
                                      fontSize: "0.6rem",
                                      padding: "0 3px",
                                      borderRadius: "2px",
                                      fontWeight: 700,
                                    }}
                                  >
                                    #{item.order}
                                  </span>
                                </div>
                              ))}

                              {banner.items.length === 0 && (
                                <span style={{ fontSize: "0.75rem", color: "var(--ink-soft)" }}>
                                  ยังไม่มีรูปภาพ
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Status Toggle */}
                        <td style={{ padding: "0.85rem 0.6rem", textAlign: "center" }}>
                          <button
                            type="button"
                            onClick={() => handleToggleActive(banner.id)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.3rem",
                              borderRadius: "9999px",
                              padding: "0.25rem 0.7rem",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              backgroundColor: banner.is_active ? "rgba(34, 197, 94, 0.12)" : "rgba(50, 55, 65, 0.08)",
                              color: banner.is_active ? "#16a34a" : "var(--ink-soft)",
                              border: banner.is_active ? "1px solid rgba(34, 197, 94, 0.25)" : "1px solid rgba(50, 55, 65, 0.15)",
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                            }}
                          >
                            {banner.is_active ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                            <span>{banner.is_active ? "เปิดใช้งาน" : "ปิดใช้งาน"}</span>
                          </button>
                        </td>

                        {/* Created Date */}
                        <td style={{ padding: "0.85rem 0.6rem" }}>
                          {renderFormattedDate(banner.created_at)}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: "0.85rem 0.6rem", textAlign: "center" }}>
                          <div style={{ display: "flex", gap: "0.35rem", justifyContent: "center" }}>
                            {/* Upload File Direct */}
                            <button
                              type="button"
                              onClick={() => {
                                setUploadTargetBannerId(banner.id);
                                directUploadRef.current?.click();
                              }}
                              title="อัพโหลดรูปภาพเข้ากลุ่มนี้"
                              style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "0.5rem",
                                border: "1px solid rgba(75, 155, 140, 0.3)",
                                backgroundColor: "rgba(75, 155, 140, 0.08)",
                                color: "var(--teal)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                              }}
                            >
                              <UploadCloud size={14} />
                            </button>

                            {/* Manage Items */}
                            <button
                              type="button"
                              onClick={() => setManagingItemsBanner(banner)}
                              title="จัดการรูปภาพสไลด์"
                              style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "0.5rem",
                                border: "1px solid rgba(50,55,65,0.12)",
                                backgroundColor: "var(--cream)",
                                color: "var(--ink-soft)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                              }}
                            >
                              <ImageIcon size={14} />
                            </button>

                            {/* Edit */}
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(banner)}
                              title="แก้ไขข้อมูลกลุ่ม"
                              style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "0.5rem",
                                border: "1px solid rgba(50,55,65,0.12)",
                                backgroundColor: "var(--cream)",
                                color: "var(--ink-soft)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                              }}
                            >
                              <Edit3 size={14} />
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => handleDeleteBannerGroup(banner.id)}
                              title="ลบกลุ่มแบนเนอร์"
                              style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "0.5rem",
                                border: "1px solid rgba(220, 38, 38, 0.25)",
                                backgroundColor: "rgba(220, 38, 38, 0.08)",
                                color: "#dc2626",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ============================================================== */}
          {/* VIEW MODE 2: GRID CARD VIEW                                    */}
          {/* ============================================================== */}
          {viewMode === "grid" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1.25rem" }}>
              {paginatedBanners.map((banner) => (
                <div
                  key={banner.id}
                  style={{
                    backgroundColor: "var(--cream)",
                    borderRadius: "1.25rem",
                    border: banner.is_active ? "1px solid rgba(50, 55, 65, 0.1)" : "1px dashed rgba(50, 55, 65, 0.2)",
                    padding: "1.25rem",
                    boxShadow: "0 4px 16px -2px rgba(0,0,0,0.03)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    opacity: banner.is_active ? 1 : 0.75,
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          padding: "0.25rem 0.6rem",
                          borderRadius: "9999px",
                          backgroundColor: "rgba(75, 155, 140, 0.12)",
                          color: "var(--teal)",
                        }}
                      >
                        {banner.items.length} รูปภาพ
                      </span>

                      <button
                        type="button"
                        onClick={() => handleToggleActive(banner.id)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.3rem",
                          borderRadius: "9999px",
                          padding: "0.2rem 0.6rem",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          backgroundColor: banner.is_active ? "rgba(34, 197, 94, 0.12)" : "rgba(50, 55, 65, 0.08)",
                          color: banner.is_active ? "#16a34a" : "var(--ink-soft)",
                          border: banner.is_active ? "1px solid rgba(34, 197, 94, 0.25)" : "1px solid rgba(50, 55, 65, 0.15)",
                          cursor: "pointer",
                        }}
                      >
                        {banner.is_active ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        <span>{banner.is_active ? "เปิดอยู่" : "ปิดอยู่"}</span>
                      </button>
                    </div>

                    <div style={{ marginTop: "0.75rem" }}>
                      <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--ink)", lineHeight: 1.3 }}>
                        {banner.name_th}
                      </h3>
                      <p style={{ fontSize: "0.8rem", color: "var(--ink-soft)", marginTop: "2px" }}>
                        {banner.name_en}
                      </p>
                    </div>

                    {/* Image Preview Strip */}
                    <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.4rem", overflowX: "auto", paddingBottom: "4px" }}>
                      {banner.items.map((item, idx) => (
                        <div
                          key={item.id}
                          style={{
                            position: "relative",
                            width: "70px",
                            height: "44px",
                            borderRadius: "0.45rem",
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
                            sizes="70px"
                            style={{ objectFit: "cover" }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid rgba(50, 55, 65, 0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--ink-soft)" }}>{renderFormattedDate(banner.created_at)}</span>
                    <div style={{ display: "flex", gap: "0.35rem" }}>
                      <button
                        type="button"
                        onClick={() => setManagingItemsBanner(banner)}
                        style={{
                          padding: "0.3rem 0.6rem",
                          borderRadius: "0.4rem",
                          border: "1px solid rgba(50,55,65,0.12)",
                          backgroundColor: "var(--card)",
                          color: "var(--ink)",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        จัดการรูป
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(banner)}
                        style={{
                          padding: "0.3rem 0.6rem",
                          borderRadius: "0.4rem",
                          border: "1px solid rgba(50,55,65,0.12)",
                          backgroundColor: "var(--card)",
                          color: "var(--ink)",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        แก้ไข
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          <div
            style={{
              marginTop: "1.25rem",
              paddingTop: "1rem",
              borderTop: "1px solid rgba(50, 55, 65, 0.08)",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "0.75rem",
              fontSize: "0.8rem",
              color: "var(--ink-soft)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span>
                แสดงหน้า {safeCurrentPage} จาก {totalPages} (ทั้งหมด {filteredBanners.length} กลุ่ม)
              </span>

              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                style={{
                  padding: "0.25rem 0.5rem",
                  borderRadius: "0.4rem",
                  border: "1px solid rgba(50, 55, 65, 0.15)",
                  backgroundColor: "var(--cream)",
                  color: "var(--ink)",
                  fontSize: "0.775rem",
                  fontWeight: 600,
                  outline: "none",
                  cursor: "pointer",
                  fontFamily: "'Kanit', sans-serif",
                }}
              >
                <option value={5}>5 รายการ/หน้า</option>
                <option value={10}>10 รายการ/หน้า</option>
                <option value={20}>20 รายการ/หน้า</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: "0.35rem" }}>
              <button
                type="button"
                disabled={safeCurrentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.2rem",
                  padding: "0.35rem 0.65rem",
                  borderRadius: "0.5rem",
                  border: "1px solid rgba(50, 55, 65, 0.15)",
                  backgroundColor: safeCurrentPage <= 1 ? "rgba(0,0,0,0.02)" : "var(--cream)",
                  color: safeCurrentPage <= 1 ? "var(--ink-soft)" : "var(--ink)",
                  fontSize: "0.775rem",
                  fontWeight: 600,
                  cursor: safeCurrentPage <= 1 ? "not-allowed" : "pointer",
                  opacity: safeCurrentPage <= 1 ? 0.5 : 1,
                }}
              >
                <ChevronLeft size={14} />
                <span>ก่อนหน้า</span>
              </button>

              <button
                type="button"
                disabled={safeCurrentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.2rem",
                  padding: "0.35rem 0.65rem",
                  borderRadius: "0.5rem",
                  border: "1px solid rgba(50, 55, 65, 0.15)",
                  backgroundColor: safeCurrentPage >= totalPages ? "rgba(0,0,0,0.02)" : "var(--cream)",
                  color: safeCurrentPage >= totalPages ? "var(--ink-soft)" : "var(--ink)",
                  fontSize: "0.775rem",
                  fontWeight: 600,
                  cursor: safeCurrentPage >= totalPages ? "not-allowed" : "pointer",
                  opacity: safeCurrentPage >= totalPages ? 0.5 : 1,
                }}
              >
                <span>ถัดไป</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* MODAL 1: ADD / EDIT BANNER GROUP                               */}
        {/* ============================================================== */}
        {isGroupModalOpen && (
          <div
            className="animate-fade-in"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.4)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
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
                boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
                border: "1px solid rgba(50, 55, 65, 0.1)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0, color: "var(--ink)" }}>
                  {editingBanner ? "แก้ไขกลุ่มแบนเนอร์" : "สร้างกลุ่มแบนเนอร์ใหม่"}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsGroupModalOpen(false)}
                  style={{ background: "none", border: "none", color: "var(--ink-soft)", cursor: "pointer" }}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmitGroup}>
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", fontSize: "0.825rem", fontWeight: 700, marginBottom: "0.35rem" }}>
                    ชื่อกลุ่มแบนเนอร์ (ภาษาไทย) <span style={{ color: "#dc2626" }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น แบนเนอร์หลักหน้าแรก"
                    value={formNameTh}
                    onChange={(e) => setFormNameTh(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "0.6rem 0.8rem",
                      borderRadius: "0.65rem",
                      border: "1px solid rgba(50,55,65,0.18)",
                      backgroundColor: "var(--cream)",
                      fontSize: "0.9rem",
                      outline: "none",
                      fontFamily: "'Kanit', sans-serif",
                    }}
                  />
                </div>

                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", fontSize: "0.825rem", fontWeight: 700, marginBottom: "0.35rem" }}>
                    ชื่อกลุ่มแบนเนอร์ (English) <span style={{ color: "#dc2626" }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น Main Homepage Hero Banner"
                    value={formNameEn}
                    onChange={(e) => setFormNameEn(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "0.6rem 0.8rem",
                      borderRadius: "0.65rem",
                      border: "1px solid rgba(50,55,65,0.18)",
                      backgroundColor: "var(--cream)",
                      fontSize: "0.9rem",
                      outline: "none",
                      fontFamily: "'Kanit', sans-serif",
                    }}
                  />
                </div>

                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", fontSize: "0.825rem", fontWeight: 700, marginBottom: "0.35rem" }}>
                    รายละเอียด / คำอธิบาย (TH)
                  </label>
                  <input
                    type="text"
                    placeholder="รายละเอียดแสดงผลภายในกลุ่มแบนเนอร์"
                    value={formDescTh}
                    onChange={(e) => setFormDescTh(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.6rem 0.8rem",
                      borderRadius: "0.65rem",
                      border: "1px solid rgba(50,55,65,0.18)",
                      backgroundColor: "var(--cream)",
                      fontSize: "0.85rem",
                      outline: "none",
                      fontFamily: "'Kanit', sans-serif",
                    }}
                  />
                </div>

                <div style={{ marginBottom: "1.25rem" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.875rem", fontWeight: 700 }}>
                    <input
                      type="checkbox"
                      checked={formIsActive}
                      onChange={(e) => setFormIsActive(e.target.checked)}
                      style={{ width: "18px", height: "18px", accentColor: "var(--teal)" }}
                    />
                    <span>เปิดใช้งานกลุ่มแบนเนอร์นี้</span>
                  </label>
                </div>

                <div style={{ display: "flex", gap: "0.6rem" }}>
                  <button
                    type="button"
                    onClick={() => setIsGroupModalOpen(false)}
                    style={{
                      flex: 1,
                      padding: "0.65rem",
                      borderRadius: "0.6rem",
                      border: "1px solid rgba(50,55,65,0.15)",
                      backgroundColor: "var(--cream)",
                      color: "var(--ink)",
                      fontWeight: 600,
                      cursor: "pointer",
                      fontSize: "0.875rem",
                    }}
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    style={{
                      flex: 1,
                      padding: "0.65rem",
                      borderRadius: "0.6rem",
                      border: "none",
                      backgroundColor: "var(--teal)",
                      color: "#fff",
                      fontWeight: 700,
                      cursor: saving ? "not-allowed" : "pointer",
                      fontSize: "0.875rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.4rem",
                    }}
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    <span>{editingBanner ? "บันทึกแก้ไข" : "สร้างกลุ่มแบนเนอร์"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODAL 2: MANAGE BANNER ITEMS & UPLOADS                        */}
        {/* ============================================================== */}
        {managingItemsBanner && (
          <div
            className="animate-fade-in"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.4)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
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
                padding: "1.75rem",
                boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
                border: "1px solid rgba(50, 55, 65, 0.1)",
                maxHeight: "90vh",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <div>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0, color: "var(--ink)" }}>
                    จัดการรูปภาพสไลด์: {managingItemsBanner.name_th}
                  </h3>
                  <p style={{ fontSize: "0.775rem", color: "var(--ink-soft)", marginTop: "2px" }}>
                    อัพโหลดรูปภาพ จัดลำดับสไลด์ภาพ และเปิด/ปิดการแสดงผลรายภาพ
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setManagingItemsBanner(null)}
                  style={{ background: "none", border: "none", color: "var(--ink-soft)", cursor: "pointer" }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Upload Input Area */}
              <div
                style={{
                  backgroundColor: "var(--cream)",
                  borderRadius: "0.85rem",
                  padding: "1rem",
                  border: "1px solid rgba(50,55,65,0.12)",
                  marginBottom: "1.25rem",
                }}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, managingItemsBanner.id);
                  }}
                />

                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center" }}>
                  <button
                    type="button"
                    disabled={uploadingImage}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      backgroundColor: "var(--teal)",
                      color: "#fff",
                      padding: "0.55rem 1rem",
                      borderRadius: "0.6rem",
                      border: "none",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      cursor: uploadingImage ? "not-allowed" : "pointer",
                    }}
                  >
                    {uploadingImage ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
                    <span>{uploadingImage ? "กำลังอัพโหลด..." : "เลือกไฟล์รูปภาพจากเครื่อง"}</span>
                  </button>

                  <span style={{ fontSize: "0.8rem", color: "var(--ink-soft)" }}>หรือใส่ URL รูปภาพ:</span>

                  <input
                    type="text"
                    placeholder="https://... หรือ /images/banner.jpg"
                    value={newItemUrl}
                    onChange={(e) => setNewItemUrl(e.target.value)}
                    style={{
                      flex: 1,
                      minWidth: "180px",
                      padding: "0.5rem 0.75rem",
                      borderRadius: "0.6rem",
                      border: "1px solid rgba(50,55,65,0.15)",
                      backgroundColor: "var(--card)",
                      fontSize: "0.85rem",
                      outline: "none",
                      fontFamily: "'Kanit', sans-serif",
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => handleAddItemToBanner(managingItemsBanner.id)}
                    style={{
                      padding: "0.55rem 1rem",
                      borderRadius: "0.6rem",
                      border: "none",
                      backgroundColor: "var(--ink)",
                      color: "var(--cream)",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      cursor: "pointer",
                    }}
                  >
                    เพิ่ม URL
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div style={{ flex: 1, overflowY: "auto", paddingRight: "0.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {managingItemsBanner.items.map((item, idx) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "0.85rem",
                      backgroundColor: "var(--cream)",
                      padding: "0.75rem 1rem",
                      borderRadius: "0.75rem",
                      border: "1px solid rgba(50,55,65,0.1)",
                      opacity: item.is_active ? 1 : 0.55,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                      <span className="font-mono" style={{ fontWeight: 800, fontSize: "0.85rem", color: "var(--ink-soft)" }}>
                        #{item.order}
                      </span>

                      <div
                        style={{
                          position: "relative",
                          width: "90px",
                          height: "54px",
                          borderRadius: "0.5rem",
                          overflow: "hidden",
                          border: "1px solid rgba(50,55,65,0.15)",
                        }}
                      >
                        <Image src={item.image_url} alt="Banner Slide" fill sizes="90px" style={{ objectFit: "cover" }} />
                      </div>

                      <div style={{ maxWidth: "240px", overflow: "hidden", textOverflow: "ellipsis" }}>
                        <span style={{ fontSize: "0.825rem", fontWeight: 600, color: "var(--ink)", display: "block" }}>
                          {item.image_url.split("/").pop()}
                        </span>
                        <span style={{ fontSize: "0.725rem", color: "var(--ink-soft)" }}>{item.image_url}</span>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveItemOrder(managingItemsBanner.id, idx, "up")}
                        style={{
                          padding: "0.35rem",
                          borderRadius: "0.4rem",
                          border: "1px solid rgba(50,55,65,0.1)",
                          backgroundColor: "var(--card)",
                          color: "var(--ink)",
                          cursor: idx === 0 ? "not-allowed" : "pointer",
                          opacity: idx === 0 ? 0.4 : 1,
                        }}
                      >
                        <ArrowUp size={14} />
                      </button>

                      <button
                        type="button"
                        disabled={idx === managingItemsBanner.items.length - 1}
                        onClick={() => handleMoveItemOrder(managingItemsBanner.id, idx, "down")}
                        style={{
                          padding: "0.35rem",
                          borderRadius: "0.4rem",
                          border: "1px solid rgba(50,55,65,0.1)",
                          backgroundColor: "var(--card)",
                          color: "var(--ink)",
                          cursor: idx === managingItemsBanner.items.length - 1 ? "not-allowed" : "pointer",
                          opacity: idx === managingItemsBanner.items.length - 1 ? 0.4 : 1,
                        }}
                      >
                        <ArrowDown size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleItemActive(managingItemsBanner.id, item.id)}
                        style={{
                          padding: "0.35rem 0.65rem",
                          borderRadius: "0.4rem",
                          border: "none",
                          backgroundColor: item.is_active ? "rgba(34, 197, 94, 0.12)" : "rgba(50,55,65,0.08)",
                          color: item.is_active ? "#16a34a" : "var(--ink-soft)",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        {item.is_active ? "เปิดอยู่" : "ปิดซ่อน"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteItem(managingItemsBanner.id, item.id)}
                        style={{
                          padding: "0.35rem",
                          borderRadius: "0.4rem",
                          border: "1px solid rgba(220, 38, 38, 0.2)",
                          backgroundColor: "rgba(220, 38, 38, 0.08)",
                          color: "#dc2626",
                          cursor: "pointer",
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}

                {managingItemsBanner.items.length === 0 && (
                  <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: "var(--ink-soft)" }}>
                    ยังไม่มีรูปภาพในกลุ่มแบนเนอร์นี้ กรุณาเลือกรูปภาพหรือใส่ URL เพื่อเพิ่มรูปภาพ
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
