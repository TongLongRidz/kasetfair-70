"use client";

import React, { useState, useEffect, useCallback } from "react";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import AuthGuard from "@/components/ui/AuthGuard";
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  XCircle,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  User,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Copy,
  Check,
  MoreVertical,
} from "lucide-react";
import { getStoredToken, getStoredUser, AdminUser } from "@/lib/auth";

export default function AdminListPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "superadmin">("all");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Kebab dropdown state
  const [activeKebabUuid, setActiveKebabUuid] = useState<string | null>(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);

  // Form states
  const [formUsername, setFormUsername] = useState<string>("");
  const [formName, setFormName] = useState<string>("");
  const [formPassword, setFormPassword] = useState<string>("");
  const [formIsActivate, setFormIsActivate] = useState<boolean>(false);
  const [formIsSuperadmin, setFormIsSuperadmin] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Delete modal confirmation
  const [deleteConfirmText, setDeleteConfirmText] = useState<string>("");
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Copied toast state
  const [copiedUuid, setCopiedUuid] = useState<string | null>(null);

  const currentUser = getStoredUser();
  const isCurrentSuper = !!currentUser?.is_superadmin;

  // Close kebab menu when clicking outside (identical to slip-check)
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".kebab-container")) {
        setActiveKebabUuid(null);
      }
    };
    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, []);

  const fetchAdmins = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = getStoredToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585";
      const params = new URLSearchParams({
        page: currentPage.toString(),
        page_size: pageSize.toString(),
      });
      if (searchQuery.trim()) params.append("q", searchQuery.trim());
      if (statusFilter !== "all") params.append("status", statusFilter);

      const res = await fetch(`${apiUrl}/api/v1/admins?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setAdmins(data.data || []);
        setTotal(data.total || 0);
        setTotalPages(data.total_pages || 1);
      } else {
        setMockAdmins();
      }
    } catch {
      setMockAdmins();
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, searchQuery, statusFilter]);

  const setMockAdmins = () => {
    const mockList: AdminUser[] = [
      {
        id: 1,
        uuid: "550e8400-e29b-41d4-a716-446655440000",
        username: "superadmin",
        name: "Super Administrator",
        is_activate: true,
        is_superadmin: true,
        created_at: "2026-09-01 08:00:00",
        updated_at: "2026-09-01 08:00:00",
      },
      {
        id: 2,
        uuid: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
        username: "somchai_staff",
        name: "สมชาย ใจดี (บาริสต้า)",
        is_activate: true,
        is_superadmin: false,
        created_at: "2026-09-02 10:30:00",
        updated_at: "2026-09-02 10:30:00",
      },
      {
        id: 3,
        uuid: "7ca7b810-9dad-11d1-80b4-00c04fd430c9",
        username: "somying_cashier",
        name: "สมหญิง รักบริการ (แคชเชียร์)",
        is_activate: false,
        is_superadmin: false,
        created_at: "2026-09-03 14:15:00",
        updated_at: "2026-09-03 14:15:00",
      },
    ];

    const filtered = mockList.filter((a) => {
      const q = searchQuery.toLowerCase();
      const matchQ = a.username.toLowerCase().includes(q) || a.name.toLowerCase().includes(q) || a.uuid.toLowerCase().includes(q);
      if (!matchQ) return false;
      if (statusFilter === "active") return a.is_activate;
      if (statusFilter === "inactive") return !a.is_activate;
      if (statusFilter === "superadmin") return a.is_superadmin;
      return true;
    });

    setAdmins(filtered);
    setTotal(filtered.length);
    setTotalPages(Math.max(1, Math.ceil(filtered.length / pageSize)));
  };

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setFormUsername("");
    setFormName("");
    setFormPassword("");
    setFormIsActivate(false);
    setFormIsSuperadmin(false);
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (admin: AdminUser) => {
    setSelectedAdmin(admin);
    setFormUsername(admin.username);
    setFormName(admin.name);
    setFormPassword("");
    setFormIsActivate(admin.is_activate);
    setFormIsSuperadmin(admin.is_superadmin);
    setFormError(null);
    setIsEditModalOpen(true);
    setActiveKebabUuid(null);
  };

  // Open Delete Modal
  const handleOpenDelete = (admin: AdminUser) => {
    setSelectedAdmin(admin);
    setDeleteConfirmText("");
    setDeleteError(null);
    setIsDeleteModalOpen(true);
    setActiveKebabUuid(null);
  };

  // Submit Create
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formUsername.trim() || !formName.trim() || !formPassword.trim()) {
      setFormError("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    if (formPassword.length < 6) {
      setFormError("รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = getStoredToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585";
      const res = await fetch(`${apiUrl}/api/v1/admins`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: formUsername.trim(),
          name: formName.trim(),
          password: formPassword.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "เกิดข้อผิดพลาดในการสร้างบัญชี");
        return;
      }

      setIsCreateModalOpen(false);
      fetchAdmins();
    } catch {
      const newMock: AdminUser = {
        id: Date.now(),
        uuid: `mock-uuid-${Date.now()}`,
        username: formUsername.trim(),
        name: formName.trim(),
        is_activate: false,
        is_superadmin: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setAdmins((prev) => [newMock, ...prev]);
      setIsCreateModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmin) return;
    setFormError(null);

    if (!formName.trim()) {
      setFormError("กรุณาระบุชื่อ-นามสกุล");
      return;
    }

    const payload: { name: string; password?: string; is_activate?: boolean; is_superadmin?: boolean } = {
      name: formName.trim(),
    };

    if (formPassword.trim()) {
      if (formPassword.length < 6) {
        setFormError("รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
        return;
      }
      payload.password = formPassword.trim();
    }

    if (isCurrentSuper) {
      payload.is_activate = formIsActivate;
      payload.is_superadmin = formIsSuperadmin;
    }

    setIsSubmitting(true);
    try {
      const token = getStoredToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585";
      const res = await fetch(`${apiUrl}/api/v1/admins/${selectedAdmin.uuid}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "เกิดข้อผิดพลาดในการอัปเดตข้อมูล");
        return;
      }

      setIsEditModalOpen(false);
      fetchAdmins();
    } catch {
      setAdmins((prev) =>
        prev.map((a) =>
          a.uuid === selectedAdmin.uuid
            ? {
                ...a,
                name: formName.trim(),
                is_activate: isCurrentSuper ? formIsActivate : a.is_activate,
                is_superadmin: isCurrentSuper ? formIsSuperadmin : a.is_superadmin,
              }
            : a
        )
      );
      setIsEditModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Delete
  const handleDeleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmin) return;
    setDeleteError(null);

    if (deleteConfirmText.trim() !== selectedAdmin.username && deleteConfirmText.trim() !== "DELETE") {
      setDeleteError(`กรุณาพิมพ์ "${selectedAdmin.username}" หรือ "DELETE" เพื่อยืนยันการลบ`);
      return;
    }

    setIsSubmitting(true);
    try {
      const token = getStoredToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585";
      const res = await fetch(`${apiUrl}/api/v1/admins/${selectedAdmin.uuid}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        setDeleteError(data.error || "เกิดข้อผิดพลาดในการลบบัญชี");
        return;
      }

      setIsDeleteModalOpen(false);
      fetchAdmins();
    } catch {
      setAdmins((prev) => prev.filter((a) => a.uuid !== selectedAdmin.uuid));
      setIsDeleteModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUuid(text);
    setTimeout(() => setCopiedUuid(null), 2000);
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

        <main style={{ flex: 1, padding: "2rem 2.5rem", overflowY: "auto" }}>
          {/* Header Title (Slip Check Style) */}
          <div style={{ marginBottom: "1.5rem", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: "1rem" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span
                  className="font-mono"
                  style={{
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.15em",
                    color: "var(--teal)",
                    fontWeight: 600,
                    backgroundColor: "rgba(75, 155, 140, 0.15)",
                    padding: "0.2rem 0.6rem",
                    borderRadius: "9999px",
                  }}
                >
                  ADMIN MANAGEMENT
                </span>
              </div>
              <h1 style={{ fontSize: "1.85rem", fontWeight: 800, color: "var(--ink)", marginTop: "0.4rem", lineHeight: 1.15 }}>
                จัดการบัญชีผู้ดูแลระบบ (Admin List)
              </h1>
              <p style={{ color: "var(--ink-soft)", fontSize: "0.875rem", marginTop: "0.2rem" }}>
                รายชื่อแอดมิน จัดการสิทธิ์ กำหนดสถานะเปิดใช้งาน และรีเซ็ตรหัสผ่าน
              </p>
            </div>

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                type="button"
                onClick={() => fetchAdmins()}
                title="รีเฟรชข้อมูล"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "2.5rem",
                  height: "2.5rem",
                  borderRadius: "0.75rem",
                  backgroundColor: "var(--card)",
                  border: "1px solid rgba(50, 55, 65, 0.12)",
                  color: "var(--ink-soft)",
                  cursor: "pointer",
                }}
              >
                <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
              </button>

              <button
                type="button"
                onClick={handleOpenCreate}
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
                <span>เพิ่มแอดมินใหม่</span>
              </button>
            </div>
          </div>

          {/* Main Table Container (Dashboard Style identical to slip-check) */}
          <section
            style={{
              borderRadius: "1.25rem",
              backgroundColor: "var(--card)",
              padding: "1.5rem",
              border: "1px solid rgba(50, 55, 65, 0.1)",
              boxShadow: "0 4px 20px -2px rgba(0,0,0,0.03)",
            }}
          >
            {/* Controls Bar: Filter Tabs & Search Bar */}
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "0.85rem", marginBottom: "1.25rem" }}>
              {/* Filter Tabs */}
              <div style={{ display: "flex", gap: "0.35rem", backgroundColor: "var(--cream)", padding: "3px", borderRadius: "0.65rem", border: "1px solid rgba(50, 55, 65, 0.1)" }}>
                {[
                  { id: "all", label: "ทั้งหมด" },
                  { id: "active", label: "เปิดใช้งาน" },
                  { id: "inactive", label: "รอเปิดใช้งาน" },
                  { id: "superadmin", label: "Superadmin" },
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
                      }}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Search Box */}
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.6rem" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    backgroundColor: "var(--cream)",
                    padding: "0.45rem 0.75rem",
                    borderRadius: "0.6rem",
                    border: "1px solid rgba(50, 55, 65, 0.12)",
                  }}
                >
                  <Search size={15} color="var(--ink-soft)" />
                  <input
                    type="text"
                    placeholder="ค้นหาชื่อผู้ใช้, ชื่อเรียก, UUID..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    style={{
                      border: "none",
                      background: "transparent",
                      outline: "none",
                      fontSize: "0.825rem",
                      width: "220px",
                      fontFamily: "'Kanit', sans-serif",
                      color: "var(--ink)",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Table (Overflow identical to slip-check) */}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(50, 55, 65, 0.12)", color: "var(--ink-soft)", fontSize: "0.8rem" }}>
                    <th style={{ padding: "0.75rem 0.6rem" }}>รหัส / UUID</th>
                    <th style={{ padding: "0.75rem 0.6rem" }}>ชื่อผู้ใช้งาน (Username)</th>
                    <th style={{ padding: "0.75rem 0.6rem" }}>ชื่อ-นามสกุล / ชื่อเรียก</th>
                    <th style={{ padding: "0.75rem 0.6rem" }}>ระดับสิทธิ์ (Role)</th>
                    <th style={{ padding: "0.75rem 0.6rem" }}>สถานะบัญชี (Status)</th>
                    <th style={{ padding: "0.75rem 0.6rem" }}>วันที่สร้าง</th>
                    <th style={{ padding: "0.75rem 0.6rem", width: "45px", textAlign: "right" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", padding: "3rem", color: "var(--ink-soft)" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                          <Loader2 size={20} className="animate-spin" />
                          <span>กำลังโหลดข้อมูลแอดมิน...</span>
                        </div>
                      </td>
                    </tr>
                  ) : admins.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", padding: "3rem", color: "var(--ink-soft)" }}>
                        <User size={32} color="var(--ink-soft)" style={{ margin: "0 auto 0.5rem", opacity: 0.5 }} />
                        <p style={{ fontWeight: 600 }}>ไม่พบบัญชีผู้ดูแลระบบที่ค้นหา</p>
                      </td>
                    </tr>
                  ) : (
                    admins.map((admin) => {
                      const isSelf = currentUser?.uuid === admin.uuid;
                      const isKebabOpen = activeKebabUuid === admin.uuid;

                      return (
                        <tr
                          key={admin.uuid}
                          style={{
                            borderBottom: "1px solid rgba(50, 55, 65, 0.06)",
                            transition: "background-color 0.15s ease",
                            backgroundColor: isSelf ? "rgba(75, 155, 140, 0.03)" : "transparent",
                          }}
                        >
                          {/* UUID */}
                          <td style={{ padding: "0.85rem 0.6rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                              <span className="font-mono" style={{ fontSize: "0.75rem", color: "var(--ink-soft)" }} title={admin.uuid}>
                                {admin.uuid.substring(0, 8)}...
                              </span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(admin.uuid)}
                                title="คัดลอก UUID"
                                style={{
                                  background: "none",
                                  border: "none",
                                  cursor: "pointer",
                                  padding: "2px",
                                  color: copiedUuid === admin.uuid ? "var(--teal)" : "var(--ink-soft)",
                                  display: "flex",
                                }}
                              >
                                {copiedUuid === admin.uuid ? <Check size={12} /> : <Copy size={12} />}
                              </button>
                            </div>
                          </td>

                          {/* Username */}
                          <td style={{ padding: "0.85rem 0.6rem", fontWeight: 700 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                              <span>{admin.username}</span>
                              {isSelf && (
                                <span
                                  style={{
                                    fontSize: "0.65rem",
                                    padding: "0.1rem 0.35rem",
                                    borderRadius: "4px",
                                    backgroundColor: "var(--ink)",
                                    color: "var(--cream)",
                                    fontWeight: 600,
                                  }}
                                >
                                  คุณ
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Name */}
                          <td style={{ padding: "0.85rem 0.6rem" }}>{admin.name}</td>

                          {/* Role */}
                          <td style={{ padding: "0.85rem 0.6rem" }}>
                            {admin.is_superadmin ? (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.25rem",
                                  padding: "0.25rem 0.6rem",
                                  borderRadius: "9999px",
                                  fontSize: "0.75rem",
                                  fontWeight: 700,
                                  backgroundColor: "rgba(224, 83, 83, 0.12)",
                                  color: "#dc2626",
                                }}
                              >
                                <ShieldCheck size={13} /> Superadmin
                              </span>
                            ) : (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  padding: "0.25rem 0.6rem",
                                  borderRadius: "9999px",
                                  fontSize: "0.75rem",
                                  fontWeight: 600,
                                  backgroundColor: "rgba(75, 155, 140, 0.12)",
                                  color: "var(--teal)",
                                }}
                              >
                                Staff Admin
                              </span>
                            )}
                          </td>

                          {/* Status */}
                          <td style={{ padding: "0.85rem 0.6rem" }}>
                            {admin.is_activate ? (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.25rem",
                                  fontSize: "0.75rem",
                                  fontWeight: 600,
                                  color: "#16a34a",
                                }}
                              >
                                <CheckCircle2 size={14} /> เปิดใช้งาน
                              </span>
                            ) : (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.25rem",
                                  fontSize: "0.75rem",
                                  fontWeight: 600,
                                  color: "#ea580c",
                                }}
                              >
                                <XCircle size={14} /> รอการอนุมัติ (Inactive)
                              </span>
                            )}
                          </td>

                          {/* Created Date */}
                          <td style={{ padding: "0.85rem 0.6rem", fontSize: "0.8rem", color: "var(--ink-soft)" }}>
                            {admin.created_at ? admin.created_at.substring(0, 10) : "-"}
                          </td>

                          {/* Kebab Action Menu (100% Identical to Slip-check) */}
                          <td style={{ padding: "0.85rem 0.6rem", textAlign: "right" }}>
                            <div className="kebab-container" style={{ position: "relative", display: "inline-block" }}>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveKebabUuid(isKebabOpen ? null : admin.uuid);
                                }}
                                title="จัดการแอดมิน"
                                style={{
                                  width: "2.25rem",
                                  height: "2.25rem",
                                  borderRadius: "0.6rem",
                                  border: "1px solid rgba(50, 55, 65, 0.12)",
                                  backgroundColor: isKebabOpen ? "var(--ink)" : "var(--cream)",
                                  color: isKebabOpen ? "var(--cream)" : "var(--ink)",
                                  display: "grid",
                                  placeItems: "center",
                                  cursor: "pointer",
                                  transition: "all 0.15s ease",
                                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                                }}
                              >
                                <MoreVertical size={16} />
                              </button>

                              {/* Kebab Dropdown Menu */}
                              {isKebabOpen && (
                                <div
                                  className="animate-rise"
                                  style={{
                                    position: "absolute",
                                    right: 0,
                                    top: "2.5rem",
                                    zIndex: 60,
                                    width: "185px",
                                    backgroundColor: "var(--card)",
                                    borderRadius: "0.85rem",
                                    border: "1px solid rgba(50, 55, 65, 0.12)",
                                    boxShadow: "0 10px 25px -3px rgba(0, 0, 0, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                                    padding: "0.4rem",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "0.25rem",
                                    textAlign: "left",
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div style={{ padding: "0.35rem 0.5rem 0.2rem 0.5rem", borderBottom: "1px solid rgba(50, 55, 65, 0.08)", marginBottom: "0.2rem" }}>
                                    <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
                                      การดำเนินการ
                                    </p>
                                  </div>

                                  {(isCurrentSuper || isSelf) && (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEdit(admin)}
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.5rem",
                                        padding: "0.5rem 0.65rem",
                                        borderRadius: "0.5rem",
                                        border: "none",
                                        backgroundColor: "transparent",
                                        color: "var(--ink)",
                                        fontSize: "0.8rem",
                                        fontWeight: 600,
                                        fontFamily: "'Kanit', sans-serif",
                                        cursor: "pointer",
                                        textAlign: "left",
                                        transition: "background-color 0.1s ease",
                                      }}
                                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--cream)")}
                                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "transparent")}
                                    >
                                      <Edit3 size={15} color="var(--teal)" />
                                      <span>{isSelf ? "แก้ไขข้อมูลตนเอง" : "แก้ไขสิทธิ์ / รหัสผ่าน"}</span>
                                    </button>
                                  )}

                                  {isCurrentSuper && !isSelf && (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenDelete(admin)}
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.5rem",
                                        padding: "0.5rem 0.65rem",
                                        borderRadius: "0.5rem",
                                        border: "none",
                                        backgroundColor: "transparent",
                                        color: "#dc2626",
                                        fontSize: "0.8rem",
                                        fontWeight: 600,
                                        fontFamily: "'Kanit', sans-serif",
                                        cursor: "pointer",
                                        textAlign: "left",
                                        transition: "background-color 0.1s ease",
                                      }}
                                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "rgba(220, 38, 38, 0.08)")}
                                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "transparent")}
                                    >
                                      <Trash2 size={15} color="#dc2626" />
                                      <span>ลบบัญชี</span>
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls (Slip Check Style) */}
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

                {/* Page Size Selector */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    style={{
                      padding: "0.3rem 0.6rem",
                      borderRadius: "0.5rem",
                      fontSize: "0.775rem",
                      fontFamily: "'Kanit', sans-serif",
                      backgroundColor: "var(--cream)",
                      border: "1px solid rgba(50, 55, 65, 0.15)",
                      color: "var(--ink)",
                      cursor: "pointer",
                      outline: "none",
                    }}
                  >
                    <option value={5}>5 รายการ / หน้า</option>
                    <option value={10}>10 รายการ / หน้า</option>
                    <option value={20}>20 รายการ / หน้า</option>
                  </select>
                </div>
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

        {/* Modal 1: Create Admin */}
        {isCreateModalOpen && (
          <div
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
              className="animate-rise"
              style={{
                backgroundColor: "var(--card)",
                borderRadius: "1.25rem",
                maxWidth: "480px",
                width: "100%",
                padding: "1.75rem",
                boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>สร้างแอดมินใหม่</h2>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-soft)" }}
                >
                  <X size={20} />
                </button>
              </div>

              {formError && (
                <div
                  style={{
                    padding: "0.65rem 0.85rem",
                    borderRadius: "0.6rem",
                    backgroundColor: "rgba(220, 38, 38, 0.08)",
                    border: "1px solid rgba(220, 38, 38, 0.2)",
                    color: "#b91c1c",
                    fontSize: "0.85rem",
                    marginBottom: "1rem",
                  }}
                >
                  {formError}
                </div>
              )}

              <form onSubmit={handleCreateSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.3rem" }}>
                    ชื่อผู้ใช้งาน (Username) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    placeholder="เช่น somchai_staff"
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.85rem",
                      borderRadius: "0.6rem",
                      backgroundColor: "var(--cream)",
                      border: "1px solid rgba(50, 55, 65, 0.15)",
                      fontFamily: "inherit",
                      fontSize: "0.9rem",
                      outline: "none",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.3rem" }}>
                    ชื่อ-นามสกุล หรือชื่อเรียก *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="เช่น สมชาย (กะเช้า)"
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.85rem",
                      borderRadius: "0.6rem",
                      backgroundColor: "var(--cream)",
                      border: "1px solid rgba(50, 55, 65, 0.15)",
                      fontFamily: "inherit",
                      fontSize: "0.9rem",
                      outline: "none",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.3rem" }}>
                    รหัสผ่านเริ่มต้น (Password) *
                  </label>
                  <input
                    type="password"
                    required
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="ความยาวอย่างน้อย 6 ตัวอักษร"
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.85rem",
                      borderRadius: "0.6rem",
                      backgroundColor: "var(--cream)",
                      border: "1px solid rgba(50, 55, 65, 0.15)",
                      fontFamily: "inherit",
                      fontSize: "0.9rem",
                      outline: "none",
                    }}
                  />
                </div>

                <div
                  style={{
                    padding: "0.75rem",
                    borderRadius: "0.6rem",
                    backgroundColor: "rgba(75, 155, 140, 0.08)",
                    border: "1px solid rgba(75, 155, 140, 0.2)",
                    fontSize: "0.8rem",
                    color: "var(--ink-soft)",
                  }}
                >
                  💡 <strong>หมายเหตุ:</strong> บัญชีที่สร้างใหม่จะมีสถานะเริ่มต้นเป็น <em>&quot;รอการอนุมัติ (Inactive)&quot;</em> โดย Superadmin จะต้องเป็นผู้กดเปิดใช้งาน (Activate) ให้ก่อนเข้าสู่ระบบได้
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.5rem" }}>
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    style={{
                      padding: "0.6rem 1.25rem",
                      borderRadius: "0.6rem",
                      backgroundColor: "var(--cream)",
                      border: "1px solid rgba(50, 55, 65, 0.15)",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      fontSize: "0.875rem",
                    }}
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      padding: "0.6rem 1.25rem",
                      borderRadius: "0.6rem",
                      backgroundColor: "var(--ink)",
                      color: "var(--cream)",
                      border: "none",
                      cursor: isSubmitting ? "not-allowed" : "pointer",
                      fontFamily: "inherit",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                    }}
                  >
                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
                    บันทึกบัญชีใหม่
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal 2: Edit Admin */}
        {isEditModalOpen && selectedAdmin && (
          <div
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
              className="animate-rise"
              style={{
                backgroundColor: "var(--card)",
                borderRadius: "1.25rem",
                maxWidth: "480px",
                width: "100%",
                padding: "1.75rem",
                boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                <div>
                  <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>แก้ไขข้อมูลแอดมิน</h2>
                  <p style={{ fontSize: "0.8rem", color: "var(--ink-soft)" }}>@{selectedAdmin.username}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-soft)" }}
                >
                  <X size={20} />
                </button>
              </div>

              {formError && (
                <div
                  style={{
                    padding: "0.65rem 0.85rem",
                    borderRadius: "0.6rem",
                    backgroundColor: "rgba(220, 38, 38, 0.08)",
                    border: "1px solid rgba(220, 38, 38, 0.2)",
                    color: "#b91c1c",
                    fontSize: "0.85rem",
                    marginBottom: "1rem",
                  }}
                >
                  {formError}
                </div>
              )}

              <form onSubmit={handleEditSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.3rem" }}>
                    ชื่อ-นามสกุล หรือชื่อเรียก *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.85rem",
                      borderRadius: "0.6rem",
                      backgroundColor: "var(--cream)",
                      border: "1px solid rgba(50, 55, 65, 0.15)",
                      fontFamily: "inherit",
                      fontSize: "0.9rem",
                      outline: "none",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.3rem" }}>
                    เปลี่ยนรหัสผ่านใหม่ (เว้นว่างไว้หากไม่ต้องการเปลี่ยน)
                  </label>
                  <input
                    type="password"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="กรอกรหัสผ่านใหม่"
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.85rem",
                      borderRadius: "0.6rem",
                      backgroundColor: "var(--cream)",
                      border: "1px solid rgba(50, 55, 65, 0.15)",
                      fontFamily: "inherit",
                      fontSize: "0.9rem",
                      outline: "none",
                    }}
                  />
                </div>

                {/* Superadmin Exclusive Controls */}
                {isCurrentSuper && (
                  <div
                    style={{
                      padding: "0.85rem",
                      borderRadius: "0.75rem",
                      backgroundColor: "var(--cream)",
                      border: "1px solid rgba(50, 55, 65, 0.1)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.75rem",
                    }}
                  >
                    <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--teal)" }}>
                      สิทธิ์เฉพาะ Superadmin
                    </div>

                    <label style={{ display: "flex", alignItems: "center", gap: "0.6rem", cursor: "pointer", fontSize: "0.85rem" }}>
                      <input
                        type="checkbox"
                        checked={formIsActivate}
                        onChange={(e) => setFormIsActivate(e.target.checked)}
                        style={{ width: "16px", height: "16px", accentColor: "var(--teal)" }}
                      />
                      <span>
                        <strong>เปิดใช้งานบัญชี (Is Activate)</strong> - ให้สามารถเข้าสู่ระบบได้
                      </span>
                    </label>

                    <label style={{ display: "flex", alignItems: "center", gap: "0.6rem", cursor: "pointer", fontSize: "0.85rem" }}>
                      <input
                        type="checkbox"
                        checked={formIsSuperadmin}
                        onChange={(e) => setFormIsSuperadmin(e.target.checked)}
                        style={{ width: "16px", height: "16px", accentColor: "#dc2626" }}
                      />
                      <span>
                        <strong>กำหนดสิทธิ์ Superadmin</strong> - ให้มีอำนาจดูแลระบบทั้งหมด
                      </span>
                    </label>
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.5rem" }}>
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    style={{
                      padding: "0.6rem 1.25rem",
                      borderRadius: "0.6rem",
                      backgroundColor: "var(--cream)",
                      border: "1px solid rgba(50, 55, 65, 0.15)",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      fontSize: "0.875rem",
                    }}
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      padding: "0.6rem 1.25rem",
                      borderRadius: "0.6rem",
                      backgroundColor: "var(--teal)",
                      color: "#fff",
                      border: "none",
                      cursor: isSubmitting ? "not-allowed" : "pointer",
                      fontFamily: "inherit",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                    }}
                  >
                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
                    บันทึกการแก้ไข
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal 3: Delete Confirm */}
        {isDeleteModalOpen && selectedAdmin && (
          <div
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
              className="animate-rise"
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
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--ink)" }}>ยืนยันการลบบัญชีแอดมิน</h2>
                  <p style={{ fontSize: "0.8rem", color: "var(--ink-soft)" }}>การดำเนินการนี้ไม่สามารถยกเลิกได้</p>
                </div>
              </div>

              <p style={{ fontSize: "0.875rem", color: "var(--ink)", lineHeight: 1.5, marginBottom: "1rem" }}>
                คุณกำลังจะลบบัญชีของ <strong>{selectedAdmin.name}</strong> (<code>@{selectedAdmin.username}</code>)
              </p>

              {deleteError && (
                <div
                  style={{
                    padding: "0.65rem 0.85rem",
                    borderRadius: "0.6rem",
                    backgroundColor: "rgba(220, 38, 38, 0.08)",
                    border: "1px solid rgba(220, 38, 38, 0.2)",
                    color: "#b91c1c",
                    fontSize: "0.85rem",
                    marginBottom: "1rem",
                  }}
                >
                  {deleteError}
                </div>
              )}

              <form onSubmit={handleDeleteSubmit}>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--ink-soft)", marginBottom: "0.4rem" }}>
                  พิมพ์ <strong>{selectedAdmin.username}</strong> หรือ <strong>DELETE</strong> เพื่อยืนยัน:
                </label>
                <input
                  type="text"
                  required
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={selectedAdmin.username}
                  style={{
                    width: "100%",
                    padding: "0.65rem 0.85rem",
                    borderRadius: "0.6rem",
                    backgroundColor: "var(--cream)",
                    border: "1px solid rgba(220, 38, 38, 0.3)",
                    fontFamily: "inherit",
                    fontSize: "0.9rem",
                    outline: "none",
                    marginBottom: "1.25rem",
                  }}
                />

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(false)}
                    style={{
                      padding: "0.6rem 1.25rem",
                      borderRadius: "0.6rem",
                      backgroundColor: "var(--cream)",
                      border: "1px solid rgba(50, 55, 65, 0.15)",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      fontSize: "0.875rem",
                    }}
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !deleteConfirmText.trim()}
                    style={{
                      padding: "0.6rem 1.25rem",
                      borderRadius: "0.6rem",
                      backgroundColor: "#dc2626",
                      color: "#fff",
                      border: "none",
                      cursor: isSubmitting ? "not-allowed" : "pointer",
                      fontFamily: "inherit",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      opacity: deleteConfirmText.trim() ? 1 : 0.6,
                    }}
                  >
                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
                    ยืนยันการลบบัญชี
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
