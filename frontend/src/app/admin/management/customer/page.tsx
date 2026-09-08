"use client";

import React, { useState } from "react";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import {
  Search,
  Calendar,
  Clock,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Phone,
  X,
} from "lucide-react";

interface Customer {
  id: number;
  phone_number: string;
  name: string;
  current_points: number;
  total_cups_bought: number;
  created_at: string;
  latest_bought_at: string;
}

const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 1,
    phone_number: "081-234-5678",
    name: "คุณฟ้า",
    current_points: 12,
    total_cups_bought: 24,
    created_at: "2026-09-01 10:30",
    latest_bought_at: "2026-09-08 10:42",
  },
  {
    id: 2,
    phone_number: "089-876-5432",
    name: "คุณเบียร์",
    current_points: 5,
    total_cups_bought: 15,
    created_at: "2026-09-01 11:15",
    latest_bought_at: "2026-09-08 10:15",
  },
  {
    id: 3,
    phone_number: "086-555-1234",
    name: "คุณแนน",
    current_points: 8,
    total_cups_bought: 18,
    created_at: "2026-09-02 14:20",
    latest_bought_at: "2026-09-08 09:50",
  },
  {
    id: 4,
    phone_number: "092-444-9988",
    name: "คุณโอ๊ต",
    current_points: 2,
    total_cups_bought: 7,
    created_at: "2026-09-03 09:45",
    latest_bought_at: "2026-09-07 18:30",
  },
  {
    id: 5,
    phone_number: "084-321-7890",
    name: "คุณปอ",
    current_points: 15,
    total_cups_bought: 30,
    created_at: "2026-09-01 12:00",
    latest_bought_at: "2026-09-07 17:10",
  },
  {
    id: 6,
    phone_number: "095-777-8899",
    name: "คุณกานต์",
    current_points: 4,
    total_cups_bought: 10,
    created_at: "2026-09-04 16:30",
    latest_bought_at: "2026-09-07 15:40",
  },
  {
    id: 7,
    phone_number: "083-999-1122",
    name: "คุณมุก",
    current_points: 9,
    total_cups_bought: 19,
    created_at: "2026-09-02 13:10",
    latest_bought_at: "2026-09-06 20:15",
  },
  {
    id: 8,
    phone_number: "088-123-9876",
    name: "คุณนพ",
    current_points: 1,
    total_cups_bought: 5,
    created_at: "2026-09-05 11:25",
    latest_bought_at: "2026-09-06 14:00",
  },
  {
    id: 9,
    phone_number: "091-654-3210",
    name: "คุณบอย",
    current_points: 6,
    total_cups_bought: 12,
    created_at: "2026-09-03 15:50",
    latest_bought_at: "2026-09-05 19:20",
  },
  {
    id: 10,
    phone_number: "087-456-7890",
    name: "คุณแพร",
    current_points: 11,
    total_cups_bought: 22,
    created_at: "2026-09-02 09:00",
    latest_bought_at: "2026-09-05 16:45",
  },
];

