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
  CheckCircle2,
  XCircle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  Flame,
} from "lucide-react";

interface MenuItem {
  id: number;
  name: string;
  nameEn: string;
  category: string;
  categoryName: string;
  price: number;
  description: string;
  image: string;
  isAvailable: boolean; // is_available (ซ่อน / แสดง)
  isSoldOut: boolean;   // is_sold_out (ขายหมด / มีของ)
  isRecommended: boolean; // is_recommended (แนะนำ)
  orderCount?: number;
}

const INITIAL_MENUS: MenuItem[] = [
  {
    id: 1,
    name: "น้ำเต้าหู้ดั้งเดิม",
    nameEn: "Original Soy Milk",
    category: "flavours",
    categoryName: "รสชาติดั้งเดิม",
    price: 35,
    description: "น้ำเต้าหู้เข้มข้น หอมถั่วเหลืองแท้ 100% ต้มสดใหม่ทุกวัน ไม่ผสมนมผง",
    image: "/images/hero-soy.jpg",
    isAvailable: true,
    isSoldOut: false,
    isRecommended: true,
    orderCount: 168,
  },
  {
    id: 2,
    name: "น้ำเต้าหู้มัทฉะ",
    nameEn: "Matcha Soy",
    category: "flavours",
    categoryName: "รสชาติพิเศษ",
    price: 50,
    description: "มัทฉะเกรดพรีเมียมจากญี่ปุ่น ชงสดผสมน้ำเต้าหู้หอมละมุนเข้มข้น",
    image: "/images/drink-matcha.jpg",
    isAvailable: true,
    isSoldOut: false,
    isRecommended: true,
    orderCount: 121,
  },
  {
    id: 3,
    name: "น้ำเต้าหู้ชาไทย",
    nameEn: "Thai Tea Soy",
    category: "flavours",
    categoryName: "รสชาติพิเศษ",
    price: 45,
    description: "ชาไทยใบชาคัดพิเศษ หอมเข้มมันนัว กลมกล่อมลงตัวแบบไทยแท้",
    image: "/images/drink-mango.jpg",
    isAvailable: true,
    isSoldOut: false,
    isRecommended: false,
    orderCount: 96,
  },
  {
    id: 4,
    name: "น้ำเต้าหู้นมเย็น",
    nameEn: "Nom Yen Soy",
    category: "flavours",
    categoryName: "รสชาติพิเศษ",
    price: 40,
    description: "สละนมเย็นสีชมพูหวานละมุน หอมสดชื่น ดื่มง่าย สดชื่นคลายร้อน",
    image: "/images/drink-lychee.jpg",
    isAvailable: true,
    isSoldOut: true,
    isRecommended: false,
    orderCount: 62,
  },
  {
    id: 5,
    name: "น้ำเต้าหู้ช็อกโกแลต",
    nameEn: "Choco Soy",
    category: "flavours",
    categoryName: "รสชาติพิเศษ",
    price: 45,
    description: "โกโก้เข้มข้นสูตรพิเศษ เข้ากันได้ดีเยี่ยมกับน้ำเต้าหู้เข้มข้น",
    image: "/images/drink-pearl.jpg",
    isAvailable: true,
    isSoldOut: false,
    isRecommended: false,
    orderCount: 74,
  },
  {
    id: 6,
    name: "Matcha + Red Bean / Boba",
    nameEn: "Combo Matcha Lover",
    category: "combos",
    categoryName: "ชุดเซ็ตยอดนิยม",
    price: 65,
    description: "มัทฉะเข้มข้นจับคู่กับไข่มุกหนึบหนับและถั่วแดงหวานมัน ฟินทุกคำ",
    image: "/images/drink-matcha.jpg",
    isAvailable: true,
    isSoldOut: false,
    isRecommended: true,
    orderCount: 88,
  },
  {
    id: 7,
    name: "Thai Tea + Grass Jelly",
    nameEn: "Combo Thai Tea Joy",
    category: "combos",
    categoryName: "ชุดเซ็ตยอดนิยม",
    price: 60,
    description: "ชาไทยหอมเข้มตัดรสชาติด้วยเฉาก๊วยหนึบหนับเคี้ยวเพลินดับร้อน",
    image: "/images/drink-mango.jpg",
    isAvailable: true,
    isSoldOut: false,
    isRecommended: false,
    orderCount: 54,
  },
  {
    id: 8,
    name: "Soy Duo Special",
    nameEn: "Original + Herbal Trio",
    category: "combos",
    categoryName: "ชุดเซ็ตยอดนิยม",
    price: 55,
    description: "น้ำเต้าหู้ดั้งเดิมพร้อมลูกชิด แปะก๊วย และถั่วแดง รวมคุณประโยชน์ล้นแก้ว",
    image: "/images/hero-soy.jpg",
    isAvailable: false,
    isSoldOut: false,
    isRecommended: false,
    orderCount: 30,
  },
];

