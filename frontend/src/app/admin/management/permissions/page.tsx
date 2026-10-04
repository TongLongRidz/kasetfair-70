"use client";

import React, { useState, useEffect, useCallback } from "react";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import AuthGuard from "@/components/ui/AuthGuard";
import {
  Key,
  Search,
  Lock,
  Loader2,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { getStoredToken, PermissionItem } from "@/lib/auth";
import { useToast } from "@/components/ui/toast";

export default function PermissionsManagementPage() {
  const { error: toastError } = useToast();
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortField, setSortField] = useState<"id" | "name_th" | "created_at">("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 5;

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = getStoredToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585";
      const headers = {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append("q", searchQuery.trim());
      params.append("sort", sortField);
      params.append("order", sortOrder);

      const resPerms = await fetch(`${apiUrl}/api/v1/permissions?${params.toString()}`, { headers, credentials: "include" });

      if (resPerms.ok) {
        const jsonPerms = await resPerms.json();
        const fetchedPerms: PermissionItem[] = jsonPerms.data || [];
        setPermissions(fetchedPerms);
      }
    } catch (err) {
      console.error("Failed to fetch permissions:", err);
      toastError("ไม่สามารถดึงข้อมูลสิทธิ์การใช้งานได้", "ข้อผิดพลาด");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, sortField, sortOrder, toastError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getModuleCategory = (name: string) => {
    const parts = name.split(".");
    return parts[0] || "general";
  };

  const categoryLabels: Record<string, string> = {
    dashboard: "หน้าแรก / แดชบอร์ด",
    expense: "ระบบจัดการค่าใช้จ่าย",
    qrcode: "จัดการ QR Code รับเงิน",
    slip_check: "ระบบตรวจสอบสลิป",
    menu: "จัดการเมนูและสินค้า",
    banner: "จัดการแบนเนอร์และภาพ",
    administrator: "จัดการผู้ดูแลระบบ (Admins)",
    pos_front: "ระบบขายหน้าร้าน (POS)",
    kitchen: "หน้าจอห้องครัว / บาร์",
    queue: "ระบบคิวลูกค้า",
    permission: "จัดการบทบาทและสิทธิ์",
  };

  const categories = Array.from(new Set(permissions.map((p) => getModuleCategory(p.name))));

  // Filter & Sort permissions locally for client-side pagination
  const filteredPermissions = permissions
    .filter((p) => {
      const categoryMatch = selectedCategory === "all" || getModuleCategory(p.name) === selectedCategory;
      if (!categoryMatch) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        (p.name_th && p.name_th.toLowerCase().includes(q)) ||
        (p.name_en && p.name_en.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (sortField === "created_at") {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
      }
      if (sortField === "name_th") {
        const nameA = a.name_th || a.name;
        const nameB = b.name_th || b.name;
        return sortOrder === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      }
      return sortOrder === "asc" ? a.id - b.id : b.id - a.id;
    });

  const total = filteredPermissions.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedPermissions = filteredPermissions.slice(startIndex, startIndex + pageSize);

  return (
    <AuthGuard>
      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          backgroundColor: "var(--cream)",
          fontFamily: "'Kanit', sans-serif",
        }}
      >
        <AdminSidebar />

        <main style={{ flex: 1, padding: "1.75rem 2.5rem", minWidth: 0 }}>
          {/* Header Section */}
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
            <div>
              <h1 style={{ fontSize: "1.75rem", fontWeight: 800, lineHeight: 1.2 }}>
                จัดการสิทธิ์การใช้งาน
              </h1>
            </div>
          </div>

          {/* Main Table Container (Administrator Page Style) */}
          <section
            style={{
              marginTop: "1.5rem",
              borderRadius: "1.25rem",
              backgroundColor: "var(--card)",
              padding: "1.5rem",
              border: "1px solid rgba(50, 55, 65, 0.1)",
              boxShadow: "0 4px 20px -2px rgba(0,0,0,0.03)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Controls Bar: Category Filter & Sort Dropdowns + Search Box */}
            <div className="admin-controls-bar">
              <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "center" }}>
                {/* Category Filter Dropdown */}
                <select
                  className="admin-filter-select"
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{
                    padding: "0.45rem 0.85rem",
                    borderRadius: "0.6rem",
                    backgroundColor: "var(--cream)",
                    border: "1px solid rgba(50, 55, 65, 0.15)",
                    fontSize: "0.825rem",
                    fontWeight: 600,
                    fontFamily: "'Kanit', sans-serif",
                    color: "var(--ink)",
                    outline: "none",
                    cursor: "pointer",
                  }}
                >
                  <option value="all">หมวดหมู่: ทั้งหมด ({permissions.length})</option>
                  {categories.map((cat) => {
                    const count = permissions.filter((p) => getModuleCategory(p.name) === cat).length;
                    return (
                      <option key={cat} value={cat}>
                        {categoryLabels[cat] || cat} ({count})
                      </option>
                    );
                  })}
                </select>

                {/* Sort Field Selector */}
                <select
                  className="admin-filter-select"
                  value={sortField}
                  onChange={(e) => {
                    setSortField(e.target.value as any);
                    setCurrentPage(1);
                  }}
                  style={{
                    padding: "0.45rem 0.85rem",
                    borderRadius: "0.6rem",
                    backgroundColor: "var(--cream)",
                    border: "1px solid rgba(50, 55, 65, 0.15)",
                    fontSize: "0.825rem",
                    fontWeight: 600,
                    fontFamily: "'Kanit', sans-serif",
                    color: "var(--ink)",
                    outline: "none",
                    cursor: "pointer",
                  }}
                >
                  <option value="id">เรียงลำดับ: ไอดี (ID)</option>
                  <option value="name_th">เรียงลำดับ: ชื่อสิทธิ์ (TH)</option>
                  <option value="created_at">เรียงลำดับ: วันที่สร้าง</option>
                </select>

                {/* Sort Direction Toggle */}
                <button
                  type="button"
                  onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    padding: "0.45rem 0.85rem",
                    borderRadius: "0.6rem",
                    backgroundColor: "var(--cream)",
                    border: "1px solid rgba(50, 55, 65, 0.15)",
                    fontSize: "0.825rem",
                    fontWeight: 600,
                    fontFamily: "'Kanit', sans-serif",
                    color: "var(--ink)",
                    cursor: "pointer",
                  }}
                >
                  <ArrowUpDown size={14} />
                  <span>{sortOrder === "asc" ? "น้อยไปมาก (ASC)" : "มากไปน้อย (DESC)"}</span>
                </button>
              </div>

              <div className="admin-search-wrapper">
                <div className="admin-search-box">
                  <Search size={15} color="var(--ink-soft)" style={{ flexShrink: 0 }} />
                  <input
                    type="text"
                    placeholder="ค้นหาสิทธิ์..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Desktop / Tablet: Table View identical to Administrator page */}
            <div className="admin-table-view" style={{ overflowX: "visible", minHeight: "318px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem", tableLayout: "fixed" }}>
                <thead>
                  <tr
                    style={{
                      borderBottom: "2px solid rgba(50, 55, 65, 0.12)",
                      color: "var(--ink)",
                      fontSize: "0.925rem",
                      fontWeight: 600,
                      height: "48px",
                      letterSpacing: "0.01em",
                    }}
                  >
                    <th style={{ padding: "0.6rem", width: "45px", textAlign: "center", color: "var(--ink)" }}>#</th>
                    <th style={{ padding: "0.6rem", color: "var(--ink)" }}>ชื่อสิทธิ์</th>
                    <th style={{ padding: "0.6rem", width: "180px", color: "var(--ink)" }}>วันที่สร้าง</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={3} style={{ textAlign: "center", height: "270px", padding: "1rem", color: "var(--ink-soft)" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                          <Loader2 size={20} className="animate-spin" />
                          <span>กำลังโหลดข้อมูลสิทธิ์การใช้งาน...</span>
                        </div>
                      </td>
                    </tr>
                  ) : paginatedPermissions.length === 0 ? (
                    <tr>
                      <td colSpan={3} style={{ textAlign: "center", height: "270px", padding: "1rem", color: "var(--ink-soft)" }}>
                        <Lock size={32} color="var(--ink-soft)" style={{ margin: "0 auto 0.5rem", opacity: 0.5 }} />
                        <p style={{ fontWeight: 600 }}>ไม่พบรายการสิทธิ์ที่ตรงกับเงื่อนไข</p>
                      </td>
                    </tr>
                  ) : (
                    <>
                      {paginatedPermissions.map((perm, idx) => {
                        const runningNumber = (currentPage - 1) * pageSize + idx + 1;

                        return (
                          <tr
                            key={perm.id}
                            style={{
                              borderBottom: "1px solid rgba(50, 55, 65, 0.06)",
                              transition: "background-color 0.15s ease",
                              height: "54px",
                              boxSizing: "border-box",
                            }}
                          >
                            {/* Running Index */}
                            <td className="font-mono" style={{ padding: "0.5rem 0.6rem", textAlign: "center", fontSize: "0.8rem", color: "var(--ink-soft)" }}>
                              {runningNumber}
                            </td>

                            {/* Permission Name (Name TH & Name EN, Name TH is prominent) */}
                            <td style={{ padding: "0.5rem 0.6rem" }}>
                              <div style={{ display: "flex", flexDirection: "column" }}>
                                <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--ink)" }}>
                                  {perm.name_th || perm.name}
                                </span>
                                {perm.name_en && (
                                  <span style={{ fontSize: "0.775rem", color: "var(--ink-soft)", fontWeight: 500, marginTop: "1px" }}>
                                    {perm.name_en}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Created At */}
                            <td style={{ padding: "0.5rem 0.6rem", fontSize: "0.8rem", color: "var(--ink-soft)" }}>
                              {perm.created_at ? (
                                <div style={{ lineHeight: 1.25 }}>
                                  <div className="font-mono" style={{ color: "var(--ink)", fontWeight: 500, fontSize: "0.8rem" }}>
                                    {perm.created_at.includes("T")
                                      ? perm.created_at.split("T")[0]
                                      : perm.created_at.split(" ")[0]}
                                  </div>
                                  <div className="font-mono" style={{ fontSize: "0.725rem", color: "var(--ink-soft)", marginTop: "1px" }}>
                                    {perm.created_at.includes("T")
                                      ? perm.created_at.split("T")[1]?.substring(0, 8)
                                      : perm.created_at.split(" ")[1] || ""}
                                  </div>
                                </div>
                              ) : (
                                "-"
                              )}
                            </td>
                          </tr>
                        );
                      })}

                      {/* Filler empty rows to maintain fixed 5-row table height matching administrator page */}
                      {Array.from({ length: Math.max(0, pageSize - paginatedPermissions.length) }).map((_, i) => (
                        <tr
                          key={`empty-filler-${i}`}
                          style={{
                            height: "54px",
                            boxSizing: "border-box",
                            borderBottom: "1px solid rgba(50, 55, 65, 0.04)",
                          }}
                        >
                          <td colSpan={3} style={{ padding: "0.5rem 0.6rem", color: "transparent" }}>
                            &nbsp;
                          </td>
                        </tr>
                      ))}
                    </>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls identical to Administrator / Slip Check pages */}
            <div
              style={{
                marginTop: "1.25rem",
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
                  แสดงหน้า {currentPage} จาก {totalPages} (ทั้งหมด {total} รายการ)
                </span>
              </div>

              {/* Prev / Next & Page Buttons */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  style={{
                    padding: "0.35rem 0.65rem",
                    borderRadius: "0.4rem",
                    border: "1px solid rgba(50, 55, 65, 0.15)",
                    backgroundColor: "var(--cream)",
                    color: currentPage <= 1 ? "rgba(50, 55, 65, 0.3)" : "var(--ink)",
                    cursor: currentPage <= 1 ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    fontSize: "0.8rem",
                    fontFamily: "'Kanit', sans-serif",
                  }}
                >
                  <ChevronLeft size={14} />
                  <span style={{ marginLeft: "2px" }}>ก่อนหน้า</span>
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
                        minWidth: "32px",
                        height: "32px",
                        padding: "0 0.4rem",
                        borderRadius: "0.4rem",
                        border: isActive ? "none" : "1px solid rgba(50, 55, 65, 0.15)",
                        backgroundColor: isActive ? "var(--teal)" : "var(--cream)",
                        color: isActive ? "#fff" : "var(--ink)",
                        fontWeight: isActive ? 700 : 500,
                        fontSize: "0.8rem",
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
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  style={{
                    padding: "0.35rem 0.65rem",
                    borderRadius: "0.4rem",
                    border: "1px solid rgba(50, 55, 65, 0.15)",
                    backgroundColor: "var(--cream)",
                    color: currentPage >= totalPages ? "rgba(50, 55, 65, 0.3)" : "var(--ink)",
                    cursor: currentPage >= totalPages ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    fontSize: "0.8rem",
                    fontFamily: "'Kanit', sans-serif",
                  }}
                >
                  <span style={{ marginRight: "2px" }}>ถัดไป</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </AuthGuard>
  );
}
