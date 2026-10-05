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
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  User,
  Loader2,
  MoreVertical,
} from "lucide-react";
import { getStoredToken, getStoredUser, AdminUser, RoleItem } from "@/lib/auth";
import CustomDropdown from "@/components/ui/CustomDropdown";
import KebabMenu from "@/components/ui/KebabMenu";
import AddEditModal from "./components/AddEditModal";
import AdminDeleteModal from "./components/AdminDeleteModal";
import { useToast } from "@/components/ui/toast";
import useDateTimeFormatter from "@/hooks/useDateTimeFormatter";

export default function AdminListPage() {
  const { success, error: toastError, info } = useToast();
  const { formatDateTime } = useDateTimeFormatter();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [rolesList, setRolesList] = useState<RoleItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 5;
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "superadmin">("all");
  const [roleFilter, setRoleFilter] = useState<number | "">("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Kebab dropdown state
  const [activeKebabUuid, setActiveKebabUuid] = useState<string | null>(null);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);

  // Form states
  const [formUsername, setFormUsername] = useState<string>("");
  const [formName, setFormName] = useState<string>("");
  const [formPassword, setFormPassword] = useState<string>("");
  const [formRoleId, setFormRoleId] = useState<number | "">("");
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
  const isCurrentSuper = currentUser?.role?.key === "super_admin" || currentUser?.role?.key === "admin";

  // Fetch Roles list
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const token = getStoredToken();
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585";
        const res = await fetch(`${apiUrl}/api/v1/roles`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "include",
        });
        if (res.ok) {
          const json = await res.json();
          setRolesList(json.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch roles:", err);
      }
    };
    fetchRoles();
  }, []);

  // Close kebab menu when clicking outside
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
      if (roleFilter !== "") params.append("role_id", roleFilter.toString());

      const res = await fetch(`${apiUrl}/api/v1/staffs?${params.toString()}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setAdmins(data.data || []);
        setTotal(data.total || 0);
        setTotalPages(data.total_pages || 1);
      } else {
        setAdmins([]);
        setTotal(0);
        setTotalPages(1);
      }
    } catch {
      setAdmins([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, searchQuery, statusFilter, roleFilter]);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setSelectedAdmin(null);
    setFormMode("create");
    setFormUsername("");
    setFormName("");
    setFormPassword("");
    setFormRoleId("");
    setFormIsActivate(false);
    setFormError(null);
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (admin: AdminUser) => {
    setSelectedAdmin(admin);
    setFormMode("edit");
    setFormUsername(admin.username);
    setFormName(admin.name);
    setFormPassword("");
    setFormRoleId(admin.role_id || admin.role?.id || "");
    setFormIsActivate(admin.is_activate);
    setFormError(null);
    setIsFormModalOpen(true);
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

  // Submit Create / Edit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (formMode === "create") {
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
        const res = await fetch(`${apiUrl}/api/v1/staffs`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "include",
          body: JSON.stringify({
            username: formUsername.trim(),
            name: formName.trim(),
            password: formPassword.trim(),
            role_id: formRoleId || undefined,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setFormError(data.error || "เกิดข้อผิดพลาดในการสร้างบัญชี");
          return;
        }

        setIsFormModalOpen(false);
        success(`เพิ่มทีมงาน "${formUsername.trim()}" เรียบร้อยแล้ว`, "สร้างสำเร็จ");
        fetchAdmins();
      } catch {
        setFormError("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      if (!selectedAdmin) return;

      if (!formName.trim()) {
        setFormError("กรุณาระบุชื่อ-นามสกุล");
        return;
      }

      const payload: { name: string; password?: string; is_activate?: boolean; role_id?: number } = {
        name: formName.trim(),
        role_id: formRoleId ? Number(formRoleId) : undefined,
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
      }

      setIsSubmitting(true);
      try {
        const token = getStoredToken();
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585";
        const res = await fetch(`${apiUrl}/api/v1/staffs/${selectedAdmin.uuid}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "include",
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) {
          setFormError(data.error || "เกิดข้อผิดพลาดในการอัปเดตข้อมูล");
          toastError(data.error || "เกิดข้อผิดพลาดในการอัปเดตข้อมูล", "แก้ไขไม่สำเร็จ");
          return;
        }

        setIsFormModalOpen(false);
        success(`อัปเดตข้อมูลบัญชี "${selectedAdmin.username}" สำเร็จ`, "บันทึกสำเร็จ");
        fetchAdmins();
      } catch {
        setAdmins((prev) =>
          prev.map((a) =>
            a.uuid === selectedAdmin.uuid
              ? {
                ...a,
                name: formName.trim(),
                is_activate: isCurrentSuper ? formIsActivate : a.is_activate,
              }
              : a
          )
        );
        setIsFormModalOpen(false);
        success(`อัปเดตข้อมูลบัญชี "${selectedAdmin.username}" สำเร็จ`, "บันทึกสำเร็จ");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Submit Delete
  const handleDeleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmin) return;
    setDeleteError(null);

    if (deleteConfirmText.trim().toLowerCase() !== "delete this admin") {
      setDeleteError('กรุณาพิมพ์ "delete this admin" เพื่อยืนยันการลบ');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = getStoredToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585";
      const res = await fetch(`${apiUrl}/api/v1/staffs/${selectedAdmin.uuid}`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) {
        setDeleteError(data.error || "เกิดข้อผิดพลาดในการลบบัญชี");
        toastError(data.error || "เกิดข้อผิดพลาดในการลบบัญชี", "ลบไม่สำเร็จ");
        return;
      }

      setIsDeleteModalOpen(false);
      success(`ลบบัญชีทีมงาน "${selectedAdmin.username}" เรียบร้อยแล้ว`, "ลบสำเร็จ");
      fetchAdmins();
    } catch {
      setAdmins((prev) => prev.filter((a) => a.uuid !== selectedAdmin.uuid));
      setIsDeleteModalOpen(false);
      success(`ลบบัญชีทีมงาน "${selectedAdmin.username}" เรียบร้อยแล้ว`, "ลบสำเร็จ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUuid(text);
    success("คัดลอก UUID ไปยังคลิปบอร์ดแล้ว", "คัดลอกสำเร็จ");
    setTimeout(() => setCopiedUuid(null), 2000);
  };

  return (
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
              จัดการบัญชีทีมงาน
            </h1>
          </div>
        </div>

        {/* Main Table Container (Dashboard Style identical to slip-check) */}
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
          {/* Controls Bar: Status & Role Dropdown Filters & Search Bar / Add Button */}
          <div className="admin-controls-bar">
            {/* Filter Dropdowns (Status & Role) */}
            <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "center" }}>
              {/* Status Filter Dropdown */}
              <CustomDropdown
                options={[
                  { value: "all", label: "สถานะ: ทั้งหมด" },
                  { value: "active", label: "เปิดใช้งาน" },
                  { value: "inactive", label: "รอการอนุมัติ" },
                ]}
                value={statusFilter}
                onChange={(val) => {
                  setStatusFilter(val as any);
                  setCurrentPage(1);
                }}
                minWidth="180px"
              />

              {/* Role Filter Dropdown */}
              <CustomDropdown
                options={[
                  { value: "", label: "บทบาท (Role): ทั้งหมด" },
                  ...rolesList.map((r) => ({
                    value: r.id,
                    label: `${r.name_th || r.key || "ไม่ระบุบทบาท"}${r.name_en ? ` (${r.name_en})` : ""}`,
                  })),
                ]}
                value={roleFilter}
                onChange={(val) => {
                  setRoleFilter(val ? Number(val) : "");
                  setCurrentPage(1);
                }}
                minWidth="190px"
              />
            </div>

            {/* Search Box & Add Button */}
            <div className="admin-search-wrapper">
              <button
                type="button"
                className="admin-add-btn"
                onClick={handleOpenCreate}
              >
                <Plus size={16} />
                <span>เพิ่มทีมงานใหม่</span>
              </button>

              <div className="admin-search-box">
                <Search size={15} color="var(--ink-soft)" style={{ flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อผู้ใช้, ชื่อเรียก, UUID..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>
          </div>

          {/* Desktop / Tablet: Table View */}
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
                  <th style={{ padding: "0.6rem", color: "var(--ink)" }}>ชื่อผู้ใช้งาน</th>
                  <th style={{ padding: "0.6rem", color: "var(--ink)" }}>ชื่อ</th>
                  <th style={{ padding: "0.6rem", color: "var(--ink)" }}>บทบาท / สิทธิ์</th>
                  <th style={{ padding: "0.6rem", color: "var(--ink)" }}>สถานะบัญชี</th>
                  <th style={{ padding: "0.6rem", color: "var(--ink)" }}>วันที่สร้าง</th>
                  <th style={{ padding: "0.6rem", width: "45px", textAlign: "right" }}></th>
                </tr>
              </thead>
              <tbody>
                {admins.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", height: "270px", padding: "1rem", color: "var(--ink-soft)" }}>
                      <User size={32} color="var(--ink-soft)" style={{ margin: "0 auto 0.5rem", opacity: 0.5 }} />
                      <p style={{ fontWeight: 600 }}>ไม่พบบัญชีผู้ดูแลระบบที่ค้นหา</p>
                    </td>
                  </tr>
                ) : (
                  <>
                    {admins.map((admin, idx) => {
                      const isSelf = currentUser?.uuid === admin.uuid;
                      const isKebabOpen = activeKebabUuid === admin.uuid;
                      const runningNumber = (currentPage - 1) * pageSize + idx + 1;
                      const isSuperRole = admin.role?.key === "super_admin";
                      const roleName = admin.role?.name_th || admin.role?.key || "ไม่ระบุบทบาท";

                      const isLastRow = idx === admins.length - 1;
                      return (
                        <tr
                          key={admin.uuid}
                          style={{
                            borderBottom: isLastRow ? "none" : "1px solid rgba(50, 55, 65, 0.06)",
                            transition: "background-color 0.15s ease",
                            backgroundColor: isSelf ? "rgba(75, 155, 140, 0.03)" : "transparent",
                            position: isKebabOpen ? "relative" : "static",
                            zIndex: isKebabOpen ? 50 : 1,
                            height: "54px",
                            boxSizing: "border-box",
                          }}
                        >
                          {/* Running Number */}
                          <td className="font-mono" style={{ padding: "0.5rem 0.6rem", textAlign: "center", fontSize: "0.8rem", color: "var(--ink-soft)" }}>
                            {runningNumber}
                          </td>

                          {/* Username */}
                          <td style={{ padding: "0.5rem 0.6rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                              <span
                                className="font-mono"
                                style={{
                                  display: "inline-block",
                                  fontSize: "0.8rem",
                                  fontWeight: 500,
                                  color: "var(--ink-soft)",
                                  backgroundColor: "rgba(50, 55, 65, 0.04)",
                                  border: "1px solid rgba(50, 55, 65, 0.12)",
                                  padding: "0.15rem 0.5rem",
                                  borderRadius: "0.45rem",
                                  letterSpacing: "0.02em",
                                }}
                              >
                                {admin.username}
                              </span>
                              {isSelf && (
                                <span
                                  style={{
                                    fontSize: "0.65rem",
                                    padding: "0.15rem 0.4rem",
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
                          <td style={{ padding: "0.5rem 0.6rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{admin.name}</td>

                          {/* Role */}
                          <td style={{ padding: "0.5rem 0.6rem" }}>
                            {isSuperRole ? (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.25rem",
                                  padding: "0.2rem 0.55rem",
                                  borderRadius: "9999px",
                                  fontSize: "0.75rem",
                                  fontWeight: 700,
                                  backgroundColor: "rgba(75, 155, 140, 0.15)",
                                  color: "var(--teal)",
                                }}
                              >
                                <ShieldCheck size={13} /> {roleName}
                              </span>
                            ) : (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.25rem",
                                  padding: "0.2rem 0.55rem",
                                  borderRadius: "9999px",
                                  fontSize: "0.75rem",
                                  fontWeight: 600,
                                  backgroundColor: "rgba(50, 55, 65, 0.08)",
                                  color: "var(--ink-soft)",
                                }}
                              >
                                <User size={13} /> {roleName}
                              </span>
                            )}
                          </td>

                          {/* Status */}
                          <td style={{ padding: "0.5rem 0.6rem" }}>
                            {admin.is_activate ? (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.25rem",
                                  padding: "0.2rem 0.55rem",
                                  borderRadius: "9999px",
                                  fontSize: "0.75rem",
                                  fontWeight: 600,
                                  backgroundColor: "rgba(34, 197, 94, 0.12)",
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
                                  padding: "0.2rem 0.55rem",
                                  borderRadius: "9999px",
                                  fontSize: "0.75rem",
                                  fontWeight: 600,
                                  backgroundColor: "rgba(239, 68, 68, 0.12)",
                                  color: "#dc2626",
                                }}
                              >
                                <XCircle size={14} /> รอการอนุมัติ
                              </span>
                            )}
                          </td>

                          {/* Created Date & Time */}
                          <td style={{ padding: "0.5rem 0.6rem", fontSize: "0.8rem", color: "var(--ink-soft)" }}>
                            {admin.created_at ? (
                              (() => {
                                const { datePart, timePart } = formatDateTime(admin.created_at);
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

                          {/* Kebab Action Menu */}
                          <td style={{ padding: "0.5rem 0.6rem", textAlign: "right", position: isKebabOpen ? "relative" : "static", zIndex: isKebabOpen ? 50 : 1 }}>
                            <KebabMenu
                              isOpen={isKebabOpen}
                              onToggle={() => setActiveKebabUuid(isKebabOpen ? null : admin.uuid)}
                              title="จัดการทีมงาน"
                              headerTitle="การดำเนินการ"
                            >
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
                            </KebabMenu>
                          </td>
                        </tr>
                      );
                    })}
                    {/* Filler empty rows to maintain fixed 5-row table height */}
                    {Array.from({ length: Math.max(0, pageSize - admins.length) }).map((_, i) => (
                      <tr
                        key={`empty-filler-${i}`}
                        style={{
                          height: "54px",
                          boxSizing: "border-box",
                        }}
                      >
                        <td colSpan={7} style={{ padding: "0.5rem 0.6rem", color: "transparent" }}>
                          &nbsp;
                        </td>
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile / Narrow Screen: Card View (Clean & Simple) */}
          <div className="admin-cards-view">
            {admins.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: "var(--ink-soft)" }}>
                <User size={36} color="var(--ink-soft)" style={{ margin: "0 auto 0.5rem", opacity: 0.5 }} />
                <p style={{ fontWeight: 600 }}>ไม่พบบัญชีผู้ดูแลระบบที่ค้นหา</p>
              </div>
            ) : (
              admins.map((admin) => {
                const isSelf = currentUser?.uuid === admin.uuid;
                const isKebabOpen = activeKebabUuid === admin.uuid;

                return (
                  <div
                    key={admin.uuid}
                    style={{
                      backgroundColor: isSelf ? "rgba(75, 155, 140, 0.04)" : "var(--cream)",
                      border: "1px solid rgba(50, 55, 65, 0.1)",
                      borderRadius: "0.75rem",
                      padding: "0.85rem 0.95rem",
                      position: isKebabOpen ? "relative" : "static",
                      zIndex: isKebabOpen ? 50 : 1,
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.6rem",
                    }}
                  >
                    {/* Top Row: Username, Self Badge & Kebab */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <span
                          className="font-mono"
                          style={{
                            fontSize: "0.825rem",
                            fontWeight: 600,
                            color: "var(--ink)",
                            backgroundColor: "rgba(50, 55, 65, 0.05)",
                            border: "1px solid rgba(50, 55, 65, 0.12)",
                            padding: "0.15rem 0.5rem",
                            borderRadius: "0.4rem",
                          }}
                        >
                          @{admin.username}
                        </span>
                        {isSelf && (
                          <span
                            style={{
                              fontSize: "0.65rem",
                              padding: "0.15rem 0.4rem",
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

                      {/* Kebab Button */}
                      <KebabMenu
                        isOpen={isKebabOpen}
                        onToggle={() => setActiveKebabUuid(isKebabOpen ? null : admin.uuid)}
                        title="จัดการทีมงาน"
                        headerTitle="การดำเนินการ"
                      >
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
                      </KebabMenu>
                    </div>

                    {/* Middle Row: Name */}
                    <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--ink)" }}>
                      {admin.name}
                    </div>

                    {/* Bottom Row: Simple Tags (Role + Status) */}
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.4rem" }}>
                      {admin.role?.key === "super_admin" ? (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.25rem",
                            padding: "0.15rem 0.45rem",
                            borderRadius: "9999px",
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            backgroundColor: "rgba(75, 155, 140, 0.15)",
                            color: "var(--teal)",
                          }}
                        >
                          <ShieldCheck size={11} /> {admin.role?.name_th || "Superadmin"}
                        </span>
                      ) : (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.25rem",
                            padding: "0.15rem 0.45rem",
                            borderRadius: "9999px",
                            fontSize: "0.7rem",
                            fontWeight: 600,
                            backgroundColor: "rgba(50, 55, 65, 0.08)",
                            color: "var(--ink-soft)",
                          }}
                        >
                          <User size={11} /> {admin.role?.name_th || admin.role?.key || "ไม่ระบุบทบาท"}
                        </span>
                      )}

                      {admin.is_activate ? (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.25rem",
                            padding: "0.15rem 0.45rem",
                            borderRadius: "9999px",
                            fontSize: "0.7rem",
                            fontWeight: 600,
                            backgroundColor: "rgba(34, 197, 94, 0.12)",
                            color: "#16a34a",
                          }}
                        >
                          <CheckCircle2 size={12} /> เปิดใช้งาน
                        </span>
                      ) : (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.25rem",
                            padding: "0.15rem 0.45rem",
                            borderRadius: "9999px",
                            fontSize: "0.7rem",
                            fontWeight: 600,
                            backgroundColor: "rgba(239, 68, 68, 0.12)",
                            color: "#dc2626",
                          }}
                        >
                          <XCircle size={12} /> รอการอนุมัติ
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
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

      {/* Modal 1: Create / Edit Admin */}
      <AddEditModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        mode={formMode}
        selectedAdmin={selectedAdmin}
        isSelf={selectedAdmin?.uuid === currentUser?.uuid}
        formUsername={formUsername}
        setFormUsername={setFormUsername}
        formName={formName}
        setFormName={setFormName}
        formPassword={formPassword}
        setFormPassword={setFormPassword}
        formRoleId={formRoleId}
        setFormRoleId={setFormRoleId}
        rolesList={rolesList}
        formIsActivate={formIsActivate}
        setFormIsActivate={setFormIsActivate}
        formIsSuperadmin={formIsSuperadmin}
        setFormIsSuperadmin={setFormIsSuperadmin}
        isCurrentSuper={isCurrentSuper}
        formError={formError}
        isSubmitting={isSubmitting}
      />

      {/* Modal 2: Delete Confirm */}
      <AdminDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onSubmit={handleDeleteSubmit}
        selectedAdmin={selectedAdmin}
        deleteConfirmText={deleteConfirmText}
        setDeleteConfirmText={setDeleteConfirmText}
        deleteError={deleteError}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
