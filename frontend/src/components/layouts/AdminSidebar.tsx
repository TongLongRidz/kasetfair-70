"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  ChefHat,
  Coffee,
  Candy,
  Users,
  ImageIcon,
  ShoppingBag,
  LogOut,
  ChevronDown,
  ChevronRight,
  FolderCog,
  Tag,
  MonitorCheck,
  PanelLeftClose,
  PanelLeftOpen,
  UserCog,
  ShieldCheck,
} from "lucide-react";
import { getStoredUser, clearAuthSession, AdminUser } from "@/lib/auth";

interface MenuItem {
  label: string;
  path: string;
  icon: React.ElementType;
  badge?: string;
}

const managementSubItems: MenuItem[] = [
  { label: "แดชบอร์ดสรุปยอดขาย", path: "/admin/management/dashboard", icon: LayoutDashboard },
  { label: "ตรวจสอบการชำระเงิน", path: "/admin/management/slip-check", icon: Receipt },
  { label: "จัดการเมนูเครื่องดื่ม", path: "/admin/management/menu", icon: Coffee },
  { label: "จัดการท็อปปิ้ง", path: "/admin/management/toppings", icon: Candy },
  { label: "จัดการโปรโมชั่น", path: "/admin/management/promotion", icon: Tag },
  { label: "สมาชิกและแต้ม", path: "/admin/management/customer", icon: Users },
  { label: "จัดการแบนเนอร์", path: "/admin/management/banner", icon: ImageIcon },
  { label: "จัดการบัญชีแอดมิน", path: "/admin/management/administrator", icon: UserCog },
];

const posSubItems: MenuItem[] = [
  { label: "หน้าร้าน (POS Walk-in)", path: "/admin/pos/front-desk", icon: ShoppingBag },
  { label: "หลังร้าน (Kitchen Queue)", path: "/admin/pos/kitchen", icon: ChefHat },
];

// Module-level persistent state across client-side page transitions
let cachedManagementOpen: boolean | null = null;
let cachedPosOpen: boolean | null = null;
let cachedCollapsed: boolean | null = null;

