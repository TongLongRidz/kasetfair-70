"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, User, Lock, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";

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
      {/* Main Login Card */}
      <main
        style={{
          maxWidth: "460px",
          width: "100%",
          margin: "auto",
        }}
      >
        <div
          className="animate-rise"
          style={{
            position: "relative",
            backgroundColor: "var(--card)",
            borderRadius: "1.5rem",
            padding: "2.25rem 1.75rem",
            border: "1px solid rgba(50, 55, 65, 0.12)",
            boxShadow: "0 12px 32px -4px rgba(0, 0, 0, 0.08)",
          }}
        >
          {/* Back to Home Icon Button */}
          <Link
            href="/"
            aria-label="กลับหน้าหลัก"
            style={{
              position: "absolute",
              left: "1.25rem",
              top: "1.25rem",
              width: "2.25rem",
              height: "2.25rem",
              display: "grid",
              placeItems: "center",
              borderRadius: "9999px",
              backgroundColor: "var(--cream)",
              color: "var(--ink)",
              border: "1px solid rgba(50, 55, 65, 0.12)",
              textDecoration: "none",
              transition: "all 0.2s ease",
            }}
          >
            <ArrowLeft size={18} strokeWidth={2.5} />
          </Link>

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
              <AlertCircle size={16} />
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
                  <User size={16} />
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
                  <Lock size={16} />
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
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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
                  <Loader2 size={16} className="animate-spin" />
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
        <span className="font-mono">TAOTHONG ADMIN</span>
      </footer>

      {/* Spinner animation definition */}
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
