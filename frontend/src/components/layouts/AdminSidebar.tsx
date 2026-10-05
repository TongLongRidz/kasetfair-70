"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  ChefHat,
  Coffee,
  Candy,
  ImageIcon,
  ShoppingBag,
  LogOut,
  ChevronDown,
  ChevronRight,
  FolderCog,
  MonitorCheck,
  PanelLeftClose,
  PanelLeftOpen,
  UserCog,
  Shield,
  ShieldCheck,
  Menu,
  X,
  Wallet,
  Settings,
  User,
} from "lucide-react";
import { getStoredUser, setStoredUser, getStoredToken, clearAuthSession, AdminUser, canAccessPath } from "@/lib/auth";
import SettingsModal from "@/components/ui/modals/SettingsModal";

interface MenuItem {
  label: string;
  path: string;
  icon: React.ElementType;
  badge?: string;
}

const managementSubItems: MenuItem[] = [
  { label: "แดชบอร์ด", path: "/staff/management/dashboard", icon: LayoutDashboard },
  { label: "บันทึกรายรับ-รายจ่าย", path: "/staff/management/expense", icon: Wallet },
  { label: "ตรวจสอบการชำระเงิน", path: "/staff/management/slip-check", icon: Receipt },
  { label: "จัดการเมนูเครื่องดื่ม", path: "/staff/management/menu", icon: Coffee },
  { label: "จัดการท็อปปิ้ง", path: "/staff/management/toppings", icon: Candy },
  { label: "จัดการแบนเนอร์", path: "/staff/management/banner", icon: ImageIcon },
  { label: "จัดการบทบาท", path: "/staff/management/roles", icon: Shield },
  { label: "จัดการสิทธิ์", path: "/staff/management/permissions", icon: ShieldCheck },
  { label: "จัดการบัญชีพนักงาน", path: "/staff/management/account", icon: UserCog },
];

const posSubItems: MenuItem[] = [
  { label: "หน้าร้าน", path: "/staff/pos/front-desk", icon: ShoppingBag },
  { label: "ครัว", path: "/staff/pos/kitchen", icon: ChefHat },
  { label: "คิว", path: "/staff/pos/queue", icon: MonitorCheck },
];

function getSidebarCookie(name: string): boolean | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  if (match && match[2]) {
    return match[2] === "true";
  }
  return null;
}

