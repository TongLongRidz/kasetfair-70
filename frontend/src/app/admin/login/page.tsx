"use client";

import { useState } from "react";
import Link from "next/link";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!username.trim() || !password.trim()) {
      setErrorMessage("กรุณากรอกชื่อผู้ใช้งานและรหัสผ่าน");
      return;
    }

    setIsLoading(true);

    try {
      // Future API integration: POST /api/v1/admin/login
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Mock validation
      if (username === "admin" && password === "admin123") {
        window.location.href = "/admin";
      } else {
        setErrorMessage("ชื่อผู้ดูแลระบบหรือรหัสผ่านไม่ถูกต้อง");
      }
    } catch {
      setErrorMessage("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--cream)",
        color: "var(--ink)",
        fontFamily: "'Kanit', sans-serif",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "1rem",
        position: "relative",
      }}
    >
      {/* Top Header / Back Button */}
      <header
        style={{
          maxWidth: "460px",
          width: "100%",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.5rem 0",
        }}
      >
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "0.875rem",
            fontWeight: 500,
            color: "var(--ink-soft)",
            textDecoration: "none",
            backgroundColor: "var(--card)",
            padding: "0.5rem 0.875rem",
            borderRadius: "9999px",
            border: "1px solid rgba(50, 55, 65, 0.1)",
            transition: "all 0.2s ease",
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          กลับหน้าหลัก
        </Link>

      </header>

      {/* Main Login Card */}
      <main
        style={{
          maxWidth: "460px",
          width: "100%",
          margin: "1.5rem auto",
        }}
      >
        <div
          className="animate-rise"
          style={{
            backgroundColor: "var(--card)",
            borderRadius: "1.5rem",
            padding: "2.25rem 1.75rem",
            border: "1px solid rgba(50, 55, 65, 0.12)",
            boxShadow: "0 12px 32px -4px rgba(0, 0, 0, 0.08)",
          }}
        >
          {/* Brand Logo & Title */}
          <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "4rem",
                height: "4rem",
                borderRadius: "1.25rem",
                backgroundColor: "var(--ink)",
                color: "var(--cream)",
                fontSize: "2rem",
                fontWeight: 700,
                marginBottom: "1rem",
                boxShadow: "0 8px 16px -4px rgba(0, 0, 0, 0.2)",
              }}
            >
              ถ
            </div>
            <h1
              style={{
                fontSize: "1.625rem",
                fontWeight: 700,
                color: "var(--ink)",
                letterSpacing: "-0.01em",
              }}
            >
              ระบบผู้ดูแลร้าน (Admin)
            </h1>
            <p
              style={{
                marginTop: "0.25rem",
                fontSize: "0.875rem",
                color: "var(--ink-soft)",
              }}
            >
              ร้านถั่วทอง · จัดการออเดอร์ คิว และยอดขาย เกษตรแฟร์ 70
            </p>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div
              className="animate-rise"
              style={{
                marginBottom: "1.25rem",
                padding: "0.75rem 1rem",
                borderRadius: "0.75rem",
                backgroundColor: "rgba(220, 38, 38, 0.08)",
                border: "1px solid rgba(220, 38, 38, 0.2)",
                color: "#b91c1c",
                fontSize: "0.875rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1.125rem" }}>
            {/* Username Field */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  marginBottom: "0.375rem",
                  color: "var(--ink)",
                }}
              >
                ชื่อผู้ดูแลระบบ (Admin Username)
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="กรอกชื่อผู้ใช้ เช่น admin"
                  autoComplete="username"
                  required
                  style={{
                    width: "100%",
                    borderRadius: "0.75rem",
                    backgroundColor: "var(--cream)",
                    padding: "0.75rem 1rem 0.75rem 2.5rem",
                    fontSize: "0.9375rem",
                    border: "1px solid rgba(50, 55, 65, 0.15)",
                    outline: "none",
                    color: "var(--ink)",
                    fontFamily: "inherit",
                    transition: "border-color 0.2s ease",
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    left: "0.875rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--ink-soft)",
                    display: "flex",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </span>
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.375rem" }}>
                <label
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "var(--ink)",
                  }}
                >
                  รหัสผ่าน (Admin Password)
                </label>
              </div>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่าน"
                  autoComplete="current-password"
                  required
                  style={{
                    width: "100%",
                    borderRadius: "0.75rem",
                    backgroundColor: "var(--cream)",
                    padding: "0.75rem 2.5rem 0.75rem 2.5rem",
                    fontSize: "0.9375rem",
                    border: "1px solid rgba(50, 55, 65, 0.15)",
                    outline: "none",
                    color: "var(--ink)",
                    fontFamily: "inherit",
                    transition: "border-color 0.2s ease",
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    left: "0.875rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--ink-soft)",
                    display: "flex",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </span>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "0.75rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "var(--ink-soft)",
                    cursor: "pointer",
                    padding: "0.25rem",
                    display: "flex",
                  }}
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                marginTop: "0.5rem",
                width: "100%",
                borderRadius: "0.75rem",
                backgroundColor: "var(--ink)",
                padding: "0.875rem",
                fontSize: "0.9375rem",
                fontWeight: 600,
                color: "var(--cream)",
                border: "none",
                cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading ? 0.7 : 1,
                boxShadow: "0 4px 14px rgba(0, 0, 0, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                transition: "all 0.2s ease",
              }}
            >
              {isLoading ? (
                <>
                  <span
                    style={{
                      width: "1rem",
                      height: "1rem",
                      border: "2px solid var(--cream)",
                      borderTopColor: "transparent",
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite",
                    }}
                  />
                  กำลังเข้าสู่ระบบ...
                </>
              ) : (
                "เข้าสู่ระบบผู้ดูแล"
              )}
            </button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          textAlign: "center",
          padding: "1rem 0",
          fontSize: "0.75rem",
          color: "var(--ink-soft)",
        }}
      >
        <span className="font-mono">TAOTHONG ADMIN PORTAL · STAND 12</span>
      </footer>

      {/* Spinner animation definition */}
      <style jsx global>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
