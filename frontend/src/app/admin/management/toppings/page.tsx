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
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  Candy,
  Sparkles,
} from "lucide-react";

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

const INITIAL_TOPPINGS: ToppingItem[] = [
  {
    id: 1,
    nameTh: "ไข่มุกบราวน์ชูการ์",
    nameEn: "Brown Sugar Boba",
    price: 10,
    image: "/images/drink-pearl.jpg",
    isAvailable: true,
    isSoldOut: false,
    sortOrder: 1,
    icedOnly: true,
    orderCount: 342,
  },
  {
    id: 2,
    nameTh: "เฉาก๊วยหนึบ",
    nameEn: "Grass Jelly",
    price: 10,
    image: "/images/drink-mango.jpg",
    isAvailable: true,
    isSoldOut: false,
    sortOrder: 2,
    orderCount: 285,
  },
  {
    id: 3,
    nameTh: "เม็ดแมงลัก",
    nameEn: "Basil Seeds",
    price: 5,
    image: "/images/hero-soy.jpg",
    isAvailable: true,
    isSoldOut: false,
    sortOrder: 3,
    orderCount: 198,
  },
  {
    id: 4,
    nameTh: "เมล็ดเจีย",
    nameEn: "Chia Seeds",
    price: 10,
    image: "/images/drink-matcha.jpg",
    isAvailable: true,
    isSoldOut: false,
    sortOrder: 4,
    orderCount: 145,
  },
  {
    id: 5,
    nameTh: "สาคูใบเตย",
    nameEn: "Pandan Sago",
    price: 5,
    image: "/images/drink-lychee.jpg",
    isAvailable: true,
    isSoldOut: true,
    sortOrder: 5,
    orderCount: 160,
  },
  {
    id: 6,
    nameTh: "ถั่วแดงกวนหวานมัน",
    nameEn: "Sweet Red Bean",
    price: 10,
    image: "/images/drink-matcha.jpg",
    isAvailable: true,
    isSoldOut: false,
    sortOrder: 6,
    orderCount: 210,
  },
  {
    id: 7,
    nameTh: "แปะก๊วยเชื่อม",
    nameEn: "Sweet Ginkgo",
    price: 15,
    image: "/images/hero-soy.jpg",
    isAvailable: false,
    isSoldOut: false,
    sortOrder: 7,
    orderCount: 88,
  },
  {
    id: 8,
    nameTh: "ลูกชิดนุ่ม",
    nameEn: "Palm Seeds",
    price: 10,
    image: "/images/drink-lychee.jpg",
    isAvailable: true,
    isSoldOut: false,
    sortOrder: 8,
    orderCount: 95,
  },
];

const ITEMS_PER_PAGE = 6;

