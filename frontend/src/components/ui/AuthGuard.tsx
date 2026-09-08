"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getStoredToken, getStoredUser } from "@/lib/auth";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
  requireSuperAdmin?: boolean;
}

export default function AuthGuard({ children, requireSuperAdmin = false }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // If we're already on login page, no guard check needed
    if (pathname === "/admin/login") {
      setIsAuthorized(true);
      setChecking(false);
      return;
    }

    const token = getStoredToken();
    const user = getStoredUser();

    if (!token || !user) {
      router.replace("/admin/login");
      return;
    }

    if (requireSuperAdmin && !user.is_superadmin) {
      router.replace("/admin/management/dashboard");
      return;
    }

    setIsAuthorized(true);
    setChecking(false);
  }, [router, pathname, requireSuperAdmin]);

  if (checking || !isAuthorized) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "var(--cream)",
          color: "var(--ink)",
          fontFamily: "'Kanit', sans-serif",
          gap: "1rem",
        }}
      >
        <div
          style={{
            width: "3.5rem",
            height: "3.5rem",
            borderRadius: "1rem",
            backgroundColor: "var(--ink)",
            color: "var(--cream)",
            display: "grid",
            placeItems: "center",
            fontSize: "1.75rem",
            fontWeight: 700,
          }}
        >
          ถ
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--ink-soft)" }}>
          <Loader2 size={18} className="animate-spin" />
          <span style={{ fontSize: "0.9rem" }}>กำลังตรวจสอบสิทธิ์การเข้าถึง...</span>
        </div>
        <style jsx global>{`
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
          .animate-spin {
            animation: spin 1s linear infinite;
          }
        `}</style>
      </div>
    );
  }

  return <>{children}</>;
}