export default function CustomerManagementPage() {
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"latest_bought" | "created_at" | "points_desc" | "cups_desc">("latest_bought");
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // New Customer Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newPhone, setNewPhone] = useState("");
  const [newName, setNewName] = useState("");

  // Handle Add Customer
  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhone.trim()) return;

    const newCust: Customer = {
      id: Date.now(),
      phone_number: newPhone.trim(),
      name: newName.trim() || "ไม่ระบุชื่อ",
      current_points: 0,
      total_cups_bought: 0,
      created_at: new Date().toISOString().replace("T", " ").substring(0, 16),
      latest_bought_at: new Date().toISOString().replace("T", " ").substring(0, 16),
    };

    setCustomers([newCust, ...customers]);
    setIsAddModalOpen(false);
    setNewPhone("");
    setNewName("");
  };

  // Filter & Sort
  const filteredCustomers = customers
    .filter((c) => {
      const q = searchQuery.toLowerCase();
      return (
        c.phone_number.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        String(c.id).includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === "latest_bought") return b.latest_bought_at.localeCompare(a.latest_bought_at);
      if (sortBy === "created_at") return b.created_at.localeCompare(a.created_at);
      if (sortBy === "points_desc") return b.current_points - a.current_points;
      if (sortBy === "cups_desc") return b.total_cups_bought - a.total_cups_bought;
      return 0;
    });

  // Pagination Calculation
  const totalPages = Math.ceil(filteredCustomers.length / pageSize) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedCustomers = filteredCustomers.slice(startIndex, startIndex + pageSize);

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
              จัดการข้อมูลสมาชิก & แต้มสะสม
            </h1>
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
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
            <UserPlus size={18} />
            <span>ลงทะเบียนสมาชิกใหม่</span>
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
              placeholder="ค้นหาเบอร์โทรศัพท์ หรือชื่อลูกค้า..."
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

          {/* Sort Controls */}
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
              <option value="latest_bought">สั่งซื้อล่าสุด (Latest)</option>
              <option value="created_at">วันที่สมัครล่าสุด</option>
              <option value="points_desc">แต้มสะสม (มาก → น้อย)</option>
              <option value="cups_desc">จำนวนแก้ว (มาก → น้อย)</option>
            </select>
          </div>
        </div>

        {/* Customers Table Section */}
        <div
          style={{
            marginTop: "1.25rem",
            backgroundColor: "var(--card)",
            borderRadius: "1.25rem",
            border: "1px solid rgba(50, 55, 65, 0.1)",
            boxShadow: "0 4px 16px -2px rgba(0,0,0,0.03)",
            overflow: "hidden",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ backgroundColor: "rgba(50, 55, 65, 0.03)", borderBottom: "1px solid rgba(50, 55, 65, 0.1)", color: "var(--ink-soft)", fontSize: "0.8rem" }}>
                  <th style={{ padding: "0.85rem 1rem", width: "60px", textAlign: "center" }}>#</th>
                  <th style={{ padding: "0.85rem 1rem" }}>เบอร์โทรศัพท์</th>
                  <th style={{ padding: "0.85rem 1rem" }}>ชื่อลูกค้า</th>
                  <th style={{ padding: "0.85rem 1rem", textAlign: "center" }}>แต้มสะสม</th>
                  <th style={{ padding: "0.85rem 1rem", textAlign: "center" }}>แก้วสะสม</th>
                  <th style={{ padding: "0.85rem 1rem" }}>วันที่สมัคร</th>
                  <th style={{ padding: "0.85rem 1rem" }}>สั่งซื้อล่าสุด</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCustomers.map((c, index) => (
                  <tr
                    key={c.id}
                    style={{
                      borderBottom: "1px solid rgba(50, 55, 65, 0.05)",
                      transition: "background-color 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(75, 155, 140, 0.03)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    {/* Running Number */}
                    <td className="font-mono" style={{ padding: "0.85rem 1rem", color: "var(--ink-soft)", fontSize: "0.85rem", textAlign: "center" }}>
                      {startIndex + index + 1}
                    </td>

                    {/* Phone Number */}
                    <td style={{ padding: "0.85rem 1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <Phone size={14} color="var(--teal)" />
                        <span className="font-mono" style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--ink)" }}>
                          {c.phone_number}
                        </span>
                      </div>
                    </td>

                    {/* Name */}
                    <td style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>
                      {c.name}
                    </td>

                    {/* Current Points */}
                    <td style={{ padding: "0.85rem 1rem", textAlign: "center" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: "rgba(75, 155, 140, 0.12)",
                          color: "var(--teal)",
                          padding: "0.25rem 0.65rem",
                          borderRadius: "9999px",
                          fontWeight: 700,
                          fontSize: "0.85rem",
                        }}
                      >
                        {c.current_points} แต้ม
                      </span>
                    </td>

                    {/* Total Cups Bought */}
                    <td style={{ padding: "0.85rem 1rem", textAlign: "center" }}>
                      <span style={{ fontWeight: 700, color: "var(--ink)" }}>
                        {c.total_cups_bought}
                      </span>{" "}
                      <span style={{ fontSize: "0.75rem", color: "var(--ink-soft)" }}>แก้ว</span>
                    </td>

                    {/* Created At */}
                    <td style={{ padding: "0.85rem 1rem", fontSize: "0.8rem", color: "var(--ink-soft)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                        <Calendar size={13} />
                        <span>{c.created_at}</span>
                      </div>
                    </td>

                    {/* Latest Bought At */}
                    <td style={{ padding: "0.85rem 1rem", fontSize: "0.8rem", color: "var(--ink-soft)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                        <Clock size={13} color="var(--teal)" />
                        <span style={{ fontWeight: 500, color: "var(--ink)" }}>{c.latest_bought_at}</span>
                      </div>
                    </td>
                  </tr>
                ))}

                {paginatedCustomers.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "3rem", color: "var(--ink-soft)" }}>
                      ไม่พบข้อมูลสมาชิกที่ค้นหา
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {filteredCustomers.length > 0 && (
            <div
              style={{
                padding: "1rem 1.25rem",
                borderTop: "1px solid rgba(50, 55, 65, 0.08)",
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
                  แสดงรายการที่ {startIndex + 1} - {Math.min(startIndex + pageSize, filteredCustomers.length)} จากทั้งหมด {filteredCustomers.length} รายการ
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
                    <option value={10}>10 รายการ / หน้า</option>
                    <option value={20}>20 รายการ / หน้า</option>
                    <option value={50}>50 รายการ / หน้า</option>
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
        </div>

        {/* Add Customer Modal */}
        {isAddModalOpen && (
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
                maxWidth: "420px",
                padding: "1.75rem",
                boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
                border: "1px solid rgba(50, 55, 65, 0.1)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <UserPlus size={20} color="var(--teal)" />
                  ลงทะเบียนสมาชิกใหม่
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--ink-soft)" }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddCustomer} style={{ marginTop: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.35rem" }}>
                    เบอร์โทรศัพท์ (จำเป็น)
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="เช่น 081-234-5678"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
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
                    ชื่อ / ชื่อเล่นลูกค้า
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น คุณฟ้า"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
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

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
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
                    บันทึกสมาชิก
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