export default function AdminSidebar() {
  const pathname = usePathname();
  const isManagementActive = pathname.startsWith("/admin/management");
  const isPosActive = pathname.startsWith("/admin/pos");

  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);

  // SSR-safe default state (matches initial server render)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => cachedCollapsed ?? false);
  const [isManagementOpen, setIsManagementOpen] = useState<boolean>(() => cachedManagementOpen ?? isManagementActive);
  const [isPosOpen, setIsPosOpen] = useState<boolean>(() => cachedPosOpen ?? isPosActive);

  // Hydrate client-stored preferences after mount to prevent hydration mismatch
  useEffect(() => {
    setCurrentUser(getStoredUser());
    try {
      const savedCollapsed = localStorage.getItem("admin_sidebar_collapsed");
      if (savedCollapsed !== null) {
        const val = savedCollapsed === "true";
        cachedCollapsed = val;
        setIsCollapsed(val);
      }
      const savedMgmt = localStorage.getItem("admin_sidebar_mgmt_open");
      if (savedMgmt !== null) {
        const val = savedMgmt === "true";
        cachedManagementOpen = val;
        setIsManagementOpen(val);
      }
      const savedPos = localStorage.getItem("admin_sidebar_pos_open");
      if (savedPos !== null) {
        const val = savedPos === "true";
        cachedPosOpen = val;
        setIsPosOpen(val);
      }
    } catch {
      // Ignore localStorage errors (e.g. incognito/sandboxed)
    }
  }, []);

  // Sync to module-level cache and localStorage whenever state changes
  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      cachedCollapsed = next;
      try {
        localStorage.setItem("admin_sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
  };

  const toggleManagement = () => {
    setIsManagementOpen((prev) => {
      const next = !prev;
      cachedManagementOpen = next;
      try {
        localStorage.setItem("admin_sidebar_mgmt_open", String(next));
      } catch {}
      return next;
    });
  };

  const togglePos = () => {
    setIsPosOpen((prev) => {
      const next = !prev;
      cachedPosOpen = next;
      try {
        localStorage.setItem("admin_sidebar_pos_open", String(next));
      } catch {}
      return next;
    });
  };





  return (
    <aside
      className="font-thai"
      style={{
        width: isCollapsed ? "72px" : "270px",
        flexShrink: 0,
        position: "sticky",
        top: 0,
        height: "100vh",
        backgroundColor: "var(--card)",
        borderRight: "1px solid rgba(50, 55, 65, 0.1)",
        padding: isCollapsed ? "1.25rem 0.5rem" : "1.25rem 1rem",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        overflowY: "auto",
        boxShadow: "2px 0 12px rgba(0, 0, 0, 0.02)",
        fontFamily: "'Kanit', sans-serif",
        zIndex: 50,
        transition: "width 0.2s ease, padding 0.2s ease",
      }}
    >
      <div>
        {/* Brand Header + Collapse/Expand Toggle Button */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: isCollapsed ? "center" : "space-between",
            paddingBottom: "1.25rem",
            borderBottom: "1px solid rgba(50, 55, 65, 0.08)",
          }}
        >
          {!isCollapsed && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.65rem",
                userSelect: "none",
              }}
            >
              <span
                style={{
                  width: "2.25rem",
                  height: "2.25rem",
                  display: "grid",
                  placeItems: "center",
                  borderRadius: "0.75rem",
                  backgroundColor: "var(--ink)",
                  color: "var(--cream)",
                  fontWeight: 700,
                  fontSize: "1.15rem",
                }}
              >
                ถ
              </span>
              <span style={{ lineHeight: 1.15 }}>
                <span style={{ display: "block", fontSize: "1rem", fontWeight: 700 }}>ถั่วทอง</span>
                <span
                  className="font-mono"
                  style={{
                    display: "block",
                    fontSize: "8.5px",
                    textTransform: "uppercase",
                    letterSpacing: "0.2em",
                    color: "var(--teal)",
                    fontWeight: 600,
                  }}
                >
                  Admin System
                </span>
              </span>
            </div>
          )}

          {/* Toggle Collapse/Expand Button */}
          <button
            type="button"
            onClick={toggleCollapsed}
            title={isCollapsed ? "กาง Sidebar ออก (PanelLeftOpen)" : "หุบ Sidebar เข้า (PanelLeftClose)"}
            style={{
              display: "grid",
              placeItems: "center",
              width: "2.25rem",
              height: "2.25rem",
              borderRadius: "0.5rem",
              border: "1px solid rgba(50, 55, 65, 0.12)",
              backgroundColor: "var(--cream)",
              color: "var(--ink-soft)",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>


        {/* Navigation List */}
        <nav style={{ marginTop: "1.25rem", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          {/* Collapsed Compact View */}
          {isCollapsed ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", alignItems: "center" }}>
              <p style={{ fontSize: "9px", fontWeight: 700, color: "var(--teal)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: "0.25rem" }}>
                MGMT
              </p>
              {managementSubItems.map((sub) => {
                const isActive = pathname === sub.path;
                const Icon = sub.icon;
                return (
                  <Link
                    key={sub.path}
                    href={sub.path}
                    title={sub.label}
                    style={{
                      width: "2.5rem",
                      height: "2.5rem",
                      display: "grid",
                      placeItems: "center",
                      borderRadius: "0.6rem",
                      backgroundColor: isActive ? "var(--cream)" : "transparent",
                      color: isActive ? "var(--teal)" : "var(--ink-soft)",
                      border: isActive ? "1px solid rgba(75, 155, 140, 0.4)" : "1px solid transparent",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <Icon size={18} />
                  </Link>
                );
              })}

              <div style={{ width: "80%", height: "1px", backgroundColor: "rgba(50, 55, 65, 0.08)", margin: "0.4rem 0" }} />

              <p style={{ fontSize: "9px", fontWeight: 700, color: "var(--teal)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                POS
              </p>
              {posSubItems.map((sub) => {
                const isActive = pathname === sub.path;
                const Icon = sub.icon;
                return (
                  <Link
                    key={sub.path}
                    href={sub.path}
                    title={sub.label}
                    style={{
                      width: "2.5rem",
                      height: "2.5rem",
                      display: "grid",
                      placeItems: "center",
                      borderRadius: "0.6rem",
                      backgroundColor: isActive ? "var(--cream)" : "transparent",
                      color: isActive ? "var(--teal)" : "var(--ink-soft)",
                      border: isActive ? "1px solid rgba(75, 155, 140, 0.4)" : "1px solid transparent",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <Icon size={18} />
                  </Link>
                );
              })}
            </div>
          ) : (
            /* Expanded Normal View */
            <>
              {/* Group 1: Management (Expandable / Sub-items) */}
              <div>
                <button
                  type="button"
                  onClick={toggleManagement}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.65rem 0.75rem",
                    borderRadius: "0.75rem",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    fontFamily: "'Kanit', sans-serif",
                    border: "none",
                    cursor: "pointer",
                    backgroundColor: isManagementActive ? "rgba(75, 155, 140, 0.12)" : "transparent",
                    color: isManagementActive ? "var(--teal)" : "var(--ink)",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                    <FolderCog size={18} />
                    <span style={{ fontFamily: "'Kanit', sans-serif" }}>การจัดการ (Management)</span>
                  </div>
                  {isManagementOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>

                {/* Sub Items */}
                {isManagementOpen && (
                  <div
                    style={{
                      marginTop: "0.25rem",
                      marginLeft: "0.75rem",
                      paddingLeft: "0.75rem",
                      borderLeft: "2px solid rgba(75, 155, 140, 0.25)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.2rem",
                    }}
                  >
                    {managementSubItems.map((sub) => {
                      const isActive = pathname === sub.path;
                      const Icon = sub.icon;
                      return (
                        <Link
                          key={sub.path}
                          href={sub.path}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.6rem",
                            padding: "0.5rem 0.75rem",
                            borderRadius: "0.6rem",
                            fontSize: "0.875rem",
                            fontWeight: isActive ? 600 : 400,
                            fontFamily: "'Kanit', sans-serif",
                            textDecoration: "none",
                            backgroundColor: isActive ? "var(--cream)" : "transparent",
                            color: isActive ? "var(--ink)" : "var(--ink-soft)",
                            border: isActive ? "1px solid rgba(75, 155, 140, 0.35)" : "1px solid transparent",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <Icon size={16} color={isActive ? "var(--teal)" : "currentColor"} />
                          <span>{sub.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Group 2: POS & Kitchen (Expandable / Sub-items) */}
              <div style={{ marginTop: "0.5rem" }}>
                <button
                  type="button"
                  onClick={togglePos}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.65rem 0.75rem",
                    borderRadius: "0.75rem",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    fontFamily: "'Kanit', sans-serif",
                    border: "none",
                    cursor: "pointer",
                    backgroundColor: isPosActive ? "rgba(75, 155, 140, 0.12)" : "transparent",
                    color: isPosActive ? "var(--teal)" : "var(--ink)",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                    <MonitorCheck size={18} />
                    <span style={{ fontFamily: "'Kanit', sans-serif" }}>ระบบขาย (POS & Kitchen)</span>
                  </div>
                  {isPosOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                {/* POS Sub Items */}

                {isPosOpen && (
                  <div
                    style={{
                      marginTop: "0.25rem",
                      marginLeft: "0.75rem",
                      paddingLeft: "0.75rem",
                      borderLeft: "2px solid rgba(75, 155, 140, 0.25)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.2rem",
                    }}
                  >
                    {posSubItems.map((sub) => {
                      const isActive = pathname === sub.path;
                      const Icon = sub.icon;
                      return (
                        <Link
                          key={sub.path}
                          href={sub.path}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.6rem",
                            padding: "0.5rem 0.75rem",
                            borderRadius: "0.6rem",
                            fontSize: "0.875rem",
                            fontWeight: isActive ? 600 : 400,
                            fontFamily: "'Kanit', sans-serif",
                            textDecoration: "none",
                            backgroundColor: isActive ? "var(--cream)" : "transparent",
                            color: isActive ? "var(--ink)" : "var(--ink-soft)",
                            border: isActive ? "1px solid rgba(75, 155, 140, 0.35)" : "1px solid transparent",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <Icon size={16} color={isActive ? "var(--teal)" : "currentColor"} />
                          <span>{sub.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </nav>
      </div>

      {/* Bottom Profile & Logout CTA */}
      <div style={{ paddingTop: "0.75rem", borderTop: "1px solid rgba(50, 55, 65, 0.08)" }}>
        <button
          type="button"
          onClick={() => {
            clearAuthSession();
            window.location.href = "/admin/login";
          }}
          title={isCollapsed ? "ออกจากระบบ" : undefined}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: isCollapsed ? "center" : "flex-start",
            gap: "0.65rem",
            padding: isCollapsed ? "0.65rem 0" : "0.65rem 0.85rem",
            borderRadius: "0.75rem",
            fontSize: "0.875rem",
            fontWeight: 600,
            color: "var(--ink-soft)",
            backgroundColor: "var(--cream)",
            border: "1px solid rgba(50, 55, 65, 0.1)",
            cursor: "pointer",
            width: "100%",
            fontFamily: "'Kanit', sans-serif",
            transition: "all 0.15s ease",
          }}
        >
          <LogOut size={16} />
          {!isCollapsed && <span>ออกจากระบบ</span>}
        </button>
      </div>
    </aside>
  );
}