const ITEMS_PER_PAGE = 6;

export default function MenuManagementPage() {
  const [menus, setMenus] = useState<MenuItem[]>(INITIAL_MENUS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "available" | "hidden" | "soldout">("all");
  const [activeKebabId, setActiveKebabId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<1 | number>(1);

  // Edit Modal State
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editForm, setEditForm] = useState<{
    name: string;
    nameEn: string;
    category: string;
    price: number;
    description: string;
    isRecommended: boolean;
  }>({
    name: "",
    nameEn: "",
    category: "flavours",
    price: 0,
    description: "",
    isRecommended: false,
  });

  // Toggle Visibility (Icon ตา: ซ่อน / แสดง)
  const toggleVisibility = (id: number) => {
    setMenus((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isAvailable: !item.isAvailable } : item
      )
    );
    setActiveKebabId(null);
  };

  // Toggle Sold Out (เปิด / ปิด ขายหมด)
  const toggleSoldOut = (id: number) => {
    setMenus((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isSoldOut: !item.isSoldOut } : item
      )
    );
    setActiveKebabId(null);
  };

  // Open Edit Modal
  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setEditForm({
      name: item.name,
      nameEn: item.nameEn,
      category: item.category,
      price: item.price,
      description: item.description,
      isRecommended: item.isRecommended,
    });
    setActiveKebabId(null);
  };

  // Save Edit Modal
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setMenus((prev) =>
      prev.map((item) =>
        item.id === editingItem.id
          ? {
              ...item,
              name: editForm.name,
              nameEn: editForm.nameEn,
              category: editForm.category,
              categoryName: editForm.category === "combos" ? "ชุดเซ็ตยอดนิยม" : "รสชาติดั้งเดิม",
              price: Number(editForm.price),
              description: editForm.description,
              isRecommended: editForm.isRecommended,
            }
          : item
      )
    );
    setEditingItem(null);
  };

  // Filter Menus
  const filteredMenus = menus.filter((item) => {
    const matchSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchCategory =
      selectedCategory === "all" || item.category === selectedCategory;

    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "available" && item.isAvailable && !item.isSoldOut) ||
      (statusFilter === "hidden" && !item.isAvailable) ||
      (statusFilter === "soldout" && item.isSoldOut);

    return matchSearch && matchCategory && matchStatus;
  });

  // Pagination Calculation
  const totalPages = Math.ceil(filteredMenus.length / ITEMS_PER_PAGE) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = filteredMenus.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Close kebab when clicked outside
  const handleContainerClick = () => {
    if (activeKebabId !== null) {
      setActiveKebabId(null);
    }
  };

  return (
    <div
      onClick={handleContainerClick}
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

          {/* Add Menu Button */}
          <button
            type="button"
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
            <span>เพิ่มเมนูใหม่</span>
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
              placeholder="ค้นหาชื่อเมนู หรือคำอธิบาย..."
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

          {/* Categories & Status Filters */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center" }}>
            {/* Category Tabs */}
            <div
              style={{
                display: "flex",
                backgroundColor: "var(--cream)",
                padding: "3px",
                borderRadius: "0.6rem",
                border: "1px solid rgba(50, 55, 65, 0.08)",
              }}
            >
              {[
                { id: "all", label: "ทุกหมวดหมู่" },
                { id: "flavours", label: "น้ำเต้าหู้รสชาติต่างๆ" },
                { id: "combos", label: "เซ็ตคอมโบ" },
              ].map((c) => {
                const isSelected = selectedCategory === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(c.id);
                      setCurrentPage(1);
                    }}
                    style={{
                      padding: "0.35rem 0.75rem",
                      fontSize: "0.8rem",
                      fontWeight: isSelected ? 600 : 400,
                      borderRadius: "0.45rem",
                      border: "none",
                      cursor: "pointer",
                      backgroundColor: isSelected ? "var(--card)" : "transparent",
                      color: isSelected ? "var(--teal)" : "var(--ink-soft)",
                      boxShadow: isSelected ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>

            {/* Status Dropdown / Select */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <Filter size={15} color="var(--ink-soft)" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                style={{
                  padding: "0.4rem 0.75rem",
                  borderRadius: "0.6rem",
                  fontSize: "0.8rem",
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
                <option value="hidden">ซ่อนเมนู</option>
              </select>
            </div>
          </div>
        </div>

        {/* Menu Cards Grid */}
        <div
          style={{
            marginTop: "1.5rem",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "1.25rem",
          }}
        >
          {currentItems.map((item) => {
            const isKebabOpen = activeKebabId === item.id;

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
                    src={item.image}
                    alt={item.name}
                    fill
                    style={{
                      objectFit: "cover",
                      filter: item.isSoldOut ? "grayscale(80%)" : "none",
                    }}
                  />

                  {/* Dimmed Overlay if Sold Out or Hidden */}
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
                        สินค้าหมด (Sold Out)
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

                  {/* Recommended Badge */}
                  {item.isRecommended && item.isAvailable && (
                    <div
                      style={{
                        position: "absolute",
                        top: "0.75rem",
                        left: "0.75rem",
                        backgroundColor: "var(--teal)",
                        color: "#fff",
                        padding: "0.2rem 0.65rem",
                        borderRadius: "9999px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: "0.25rem",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                      }}
                    >
                      <Sparkles size={13} />
                      <span>เมนูแนะนำ</span>
                    </div>
                  )}

                  {/* Kebab Menu Button (Top Right) */}
                  <div style={{ position: "absolute", top: "0.75rem", right: "0.75rem", zIndex: 10 }}>
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
                          width: "180px",
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
                        {/* Option 1: Edit (Icon Edit) */}
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

                        {/* Option 2: Sold Out Toggle (ขายหมด / มีของ) */}
                        <button
                          type="button"
                          onClick={() => toggleSoldOut(item.id)}
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

                        <div style={{ height: "1px", backgroundColor: "rgba(50, 55, 65, 0.08)", margin: "0.2rem 0" }} />

                        {/* Option 3: Eye / EyeOff Toggle (ซ่อน / ยกเลิกซ่อน) */}
                        <button
                          type="button"
                          onClick={() => toggleVisibility(item.id)}
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
                          {item.categoryName}
                        </span>
                        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginTop: "0.15rem", lineHeight: 1.3 }}>
                          {item.name}
                        </h3>
                        <p style={{ fontSize: "0.75rem", color: "var(--ink-soft)", marginTop: "1px" }}>
                          {item.nameEn}
                        </p>
                      </div>

                      {/* Price Badge */}
                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--ink)", fontFamily: "'Kanit', sans-serif" }}>
                          ฿{item.price}
                        </span>
                      </div>
                    </div>

                    <p
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--ink-soft)",
                        marginTop: "0.6rem",
                        lineHeight: 1.4,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {item.description}
                    </p>
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

                    {item.orderCount && (
                      <span style={{ color: "var(--ink-soft)", fontWeight: 500, display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        <Flame size={13} color="var(--teal)" />
                        ขายแล้ว {item.orderCount} แก้ว
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredMenus.length === 0 && (
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
            <p style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--ink)" }}>ไม่พบรายการเมนูที่ค้นหา</p>
            <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)", marginTop: "0.35rem" }}>
              ลองเปลี่ยนคำค้นหา หรือรีเซ็ตตัวกรองสถานะ/หมวดหมู่
            </p>
          </div>
        )}

        {/* Pagination Section */}
        {filteredMenus.length > 0 && (
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
              แสดงรายการที่ {startIndex + 1} - {Math.min(startIndex + ITEMS_PER_PAGE, filteredMenus.length)} จากทั้งหมด {filteredMenus.length} รายการ
            </p>

            {/* Pagination Controls */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage === 1}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "36px",
                  height: "36px",
                  borderRadius: "0.5rem",
                  border: "1px solid rgba(50, 55, 65, 0.1)",
                  backgroundColor: "var(--card)",
                  color: safeCurrentPage === 1 ? "rgba(50,55,65,0.3)" : "var(--ink)",
                  cursor: safeCurrentPage === 1 ? "not-allowed" : "pointer",
                }}
              >
                <ChevronLeft size={18} />
              </button>

              {Array.from({ length: totalPages }).map((_, idx) => {
                const pageNum = idx + 1;
                const isActive = pageNum === safeCurrentPage;
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
                disabled={safeCurrentPage === totalPages}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "36px",
                  height: "36px",
                  borderRadius: "0.5rem",
                  border: "1px solid rgba(50, 55, 65, 0.1)",
                  backgroundColor: "var(--card)",
                  color: safeCurrentPage === totalPages ? "rgba(50,55,65,0.3)" : "var(--ink)",
                  cursor: safeCurrentPage === totalPages ? "not-allowed" : "pointer",
                }}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editingItem && (
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
                maxHeight: "90vh",
                overflowY: "auto",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Edit3 size={20} color="var(--teal)" />
                  แก้ไขข้อมูลเมนู
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  style={{
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    padding: "0.25rem",
                    borderRadius: "0.5rem",
                    color: "var(--ink-soft)",
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} style={{ marginTop: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                {/* Product Name (TH) */}
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.35rem" }}>
                    ชื่อเมนู (ภาษาไทย)
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
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

                {/* Product Name (EN) */}
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.35rem" }}>
                    ชื่อเมนู (English)
                  </label>
                  <input
                    type="text"
                    value={editForm.nameEn}
                    onChange={(e) => setEditForm({ ...editForm, nameEn: e.target.value })}
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

                {/* Price & Category */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.35rem" }}>
                      ราคาเริ่มต้น (บาท)
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={editForm.price}
                      onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })}
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
                      หมวดหมู่
                    </label>
                    <select
                      value={editForm.category}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "0.6rem 0.85rem",
                        borderRadius: "0.6rem",
                        border: "1px solid rgba(50, 55, 65, 0.15)",
                        backgroundColor: "var(--cream)",
                        fontFamily: "'Kanit', sans-serif",
                        fontSize: "0.9rem",
                        outline: "none",
                        cursor: "pointer",
                      }}
                    >
                      <option value="flavours">น้ำเต้าหู้รสชาติต่างๆ</option>
                      <option value="combos">เซ็ตคอมโบ</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.35rem" }}>
                    คำอธิบายสินค้า
                  </label>
                  <textarea
                    rows={3}
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
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

                {/* Recommended Checkbox */}
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.85rem", fontWeight: 500 }}>
                  <input
                    type="checkbox"
                    checked={editForm.isRecommended}
                    onChange={(e) => setEditForm({ ...editForm, isRecommended: e.target.checked })}
                    style={{ width: "16px", height: "16px", accentColor: "var(--teal)" }}
                  />
                  <span>ตั้งเป็นสินค้าแนะนำ (Recommended)</span>
                </label>

                {/* Action Buttons */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
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
                    บันทึกข้อมูล
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
