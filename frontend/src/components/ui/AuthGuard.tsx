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
    return null;
  }

  return <>{children}</>;
}