export default function ToppingsManagementPage() {
  const [toppings, setToppings] = useState<ToppingItem[]>(INITIAL_TOPPINGS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "available" | "hidden" | "soldout">("all");
  const [activeKebabId, setActiveKebabId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Edit/Add Modal State
  const [editingItem, setEditingItem] = useState<ToppingItem | null>(null);
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
  const [editForm, setEditForm] = useState<{
    nameTh: string;
    nameEn: string;
    price: number;
    icedOnly: boolean;
    sortOrder: number;
  }>({
    nameTh: "",
    nameEn: "",
    price: 10,
    icedOnly: false,
    sortOrder: 1,
  });

  // Toggle Visibility (Icon ตา: ซ่อน / แสดง)
  const toggleVisibility = (id: number) => {
    setToppings((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isAvailable: !item.isAvailable } : item
      )
    );
    setActiveKebabId(null);
  };

  // Toggle Sold Out (เปิด / ปิด ขายหมด)
  const toggleSoldOut = (id: number) => {
    setToppings((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isSoldOut: !item.isSoldOut } : item
      )
    );
    setActiveKebabId(null);
  };

  // Open Edit Modal
  const openEditModal = (item: ToppingItem) => {
    setEditingItem(item);
    setIsAddingNew(false);
    setEditForm({
      nameTh: item.nameTh,
      nameEn: item.nameEn,
      price: item.price,
      icedOnly: item.icedOnly ?? false,
      sortOrder: item.sortOrder,
    });
    setActiveKebabId(null);
  };

  // Open Add New Modal
  const openAddModal = () => {
    setEditingItem(null);
    setIsAddingNew(true);
    setEditForm({
      nameTh: "",
      nameEn: "",
      price: 10,
      icedOnly: false,
      sortOrder: toppings.length + 1,
    });
  };

  // Save Modal Form
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAddingNew) {
      const newItem: ToppingItem = {
        id: Date.now(),
        nameTh: editForm.nameTh,
        nameEn: editForm.nameEn,
        price: Number(editForm.price),
        image: "/images/drink-pearl.jpg",
        isAvailable: true,
        isSoldOut: false,
        sortOrder: Number(editForm.sortOrder),
        icedOnly: editForm.icedOnly,
        orderCount: 0,
      };
      setToppings((prev) => [...prev, newItem]);
      setIsAddingNew(false);
    } else if (editingItem) {
      setToppings((prev) =>
        prev.map((item) =>
          item.id === editingItem.id
            ? {
                ...item,
                nameTh: editForm.nameTh,
                nameEn: editForm.nameEn,
                price: Number(editForm.price),
                icedOnly: editForm.icedOnly,
                sortOrder: Number(editForm.sortOrder),
              }
            : item
        )
      );
      setEditingItem(null);
    }
  };

  // Filter Toppings
  const filteredToppings = toppings.filter((item) => {
    const matchSearch =
      item.nameTh.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.nameEn.toLowerCase().includes(searchQuery.toLowerCase());

    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "available" && item.isAvailable && !item.isSoldOut) ||
      (statusFilter === "hidden" && !item.isAvailable) ||
      (statusFilter === "soldout" && item.isSoldOut);

    return matchSearch && matchStatus;
  });

  // Pagination Calculation
  const totalPages = Math.ceil(filteredToppings.length / ITEMS_PER_PAGE) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = filteredToppings.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Filter size={15} color="var(--ink-soft)" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              style={{
                padding: "0.45rem 0.85rem",
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

        {/* Toppings Cards Grid */}
        <div
          style={{
            marginTop: "1.5rem",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
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
                <div style={{ position: "relative", width: "100%", height: "160px", backgroundColor: "#f0ece1" }}>
                  <Image
                    src={item.image}
                    alt={item.nameTh}
                    fill
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
                      <span>ซ่อนอยู่</span>
                    </div>
                  )}

                  {/* Iced Only Tag */}
                  {item.icedOnly && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: "0.6rem",
                        left: "0.75rem",
                        backgroundColor: "rgba(75, 155, 140, 0.9)",
                        color: "#fff",
                        padding: "0.15rem 0.5rem",
                        borderRadius: "0.4rem",
                        fontSize: "0.7rem",
                        fontWeight: 600,
                      }}
                    >
                      เฉพาะเมนูเย็น
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
                              <span>ตั้งเป็น "ของหมด"</span>
                            </>
                          )}
                        </button>

                        <div style={{ height: "1px", backgroundColor: "rgba(50, 55, 65, 0.08)", margin: "0.2rem 0" }} />

                        {/* Option 3: Eye / EyeOff Toggle */}
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
                              <span>ซ่อนท็อปปิ้งนี้</span>
                            </>
                          ) : (
                            <>
                              <Eye size={15} color="var(--teal)" />
                              <span>เปิดแสดงท็อปปิ้ง</span>
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
                        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, lineHeight: 1.3 }}>
                          {item.nameTh}
                        </h3>
                        <p style={{ fontSize: "0.75rem", color: "var(--ink-soft)", marginTop: "2px" }}>
                          {item.nameEn}
                        </p>
                      </div>

                      {/* Price Tag */}
                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--teal)", fontFamily: "'Kanit', sans-serif" }}>
                          +{item.price}฿
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Bottom Status Bar */}
                  <div
                    style={{
                      marginTop: "1.25rem",
                      paddingTop: "0.75rem",
                      borderTop: "1px solid rgba(50, 55, 65, 0.08)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: "0.75rem",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      {item.isSoldOut ? (
                        <span style={{ color: "#e05353", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.25rem" }}>
                          <XCircle size={13} /> ของหมด
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

                    {item.orderCount !== undefined && (
                      <span style={{ color: "var(--ink-soft)", fontWeight: 500, display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        <Candy size={13} color="var(--teal)" />
                        สั่งแล้ว {item.orderCount} ครั้ง
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredToppings.length === 0 && (
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
            <p style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--ink)" }}>ไม่พบรายการท็อปปิ้งที่ค้นหา</p>
            <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)", marginTop: "0.35rem" }}>
              ลองเปลี่ยนคำค้นหา หรือรีเซ็ตตัวกรองสถานะ
            </p>
          </div>
        )}

        {/* Pagination Section */}
        {filteredToppings.length > 0 && (
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
              แสดงรายการที่ {startIndex + 1} - {Math.min(startIndex + ITEMS_PER_PAGE, filteredToppings.length)} จากทั้งหมด {filteredToppings.length} รายการ
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

        {/* Edit / Add Modal */}
        {(editingItem || isAddingNew) && (
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
                maxWidth: "480px",
                padding: "1.75rem",
                boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
                border: "1px solid rgba(50, 55, 65, 0.1)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Candy size={20} color="var(--teal)" />
                  {isAddingNew ? "เพิ่มท็อปปิ้งใหม่" : "แก้ไขข้อมูลท็อปปิ้ง"}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setEditingItem(null);
                    setIsAddingNew(false);
                  }}
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

              <form onSubmit={handleSaveForm} style={{ marginTop: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                {/* Topping Name TH */}
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.35rem" }}>
                    ชื่อท็อปปิ้ง (ภาษาไทย)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น ไข่มุกบราวน์ชูการ์"
                    value={editForm.nameTh}
                    onChange={(e) => setEditForm({ ...editForm, nameTh: e.target.value })}
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

                {/* Topping Name EN */}
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.35rem" }}>
                    ชื่อท็อปปิ้ง (English)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Brown Sugar Boba"
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

                {/* Price & Sort Order */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.35rem" }}>
                      ราคาบวกเพิ่ม (บาท)
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
                      ลำดับการแสดงผล
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={editForm.sortOrder}
                      onChange={(e) => setEditForm({ ...editForm, sortOrder: Number(e.target.value) })}
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
                </div>

                {/* Iced Only Option */}
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.85rem", fontWeight: 500 }}>
                  <input
                    type="checkbox"
                    checked={editForm.icedOnly}
                    onChange={(e) => setEditForm({ ...editForm, icedOnly: e.target.checked })}
                    style={{ width: "16px", height: "16px", accentColor: "var(--teal)" }}
                  />
                  <span>ใส่ได้เฉพาะเมนูเย็นเท่านั้น (Iced Only)</span>
                </label>

                {/* Action Buttons */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingItem(null);
                      setIsAddingNew(false);
                    }}
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
                    {isAddingNew ? "เพิ่มท็อปปิ้ง" : "บันทึกการแก้ไข"}
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
