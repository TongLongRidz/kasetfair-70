"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getStoredToken, getStoredUser, setStoredUser, canAccessPath, getFirstAllowedPath } from "@/lib/auth";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
  requireSuperAdmin?: boolean;
}

export default function AuthGuard({ children, requireSuperAdmin = false }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  // Fast initial authorization check from cached session
  const [isAuthorized, setIsAuthorized] = useState(() => {
    if (pathname === "/staff/login") return true;
    const token = getStoredToken();
    const user = getStoredUser();
    if (token && user) {
      if (requireSuperAdmin && user?.role?.key !== "super_admin") return false;
      return canAccessPath(pathname, user);
    }
    return false;
  });

  const [checking, setChecking] = useState(() => {
    if (pathname === "/staff/login") return false;
    const token = getStoredToken();
    const user = getStoredUser();
    // If we have cached auth credentials, don't block the initial render with a blank screen
    if (token && user) {
      return false;
    }
    return true;
  });

  useEffect(() => {
    // If we're already on login page, no guard check needed
    if (pathname === "/staff/login") {
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
          router.replace("/staff/login");
          return;
        }

        const userData = await res.json();
        setStoredUser(userData);

        if (requireSuperAdmin && userData?.role?.key !== "super_admin") {
          const firstPath = getFirstAllowedPath(userData);
          router.replace(firstPath);
          return;
        }

        // Check if user has permission to view current route
        if (!canAccessPath(pathname, userData)) {
          const firstPath = getFirstAllowedPath(userData);
          router.replace(firstPath);
          return;
        }

        setIsAuthorized(true);
      } catch {
        // Dev fallback if backend unreachable but cookie token exists
        const user = getStoredUser();
        if (token && user) {
          if (requireSuperAdmin && user?.role?.key !== "super_admin") {
            const firstPath = getFirstAllowedPath(user);
            router.replace(firstPath);
            return;
          }
          if (!canAccessPath(pathname, user)) {
            const firstPath = getFirstAllowedPath(user);
            router.replace(firstPath);
            return;
          }
          setIsAuthorized(true);
        } else {
          router.replace("/staff/login");
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
