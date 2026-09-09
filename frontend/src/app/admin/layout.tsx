import React from "react";
import AuthGuard from "@/components/ui/AuthGuard";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="admin-theme" style={{ fontFamily: "'Mitr', sans-serif" }}>
        {children}
      </div>
    </AuthGuard>
  );
}
