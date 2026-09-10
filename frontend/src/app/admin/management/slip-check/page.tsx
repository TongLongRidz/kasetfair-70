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
  CreditCard,
  Banknote,
  ExternalLink,
  ShieldCheck,
  X,
  Sparkles,
  MoreVertical,
  Check,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";

export type PaymentVerificationStatus = "verified" | "pending" | "fraud";
export type PaymentMethod = "promptpay_qr" | "cash";

export interface SlipOrderItem {
  id: number;
  orderNo: string;
  queueNo: string;
  customerName: string;
  customerPhone?: string;
  channel: "ออนไลน์" | "หน้าร้าน";
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentVerificationStatus;
  statusNote?: string;
  orderedAt: string;
  slipImageUrl?: string;
  cashImageUrl?: string;
  itemsSummary: string;
}

const INITIAL_SLIP_ORDERS: SlipOrderItem[] = [
  {
    id: 1,
    orderNo: "TT-1042",
    queueNo: "B021",
    customerName: "คุณฟ้า",
    customerPhone: "081-234-5678",
    channel: "ออนไลน์",
    total: 185,
    paymentMethod: "promptpay_qr",
    paymentStatus: "pending",
    orderedAt: "13:42 น.",
    slipImageUrl: "/images/hero-soy.jpg",
    itemsSummary: "น้ำเต้าหู้มัทฉะ (หวาน 50% + Boba) x2, น้ำเต้าหู้ชาไทย x1",
  },
  {
    id: 2,
    orderNo: "TT-1041",
    queueNo: "W008",
    customerName: "คุณเบียร์",
    customerPhone: "089-987-6543",
    channel: "หน้าร้าน",
    total: 120,
    paymentMethod: "cash",
    paymentStatus: "verified",
    orderedAt: "13:38 น.",
    cashImageUrl: "/images/hero-soy.jpg",
    itemsSummary: "น้ำเต้าหู้ดั้งเดิม (หวาน 25% + เฉาก๊วย) x2",
  },
  {
    id: 3,
    orderNo: "TT-1040",
    queueNo: "B020",
    customerName: "คุณแนน",
    customerPhone: "086-555-4321",
    channel: "ออนไลน์",
    total: 240,
    paymentMethod: "promptpay_qr",
    paymentStatus: "verified",
    orderedAt: "13:30 น.",
    slipImageUrl: "/images/hero-soy.jpg",
    itemsSummary: "เซ็ตคอมโบ 2 แก้ว + ท็อปปิ้ง x2",
  },
  {
    id: 4,
    orderNo: "TT-1039",
    queueNo: "W007",
    customerName: "คุณโอ๊ต",
    customerPhone: "092-111-2233",
    channel: "หน้าร้าน",
    total: 90,
    paymentMethod: "promptpay_qr",
    paymentStatus: "fraud",
    statusNote: "สลิปตัดต่อ เวลาไม่ตรงกับยอดเงินในระบบธนาคาร",
    orderedAt: "13:22 น.",
    slipImageUrl: "/images/hero-soy.jpg",
    itemsSummary: "น้ำเต้าหู้โกโก้ x2",
  },
  {
    id: 5,
    orderNo: "TT-1038",
    queueNo: "B019",
    customerName: "คุณปอ",
    customerPhone: "084-333-8899",
    channel: "ออนไลน์",
    total: 310,
    paymentMethod: "promptpay_qr",
    paymentStatus: "pending",
    orderedAt: "13:15 น.",
    slipImageUrl: "/images/hero-soy.jpg",
    itemsSummary: "น้ำเต้าหู้ 5 รสชาติ x1, ท็อปปิ้งแยก x3",
  },
  {
    id: 6,
    orderNo: "TT-1037",
    queueNo: "B018",
    customerName: "คุณกานต์",
    customerPhone: "087-444-5566",
    channel: "ออนไลน์",
    total: 150,
    paymentMethod: "promptpay_qr",
    paymentStatus: "verified",
    orderedAt: "13:05 น.",
    slipImageUrl: "/images/hero-soy.jpg",
    itemsSummary: "น้ำเต้าหู้ดั้งเดิม x3",
  },
  {
    id: 7,
    orderNo: "TT-1036",
    queueNo: "W006",
    customerName: "คุณมุก",
    customerPhone: "083-777-9911",
    channel: "หน้าร้าน",
    total: 70,
    paymentMethod: "cash",
    paymentStatus: "verified",
    orderedAt: "12:50 น.",
    cashImageUrl: "/images/hero-soy.jpg",
    itemsSummary: "น้ำเต้าหู้มัทฉะ x1",
  },
  {
    id: 8,
    orderNo: "TT-1035",
    queueNo: "B017",
    customerName: "คุณนพ",
    customerPhone: "082-888-0022",
    channel: "ออนไลน์",
    total: 260,
    paymentMethod: "promptpay_qr",
    paymentStatus: "fraud",
    statusNote: "ใช้สลิปเก่าของเมื่อวานมาแนบใหม่",
    orderedAt: "12:44 น.",
    slipImageUrl: "/images/hero-soy.jpg",
    itemsSummary: "น้ำเต้าหู้ชาไทย + ไข่มุก x4",
  },
  {
    id: 9,
    orderNo: "TT-1034",
    queueNo: "W005",
    customerName: "คุณบอย",
    customerPhone: "095-666-3344",
    channel: "หน้าร้าน",
    total: 135,
    paymentMethod: "cash",
    paymentStatus: "verified",
    orderedAt: "12:30 น.",
    cashImageUrl: "/images/hero-soy.jpg",
    itemsSummary: "น้ำเต้าหู้ถั่วแดง x2, สาคู x1",
  },
  {
    id: 10,
    orderNo: "TT-1033",
    queueNo: "B016",
    customerName: "คุณแพร",
    customerPhone: "080-123-9988",
    channel: "ออนไลน์",
    total: 195,
    paymentMethod: "promptpay_qr",
    paymentStatus: "verified",
    orderedAt: "12:15 น.",
    slipImageUrl: "/images/hero-soy.jpg",
    itemsSummary: "น้ำเต้าหู้ชมพูนมเย็น x3",
  },
];