function setSidebarCookie(name: string, value: boolean) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${value}; path=/; max-age=31536000; SameSite=Lax`;
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const isManagementActive = pathname.startsWith("/staff/management");
  const isPosActive = pathname.startsWith("/staff/pos");

  const [currentUser, setCurrentUser] = useState<AdminUser | null>(() => getStoredUser());
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Mobile Top Navbar drawer toggle & closing animation
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isClosingMobile, setIsClosingMobile] = useState<boolean>(false);
  const mobileNavRef = useRef<HTMLElement>(null);

  const closeMobileMenu = () => {
    if (!isMobileMenuOpen || isClosingMobile) return;
    setIsClosingMobile(true);
    setIsMobileMenuOpen(false);
    setTimeout(() => {
      setIsClosingMobile(false);
    }, 280);
  };

  const toggleMobileMenu = () => {
    if (isMobileMenuOpen) {
      closeMobileMenu();
    } else {
      setIsMobileMenuOpen(true);
      setIsClosingMobile(false);
    }
  };

  const handleNavigateWithAnimation = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    if (pathname === path) {
      closeMobileMenu();
      return;
    }
    if (isMobileMenuOpen) {
      closeMobileMenu();
      setTimeout(() => {
        router.push(path);
      }, 260);
    } else {
      router.push(path);
    }
  };

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsClosingMobile(false);
  }, [pathname]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (
        isMobileMenuOpen &&
        !isClosingMobile &&
        mobileNavRef.current &&
        !mobileNavRef.current.contains(e.target as Node)
      ) {
        closeMobileMenu();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [isMobileMenuOpen, isClosingMobile]);

  // Sidebar Open states stored in cookies
  // is_sidebar_open: true = expanded sidebar, false = collapsed (72px)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    const cookieVal = getSidebarCookie("is_sidebar_open");
    if (cookieVal !== null) return !cookieVal;
    return false;
  });

  const [isManagementOpen, setIsManagementOpen] = useState<boolean>(() => {
    const cookieVal = getSidebarCookie("is_sidebar_management_open");
    if (cookieVal !== null) return cookieVal;
    return true;
  });

  const [isPosOpen, setIsPosOpen] = useState<boolean>(() => {
    const cookieVal = getSidebarCookie("is_sidebar_pos_open");
    if (cookieVal !== null) return cookieVal;
    return true;
  });

  useEffect(() => {
    const user = getStoredUser();
    if (user) {
      setCurrentUser(user);
    } else {
      const token = getStoredToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585";
      fetch(`${apiUrl}/api/v1/auth/me`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
      })
        .then((res) => {
          if (res.ok) return res.json();
          return null;
        })
        .then((data) => {
          if (data) {
            setStoredUser(data);
            setCurrentUser(data);
          }
        })
        .catch(() => {});
    }
  }, [pathname]);

  const visibleManagementItems = managementSubItems.filter((item) =>
    currentUser ? canAccessPath(item.path, currentUser) : true
  );

  const visiblePosItems = posSubItems.filter((item) =>
    currentUser ? canAccessPath(item.path, currentUser) : true
  );

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const nextCollapsed = !prev;
      const isSidebarOpen = !nextCollapsed;
      setSidebarCookie("is_sidebar_open", isSidebarOpen);
      return nextCollapsed;
    });
  };

  const toggleManagement = () => {
    setIsManagementOpen((prev) => {
      const next = !prev;
      setSidebarCookie("is_sidebar_management_open", next);
      return next;
    });
  };

  const togglePos = () => {
    setIsPosOpen((prev) => {
      const next = !prev;
      setSidebarCookie("is_sidebar_pos_open", next);
      return next;
    });
  };

  const handleLogout = () => {
    clearAuthSession();
    window.location.href = "/staff/login";
  };

  return (
    <>
      {/* ------------------------------------------------------------- */}
      {/* 1. DESKTOP SIDEBAR (Visible on > 768px screens)              */}
      {/* ------------------------------------------------------------- */}
      <div
        className="admin-sidebar-desktop-wrapper"
        style={{
          width: isCollapsed ? "72px" : "270px",
          flexShrink: 0,
          transition: "width 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <aside
          className="font-thai admin-sidebar-desktop"
          style={{
            width: isCollapsed ? "72px" : "270px",
            position: "fixed",
            top: 0,
            left: 0,
            bottom: 0,
            height: "100vh",
            backgroundColor: "var(--card)",
            borderRight: "1px solid rgba(50, 55, 65, 0.1)",
            padding: isCollapsed ? "1.25rem 0.5rem" : "1.25rem 1rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "2px 0 12px rgba(0, 0, 0, 0.02)",
            fontFamily: "'Kanit', sans-serif",
            zIndex: 50,
            transition: "width 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
            userSelect: "none",
            WebkitUserSelect: "none",
          }}
        >
          {/* Brand Header + Collapse/Expand Toggle Button */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: isCollapsed ? "center" : "space-between",
              paddingBottom: "1.25rem",
              borderBottom: "1px solid rgba(50, 55, 65, 0.08)",
              flexShrink: 0,
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
                  <span style={{ display: "block", fontSize: "1rem", fontWeight: 700 }}>ถั่วทอง | M__</span>
                  <span
                    className="font-mono"
                    style={{
                      display: "block",
                      fontSize: "8.5px",
                      textTransform: "uppercase",
                      letterSpacing: "0.2em",
                      color: "var(--ink-soft)",
                    }}
                  >
                    Thuathong Soy Milk
                  </span>
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={toggleCollapsed}
              title={isCollapsed ? "กาง Sidebar ออก" : "หุบ Sidebar เข้า"}
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

          {/* Scrollable Navigation List */}
          <div
            className="admin-sidebar-scroll-container"
            style={{
              flex: 1,
              overflowY: "auto",
              marginTop: "1rem",
              paddingRight: "2px",
            }}
          >
            <nav style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              {isCollapsed ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", alignItems: "center" }}>
                  {visibleManagementItems.map((sub) => {
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

                  {visibleManagementItems.length > 0 && visiblePosItems.length > 0 && (
                    <div style={{ width: "80%", height: "1px", backgroundColor: "rgba(50, 55, 65, 0.08)", margin: "0.4rem 0" }} />
                  )}

                  {visiblePosItems.length > 0 && (
                    <p style={{ fontSize: "9px", fontWeight: 700, color: "var(--teal)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                      POS
                    </p>
                  )}
                  {visiblePosItems.map((sub) => {
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
                <>
                  {/* Group 1: Management */}
                  {visibleManagementItems.length > 0 && (
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
                          <span>การจัดการ</span>
                        </div>
                        {isManagementOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>

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
                          {visibleManagementItems.map((sub) => {
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
                  )}

                  {/* Group 2: POS */}
                  {visiblePosItems.length > 0 && (
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
                          <span>POS</span>
                        </div>
                        {isPosOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>

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
                          {visiblePosItems.map((sub) => {
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
                  )}
                </>
              )}
            </nav>
          </div>

          {/* Bottom Profile, Settings & Logout CTA */}
          <div
            style={{
              paddingTop: "0.75rem",
              borderTop: "1px solid rgba(50, 55, 65, 0.08)",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            {/* User Profile Card with Settings Icon on the right */}
            {currentUser ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: isCollapsed ? "center" : "space-between",
                  gap: "0.5rem",
                  padding: isCollapsed ? "0.4rem 0" : "0.45rem 0.65rem",
                  borderRadius: "0.75rem",
                  backgroundColor: "var(--cream)",
                  border: "1px solid rgba(50, 55, 65, 0.08)",
                  overflow: "hidden",
                }}
                title={
                  isCollapsed
                    ? `${currentUser.name || currentUser.username} (${currentUser.role?.name_th || currentUser.role?.name_en || currentUser.role?.key || "Staff"})`
                    : undefined
                }
              >
                {/* Left: Avatar + User Info (or only Settings when collapsed) */}
                {isCollapsed ? (
                  /* When collapsed, clicking user area or icon opens settings */
                  <button
                    type="button"
                    onClick={() => setIsSettingsOpen(true)}
                    title={`ตั้งค่า (@${currentUser.username || currentUser.name})`}
                    aria-label="Settings"
                    style={{
                      width: "2.35rem",
                      height: "2.35rem",
                      borderRadius: "0.6rem",
                      backgroundColor: "rgba(75, 155, 140, 0.15)",
                      color: "var(--teal)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "none",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <Settings size={18} />
                  </button>
                ) : (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          width: "2.1rem",
                          height: "2.1rem",
                          borderRadius: "0.6rem",
                          backgroundColor: "rgba(75, 155, 140, 0.15)",
                          color: "var(--teal)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          fontWeight: 700,
                          fontSize: "0.85rem",
                        }}
                      >
                        <User size={16} />
                      </div>
                      <div style={{ minWidth: 0, flex: 1, lineHeight: 1.25 }}>
                        <div
                          style={{
                            fontSize: "0.85rem",
                            fontWeight: 700,
                            color: "var(--ink)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          @{currentUser.username || currentUser.name}
                        </div>
                        <div
                          style={{
                            fontSize: "0.725rem",
                            color: "var(--teal)",
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            marginTop: "1px",
                          }}
                        >
                          {currentUser.role?.name_th || currentUser.role?.name_en || currentUser.role?.key || "Staff"}
                        </div>
                      </div>
                    </div>

                    {/* Settings Button on the right inside User Card */}
                    <button
                      type="button"
                      onClick={() => setIsSettingsOpen(true)}
                      title="ตั้งค่า (Settings)"
                      aria-label="Settings"
                      style={{
                        display: "grid",
                        placeItems: "center",
                        width: "2rem",
                        height: "2rem",
                        borderRadius: "0.5rem",
                        color: "var(--ink-soft)",
                        backgroundColor: "transparent",
                        border: "1px solid transparent",
                        cursor: "pointer",
                        flexShrink: 0,
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "rgba(75, 155, 140, 0.15)";
                        e.currentTarget.style.color = "var(--teal)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color = "var(--ink-soft)";
                      }}
                    >
                      <Settings size={16} />
                    </button>
                  </>
                )}
              </div>
            ) : isCollapsed && (
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                title="ตั้งค่า (Settings)"
                aria-label="Settings"
                style={{
                  display: "grid",
                  placeItems: "center",
                  width: "100%",
                  height: "2.4rem",
                  borderRadius: "0.75rem",
                  color: "var(--teal)",
                  backgroundColor: "var(--cream)",
                  border: "1px solid rgba(50, 55, 65, 0.12)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <Settings size={17} />
              </button>
            )}

            {/* Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              title="ออกจากระบบ"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.45rem",
                width: "100%",
                height: "2.4rem",
                padding: isCollapsed ? "0" : "0 0.75rem",
                borderRadius: "0.75rem",
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "#dc2626",
                backgroundColor: "rgba(220, 38, 38, 0.06)",
                border: "1px solid rgba(220, 38, 38, 0.15)",
                cursor: "pointer",
                fontFamily: "'Kanit', sans-serif",
                transition: "all 0.15s ease",
                whiteSpace: "nowrap",
              }}
            >
              <LogOut size={16} />
              {!isCollapsed && <span>ออกจากระบบ</span>}
            </button>
          </div>
        </aside>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. MOBILE TOP NAVBAR (Visible on <= 768px screens)            */}
      {/* ------------------------------------------------------------- */}
      <header
        ref={mobileNavRef}
        className="font-thai admin-topbar-mobile"
        style={{
          position: "sticky",
          top: 0,
          left: 0,
          right: 0,
          width: "100%",
          backgroundColor: "var(--card)",
          borderBottom: "1px solid rgba(50, 55, 65, 0.12)",
          padding: "0.65rem 1rem",
          display: "none",
          flexDirection: "column",
          zIndex: 90,
          boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
          userSelect: "none",
          WebkitUserSelect: "none",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          {/* Brand Logo & Name */}
          <Link
            href="/staff/management/dashboard"
            onClick={(e) => handleNavigateWithAnimation(e, "/staff/management/dashboard")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.65rem",
              textDecoration: "none",
              color: "inherit",
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
                flexShrink: 0,
              }}
            >
              ถ
            </span>
            <span style={{ lineHeight: 1.15 }}>
              <span style={{ display: "block", fontSize: "0.95rem", fontWeight: 700, color: "var(--ink)" }}>
                ถั่วทอง | M__
              </span>
              <span
                className="font-mono"
                style={{
                  display: "block",
                  fontSize: "8.5px",
                  textTransform: "uppercase",
                  letterSpacing: "0.2em",
                  color: "var(--ink-soft)",
                }}
              >
                Thuathong Soy Milk
              </span>
            </span>
          </Link>

          {/* Right Actions: Settings Button (Left of Menu Button) & Hamburger Menu Button */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {/* Quick Settings Button on the left of Menu button */}
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              aria-label="Settings"
              title="ตั้งค่า (Settings)"
              style={{
                display: "grid",
                placeItems: "center",
                width: "2.35rem",
                height: "2.35rem",
                borderRadius: "0.6rem",
                backgroundColor: "var(--cream)",
                color: "var(--teal)",
                border: "1px solid rgba(50, 55, 65, 0.12)",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <Settings size={19} />
            </button>

            {/* Hamburger Menu Button */}
            <button
              type="button"
              onClick={toggleMobileMenu}
              aria-label="Toggle Navigation Menu"
              style={{
                display: "grid",
                placeItems: "center",
                width: "2.35rem",
                height: "2.35rem",
                borderRadius: "0.6rem",
                backgroundColor: isMobileMenuOpen ? "var(--teal)" : "var(--cream)",
                color: isMobileMenuOpen ? "#fff" : "var(--ink)",
                border: "1px solid rgba(50, 55, 65, 0.12)",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer Menu */}
        <div className={`admin-mobile-drawer-wrapper ${isMobileMenuOpen ? "is-open" : ""}`}>
          <div className="admin-mobile-drawer-inner">
            <div
              className="admin-mobile-drawer-content"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
                maxHeight: "calc(100vh - 100px)",
                overflowY: "auto",
              }}
            >
              {/* Group 1: Management */}
              {visibleManagementItems.length > 0 && (
                <div>
                  <p
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: "var(--teal)",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      marginBottom: "0.35rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem",
                    }}
                  >
                    <FolderCog size={14} />
                    การจัดการ
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "0.25rem" }}>
                    {visibleManagementItems.map((sub) => {
                      const isActive = pathname === sub.path;
                      const Icon = sub.icon;
                      return (
                        <Link
                          key={sub.path}
                          href={sub.path}
                          onClick={(e) => handleNavigateWithAnimation(e, sub.path)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.65rem",
                            padding: "0.6rem 0.75rem",
                            borderRadius: "0.6rem",
                            fontSize: "0.85rem",
                            fontWeight: isActive ? 600 : 400,
                            textDecoration: "none",
                            backgroundColor: isActive ? "var(--cream)" : "transparent",
                            color: isActive ? "var(--teal)" : "var(--ink)",
                            border: isActive ? "1px solid rgba(75, 155, 140, 0.35)" : "1px solid transparent",
                          }}
                        >
                          <Icon size={16} color={isActive ? "var(--teal)" : "var(--ink-soft)"} />
                          <span>{sub.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Group 2: POS & Kitchen */}
              {visiblePosItems.length > 0 && (
                <div>
                  <p
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: "var(--teal)",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      marginBottom: "0.35rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem",
                    }}
                  >
                    <MonitorCheck size={14} />
                    ระบบขาย
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "0.25rem" }}>
                    {visiblePosItems.map((sub) => {
                      const isActive = pathname === sub.path;
                      const Icon = sub.icon;
                      return (
                        <Link
                          key={sub.path}
                          href={sub.path}
                          onClick={(e) => handleNavigateWithAnimation(e, sub.path)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.65rem",
                            padding: "0.6rem 0.75rem",
                            borderRadius: "0.6rem",
                            fontSize: "0.85rem",
                            fontWeight: isActive ? 600 : 400,
                            textDecoration: "none",
                            backgroundColor: isActive ? "var(--cream)" : "transparent",
                            color: isActive ? "var(--teal)" : "var(--ink)",
                            border: isActive ? "1px solid rgba(75, 155, 140, 0.35)" : "1px solid transparent",
                          }}
                        >
                          <Icon size={16} color={isActive ? "var(--teal)" : "var(--ink-soft)"} />
                          <span>{sub.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* User Profile Info Card (Mobile Drawer) */}
              {currentUser && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "0.5rem",
                    padding: "0.55rem 0.75rem",
                    borderRadius: "0.75rem",
                    backgroundColor: "rgba(75, 155, 140, 0.08)",
                    border: "1px solid rgba(75, 155, 140, 0.2)",
                    marginTop: "0.5rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        width: "2.2rem",
                        height: "2.2rem",
                        borderRadius: "50%",
                        backgroundColor: "var(--teal)",
                        color: "#fff",
                        display: "grid",
                        placeItems: "center",
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      <User size={15} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontSize: "0.85rem",
                          fontWeight: 700,
                          color: "var(--ink)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        @{currentUser.username || currentUser.name}
                      </div>
                      <div
                        style={{
                          fontSize: "0.725rem",
                          color: "var(--teal)",
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          marginTop: "1px",
                        }}
                      >
                        {currentUser.role?.name_th || currentUser.role?.name_en || currentUser.role?.key || "Staff"}
                      </div>
                    </div>
                  </div>

                  {/* Settings Icon on right of user card in mobile drawer */}
                  <button
                    type="button"
                    onClick={() => {
                      closeMobileMenu();
                      setIsSettingsOpen(true);
                    }}
                    title="ตั้งค่า (Settings)"
                    aria-label="Settings"
                    style={{
                      display: "grid",
                      placeItems: "center",
                      width: "2.1rem",
                      height: "2.1rem",
                      borderRadius: "0.5rem",
                      color: "var(--teal)",
                      backgroundColor: "rgba(75, 155, 140, 0.15)",
                      border: "none",
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  >
                    <Settings size={17} />
                  </button>
                </div>
              )}

              {/* Logout Button */}
              <div
                style={{
                  marginTop: "0.25rem",
                  paddingTop: "0.35rem",
                  display: "flex",
                  alignItems: "center",
                  paddingBottom: "0.5rem",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    closeMobileMenu();
                    handleLogout();
                  }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    height: "2.5rem",
                    padding: "0 0.75rem",
                    borderRadius: "0.6rem",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    color: "#dc2626",
                    backgroundColor: "rgba(220, 38, 38, 0.08)",
                    border: "1px solid rgba(220, 38, 38, 0.2)",
                    cursor: "pointer",
                  }}
                >
                  <LogOut size={16} />
                  <span>ออกจากระบบ</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* 3. SETTINGS MODAL DIALOG (From @/components/ui/modals)         */}
      {/* ------------------------------------------------------------- */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}
