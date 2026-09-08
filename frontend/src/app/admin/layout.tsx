import React from "react";
import AuthGuard from "@/components/ui/AuthGuard";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}