export default function SlipCheckManagementPage() {
  const { success, error: toastError, info, warning } = useToast();
  const [orders, setOrders] = useState<SlipOrderItem[]>(INITIAL_SLIP_ORDERS);
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
  const handleSetStatus = (orderId: number, status: PaymentVerificationStatus, note?: string) => {
    const target = orders.find((o) => o.id === orderId);
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

        {/* Main Table Container (Dashboard Style) */}
        <section
          style={{
            marginTop: "1.5rem",
            borderRadius: "1.25rem",
            backgroundColor: "var(--card)",
            padding: "1.5rem",
            border: "1px solid rgba(50, 55, 65, 0.1)",
            boxShadow: "0 4px 20px -2px rgba(0,0,0,0.03)",
          }}
        >
          {/* Top of Table: Status Summary Cards (Dashboard KPI Card Style) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1rem",
              marginBottom: "1.25rem",
              paddingBottom: "1.25rem",
              borderBottom: "1px solid rgba(50, 55, 65, 0.08)",
            }}
          >
            {/* Card 1: ยังไม่ได้ยืนยัน */}
            <div
              className="animate-rise"
              onClick={() => {
                setStatusFilter(statusFilter === "pending" ? "all" : "pending");
                setPage(1);
              }}
              style={{
                borderRadius: "1.25rem",
                backgroundColor: statusFilter === "pending" ? "rgba(239, 68, 68, 0.08)" : "var(--card)",
                padding: "1.25rem",
                border: statusFilter === "pending" ? "2px solid #ef4444" : "1px solid rgba(50, 55, 65, 0.1)",
                boxShadow: "0 4px 16px -2px rgba(0,0,0,0.03)",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <p style={{ fontSize: "0.875rem", color: "var(--ink-soft)", fontWeight: 500, margin: 0 }}>
                ยังไม่ได้ยืนยัน
              </p>
              <p
                style={{
                  marginTop: "0.35rem",
                  marginBottom: 0,
                  fontSize: "1.75rem",
                  fontWeight: 700,
                  fontFamily: "'Kanit', sans-serif",
                  color: "var(--ink)",
                  letterSpacing: "-0.01em",
                  lineHeight: 1.15,
                }}
              >
                {pendingCount}
              </p>
              <p style={{ marginTop: "0.25rem", marginBottom: 0, fontSize: "0.75rem", color: "var(--ink-soft)" }}>
                รอตรวจสอบสลิป / เงินสด
              </p>
            </div>

            {/* Card 2: ยืนยันแล้ว */}
            <div
              className="animate-rise"
              onClick={() => {
                setStatusFilter(statusFilter === "verified" ? "all" : "verified");
                setPage(1);
              }}
              style={{
                borderRadius: "1.25rem",
                backgroundColor: statusFilter === "verified" ? "rgba(34, 197, 94, 0.08)" : "var(--card)",
                padding: "1.25rem",
                border: statusFilter === "verified" ? "2px solid #22c55e" : "1px solid rgba(50, 55, 65, 0.1)",
                boxShadow: "0 4px 16px -2px rgba(0,0,0,0.03)",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <p style={{ fontSize: "0.875rem", color: "var(--ink-soft)", fontWeight: 500, margin: 0 }}>
                ยืนยันแล้ว
              </p>
              <p
                style={{
                  marginTop: "0.35rem",
                  marginBottom: 0,
                  fontSize: "1.75rem",
                  fontWeight: 700,
                  fontFamily: "'Kanit', sans-serif",
                  color: "var(--ink)",
                  letterSpacing: "-0.01em",
                  lineHeight: 1.15,
                }}
              >
                {verifiedCount}
              </p>
              <p style={{ marginTop: "0.25rem", marginBottom: 0, fontSize: "0.75rem", color: "var(--ink-soft)" }}>
                ชำระเงินถูกต้อง พร้อมทำเครื่องดื่ม
              </p>
            </div>

            {/* Card 3: เนียนเลยนะครับ */}
            <div
              className="animate-rise"
              onClick={() => {
                setStatusFilter(statusFilter === "fraud" ? "all" : "fraud");
                setPage(1);
              }}
              style={{
                borderRadius: "1.25rem",
                backgroundColor: statusFilter === "fraud" ? "rgba(185, 28, 28, 0.08)" : "var(--card)",
                padding: "1.25rem",
                border: statusFilter === "fraud" ? "2px solid #991b1b" : "1px solid rgba(50, 55, 65, 0.1)",
                boxShadow: "0 4px 16px -2px rgba(0,0,0,0.03)",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <p style={{ fontSize: "0.875rem", color: "var(--ink-soft)", fontWeight: 500, margin: 0 }}>
                เนียนเลยนะครับ
              </p>
              <p
                style={{
                  marginTop: "0.35rem",
                  marginBottom: 0,
                  fontSize: "1.75rem",
                  fontWeight: 700,
                  fontFamily: "'Kanit', sans-serif",
                  color: "var(--ink)",
                  letterSpacing: "-0.01em",
                  lineHeight: 1.15,
                }}
              >
                {fraudCount}
              </p>
              <p style={{ marginTop: "0.25rem", marginBottom: 0, fontSize: "0.75rem", color: "var(--ink-soft)" }}>
                สลิปไม่ถูกต้อง / ปฏิเสธรายการ
              </p>
            </div>
          </div>

          {/* Controls Bar: Filter Tabs & Search / Sort */}
          <div className="admin-controls-bar">
            {/* Filter Tabs (Desktop) */}
            <div className="admin-filter-tabs">
              {[
                { id: "all", label: "ทั้งหมด" },
                { id: "pending", label: "รอตรวจสอบ" },
                { id: "verified", label: "ยืนยันแล้ว" },
                { id: "fraud", label: "สลิปไม่ถูกต้อง" },
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
                <option value="all">สถานะ: ทั้งหมด</option>
                <option value="pending">สถานะ: รอตรวจสอบ</option>
                <option value="verified">สถานะ: ยืนยันแล้ว</option>
                <option value="fraud">สถานะ: สลิปไม่ถูกต้อง</option>
              </select>
            </div>

            {/* Search & Sort */}
            <div className="admin-search-wrapper">
              {/* Search */}
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

              {/* Sort */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                <ArrowUpDown size={15} color="var(--ink-soft)" />
                <select
                  value={sortOrder}
                  onChange={(e) => {
                    setSortOrder(e.target.value as any);
                    setPage(1);
                  }}
                  style={{
                    padding: "0.45rem 0.75rem",
                    borderRadius: "0.6rem",
                    fontSize: "0.825rem",
                    fontFamily: "'Kanit', sans-serif",
                    backgroundColor: "var(--cream)",
                    border: "1px solid rgba(50, 55, 65, 0.12)",
                    color: "var(--ink)",
                    cursor: "pointer",
                    outline: "none",
                  }}
                >
                  <option value="latest">ล่าสุด</option>
                  <option value="oldest">เก่าสุด</option>
                  <option value="amount_high">ยอดเงิน (มาก → น้อย)</option>
                  <option value="amount_low">ยอดเงิน (น้อย → มาก)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: "visible" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(50, 55, 65, 0.12)", color: "var(--ink-soft)", fontSize: "0.8rem" }}>
                  <th style={{ padding: "0.75rem 0.6rem" }}>เลขที่ออเดอร์</th>
                  <th style={{ padding: "0.75rem 0.6rem" }}>คิว</th>
                  <th style={{ padding: "0.75rem 0.6rem" }}>ลูกค้า / เบอร์โทร</th>
                  <th style={{ padding: "0.75rem 0.6rem" }}>ช่องทาง</th>
                  <th style={{ padding: "0.75rem 0.6rem" }}>วิธีชำระ</th>
                  <th style={{ padding: "0.75rem 0.6rem" }}>ยอดเงิน</th>
                  <th style={{ padding: "0.75rem 0.6rem" }}>หลักฐาน</th>
                  <th style={{ padding: "0.75rem 0.6rem" }}>สถานะตรวจสอบ</th>
                  <th style={{ padding: "0.75rem 0.6rem", width: "45px" }}></th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.map((order) => {
                  const isPending = order.paymentStatus === "pending";
                  const isVerified = order.paymentStatus === "verified";
                  const isFraud = order.paymentStatus === "fraud";
                  const isKebabOpen = activeKebabId === order.id;

                  return (
                    <tr
                      key={order.id}
                      style={{
                        borderBottom: "1px solid rgba(50, 55, 65, 0.06)",
                        transition: "background-color 0.15s ease",
                        position: isKebabOpen ? "relative" : "static",
                        zIndex: isKebabOpen ? 50 : 1,
                      }}
                    >
                      <td className="font-mono" style={{ padding: "0.85rem 0.6rem", fontSize: "0.825rem", fontWeight: 600 }}>
                        {order.orderNo}
                        <span style={{ display: "block", fontSize: "0.7rem", color: "var(--ink-soft)", fontWeight: 400 }}>
                          {order.orderedAt}
                        </span>
                      </td>
                      <td style={{ padding: "0.85rem 0.6rem", fontWeight: 800, fontSize: "1rem", color: "var(--ink)" }}>
                        {order.queueNo}
                      </td>
                      <td style={{ padding: "0.85rem 0.6rem" }}>
                        <span style={{ fontWeight: 600, color: "var(--ink)", display: "block" }}>{order.customerName}</span>
                        <span className="font-mono" style={{ fontSize: "0.75rem", color: "var(--ink-soft)" }}>
                          {order.customerPhone || "-"}
                        </span>
                      </td>
                      <td style={{ padding: "0.85rem 0.6rem" }}>
                        <span
                          style={{
                            fontWeight: 600,
                            color: order.channel === "ออนไลน์" ? "var(--teal)" : "var(--ink)",
                          }}
                        >
                          {order.channel}
                        </span>
                      </td>
                      <td style={{ padding: "0.85rem 0.6rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.8rem" }}>
                          {order.paymentMethod === "promptpay_qr" ? (
                            <>
                              <CreditCard size={15} color="var(--teal)" />
                              <span>QR PromptPay</span>
                            </>
                          ) : (
                            <>
                              <Banknote size={15} color="#b45309" />
                              <span>เงินสด</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: "0.85rem 0.6rem", fontWeight: 800, fontSize: "1rem", color: "var(--ink)" }}>
                        ฿{order.total}
                      </td>
                      {/* View Evidence / Slip Button */}
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
                          <FileImage size={14} color="var(--teal)" />
                          <span>ดูสลิป/รูป</span>
                        </button>
                      </td>

                      {/* Status Tag */}
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

                      {/* Status Action: Kebab Menu */}
                      <td style={{ padding: "0.85rem 0.6rem", textAlign: "right", position: isKebabOpen ? "relative" : "static", zIndex: isKebabOpen ? 50 : 1 }}>
                        <div className="kebab-container" style={{ position: "relative", display: "inline-block" }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveKebabId(activeKebabId === order.id ? null : order.id);
                            }}
                            title="จัดการสถานะ"
                            style={{
                              width: "2.25rem",
                              height: "2.25rem",
                              borderRadius: "0.6rem",
                              border: "1px solid rgba(50, 55, 65, 0.12)",
                              backgroundColor: activeKebabId === order.id ? "var(--ink)" : "var(--cream)",
                              color: activeKebabId === order.id ? "var(--cream)" : "var(--ink)",
                              display: "grid",
                              placeItems: "center",
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                            }}
                          >
                            <MoreVertical size={16} />
                          </button>

                          {/* Kebab Dropdown Menu */}
                          {activeKebabId === order.id && (
                            <div
                              className="animate-rise"
                              style={{
                                position: "absolute",
                                right: 0,
                                top: "2.5rem",
                                zIndex: 60,
                                width: "180px",
                                backgroundColor: "var(--card)",
                                borderRadius: "0.85rem",
                                border: "1px solid rgba(50, 55, 65, 0.12)",
                                boxShadow: "0 10px 25px -3px rgba(0, 0, 0, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                                padding: "0.4rem",
                                display: "flex",
                                flexDirection: "column",
                                gap: "0.25rem",
                                textAlign: "left",
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div style={{ padding: "0.35rem 0.5rem 0.2rem 0.5rem", borderBottom: "1px solid rgba(50, 55, 65, 0.08)", marginBottom: "0.2rem" }}>
                                <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
                                  เปลี่ยนสถานะ
                                </p>
                              </div>

                              {/* Option 1: ยืนยันแล้ว */}
                              <button
                                type="button"
                                onClick={() => {
                                  handleSetStatus(order.id, "verified");
                                  setActiveKebabId(null);
                                }}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  width: "100%",
                                  padding: "0.5rem 0.65rem",
                                  borderRadius: "0.5rem",
                                  border: "none",
                                  backgroundColor: isVerified ? "rgba(34, 197, 94, 0.12)" : "transparent",
                                  color: "#16a34a",
                                  fontSize: "0.8rem",
                                  fontWeight: 600,
                                  fontFamily: "'Kanit', sans-serif",
                                  cursor: "pointer",
                                  textAlign: "left",
                                  transition: "background-color 0.1s ease",
                                }}
                                onMouseEnter={(e) => {
                                  if (!isVerified) (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(34, 197, 94, 0.08)";
                                }}
                                onMouseLeave={(e) => {
                                  if (!isVerified) (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                                  <CheckCircle2 size={15} />
                                  <span>ยืนยันแล้ว</span>
                                </div>
                                {isVerified && <Check size={14} />}
                              </button>

                              {/* Option 2: ยังไม่ได้ยืนยัน */}
                              <button
                                type="button"
                                onClick={() => {
                                  handleSetStatus(order.id, "pending");
                                  setActiveKebabId(null);
                                }}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  width: "100%",
                                  padding: "0.5rem 0.65rem",
                                  borderRadius: "0.5rem",
                                  border: "none",
                                  backgroundColor: isPending ? "rgba(239, 68, 68, 0.12)" : "transparent",
                                  color: "#dc2626",
                                  fontSize: "0.8rem",
                                  fontWeight: 600,
                                  fontFamily: "'Kanit', sans-serif",
                                  cursor: "pointer",
                                  textAlign: "left",
                                  transition: "background-color 0.1s ease",
                                }}
                                onMouseEnter={(e) => {
                                  if (!isPending) (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(239, 68, 68, 0.08)";
                                }}
                                onMouseLeave={(e) => {
                                  if (!isPending) (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                                  <Clock size={15} />
                                  <span>ยังไม่ได้ยืนยัน</span>
                                </div>
                                {isPending && <Check size={14} />}
                              </button>

                              {/* Option 3: เนียนเลยนะครับ */}
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveKebabId(null);
                                  handleOpenFraudReasonModal(order);
                                }}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  width: "100%",
                                  padding: "0.5rem 0.65rem",
                                  borderRadius: "0.5rem",
                                  border: "none",
                                  backgroundColor: isFraud ? "rgba(185, 28, 28, 0.12)" : "transparent",
                                  color: "#991b1b",
                                  fontSize: "0.8rem",
                                  fontWeight: 600,
                                  fontFamily: "'Kanit', sans-serif",
                                  cursor: "pointer",
                                  textAlign: "left",
                                  transition: "background-color 0.1s ease",
                                }}
                                onMouseEnter={(e) => {
                                  if (!isFraud) (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(185, 28, 28, 0.08)";
                                }}
                                onMouseLeave={(e) => {
                                  if (!isFraud) (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                                  <AlertTriangle size={15} />
                                  <span>เนียนเลยนะครับ</span>
                                </div>
                                {isFraud && <Check size={14} />}
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {paginatedOrders.length === 0 && (
                  <tr>
                    <td colSpan={9} style={{ textAlign: "center", padding: "2.5rem 0", color: "var(--ink-soft)" }}>
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
        <div
          className="animate-fade-in"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            backgroundColor: "rgba(0, 0, 0, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem",
          }}
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="animate-rise"
            style={{
              width: "100%",
              maxWidth: "580px",
              backgroundColor: "var(--card)",
              borderRadius: "1.5rem",
              padding: "1.75rem",
              boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
              border: "1px solid rgba(50, 55, 65, 0.12)",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span
                    className="font-mono"
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      backgroundColor: "var(--cream)",
                      padding: "0.2rem 0.5rem",
                      borderRadius: "0.4rem",
                    }}
                  >
                    {selectedOrder.orderNo}
                  </span>
                  <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--teal)" }}>
                    คิว {selectedOrder.queueNo}
                  </span>
                </div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--ink)", marginTop: "0.35rem" }}>
                  ตรวจสอบหลักฐานการชำระเงิน
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                style={{
                  width: "2rem",
                  height: "2rem",
                  borderRadius: "50%",
                  border: "none",
                  backgroundColor: "var(--cream)",
                  color: "var(--ink-soft)",
                  display: "grid",
                  placeItems: "center",
                  cursor: "pointer",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Order Info & Total */}
            <div
              style={{
                backgroundColor: "var(--cream)",
                borderRadius: "1rem",
                padding: "1rem",
                marginBottom: "1.25rem",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.75rem",
                fontSize: "0.85rem",
              }}
            >
              <div>
                <span style={{ color: "var(--ink-soft)", fontSize: "0.75rem" }}>ลูกค้า</span>
                <p style={{ margin: 0, fontWeight: 700 }}>{selectedOrder.customerName}</p>
                <p className="font-mono" style={{ margin: 0, fontSize: "0.75rem", color: "var(--ink-soft)" }}>
                  {selectedOrder.customerPhone || "-"}
                </p>
              </div>

              <div>
                <span style={{ color: "var(--ink-soft)", fontSize: "0.75rem" }}>ยอดที่ต้องชำระ</span>
                <p className="font-display" style={{ margin: 0, fontSize: "1.4rem", color: "var(--teal)", lineHeight: 1.1 }}>
                  ฿{selectedOrder.total}
                </p>
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <span style={{ color: "var(--ink-soft)", fontSize: "0.75rem" }}>รายการสั่งซื้อ</span>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--ink)" }}>{selectedOrder.itemsSummary}</p>
              </div>
            </div>

            {/* Slip / Cash Evidence Preview Box */}
            <div style={{ marginBottom: "1.25rem" }}>
              <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--ink)", marginBottom: "0.5rem" }}>
                {selectedOrder.paymentMethod === "promptpay_qr"
                  ? "รูปภาพสลิปโอนเงิน (Slip Attached)"
                  : "รูปถ่ายเงินสด / ใบเสร็จหน้าร้าน"}
              </p>

              <div
                style={{
                  width: "100%",
                  height: "280px",
                  borderRadius: "1rem",
                  backgroundColor: "#f1f0ea",
                  border: "2px dashed rgba(50, 55, 65, 0.2)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Simulated Slip Visual */}
                <div
                  style={{
                    width: "200px",
                    backgroundColor: "#fff",
                    borderRadius: "0.75rem",
                    padding: "1rem",
                    boxShadow: "0 8px 25px rgba(0,0,0,0.1)",
                    textAlign: "center",
                    border: "1px solid rgba(0,0,0,0.08)",
                  }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      backgroundColor: "rgba(75, 155, 140, 0.15)",
                      color: "var(--teal)",
                      margin: "0 auto 0.5rem auto",
                      display: "grid",
                      placeItems: "center",
                      fontWeight: 800,
                    }}
                  >
                    ถ
                  </div>
                  <p style={{ fontSize: "0.75rem", fontWeight: 700, margin: 0 }}>สลิปโอนเงินสำเร็จ</p>
                  <p className="font-mono" style={{ fontSize: "0.65rem", color: "#666", margin: "2px 0 6px 0" }}>
                    {selectedOrder.orderedAt} · PromptPay
                  </p>
                  <p className="font-mono" style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--teal)", margin: "4px 0" }}>
                    ฿{selectedOrder.total}.00
                  </p>
                  <p style={{ fontSize: "0.65rem", color: "#888", margin: 0 }}>
                    ผู้รับ: ร้านถั่วทอง เกษตรแฟร์
                  </p>
                  <p className="font-mono" style={{ fontSize: "0.6rem", color: "#aaa", marginTop: "4px" }}>
                    Ref: {selectedOrder.orderNo}-98234
                  </p>
                </div>
              </div>
            </div>

            {/* Current Status and Fraud Reason Warning (if any) */}
            {selectedOrder.paymentStatus === "fraud" && selectedOrder.statusNote && (
              <div
                style={{
                  backgroundColor: "rgba(185, 28, 28, 0.1)",
                  border: "1px solid rgba(185, 28, 28, 0.3)",
                  borderRadius: "0.75rem",
                  padding: "0.75rem 1rem",
                  marginBottom: "1.25rem",
                  fontSize: "0.825rem",
                  color: "#991b1b",
                }}
              >
                <strong>ระบุข้อสงสัย / เหตุผลเนียน:</strong> {selectedOrder.statusNote}
              </div>
            )}

            {/* Change Status Action Buttons */}
            <div style={{ borderTop: "1px solid rgba(50, 55, 65, 0.1)", paddingTop: "1.25rem" }}>
              <p style={{ fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.6rem" }}>
                เปลี่ยนสถานะการตรวจสอบ:
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => {
                    handleSetStatus(selectedOrder.id, "verified");
                  }}
                  style={{
                    padding: "0.65rem",
                    borderRadius: "0.75rem",
                    backgroundColor: selectedOrder.paymentStatus === "verified" ? "#22c55e" : "rgba(34, 197, 94, 0.12)",
                    color: selectedOrder.paymentStatus === "verified" ? "#fff" : "#16a34a",
                    border: "1.5px solid #22c55e",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.3rem",
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>ยืนยันแล้ว</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleSetStatus(selectedOrder.id, "pending");
                  }}
                  style={{
                    padding: "0.65rem",
                    borderRadius: "0.75rem",
                    backgroundColor: selectedOrder.paymentStatus === "pending" ? "#ef4444" : "rgba(239, 68, 68, 0.12)",
                    color: selectedOrder.paymentStatus === "pending" ? "#fff" : "#dc2626",
                    border: "1.5px solid #ef4444",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.3rem",
                  }}
                >
                  <Clock size={16} />
                  <span>ยังไม่ยืนยัน</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleOpenFraudReasonModal(selectedOrder);
                  }}
                  style={{
                    padding: "0.65rem",
                    borderRadius: "0.75rem",
                    backgroundColor: selectedOrder.paymentStatus === "fraud" ? "#991b1b" : "rgba(185, 28, 28, 0.12)",
                    color: selectedOrder.paymentStatus === "fraud" ? "#fff" : "#991b1b",
                    border: "1.5px solid #991b1b",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.3rem",
                  }}
                >
                  <AlertTriangle size={16} />
                  <span>เนียนเลยนะครับ</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL 2: Fraud Reason Required Modal */}
      {isFraudModalOpen && fraudTargetOrder && (
        <div
          className="animate-fade-in"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 110,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem",
          }}
          onClick={() => setIsFraudModalOpen(false)}
        >
          <form
            onSubmit={handleConfirmFraud}
            className="animate-rise"
            style={{
              width: "100%",
              maxWidth: "460px",
              backgroundColor: "var(--card)",
              borderRadius: "1.5rem",
              padding: "1.75rem",
              boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
              border: "2px solid #b91c1c",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#b91c1c", marginBottom: "0.5rem" }}>
              <AlertTriangle size={24} />
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0 }}>
                ระบุเหตุผล (เนียนเลยนะครับ)
              </h3>
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)", marginBottom: "1rem" }}>
              ออเดอร์ <strong className="font-mono">{fraudTargetOrder.orderNo}</strong> (คิว {fraudTargetOrder.queueNo}) โดย {fraudTargetOrder.customerName}
            </p>

            <label style={{ display: "block", fontSize: "0.825rem", fontWeight: 700, marginBottom: "0.4rem" }}>
              กรุณาระบุเหตุผลที่ปฏิเสธสลิป / พบความผิดปกติ: <span style={{ color: "#b91c1c" }}>*</span>
            </label>
            <textarea
              required
              rows={3}
              value={fraudReason}
              onChange={(e) => setFraudReason(e.target.value)}
              placeholder="เช่น สลิปปลอม, ยอดเงินไม่เข้าบัญชี, ใช้สลิปเก่าซ้ำ, สลิปตัดต่อ..."
              style={{
                width: "100%",
                borderRadius: "0.75rem",
                backgroundColor: "var(--cream)",
                border: "1px solid rgba(50, 55, 65, 0.2)",
                padding: "0.75rem",
                fontSize: "0.875rem",
                fontFamily: "'Kanit', sans-serif",
                outline: "none",
                color: "var(--ink)",
                boxSizing: "border-box",
                marginBottom: "1.25rem",
              }}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
              <button
                type="button"
                onClick={() => setIsFraudModalOpen(false)}
                style={{
                  padding: "0.6rem 1rem",
                  borderRadius: "0.6rem",
                  backgroundColor: "var(--cream)",
                  border: "1px solid rgba(50, 55, 65, 0.15)",
                  color: "var(--ink)",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                }}
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                style={{
                  padding: "0.6rem 1.25rem",
                  borderRadius: "0.6rem",
                  backgroundColor: "#991b1b",
                  border: "none",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                }}
              >
                บันทึกสถานะเนียนเลยนะครับ
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
