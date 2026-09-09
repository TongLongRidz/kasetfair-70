"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  title?: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, title?: string, duration?: number) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "info", title?: string, duration: number = 3500) => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newToast: ToastItem = { id, title, message, type, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback(
    (message: string, title?: string) => showToast(message, "success", title),
    [showToast]
  );
  const error = useCallback(
    (message: string, title?: string) => showToast(message, "error", title),
    [showToast]
  );
  const info = useCallback(
    (message: string, title?: string) => showToast(message, "info", title),
    [showToast]
  );
  const warning = useCallback(
    (message: string, title?: string) => showToast(message, "warning", title),
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
      {children}
      {/* Toast Notification Container */}
      <div
        style={{
          position: "fixed",
          top: "1.25rem",
          right: "1.25rem",
          zIndex: 99999,
          display: "flex",
          flexDirection: "column",
          gap: "0.6rem",
          maxWidth: "380px",
          width: "calc(100% - 2.5rem)",
          pointerEvents: "none",
        }}
      >
        {toasts.map((toast) => {
          const isSuccess = toast.type === "success";
          const isError = toast.type === "error";
          const isWarning = toast.type === "warning";

          const borderColor = isSuccess
            ? "rgba(34, 197, 94, 0.3)"
            : isError
            ? "rgba(239, 68, 68, 0.3)"
            : isWarning
            ? "rgba(245, 158, 11, 0.3)"
            : "rgba(75, 155, 140, 0.3)";

          const iconColor = isSuccess
            ? "#16a34a"
            : isError
            ? "#dc2626"
            : isWarning
            ? "#d97706"
            : "var(--teal)";

          return (
            <div
              key={toast.id}
              className="animate-rise"
              style={{
                pointerEvents: "auto",
                backgroundColor: "var(--card)",
                borderRadius: "0.85rem",
                padding: "0.85rem 1rem",
                boxShadow: "0 10px 25px -3px rgba(0, 0, 0, 0.12), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                border: `1px solid ${borderColor}`,
                display: "flex",
                alignItems: "flex-start",
                gap: "0.75rem",
                fontFamily: "'Kanit', sans-serif",
                color: "var(--ink)",
                backdropFilter: "blur(8px)",
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ flexShrink: 0, marginTop: "2px" }}>
                {isSuccess && <CheckCircle2 size={19} color={iconColor} />}
                {isError && <AlertCircle size={19} color={iconColor} />}
                {isWarning && <AlertTriangle size={19} color={iconColor} />}
                {!isSuccess && !isError && !isWarning && <Info size={19} color={iconColor} />}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                {toast.title && (
                  <h4 style={{ fontSize: "0.875rem", fontWeight: 700, lineHeight: 1.3, marginBottom: "2px" }}>
                    {toast.title}
                  </h4>
                )}
                <p style={{ fontSize: "0.825rem", color: "var(--ink)", lineHeight: 1.4, margin: 0, wordBreak: "break-word" }}>
                  {toast.message}
                </p>
              </div>

              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                style={{
                  flexShrink: 0,
                  border: "none",
                  backgroundColor: "transparent",
                  color: "var(--ink-soft)",
                  cursor: "pointer",
                  padding: "2px",
                  borderRadius: "0.35rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: 0.7,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
