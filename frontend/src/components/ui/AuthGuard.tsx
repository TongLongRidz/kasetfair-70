"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getStoredToken, getStoredUser, setStoredUser } from "@/lib/auth";
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

    const verifyAuth = async () => {
      const token = getStoredToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585";
      
      try {
        const res = await fetch(`${apiUrl}/api/v1/auth/me`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: "include",
        });

        if (!res.ok) {
          router.replace("/admin/login");
          return;
        }

        const userData = await res.json();
        setStoredUser(userData);

        if (requireSuperAdmin && !userData.is_superadmin) {
          router.replace("/admin/management/dashboard");
          return;
        }

        setIsAuthorized(true);
      } catch {
        // Dev fallback if backend unreachable but cookie token exists
        const user = getStoredUser();
        if (token && user) {
          if (requireSuperAdmin && !user.is_superadmin) {
            router.replace("/admin/management/dashboard");
            return;
          }
          setIsAuthorized(true);
        } else {
          router.replace("/admin/login");
        }
      } finally {
        setChecking(false);
      }
    };

    verifyAuth();
  }, [router, pathname, requireSuperAdmin]);

  if (checking || !isAuthorized) {
    return null;
  }

  return <>{children}</>;
}
