"use client";

import React, { useState, useEffect, useCallback } from "react";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import AuthGuard from "@/components/ui/AuthGuard";
import {
  Shield,
  Search,
  Lock,
  Loader2,
  Check,
  Save,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { getStoredToken, RoleItem, PermissionItem } from "@/lib/auth";
import { useToast } from "@/components/ui/toast";

export default function RolesManagementPage() {
  const { success, error: toastError } = useToast();
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortField, setSortField] = useState<"id" | "name" | "created_at">("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [modalSearchQuery, setModalSearchQuery] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<RoleItem | null>(null);
  const [selectedPermIds, setSelectedPermIds] = useState<number[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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

      const [resRoles, resPerms] = await Promise.all([
        fetch(`${apiUrl}/api/v1/roles?${params.toString()}`, { headers, credentials: "include" }),
        fetch(`${apiUrl}/api/v1/permissions`, { headers, credentials: "include" }),
      ]);

      if (resRoles.ok && resPerms.ok) {
        const jsonRoles = await resRoles.json();
        const jsonPerms = await resPerms.json();
        const fetchedRoles: RoleItem[] = jsonRoles.data || [];
        setRoles(fetchedRoles);
        const fetchedPerms: PermissionItem[] = jsonPerms.data || [];
        setPermissions(fetchedPerms);
      }
    } catch (err) {
      console.error("Failed to fetch roles & permissions:", err);
      toastError("ไม่สามารถดึงข้อมูลบทบาทและสิทธิ์ได้", "ข้อผิดพลาด");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, sortField, sortOrder, toastError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openEditModal = (role: RoleItem) => {
    setSelectedRole(role);
    setSelectedPermIds(role.permissions ? role.permissions.map((p) => p.id) : []);
    setModalSearchQuery("");
    setIsEditModalOpen(true);
  };

  const handleTogglePerm = (permId: number) => {
    setSelectedPermIds((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]
    );
  };

  const handleSelectAll = () => {
    if (selectedPermIds.length === permissions.length) {
      setSelectedPermIds([]);
    } else {
      setSelectedPermIds(permissions.map((p) => p.id));
    }
  };

  const handleSaveChanges = async () => {
    if (!selectedRole) return;
    setIsSaving(true);
    try {
      const token = getStoredToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585";
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const res = await fetch(`${apiUrl}/api/v1/roles/${selectedRole.id}/permissions`, {
        method: "PUT",
        headers,
        credentials: "include",
        body: JSON.stringify({ permission_ids: selectedPermIds }),
      });

      const json = await res.json();
      if (res.ok) {
        success("บันทึกสิทธิ์การใช้งานของบทบาทเรียบร้อยแล้ว", "สำเร็จ");
        const updatedRoles = roles.map((r) => {
          if (r.id === selectedRole.id) {
            const updatedPerms = permissions.filter((p) => selectedPermIds.includes(p.id));
            return { ...r, permissions: updatedPerms };
          }
          return r;
        });
        setRoles(updatedRoles);
        setSelectedRole((prev) =>
          prev
            ? { ...prev, permissions: permissions.filter((p) => selectedPermIds.includes(p.id)) }
            : null
        );
      } else {
        toastError(json.error || "เกิดข้อผิดพลาดในการบันทึก", "ข้อผิดพลาด");
      }
    } catch (err) {
      console.error("Save permissions error:", err);
      toastError("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์", "ข้อผิดพลาด");
    } finally {
      setIsSaving(false);
    }
  };

  // Filter & Sort roles locally for client pagination
  const processedRoles = [...roles]
    .filter((r) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        r.name.toLowerCase().includes(q) ||
        (r.name_th && r.name_th.toLowerCase().includes(q)) ||
        (r.name_en && r.name_en.toLowerCase().includes(q)) ||
        (r.description && r.description.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (sortField === "created_at") {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
      }
      if (sortField === "name") {
        const nameA = a.name_th || a.name;
        const nameB = b.name_th || b.name;
        return sortOrder === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      }
      return sortOrder === "asc" ? a.id - b.id : b.id - a.id;
    });

  const total = processedRoles.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedRoles = processedRoles.slice(startIndex, startIndex + pageSize);

  const filteredModalPermissions = permissions.filter((p) => {
    if (!modalSearchQuery.trim()) return true;
    const q = modalSearchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.name_th && p.name_th.toLowerCase().includes(q)) ||
      (p.description && p.description.toLowerCase().includes(q))
    );
  });

  const getModuleCategory = (name: string) => {
    const parts = name.split(".");
    return parts[0] || "general";
  };

  const groupedModalPermissions: Record<string, PermissionItem[]> = {};
  filteredModalPermissions.forEach((p) => {
    const cat = getModuleCategory(p.name);
    if (!groupedModalPermissions[cat]) groupedModalPermissions[cat] = [];
    groupedModalPermissions[cat].push(p);
  });

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
                จัดการบทบาทในระบบ
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
            {/* Controls Bar */}
            <div className="admin-controls-bar">
              <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "center" }}>
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
                  <option value="name">เรียงลำดับ: ชื่อบทบาท</option>
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
                    placeholder="ค้นหาชื่อบทบาท..."
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
                    <th style={{ padding: "0.6rem", color: "var(--ink)" }}>บทบาท (Role)</th>
                    <th style={{ padding: "0.6rem", color: "var(--ink)" }}>วันที่สร้าง</th>
                    <th style={{ padding: "0.6rem", width: "120px", textAlign: "right", color: "var(--ink)" }}>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: "center", height: "270px", padding: "1rem", color: "var(--ink-soft)" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                          <Loader2 size={20} className="animate-spin" />
                          <span>กำลังโหลดข้อมูลบทบาท...</span>
                        </div>
                      </td>
                    </tr>
                  ) : paginatedRoles.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: "center", height: "270px", padding: "1rem", color: "var(--ink-soft)" }}>
                        <Shield size={32} color="var(--ink-soft)" style={{ margin: "0 auto 0.5rem", opacity: 0.5 }} />
                        <p style={{ fontWeight: 600 }}>ไม่พบบทบาทที่ตรงกับคำค้นหา</p>
                      </td>
                    </tr>
                  ) : (
                    <>
                      {paginatedRoles.map((role, idx) => {
                        const runningNumber = (currentPage - 1) * pageSize + idx + 1;

                        return (
                          <tr
                            key={role.id}
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

                            {/* Role Name */}
                            <td style={{ padding: "0.5rem 0.6rem" }}>
                              <div style={{ display: "flex", flexDirection: "column" }}>
                                <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--ink)" }}>
                                  {role.name_th || role.name}
                                </span>
                                {role.name_en && (
                                  <span style={{ fontSize: "0.75rem", color: "var(--ink-soft)", fontWeight: 500 }}>
                                    {role.name_en}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Created At (Replaces Description) */}
                            <td style={{ padding: "0.5rem 0.6rem", fontSize: "0.8rem", color: "var(--ink-soft)" }}>
                              {role.created_at ? (
                                <div style={{ lineHeight: 1.25 }}>
                                  <div className="font-mono" style={{ color: "var(--ink)", fontWeight: 500, fontSize: "0.8rem" }}>
                                    {role.created_at.includes("T")
                                      ? role.created_at.split("T")[0]
                                      : role.created_at.split(" ")[0]}
                                  </div>
                                  <div className="font-mono" style={{ fontSize: "0.725rem", color: "var(--ink-soft)", marginTop: "1px" }}>
                                    {role.created_at.includes("T")
                                      ? role.created_at.split("T")[1]?.substring(0, 8)
                                      : role.created_at.split(" ")[1] || ""}
                                  </div>
                                </div>
                              ) : (
                                "-"
                              )}
                            </td>

                            {/* Actions */}
                            <td style={{ padding: "0.5rem 0.6rem", textAlign: "right" }}>
                              <button
                                type="button"
                                onClick={() => openEditModal(role)}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.4rem",
                                  padding: "0.4rem 0.8rem",
                                  borderRadius: "0.6rem",
                                  backgroundColor: "var(--cream)",
                                  border: "1px solid rgba(75, 155, 140, 0.35)",
                                  color: "var(--teal)",
                                  fontWeight: 600,
                                  fontSize: "0.8rem",
                                  cursor: "pointer",
                                  transition: "all 0.15s ease",
                                  fontFamily: "'Kanit', sans-serif",
                                }}
                              >
                                <Shield size={14} />
                                <span>แก้ไขสิทธิ์</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}

                      {/* Filler empty rows to maintain fixed 5-row table height matching administrator page */}
                      {Array.from({ length: Math.max(0, pageSize - paginatedRoles.length) }).map((_, i) => (
                        <tr
                          key={`empty-filler-${i}`}
                          style={{
                            height: "54px",
                            boxSizing: "border-box",
                            borderBottom: "1px solid rgba(50, 55, 65, 0.04)",
                          }}
                        >
                          <td colSpan={4} style={{ padding: "0.5rem 0.6rem", color: "transparent" }}>
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

        {/* Edit Role Permissions Modal */}
        {isEditModalOpen && selectedRole && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "1rem",
              backdropFilter: "blur(4px)",
            }}
          >
            <div
              style={{
                backgroundColor: "var(--card)",
                borderRadius: "1.25rem",
                maxWidth: "800px",
                width: "100%",
                maxHeight: "90vh",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
                border: "1px solid rgba(50, 55, 65, 0.12)",
                overflow: "hidden",
              }}
            >
              {/* Modal Header */}
              <div
                style={{
                  padding: "1.25rem 1.5rem",
                  borderBottom: "1px solid rgba(50, 55, 65, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span
                      style={{
                        padding: "0.2rem 0.55rem",
                        borderRadius: "0.5rem",
                        backgroundColor: "var(--teal)",
                        color: "#fff",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                      }}
                    >
                      แก้ไขสิทธิ์
                    </span>
                    <h2 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0 }}>
                      {selectedRole.name_th || selectedRole.name}
                    </h2>
                  </div>
                  {selectedRole.description && (
                    <p style={{ fontSize: "0.825rem", color: "var(--ink-soft)", marginTop: "0.25rem", margin: 0 }}>
                      {selectedRole.description}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "var(--ink-soft)",
                    cursor: "pointer",
                    padding: "0.4rem",
                    borderRadius: "0.5rem",
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Modal Toolbar */}
              <div
                style={{
                  padding: "1rem 1.5rem",
                  backgroundColor: "rgba(50, 55, 65, 0.02)",
                  borderBottom: "1px solid rgba(50, 55, 65, 0.08)",
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "0.75rem",
                }}
              >
                <button
                  type="button"
                  onClick={handleSelectAll}
                  style={{
                    fontSize: "0.825rem",
                    fontWeight: 600,
                    color: "var(--teal)",
                    background: "none",
                    border: "1px solid var(--teal)",
                    padding: "0.4rem 0.75rem",
                    borderRadius: "0.5rem",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {selectedPermIds.length === permissions.length ? "ยกเลิกทั้งหมด" : "เลือกทั้งหมด"}
                </button>

                <div className="admin-search-box" style={{ width: "220px" }}>
                  <Search size={15} color="var(--ink-soft)" style={{ flexShrink: 0 }} />
                  <input
                    type="text"
                    placeholder="ค้นหาสิทธิ์..."
                    value={modalSearchQuery}
                    onChange={(e) => setModalSearchQuery(e.target.value)}
                    style={{ fontSize: "0.825rem" }}
                  />
                </div>
              </div>

              {/* Modal Body */}
              <div
                style={{
                  padding: "1.5rem",
                  overflowY: "auto",
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.5rem",
                }}
              >
                {Object.keys(groupedModalPermissions).length === 0 ? (
                  <div style={{ textAlign: "center", padding: "2.5rem", color: "var(--ink-soft)" }}>
                    <Lock size={32} color="var(--ink-soft)" style={{ margin: "0 auto 0.5rem", opacity: 0.5 }} />
                    <p style={{ fontWeight: 600 }}>ไม่พบรายการสิทธิ์ที่ตรงตามคำค้นหา</p>
                  </div>
                ) : (
                  Object.entries(groupedModalPermissions).map(([cat, perms]) => (
                    <div key={cat}>
                      <h3
                        style={{
                          fontSize: "0.9rem",
                          fontWeight: 700,
                          marginBottom: "0.75rem",
                          color: "var(--ink)",
                        }}
                      >
                        {categoryLabels[cat] || cat}
                      </h3>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                          gap: "0.75rem",
                        }}
                      >
                        {perms.map((perm) => {
                          const isChecked = selectedPermIds.includes(perm.id);

                          return (
                            <button
                              key={perm.id}
                              type="button"
                              onClick={() => handleTogglePerm(perm.id)}
                              style={{
                                padding: "0.85rem 0.95rem",
                                borderRadius: "0.75rem",
                                border: isChecked
                                  ? "2px solid var(--teal)"
                                  : "1px solid rgba(50, 55, 65, 0.12)",
                                backgroundColor: isChecked
                                  ? "rgba(75, 155, 140, 0.06)"
                                  : "var(--cream)",
                                display: "flex",
                                alignItems: "flex-start",
                                gap: "0.65rem",
                                textAlign: "left",
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                                fontFamily: "'Kanit', sans-serif",
                              }}
                            >
                              <div
                                style={{
                                  width: "1.25rem",
                                  height: "1.25rem",
                                  borderRadius: "0.35rem",
                                  backgroundColor: isChecked ? "var(--teal)" : "#fff",
                                  border: isChecked ? "none" : "2px solid rgba(50, 55, 65, 0.3)",
                                  color: "#fff",
                                  display: "grid",
                                  placeItems: "center",
                                  flexShrink: 0,
                                  marginTop: "0.1rem",
                                }}
                              >
                                {isChecked && <Check size={14} strokeWidth={3} />}
                              </div>
                              <div>
                                <span
                                  style={{
                                    fontSize: "0.85rem",
                                    fontWeight: 700,
                                    color: isChecked ? "var(--teal)" : "var(--ink)",
                                    display: "block",
                                  }}
                                >
                                  {perm.name_th || perm.name}
                                </span>
                                {perm.description && (
                                  <p style={{ fontSize: "0.75rem", color: "var(--ink-soft)", marginTop: "0.2rem", margin: 0 }}>
                                    {perm.description}
                                  </p>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Modal Footer */}
              <div
                style={{
                  padding: "1rem 1.5rem",
                  borderTop: "1px solid rgba(50, 55, 65, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: "0.75rem",
                  backgroundColor: "rgba(50, 55, 65, 0.02)",
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  style={{
                    padding: "0.6rem 1.15rem",
                    borderRadius: "0.6rem",
                    border: "1px solid rgba(50, 55, 65, 0.2)",
                    backgroundColor: "transparent",
                    color: "var(--ink-soft)",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    cursor: "pointer",
                    fontFamily: "'Kanit', sans-serif",
                  }}
                >
                  ยกเลิก
                </button>

                <button
                  type="button"
                  className="admin-btn admin-btn-primary admin-add-btn"
                  onClick={async () => {
                    await handleSaveChanges();
                    setIsEditModalOpen(false);
                  }}
                  disabled={isSaving}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.6rem 1.25rem",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    borderRadius: "0.6rem",
                  }}
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      กำลังบันทึก...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      บันทึกการเปลี่ยนแปลง
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
