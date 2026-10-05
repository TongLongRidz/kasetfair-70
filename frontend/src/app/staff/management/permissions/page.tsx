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
import CustomDropdown from "@/components/ui/CustomDropdown";
import useDateTimeFormatter from "@/hooks/useDateTimeFormatter";

export default function PermissionsManagementPage() {
  const { error: toastError } = useToast();
  const { formatDateTime } = useDateTimeFormatter();
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
    topping: "จัดการท็อปปิ้ง",
    banner: "จัดการแบนเนอร์และภาพ",
    staff: "จัดการบัญชีทีมงาน (Staff)",
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
                <CustomDropdown
                  options={[
                    { value: "all", label: `หมวดหมู่: ทั้งหมด (${permissions.length})` },
                    ...categories.map((cat) => ({
                      value: cat,
                      label: `${categoryLabels[cat] || cat} (${permissions.filter((p) => getModuleCategory(p.name) === cat).length})`,
                    })),
                  ]}
                  value={selectedCategory}
                  onChange={(val) => {
                    setSelectedCategory(val);
                    setCurrentPage(1);
                  }}
                  minWidth="200px"
                />

                {/* Sort Field Selector */}
                <CustomDropdown
                  options={[
                    { value: "id", label: "เรียงลำดับ: ไอดี (ID)" },
                    { value: "name_th", label: "เรียงลำดับ: ชื่อสิทธิ์ (TH)" },
                    { value: "created_at", label: "เรียงลำดับ: วันที่สร้าง" },
                  ]}
                  value={sortField}
                  onChange={(val) => {
                    setSortField(val as any);
                    setCurrentPage(1);
                  }}
                  minWidth="190px"
                />

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
            <div className="admin-table-view" style={{ overflowX: "visible", height: "318px", minHeight: "318px" }}>
              <table style={{ width: "100%", height: "318px", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem", tableLayout: "fixed" }}>
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
                  {paginatedPermissions.length === 0 ? (
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

                        const isLastRow = idx === paginatedPermissions.length - 1;
                        return (
                          <tr
                            key={perm.id}
                            style={{
                              borderBottom: isLastRow ? "none" : "1px solid rgba(50, 55, 65, 0.06)",
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
                                (() => {
                                  const { datePart, timePart } = formatDateTime(perm.created_at);
                                  return (
                                    <div style={{ lineHeight: 1.25 }}>
                                      <div className="font-mono" style={{ color: "var(--ink)", fontWeight: 500, fontSize: "0.8rem" }}>
                                        {datePart}
                                      </div>
                                      {timePart && (
                                        <div className="font-mono" style={{ fontSize: "0.725rem", color: "var(--ink-soft)", marginTop: "1px" }}>
                                          {timePart}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()
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

            {/* Mobile / Narrow Screen: Card View */}
            <div className="admin-cards-view">
              {paginatedPermissions.length === 0 ? (
                <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: "var(--ink-soft)" }}>
                  <Lock size={36} color="var(--ink-soft)" style={{ margin: "0 auto 0.5rem", opacity: 0.5 }} />
                  <p style={{ fontWeight: 600 }}>ไม่พบรายการสิทธิ์ที่ตรงกับเงื่อนไข</p>
                </div>
              ) : (
                paginatedPermissions.map((perm, idx) => {
                  const runningNumber = (currentPage - 1) * pageSize + idx + 1;
                  const cat = getModuleCategory(perm.name);
                  return (
                    <div
                      key={perm.id}
                      style={{
                        backgroundColor: "var(--cream)",
                        border: "1px solid rgba(50, 55, 65, 0.1)",
                        borderRadius: "0.75rem",
                        padding: "0.85rem 0.95rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.6rem",
                      }}
                    >
                      {/* Top Row: Running #, Permission Names */}
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                        <span
                          className="font-mono"
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            color: "var(--ink-soft)",
                            backgroundColor: "rgba(50, 55, 65, 0.08)",
                            padding: "0.15rem 0.45rem",
                            borderRadius: "0.35rem",
                          }}
                        >
                          #{runningNumber}
                        </span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--ink)" }}>
                            {perm.name_th || perm.name}
                          </div>
                          {perm.name_en && (
                            <div style={{ fontSize: "0.775rem", color: "var(--ink-soft)", fontWeight: 500, marginTop: "1px" }}>
                              {perm.name_en}
                            </div>
                          )}
                          {perm.description && (
                            <p style={{ fontSize: "0.75rem", color: "var(--ink-soft)", marginTop: "0.25rem", margin: 0 }}>
                              {perm.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Bottom Row: Category Badge & Created Date */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem", color: "var(--ink-soft)", borderTop: "1px solid rgba(50, 55, 65, 0.06)", paddingTop: "0.45rem" }}>
                        <span
                          style={{
                            fontSize: "0.7rem",
                            fontWeight: 600,
                            padding: "0.15rem 0.5rem",
                            borderRadius: "9999px",
                            backgroundColor: "rgba(75, 155, 140, 0.12)",
                            color: "var(--teal)",
                          }}
                        >
                          {categoryLabels[cat] || cat}
                        </span>
                        <div className="font-mono">
                          {perm.created_at ? formatDateTime(perm.created_at).datePart : "-"}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination Controls identical to Administrator / Slip Check pages */}
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
