"use client";

import React, { useState, useEffect, useRef } from "react";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
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
  itemsDetail?: Array<{
    productName: string;
    sweetness?: string;
    quantity: number;
    toppings?: string[];
  }>;
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
      } catch { }

      try {
        const res = await fetch(`${apiUrl}/api/v1/settings/cash_upload_mode`);
        if (res.ok) {
          const data = await res.json();
          if (data.value === "later" || data.value === "immediate") {
            setCashUploadMode(data.value);
            localStorage.setItem("kaset_cash_upload_mode", data.value);
          }
        }
      } catch { }

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
      } catch { }
    };
    fetchSettings();
  }, []);

  const handleTogglePromptpayMode = async (mode: "immediate" | "later") => {
    setPromptpayUploadMode(mode);
    try {
      localStorage.setItem("kaset_slip_upload_mode", mode);
    } catch { }

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
    } catch { }

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
  const [totalOrders, setTotalOrders] = useState<number>(0);
  const [statsCounts, setStatsCounts] = useState({ pending: 0, verified: 0, fraud: 0 });
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | PaymentVerificationStatus>("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<"all" | PaymentMethod>("all");
  const [dateSort, setDateSort] = useState<"desc" | "asc">("desc");
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState<number>(1);

  // Selected order for inspection modal
  const [selectedOrder, setSelectedOrder] = useState<SlipOrderItem | null>(null);

  // Kebab dropdown menu state
  const [activeKebabId, setActiveKebabId] = useState<number | null>(null);

  // Header click handlers
  const handleToggleDateSort = () => {
    setDateSort((prev) => (prev === "desc" ? "asc" : "desc"));
    setPage(1);
  };

  const handleCyclePaymentMethod = () => {
    if (paymentMethodFilter === "all") setPaymentMethodFilter("promptpay_qr");
    else if (paymentMethodFilter === "promptpay_qr") setPaymentMethodFilter("cash");
    else setPaymentMethodFilter("all");
    setPage(1);
  };

  const handleCycleStatusFilter = () => {
    if (statusFilter === "all") setStatusFilter("pending");
    else if (statusFilter === "pending") setStatusFilter("verified");
    else if (statusFilter === "verified") setStatusFilter("fraud");
    else setStatusFilter("all");
    setPage(1);
  };

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

  // Fetch overall status stats for KPI cards using count queries
  const fetchStats = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585";
      const token = getStoredToken();
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      const [resP, resV, resF] = await Promise.all([
        fetch(`${apiUrl}/api/v1/orders?slip_verification_status=pending&page_size=1`, { headers }),
        fetch(`${apiUrl}/api/v1/orders?slip_verification_status=verified&page_size=1`, { headers }),
        fetch(`${apiUrl}/api/v1/orders?slip_verification_status=fraud&page_size=1`, { headers }),
      ]);

      const [dataP, dataV, dataF] = await Promise.all([
        resP.ok ? resP.json() : Promise.resolve({ total: 0 }),
        resV.ok ? resV.json() : Promise.resolve({ total: 0 }),
        resF.ok ? resF.json() : Promise.resolve({ total: 0 }),
      ]);

      setStatsCounts({
        pending: dataP.total || 0,
        verified: dataV.total || 0,
        fraud: dataF.total || 0,
      });
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  // Fetch paginated & filtered orders from Backend API
  const fetchOrders = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585";
      const token = getStoredToken();

      const queryParams = new URLSearchParams();
      queryParams.append("page", page.toString());
      queryParams.append("page_size", pageSize.toString());
      queryParams.append("sort", dateSort === "asc" ? "date_asc" : "date_desc");

      if (statusFilter !== "all") {
        queryParams.append("slip_verification_status", statusFilter);
      }
      if (paymentMethodFilter !== "all") {
        queryParams.append("payment_method", paymentMethodFilter);
      }
      if (search.trim()) {
        queryParams.append("search", search.trim());
      }

      const res = await fetch(`${apiUrl}/api/v1/orders?${queryParams.toString()}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        const json = await res.json();
        const rawOrders = json.data || [];
        setTotalOrders(json.total || 0);

        const mapped: SlipOrderItem[] = rawOrders.map((o: any) => {
          let channel: "ออนไลน์" | "หน้าร้าน" | "Nisit Shop" = "หน้าร้าน";
          if (o.method === "online") channel = "ออนไลน์";
          else if (o.method === "nisit-shop") channel = "Nisit Shop";

          const paymentMethod: PaymentMethod = (o.payment_method === "promptpay" || o.payment_method === "promptpay_qr") ? "promptpay_qr" : "cash";

          let paymentStatus: PaymentVerificationStatus = "pending";
          if (o.slip_verification_status === "verified" || o.slip_verification_status === "fraud") {
            paymentStatus = o.slip_verification_status;
          }

          const itemsSummary = o.order_items && o.order_items.length > 0
            ? o.order_items.map((item: any) => {
              const pName = item.product?.name_th || "สินค้า";
              const sweet = item.sweetness_level ? ` (${item.sweetness_level})` : "";
              return `${pName}${sweet} x${item.quantity}`;
            }).join(", ")
            : "ไม่ระบุรายการ";

          const itemsDetail = o.order_items && o.order_items.length > 0
            ? o.order_items.map((item: any) => {
              const pName = item.product?.name_th || item.product_name || "สินค้า";
              const sweet = item.sweetness_level || undefined;
              const toppings = (item.order_item_toppings || item.toppings || [])
                .map((t: any) => t.topping?.name_th || t.name_th || t.topping_name || t.name)
                .filter(Boolean);
              return {
                productName: pName,
                sweetness: sweet,
                quantity: item.quantity || 1,
                toppings,
              };
            })
            : undefined;

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
            slipImageUrl: o.slip_url
              ? o.slip_url.startsWith("http")
                ? o.slip_url
                : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585"}${o.slip_url.startsWith("/") ? "" : "/"}${o.slip_url}`
              : undefined,
            itemsSummary,
            itemsDetail,
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
    fetchStats();
  }, [page, pageSize, dateSort, statusFilter, paymentMethodFilter, search]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrders();
      fetchStats();
    }, 10000);
    return () => clearInterval(interval);
  }, [page, pageSize, dateSort, statusFilter, paymentMethodFilter, search]);

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

  const totalPages = Math.ceil(totalOrders / pageSize) || 1;
  const paginatedOrders = orders;

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
  // Upload slip for existing order (using FormData to POST /api/v1/upload then PUT /api/v1/orders/:id)
  const handleUploadSlip = async (orderId: number, file: File) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585";
      const token = getStoredToken();
      const authHeader: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      // 1. Construct custom filename DDMMYYYY-QueueNumber.jpg
      const targetOrder = orders.find((o) => o.id === orderId);
      const queueNoStr = targetOrder?.queueNo || `ORDER${orderId}`;
      const now = new Date();
      const dd = String(now.getDate()).padStart(2, "0");
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const yyyy = now.getFullYear();
      const customFilename = `${dd}${mm}${yyyy}-${queueNoStr}.jpg`;

      // 2. Upload file via FormData
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "slips");
      formData.append("custom_filename", customFilename);

      const uploadRes = await fetch(`${apiUrl}/api/v1/upload`, {
        method: "POST",
        headers: {
          ...authHeader,
        },
        body: formData,
      });

      if (!uploadRes.ok) {
        const errJson = await uploadRes.json().catch(() => ({}));
        toastError(errJson.error || "ไม่สามารถอัพโหลดไฟล์รูปภาพได้", "เกิดข้อผิดพลาด");
        return;
      }

      const uploadData = await uploadRes.json();
      const rawUrl: string = uploadData.url || "";
      const fullImageUrl = rawUrl
        ? rawUrl.startsWith("http")
          ? rawUrl
          : `${apiUrl}${rawUrl.startsWith("/") ? "" : "/"}${rawUrl}`
        : "";

      // 2. Update order slip_url with saved image URL
      const updateRes = await fetch(`${apiUrl}/api/v1/orders/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
        },
        body: JSON.stringify({
          slip_url: rawUrl,
        }),
      });

      if (updateRes.ok) {
        success("อัพโหลดรูปภาพสลิป/หลักฐานเรียบร้อยแล้ว", "บันทึกสำเร็จ");
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, slipImageUrl: fullImageUrl } : o))
        );
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder((prev) => (prev ? { ...prev, slipImageUrl: fullImageUrl } : null));
        }
        fetchOrders();
      } else {
        toastError("ไม่สามารถอัพเดตสลิปของออเดอร์ได้", "เกิดข้อผิดพลาด");
      }
    } catch (err) {
      console.error("Failed to upload slip:", err);
      toastError("เกิดข้อผิดพลาดในการส่งข้อมูลสลิป", "เกิดข้อผิดพลาด");
    }
  };

  // Count stats
  const pendingCount = statsCounts.pending;
  const verifiedCount = statsCounts.verified;
  const fraudCount = statsCounts.fraud;

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
                <option value="all">ทั้งหมด ({orders.length})</option>
                <option value="pending">รอตรวจสอบ ({pendingCount})</option>
                <option value="verified">ยืนยันแล้ว ({verifiedCount})</option>
                <option value="fraud">สลิปไม่ถูกต้อง ({fraudCount})</option>
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

          {/* Desktop / Tablet: Table View */}
          <div className="admin-table-view" style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem", tableLayout: "fixed" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(50, 55, 65, 0.12)", color: "var(--ink)", fontSize: "0.825rem" }}>
                  {/* วันที่ (Sortable: ASC / DESC with icon) */}
                  <th
                    onClick={handleToggleDateSort}
                    style={{ width: "14%", padding: "0.75rem 0.6rem", cursor: "pointer", userSelect: "none" }}
                    title="กดเพื่อสลับเรียงลำดับวันที่ (ล่าสุด ↔ เก่าสุด)"
                  >
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                      <span>วันที่</span>
                      {dateSort === "desc" ? (
                        <ArrowDown size={13} style={{ color: "var(--teal)" }} />
                      ) : (
                        <ArrowUp size={13} style={{ color: "var(--teal)" }} />
                      )}
                    </div>
                  </th>

                  <th style={{ width: "12%", padding: "0.75rem 0.6rem" }}>หมายเลขคิว</th>

                  {/* วิธีชำระ (Filterable: ทั้งหมด ↔ พร้อมเพย์ QR ↔ เงินสด) */}
                  <th
                    onClick={handleCyclePaymentMethod}
                    style={{ width: "15%", padding: "0.75rem 0.6rem", cursor: "pointer", userSelect: "none" }}
                    title="กดเพื่อสลับกรองวิธีชำระ (ทั้งหมด ↔ พร้อมเพย์ QR ↔ เงินสด)"
                  >
                    <span>วิธีชำระ</span>
                  </th>

                  <th style={{ width: "12%", padding: "0.75rem 0.6rem" }}>ตรวจสอบ</th>

                  {/* สถานะตรวจสอบ (Filterable: ทั้งหมด ↔ รอตรวจสอบ ↔ ยืนยันแล้ว ↔ เนียนเลยนะครับ) */}
                  <th
                    onClick={handleCycleStatusFilter}
                    style={{ width: "17%", padding: "0.75rem 0.6rem", cursor: "pointer", userSelect: "none" }}
                    title="กดเพื่อสลับกรองสถานะตรวจสอบ (ทั้งหมด ↔ รอตรวจสอบ ↔ ยืนยันแล้ว ↔ เนียนเลยนะครับ)"
                  >
                    <span>สถานะตรวจสอบ</span>
                  </th>

                  <th style={{ width: "15%", padding: "0.75rem 0.6rem" }}>วันที่ตรวจสอบ</th>
                  <th style={{ width: "15%", padding: "0.75rem 0.6rem" }}>ผู้ตรวจสอบ</th>
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

                      {/* ผู้ตรวจสอบ */}
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

          {/* Mobile / Narrow Screen: Card View */}
          <div className="admin-cards-view">
            {paginatedOrders.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: "var(--ink-soft)" }}>
                ไม่พบข้อมูลรายการชำระเงินตามเงื่อนไขที่ระบุ
              </div>
            ) : (
              paginatedOrders.map((order) => {
                const isPending = order.paymentStatus === "pending";
                const isVerified = order.paymentStatus === "verified";
                const isFraud = order.paymentStatus === "fraud";

                return (
                  <div
                    key={order.id}
                    style={{
                      backgroundColor: "var(--cream)",
                      border: "1px solid rgba(50, 55, 65, 0.1)",
                      borderRadius: "0.75rem",
                      padding: "0.95rem 1rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.65rem",
                    }}
                  >
                    {/* Top Header Row: Queue No & Date (Left), Status Badge & Method (Right) */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <span style={{ fontWeight: 800, fontSize: "1.4rem", color: "var(--ink)", lineHeight: 1.1, display: "block" }}>
                          คิว {order.queueNo}
                        </span>
                        <div style={{ fontSize: "0.775rem", color: "var(--ink-soft)", marginTop: "3px" }}>
                          {renderFormattedDate(order.createdAtRaw || order.orderedAt)}
                        </div>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.35rem" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.3rem",
                            borderRadius: "9999px",
                            padding: "0.3rem 0.75rem",
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
                          {isPending && <Clock size={13} />}
                          {isVerified && <CheckCircle2 size={13} />}
                          {isFraud && <AlertTriangle size={13} />}
                          <span>{isPending ? "ยังไม่ได้ยืนยัน" : isVerified ? "ยืนยันแล้ว" : "เนียนเลยนะครับ"}</span>
                        </span>

                        <span style={{ fontSize: "0.8rem", color: "var(--ink-soft)", display: "flex", alignItems: "center", gap: "0.3rem", fontWeight: 600 }}>
                          {order.paymentMethod === "promptpay_qr" ? (
                            <>
                              <QrCode size={14} color="var(--teal)" />
                              <span>พร้อมเพย์ QR</span>
                            </>
                          ) : (
                            <>
                              <Banknote size={14} color="#b45309" />
                              <span>เงินสด</span>
                            </>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Info Section: Customer (if not 'ลูกค้าหน้าร้าน'), Inspector & Verification Date */}
                    <div style={{ fontSize: "0.825rem", color: "var(--ink)", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                      {order.customerName && order.customerName !== "ลูกค้าหน้าร้าน" && (
                        <div><strong>ลูกค้า:</strong> {order.customerName} {order.customerPhone ? `(${order.customerPhone})` : ""}</div>
                      )}

                      {/* ผู้ตรวจสอบ & วันที่ตรวจสอบ (แสดงเฉพาะเมื่อยืนยันแล้ว และแสดงแยกคนละบรรทัด) */}
                      {isVerified && (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.2rem",
                            backgroundColor: "rgba(50, 55, 65, 0.04)",
                            padding: "0.45rem 0.65rem",
                            borderRadius: "0.5rem",
                            fontSize: "0.775rem",
                            color: "var(--ink-soft)",
                            marginTop: "2px",
                          }}
                        >
                          <div>
                            <strong>ผู้ตรวจสอบ:</strong> <span style={{ color: "var(--ink)", fontWeight: 600 }}>{order.verifiedByName || "-"}</span>
                          </div>
                          <div>
                            <strong>วันที่ตรวจสอบ:</strong> <span className="font-mono" style={{ color: "var(--ink)" }}>{order.slipVerifiedAt ? (order.slipVerifiedAt.includes("T") ? order.slipVerifiedAt.split("T")[0] + " " + order.slipVerifiedAt.split("T")[1]?.substring(0, 8) : order.slipVerifiedAt) : "-"}</span>
                          </div>
                        </div>
                      )}

                      {isFraud && order.statusNote && (
                        <div style={{ fontSize: "0.775rem", color: "#b91c1c", marginTop: "2px" }}>
                          <strong>เหตุผล:</strong> {order.statusNote}
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Row */}
                    <div
                      style={{
                        paddingTop: "0.4rem",
                        borderTop: "1px dashed rgba(50, 55, 65, 0.1)",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(order)}
                        style={{
                          width: "100%",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.35rem",
                          borderRadius: "0.6rem",
                          backgroundColor: "var(--teal)",
                          color: "#fff",
                          border: "none",
                          padding: "0.55rem 0.85rem",
                          fontSize: "0.85rem",
                          fontWeight: 700,
                          cursor: "pointer",
                          boxShadow: "0 2px 8px rgba(75, 155, 140, 0.2)",
                        }}
                      >
                        <span>ตรวจสอบหลักฐาน</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
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
                แสดงหน้า {page} จาก {totalPages} (ทั้งหมด {totalOrders} รายการ)
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
          onUploadSlip={handleUploadSlip}
        />
      )}
    </div>
  );
}
