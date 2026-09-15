"use client";

import React, { useState, useEffect, useRef } from "react";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import {
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  FileImage,
  QrCode,
  Banknote,
  ExternalLink,
  ShieldCheck,
  X,
  Sparkles,
  MoreVertical,
  Check,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { getStoredToken } from "@/lib/auth";
import OrderInspectionModal from "./components/OrderInspectionModal";
import FraudReasonModal from "./components/FraudReasonModal";

export type PaymentVerificationStatus = "verified" | "pending" | "fraud";
export type PaymentMethod = "promptpay_qr" | "cash";

export interface SlipOrderItem {
  id: number;
  orderNo: string;
  queueNo: string;
  customerName: string;
  customerPhone?: string;
  channel: "ออนไลน์" | "หน้าร้าน" | "Nisit Shop";
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentVerificationStatus;
  statusNote?: string;
  orderedAt: string;
  createdAtRaw?: string;
  slipVerifiedAt?: string;
  verifiedByName?: string;
  slipImageUrl?: string;
  cashImageUrl?: string;
  itemsSummary: string;
}

export default function SlipCheckManagementPage() {
  const { success, error: toastError, info, warning } = useToast();
  // Settings policies: "immediate" (ต้องอัพรูปเลย) vs "later" (ไม่อัพรูป/อัพทีหลังได้)
  const [promptpayUploadMode, setPromptpayUploadMode] = useState<"immediate" | "later">("immediate");
  const [cashUploadMode, setCashUploadMode] = useState<"immediate" | "later">("later");

  // Load settings policies from Backend API (with localStorage fallback)
  useEffect(() => {
    const fetchSettings = async () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585";
      try {
        const res = await fetch(`${apiUrl}/api/v1/settings/slip_upload_mode`);
        if (res.ok) {
          const data = await res.json();
          if (data.value === "later" || data.value === "immediate") {
            setPromptpayUploadMode(data.value);
            localStorage.setItem("kaset_slip_upload_mode", data.value);
          }
        }
      } catch {}

      try {
        const res = await fetch(`${apiUrl}/api/v1/settings/cash_upload_mode`);
        if (res.ok) {
          const data = await res.json();
          if (data.value === "later" || data.value === "immediate") {
            setCashUploadMode(data.value);
            localStorage.setItem("kaset_cash_upload_mode", data.value);
          }
        }
      } catch {}

      // Fallbacks
      try {
        const savedPromptpay = localStorage.getItem("kaset_slip_upload_mode");
        if (savedPromptpay === "later" || savedPromptpay === "immediate") {
          setPromptpayUploadMode(savedPromptpay);
        }
        const savedCash = localStorage.getItem("kaset_cash_upload_mode");
        if (savedCash === "later" || savedCash === "immediate") {
          setCashUploadMode(savedCash);
        }
      } catch {}
    };
    fetchSettings();
  }, []);

  const handleTogglePromptpayMode = async (mode: "immediate" | "later") => {
    setPromptpayUploadMode(mode);
    try {
      localStorage.setItem("kaset_slip_upload_mode", mode);
    } catch {}

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585";
      const token = getStoredToken();
      await fetch(`${apiUrl}/api/v1/settings/slip_upload_mode`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          value: mode,
          description: "เงื่อนไขการแนบสลิป PromptPay: immediate (ต้องอัพสลิป) หรือ later (ไม่ต้องอัพ)",
        }),
      });
    } catch (err) {
      console.error("Failed to update PromptPay setting:", err);
    }

    if (mode === "later") {
      info("PromptPay: ไม่อัพรูป / อัพทีหลังได้", "ตั้งค่ารูป PromptPay");
    } else {
      success("PromptPay: ต้องอัพโหลดสลิปทันที", "ตั้งค่ารูป PromptPay");
    }
  };

  const handleToggleCashMode = async (mode: "immediate" | "later") => {
    setCashUploadMode(mode);
    try {
      localStorage.setItem("kaset_cash_upload_mode", mode);
    } catch {}

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585";
      const token = getStoredToken();
      await fetch(`${apiUrl}/api/v1/settings/cash_upload_mode`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          value: mode,
          description: "เงื่อนไขการถ่ายรูปเงินสด: immediate (ต้องถ่ายรูป/อัพรูป) หรือ later (ไม่ต้องถ่ายรูป)",
        }),
      });
    } catch (err) {
      console.error("Failed to update Cash setting:", err);
    }

    if (mode === "later") {
      info("เงินสด: ไม่ต้องถ่ายรูป", "ตั้งค่าถ่ายรูปเงินสด");
    } else {
      success("เงินสด: บังคับถ่ายรูป/อัพโหลดรูป", "ตั้งค่าถ่ายรูปเงินสด");
    }
  };

  const [orders, setOrders] = useState<SlipOrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | PaymentVerificationStatus>("all");
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest" | "amount_high" | "amount_low">("latest");
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState<number>(1);

  // Selected order for inspection modal
  const [selectedOrder, setSelectedOrder] = useState<SlipOrderItem | null>(null);

  // Kebab dropdown menu state
  const [activeKebabId, setActiveKebabId] = useState<number | null>(null);

  // Fraud reason input modal
  const [isFraudModalOpen, setIsFraudModalOpen] = useState(false);
  const [fraudTargetOrder, setFraudTargetOrder] = useState<SlipOrderItem | null>(null);
  const [fraudReason, setFraudReason] = useState("");

  // Helper to format date / time nicely like administrator page
  const renderFormattedDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    const datePart = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr.split(" ")[0];
    const rawTime = dateStr.includes("T") ? dateStr.split("T")[1]?.substring(0, 8) : dateStr.split(" ")[1] || "";
    const timePart = rawTime ? rawTime.substring(0, 8) : "";

    return (
      <div style={{ lineHeight: 1.25 }}>
        <div className="font-mono" style={{ color: "var(--ink)", fontWeight: 500, fontSize: "0.8rem" }}>
          {datePart}
        </div>
        {timePart && (
          <div className="font-mono" style={{ fontSize: "0.725rem", color: "var(--ink-soft)", marginTop: "1px" }}>
            {timePart}
          </div>
        )}
      </div>
    );
  };

  // Fetch orders from backend API
  const fetchOrders = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585";
      const token = getStoredToken();
      const res = await fetch(`${apiUrl}/api/v1/orders?page_size=500`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        const json = await res.json();
        const rawOrders = json.data || json || [];
        const mapped: SlipOrderItem[] = rawOrders.map((o: any) => {
          // Channel mapping
          let channel: "ออนไลน์" | "หน้าร้าน" | "Nisit Shop" = "หน้าร้าน";
          if (o.method === "online") channel = "ออนไลน์";
          else if (o.method === "nisit-shop") channel = "Nisit Shop";

          // Payment method mapping
          const paymentMethod: PaymentMethod = o.payment_method === "promptpay" ? "promptpay_qr" : "cash";

          // Verification status mapping
          let paymentStatus: PaymentVerificationStatus = "pending";
          if (o.slip_verification_status === "verified" || o.slip_verification_status === "fraud") {
            paymentStatus = o.slip_verification_status;
          }

          // Build items summary
          const itemsSummary = o.order_items && o.order_items.length > 0
            ? o.order_items.map((item: any) => {
                const pName = item.product?.name_th || "สินค้า";
                const sweet = item.sweetness_level ? ` (${item.sweetness_level})` : "";
                return `${pName}${sweet} x${item.quantity}`;
              }).join(", ")
            : "ไม่ระบุรายการ";

          return {
            id: o.id,
            orderNo: `#${o.id}`,
            queueNo: o.queue_no || `#${o.id}`,
            customerName: o.customer_name || (o.method === "walk-in" ? "ลูกค้าหน้าร้าน" : "ลูกค้าออนไลน์"),
            customerPhone: o.customer_phone || "",
            channel,
            total: o.total_amount || 0,
            paymentMethod,
            paymentStatus,
            statusNote: o.check_note || o.note || "",
            orderedAt: o.created_at,
            createdAtRaw: o.created_at,
            slipVerifiedAt: o.slip_verified_at || undefined,
            verifiedByName: o.slip_admin?.name || o.slip_admin?.username || (o.slip_verified_by ? `Admin #${o.slip_verified_by}` : "-"),
            slipImageUrl: o.slip_url || undefined,
            itemsSummary,
          };
        });
        setOrders(mapped);
      }
    } catch (err) {
      console.error("Failed to fetch orders from backend:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  // Close kebab menu when clicking outside
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".kebab-container")) {
        setActiveKebabId(null);
      }
    };
    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, []);

  // Filter and sort logic
  const filteredOrders = orders
    .filter((o) => {
      const matchSearch =
        o.orderNo.toLowerCase().includes(search.toLowerCase()) ||
        o.queueNo.toLowerCase().includes(search.toLowerCase()) ||
        o.customerName.toLowerCase().includes(search.toLowerCase()) ||
        (o.customerPhone && o.customerPhone.includes(search));

      const matchStatus = statusFilter === "all" || o.paymentStatus === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      if (sortOrder === "latest") return b.id - a.id;
      if (sortOrder === "oldest") return a.id - b.id;
      if (sortOrder === "amount_high") return b.total - a.total;
      if (sortOrder === "amount_low") return a.total - b.total;
      return 0;
    });

  const totalPages = Math.ceil(filteredOrders.length / pageSize) || 1;
  const paginatedOrders = filteredOrders.slice((page - 1) * pageSize, page * pageSize);

  // Status Change Handlers
  const handleSetStatus = async (orderId: number, status: PaymentVerificationStatus, note?: string) => {
    const target = orders.find((o) => o.id === orderId);

    // Optimistic update
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            paymentStatus: status,
            statusNote: note !== undefined ? note : status === "fraud" ? o.statusNote : undefined,
          };
        }
        return o;
      })
    );

    // API call to backend
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585";
      const token = getStoredToken();
      const res = await fetch(`${apiUrl}/api/v1/orders/${orderId}/verify-slip`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          status,
          check_note: note !== undefined ? note : "",
          note: note !== undefined ? note : "",
        }),
      });

      if (res.ok) {
        fetchOrders();
      }
    } catch (err) {
      console.error("Failed to update order slip verification status:", err);
    }

    if (target) {
      if (status === "verified") {
        success(`อนุมัติสลิปออเดอร์ ${target.orderNo} (${target.queueNo}) เรียบร้อยแล้ว`, "อนุมัติการชำระเงิน");
      } else if (status === "fraud") {
        toastError(`ปฏิเสธสลิปออเดอร์ ${target.orderNo} (${target.queueNo}) แล้ว`, "ปฏิเสธสลิป");
      } else if (status === "pending") {
        info(`ย้ายออเดอร์ ${target.orderNo} กลับมารอตรวจสอบ`, "รอตรวจสอบ");
      }
    }

    // If active modal is open, update selectedOrder
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder((prev) =>
        prev
          ? {
              ...prev,
              paymentStatus: status,
              statusNote: note !== undefined ? note : status === "fraud" ? prev.statusNote : undefined,
            }
          : null
      );
    }
  };

  // Upload slip for existing order
  const handleUploadSlip = async (orderId: number, file: File) => {
    return new Promise<void>((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        if (!dataUrl) {
          resolve();
          return;
        }

        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585";
          const token = getStoredToken();
          const res = await fetch(`${apiUrl}/api/v1/orders/${orderId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              slip_url: dataUrl,
            }),
          });

          if (res.ok) {
            success("อัพโหลดรูปภาพสลิป/หลักฐานเรียบร้อยแล้ว", "บันทึกสำเร็จ");
            setOrders((prev) =>
              prev.map((o) => (o.id === orderId ? { ...o, slipImageUrl: dataUrl } : o))
            );
            if (selectedOrder && selectedOrder.id === orderId) {
              setSelectedOrder((prev) => (prev ? { ...prev, slipImageUrl: dataUrl } : null));
            }
            fetchOrders();
          } else {
            toastError("ไม่สามารถอัพโหลดรูปสลิปได้", "เกิดข้อผิดพลาด");
          }
        } catch (err) {
          console.error("Failed to upload slip:", err);
          toastError("เกิดข้อผิดพลาดในการส่งข้อมูลสลิป", "เกิดข้อผิดพลาด");
        } finally {
          resolve();
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleOpenFraudReasonModal = (order: SlipOrderItem) => {
    setFraudTargetOrder(order);
    setFraudReason(order.statusNote || "");
    setIsFraudModalOpen(true);
  };

  const handleConfirmFraud = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fraudTargetOrder) return;
    if (!fraudReason.trim()) return;

    handleSetStatus(fraudTargetOrder.id, "fraud", fraudReason.trim());
    setIsFraudModalOpen(false);
    setFraudTargetOrder(null);
    setFraudReason("");
  };

  // Count stats
  const pendingCount = orders.filter((o) => o.paymentStatus === "pending").length;
  const verifiedCount = orders.filter((o) => o.paymentStatus === "verified").length;
  const fraudCount = orders.filter((o) => o.paymentStatus === "fraud").length;

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--cream)", fontFamily: "'Kanit', sans-serif" }}>
      <AdminSidebar />

      <main style={{ flex: 1, padding: "1.75rem 2.5rem", overflowY: "auto", minWidth: 0 }}>
        {/* Header Section */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, lineHeight: 1.2, margin: 0 }}>
              การตรวจสอบการชำระเงิน
            </h1>
          </div>
        </div>

        {/* 4 KPI Cards Grid */}
        <div
          className="admin-kpi-grid"
          style={{
            marginTop: "1.5rem",
            marginBottom: "1.5rem",
          }}
        >
          {/* Card 1: ยังไม่ได้ยืนยัน */}
          <div
            className="admin-kpi-card animate-rise"
            style={{
              borderRadius: "1.25rem",
              backgroundColor: "var(--card)",
              padding: "1.25rem 1.35rem",
              border: "1px solid rgba(50, 55, 65, 0.09)",
              boxShadow: "0 2px 12px -2px rgba(0,0,0,0.03)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxSizing: "border-box",
              transition: "all 0.15s ease",
            }}
          >
            <div>
              <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)", fontWeight: 500, margin: 0 }}>
                ยังไม่ได้ยืนยัน (รอตรวจสอบ)
              </p>
            </div>
            <div style={{ marginTop: "0.5rem", marginBottom: "0.35rem" }}>
              <p
                style={{
                  fontSize: "1.85rem",
                  fontWeight: 800,
                  fontFamily: "'Kanit', sans-serif",
                  color: "#f59e0b",
                  letterSpacing: "-0.01em",
                  lineHeight: 1.15,
                  margin: 0,
                }}
              >
                {pendingCount}
              </p>
            </div>
            <div>
              <p style={{ fontSize: "0.75rem", color: "var(--ink-soft)", fontWeight: 400, lineHeight: 1.3, margin: 0 }}>
                รอตรวจสอบสลิป / เงินสด
              </p>
            </div>
          </div>

          {/* Card 2: ยืนยันแล้ว */}
          <div
            className="admin-kpi-card animate-rise"
            style={{
              borderRadius: "1.25rem",
              backgroundColor: "var(--card)",
              padding: "1.25rem 1.35rem",
              border: "1px solid rgba(50, 55, 65, 0.09)",
              boxShadow: "0 2px 12px -2px rgba(0,0,0,0.03)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxSizing: "border-box",
              transition: "all 0.15s ease",
            }}
          >
            <div>
              <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)", fontWeight: 500, margin: 0 }}>
                ยืนยันแล้ว (ผ่าน)
              </p>
            </div>
            <div style={{ marginTop: "0.5rem", marginBottom: "0.35rem" }}>
              <p
                style={{
                  fontSize: "1.85rem",
                  fontWeight: 800,
                  fontFamily: "'Kanit', sans-serif",
                  color: "var(--teal)",
                  letterSpacing: "-0.01em",
                  lineHeight: 1.15,
                  margin: 0,
                }}
              >
                {verifiedCount}
              </p>
            </div>
            <div>
              <p style={{ fontSize: "0.75rem", color: "var(--ink-soft)", fontWeight: 400, lineHeight: 1.3, margin: 0 }}>
                ชำระเงินถูกต้อง พร้อมทำเครื่องดื่ม
              </p>
            </div>
          </div>

          {/* Card 3: เนียนเลยนะครับ (ปฏิเสธ) */}
          <div
            className="admin-kpi-card animate-rise"
            style={{
              borderRadius: "1.25rem",
              backgroundColor: "var(--card)",
              padding: "1.25rem 1.35rem",
              border: "1px solid rgba(50, 55, 65, 0.09)",
              boxShadow: "0 2px 12px -2px rgba(0,0,0,0.03)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxSizing: "border-box",
              transition: "all 0.15s ease",
            }}
          >
            <div>
              <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)", fontWeight: 500, margin: 0 }}>
                เนียนเลยนะครับ (ไม่ผ่าน)
              </p>
            </div>
            <div style={{ marginTop: "0.5rem", marginBottom: "0.35rem" }}>
              <p
                style={{
                  fontSize: "1.85rem",
                  fontWeight: 800,
                  fontFamily: "'Kanit', sans-serif",
                  color: "#ef4444",
                  letterSpacing: "-0.01em",
                  lineHeight: 1.15,
                  margin: 0,
                }}
              >
                {fraudCount}
              </p>
            </div>
            <div>
              <p style={{ fontSize: "0.75rem", color: "var(--ink-soft)", fontWeight: 400, lineHeight: 1.3, margin: 0 }}>
                สลิปไม่ถูกต้อง / ปฏิเสธรายการ
              </p>
            </div>
          </div>

          {/* Card 4: ตั้งค่าเงื่อนไขรูปภาพการชำระเงิน */}
          <div
            className="admin-kpi-card animate-rise"
            style={{
              borderRadius: "1.25rem",
              backgroundColor: "var(--card)",
              padding: "1.1rem 1.25rem",
              border: "1px solid rgba(50, 55, 65, 0.09)",
              boxShadow: "0 2px 12px -2px rgba(0,0,0,0.03)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxSizing: "border-box",
              transition: "all 0.15s ease",
            }}
          >
            <div style={{ marginBottom: "0.6rem" }}>
              <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)", fontWeight: 600, margin: 0 }}>
                เงื่อนไขการอัพโหลดรูปภาพ
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
              {/* PromptPay QR Toggle Row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "0.5rem",
                  padding: "0.4rem 0.6rem",
                  backgroundColor: "rgba(50, 55, 65, 0.025)",
                  borderRadius: "0.75rem",
                  border: "1px solid rgba(50, 55, 65, 0.05)",
                }}
              >
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--ink)", lineHeight: 1.2 }}>
                  พร้อมเพย์ QR:
                </span>

                <button
                  type="button"
                  onClick={() => handleTogglePromptpayMode(promptpayUploadMode === "immediate" ? "later" : "immediate")}
                  style={{
                    position: "relative",
                    width: "44px",
                    height: "24px",
                    borderRadius: "12px",
                    border: "none",
                    backgroundColor: promptpayUploadMode === "immediate" ? "var(--teal)" : "#cbd5e1",
                    cursor: "pointer",
                    transition: "background-color 0.2s ease",
                    padding: 0,
                    outline: "none",
                  }}
                  title={promptpayUploadMode === "immediate" ? "เปิดอยู่ (กดเพื่อปิด)" : "ปิดอยู่ (กดเพื่อเปิด)"}
                >
                  <span
                    style={{
                      position: "absolute",
                      top: "2px",
                      left: promptpayUploadMode === "immediate" ? "22px" : "2px",
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      backgroundColor: "#ffffff",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                      transition: "left 0.2s ease",
                    }}
                  />
                </button>
              </div>

              {/* Cash Toggle Row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "0.5rem",
                  padding: "0.4rem 0.6rem",
                  backgroundColor: "rgba(50, 55, 65, 0.025)",
                  borderRadius: "0.75rem",
                  border: "1px solid rgba(50, 55, 65, 0.05)",
                }}
              >
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--ink)", whiteSpace: "nowrap" }}>
                  เงินสด:
                </span>

                <button
                  type="button"
                  onClick={() => handleToggleCashMode(cashUploadMode === "immediate" ? "later" : "immediate")}
                  style={{
                    position: "relative",
                    width: "44px",
                    height: "24px",
                    borderRadius: "12px",
                    border: "none",
                    backgroundColor: cashUploadMode === "immediate" ? "var(--teal)" : "#cbd5e1",
                    cursor: "pointer",
                    transition: "background-color 0.2s ease",
                    padding: 0,
                    outline: "none",
                  }}
                  title={cashUploadMode === "immediate" ? "เปิดอยู่ (กดเพื่อปิด)" : "ปิดอยู่ (กดเพื่อเปิด)"}
                >
                  <span
                    style={{
                      position: "absolute",
                      top: "2px",
                      left: cashUploadMode === "immediate" ? "22px" : "2px",
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      backgroundColor: "#ffffff",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                      transition: "left 0.2s ease",
                    }}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Table Container */}
        <section
          style={{
            borderRadius: "1.25rem",
            backgroundColor: "var(--card)",
            padding: "1.5rem",
            border: "1px solid rgba(50, 55, 65, 0.1)",
            boxShadow: "0 4px 20px -2px rgba(0,0,0,0.03)",
          }}
        >

          {/* Controls Bar: Filter Tabs & Search / Sort */}
          <div className="admin-controls-bar">
            {/* Filter Tabs (Desktop) */}
            <div className="admin-filter-tabs">
              {[
                { id: "all", label: `ทั้งหมด (${orders.length})` },
                { id: "pending", label: `รอตรวจสอบ (${pendingCount})` },
                { id: "verified", label: `ยืนยันแล้ว (${verifiedCount})` },
                { id: "fraud", label: `สลิปไม่ถูกต้อง (${fraudCount})` },
              ].map((tab) => {
                const isSelected = statusFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setStatusFilter(tab.id as any);
                      setPage(1);
                    }}
                    style={{
                      padding: "0.4rem 0.85rem",
                      borderRadius: "0.5rem",
                      fontSize: "0.8rem",
                      fontWeight: isSelected ? 700 : 500,
                      fontFamily: "'Kanit', sans-serif",
                      border: "none",
                      cursor: "pointer",
                      backgroundColor: isSelected ? "var(--ink)" : "transparent",
                      color: isSelected ? "var(--cream)" : "var(--ink-soft)",
                      transition: "all 0.15s ease",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Filter Dropdown (Mobile) */}
            <div className="admin-filter-dropdown-wrapper">
              <select
                className="admin-filter-select"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as any);
                  setPage(1);
                }}
              >
                <option value="all">สถานะ: ทั้งหมด ({orders.length})</option>
                <option value="pending">สถานะ: รอตรวจสอบ ({pendingCount})</option>
                <option value="verified">สถานะ: ยืนยันแล้ว ({verifiedCount})</option>
                <option value="fraud">สถานะ: สลิปไม่ถูกต้อง ({fraudCount})</option>
              </select>
            </div>

            {/* Search */}
            <div className="admin-search-wrapper">
              <div className="admin-search-box">
                <Search size={15} color="var(--ink-soft)" style={{ flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="ค้นหาเลขที่, คิว, ชื่อ, เบอร์..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(50, 55, 65, 0.12)", color: "var(--ink-soft)", fontSize: "0.8rem" }}>
                  <th style={{ padding: "0.75rem 0.6rem" }}>วันที่</th>
                  <th style={{ padding: "0.75rem 0.6rem" }}>หมายเลขคิว</th>
                  <th style={{ padding: "0.75rem 0.6rem" }}>วิธีชำระ</th>
                  <th style={{ padding: "0.75rem 0.6rem" }}>ตรวจสอบ</th>
                  <th style={{ padding: "0.75rem 0.6rem" }}>สถานะตรวจสอบ</th>
                  <th style={{ padding: "0.75rem 0.6rem" }}>วันที่ตรวจสอบ</th>
                  <th style={{ padding: "0.75rem 0.6rem" }}>คนที่ตรวจสอบ</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.map((order) => {
                  const isPending = order.paymentStatus === "pending";
                  const isVerified = order.paymentStatus === "verified";
                  const isFraud = order.paymentStatus === "fraud";

                  return (
                    <tr
                      key={order.id}
                      style={{
                        borderBottom: "1px solid rgba(50, 55, 65, 0.06)",
                        transition: "background-color 0.15s ease",
                      }}
                    >
                      {/* วันที่ */}
                      <td style={{ padding: "0.85rem 0.6rem" }}>
                        {renderFormattedDate(order.createdAtRaw || order.orderedAt)}
                      </td>

                      {/* หมายเลขคิว */}
                      <td style={{ padding: "0.85rem 0.6rem", fontWeight: 800, fontSize: "1rem", color: "var(--ink)" }}>
                        {order.queueNo}
                      </td>

                      {/* วิธีชำระ */}
                      <td style={{ padding: "0.85rem 0.6rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.8rem" }}>
                          {order.paymentMethod === "promptpay_qr" ? (
                            <>
                              <QrCode size={15} color="var(--teal)" />
                              <span>พร้อมเพย์ QR</span>
                            </>
                          ) : (
                            <>
                              <Banknote size={15} color="#b45309" />
                              <span>เงินสด</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* ตรวจสอบ */}
                      <td style={{ padding: "0.85rem 0.6rem" }}>
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(order)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.35rem",
                            borderRadius: "0.5rem",
                            backgroundColor: "var(--cream)",
                            border: "1px solid rgba(50, 55, 65, 0.15)",
                            padding: "0.35rem 0.65rem",
                            fontSize: "0.775rem",
                            fontWeight: 600,
                            color: "var(--ink)",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--teal)")}
                          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(50, 55, 65, 0.15)")}
                        >
                          <span>รายละเอียด</span>
                        </button>
                      </td>

                      {/* สถานะตรวจสอบ */}
                      <td style={{ padding: "0.85rem 0.6rem" }}>
                        <div>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.3rem",
                              borderRadius: "9999px",
                              padding: "0.25rem 0.75rem",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              backgroundColor: isPending
                                ? "rgba(224, 83, 83, 0.15)"
                                : isVerified
                                ? "rgba(34, 197, 94, 0.15)"
                                : "rgba(185, 28, 28, 0.2)",
                              color: isPending
                                ? "#dc2626"
                                : isVerified
                                ? "#16a34a"
                                : "#991b1b",
                            }}
                          >
                            {isPending && <Clock size={12} />}
                            {isVerified && <CheckCircle2 size={12} />}
                            {isFraud && <AlertTriangle size={12} />}
                            <span>
                              {isPending ? "ยังไม่ได้ยืนยัน" : isVerified ? "ยืนยันแล้ว" : "เนียนเลยนะครับ"}
                            </span>
                          </span>
                          {isFraud && order.statusNote && (
                            <p style={{ fontSize: "0.7rem", color: "#b91c1c", marginTop: "0.25rem", maxWidth: "160px" }}>
                              เหตุผล: {order.statusNote}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* วันที่ตรวจสอบ */}
                      <td style={{ padding: "0.85rem 0.6rem", fontSize: "0.8rem", color: "var(--ink-soft)" }}>
                        {renderFormattedDate(order.slipVerifiedAt)}
                      </td>

                      {/* คนที่ตรวจสอบ */}
                      <td style={{ padding: "0.85rem 0.6rem", fontSize: "0.8rem", fontWeight: 600, color: "var(--ink)" }}>
                        {order.verifiedByName || "-"}
                      </td>
                    </tr>
                  );
                })}

                {paginatedOrders.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "2.5rem 0", color: "var(--ink-soft)" }}>
                      ไม่พบข้อมูลรายการชำระเงินตามเงื่อนไขที่ระบุ
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div
            style={{
              marginTop: "1.25rem",
              paddingTop: "1rem",
              borderTop: "1px solid rgba(50, 55, 65, 0.08)",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "0.75rem",
              fontSize: "0.8rem",
              color: "var(--ink-soft)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span>
                แสดงหน้า {page} จาก {totalPages} (ทั้งหมด {filteredOrders.length} รายการ)
              </span>

              {/* Max Items Per Page Selector (Moved to Bottom Pagination) */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  style={{
                    padding: "0.3rem 0.6rem",
                    borderRadius: "0.5rem",
                    fontSize: "0.775rem",
                    fontFamily: "'Kanit', sans-serif",
                    backgroundColor: "var(--cream)",
                    border: "1px solid rgba(50, 55, 65, 0.15)",
                    color: "var(--ink)",
                    cursor: "pointer",
                    outline: "none",
                  }}
                >
                  <option value={5}>5 รายการ / หน้า</option>
                  <option value={10}>10 รายการ / หน้า</option>
                  <option value={20}>20 รายการ / หน้า</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                style={{
                  padding: "0.35rem 0.65rem",
                  borderRadius: "0.4rem",
                  border: "1px solid rgba(50, 55, 65, 0.15)",
                  backgroundColor: "var(--cream)",
                  color: page === 1 ? "rgba(50, 55, 65, 0.3)" : "var(--ink)",
                  cursor: page === 1 ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <ChevronLeft size={14} />
                <span style={{ marginLeft: "2px" }}>ก่อนหน้า</span>
              </button>
              <button
                type="button"
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                style={{
                  padding: "0.35rem 0.65rem",
                  borderRadius: "0.4rem",
                  border: "1px solid rgba(50, 55, 65, 0.15)",
                  backgroundColor: "var(--cream)",
                  color: page === totalPages ? "rgba(50, 55, 65, 0.3)" : "var(--ink)",
                  cursor: page === totalPages ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <span style={{ marginRight: "2px" }}>ถัดไป</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* POPUP MODAL 1: View Slip / Evidence & Quick Status Change */}
      {selectedOrder && (
        <OrderInspectionModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onSetStatus={handleSetStatus}
          onOpenFraudReasonModal={handleOpenFraudReasonModal}
          onUploadSlip={handleUploadSlip}
        />
      )}

      {/* POPUP MODAL 2: Fraud Reason Required Modal */}
      {isFraudModalOpen && fraudTargetOrder && (
        <FraudReasonModal
          targetOrder={fraudTargetOrder}
          reason={fraudReason}
          onChangeReason={setFraudReason}
          onClose={() => setIsFraudModalOpen(false)}
          onSubmit={handleConfirmFraud}
        />
      )}
    </div>
  );
}
