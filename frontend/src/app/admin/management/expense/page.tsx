"use client";

import React, { useState, useEffect } from "react";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import { getStoredToken } from "@/lib/auth";
import { useToast } from "@/components/ui/toast";
import generatePayload from "promptpay-qr";
import QRCode from "qrcode";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  Trash2,
  Edit3,
  Search,
  QrCode,
  Save,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export interface CashTransactionItem {
  id: number;
  type: "income" | "expense";
  category: string;
  title: string;
  amount: number;
  date_time: string;
  note?: string;
  created_at?: string;
}

export default function AdminExpensePage() {
  const { success, error: toastError } = useToast();
  const [activeTab, setActiveTab] = useState<"records" | "qr_settings">("records");

  // Cash Transactions API State
  const [transactions, setTransactions] = useState<CashTransactionItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalIncome, setTotalIncome] = useState<number>(0);
  const [totalExpense, setTotalExpense] = useState<number>(0);
  const [netBalance, setNetBalance] = useState<number>(0);

  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateSort, setDateSort] = useState<"desc" | "asc">("desc");
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal State for Add/Edit Transaction
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formType, setFormType] = useState<"income" | "expense">("expense");
  const [formCategory, setFormCategory] = useState("วัตถุดิบ");
  const [formTitle, setFormTitle] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().substring(0, 16));
  const [formNote, setFormNote] = useState("");

  // PromptPay Settings State
  const [promptpayAccount, setPromptpayAccount] = useState("");
  const [promptpayName, setPromptpayName] = useState("");
  const [promptpayReceiverName, setPromptpayReceiverName] = useState("");
  const [testAmount, setTestAmount] = useState<string>("50");
  const [previewQrUrl, setPreviewQrUrl] = useState<string>("");

  // Fetch Cash Transactions from Backend API
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585";
      const token = getStoredToken();
      const queryParams = new URLSearchParams();

      queryParams.append("page", page.toString());
      queryParams.append("page_size", pageSize.toString());
      queryParams.append("sort", dateSort === "asc" ? "date_asc" : "date_desc");

      if (filterType !== "all") {
        queryParams.append("type", filterType);
      }
      if (searchQuery.trim()) {
        queryParams.append("search", searchQuery.trim());
      }

      const res = await fetch(`${apiUrl}/api/v1/cash-transactions?${queryParams.toString()}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        const json = await res.json();
        setTransactions(json.data || []);
        setTotalCount(json.total || 0);
        setTotalIncome(json.total_income || 0);
        setTotalExpense(json.total_expense || 0);
        setNetBalance(json.net_balance || 0);
      }
    } catch (err) {
      console.error("Failed to fetch cash transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [page, pageSize, filterType, dateSort, searchQuery]);

  // Load PromptPay & System Settings from API
  useEffect(() => {
    const fetchSettings = async () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585";
      try {
        const res = await fetch(`${apiUrl}/api/v1/settings/promptpay_target`);
        if (res.ok) {
          const data = await res.json();
          if (data.value) {
            setPromptpayAccount(data.value);
            localStorage.setItem("kaset_promptpay_account", data.value);
          }
        }
      } catch {}

      try {
        const res = await fetch(`${apiUrl}/api/v1/settings/promptpay_name`);
        if (res.ok) {
          const data = await res.json();
          if (data.value) {
            setPromptpayName(data.value);
            localStorage.setItem("kaset_promptpay_name", data.value);
          }
        }
      } catch {}

      try {
        const res = await fetch(`${apiUrl}/api/v1/settings/ocr_name`);
        if (res.ok) {
          const data = await res.json();
          if (data.value) {
            setPromptpayReceiverName(data.value);
          }
        }
      } catch {}
    };
    fetchSettings();
  }, []);

  // Generate QR Preview
  useEffect(() => {
    if (!promptpayAccount) return;
    try {
      const cleanAcc = promptpayAccount.replace(/[^0-9]/g, "");
      const amt = Number(testAmount) || 0;
      const payload = generatePayload(cleanAcc, { amount: amt });
      QRCode.toDataURL(payload, {
        width: 260,
        margin: 1,
        color: {
          dark: "#1A1D20",
          light: "#FFFFFF",
        },
      })
        .then((url) => setPreviewQrUrl(url))
        .catch((err) => console.error("Error generating QR:", err));
    } catch (err) {
      console.error("PromptPay payload error:", err);
    }
  }, [promptpayAccount, testAmount]);

  // Save PromptPay Settings
  const handleSavePromptpaySettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAccount = promptpayAccount.trim();
    const cleanName = promptpayName.trim();
    const cleanReceiverName = promptpayReceiverName.trim();

    try {
      localStorage.setItem("kaset_promptpay_account", cleanAccount);
      localStorage.setItem("kaset_promptpay_name", cleanName);
    } catch (err) {
      console.error("Error saving promptpay settings to localStorage:", err);
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585";
      const token = getStoredToken();
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      await Promise.all([
        fetch(`${apiUrl}/api/v1/settings/promptpay_target`, {
          method: "PUT",
          headers,
          body: JSON.stringify({
            value: cleanAccount,
            description: "หมายเลขบัญชีพร้อมเพย์สำหรับรับชำระเงิน",
          }),
        }),
        fetch(`${apiUrl}/api/v1/settings/promptpay_name`, {
          method: "PUT",
          headers,
          body: JSON.stringify({
            value: cleanName,
            description: "ชื่อบัญชีพร้อมเพย์สำหรับรับชำระเงิน",
          }),
        }),
        fetch(`${apiUrl}/api/v1/settings/ocr_name`, {
          method: "PUT",
          headers,
          body: JSON.stringify({
            value: cleanReceiverName,
            description: "ชื่อผู้รับเงินสำหรับตรวจสอบสลิปด้วยระบบ OCR อัตโนมัติ",
          }),
        }),
      ]);

      success("บันทึกการตั้งค่าพร้อมเพย์และ OCR เรียบร้อยแล้ว", "ตั้งค่า PromptPay & OCR");
    } catch (err) {
      console.error("Error saving promptpay settings to backend:", err);
      toastError("ไม่สามารถบันทึกการตั้งค่าได้", "เกิดข้อผิดพลาด");
    }
  };

  // Open Add Modal
  const openAddModal = () => {
    setModalMode("create");
    setEditingId(null);
    setFormType("expense");
    setFormCategory("วัตถุดิบ");
    setFormTitle("");
    setFormAmount("");
    setFormDate(new Date().toISOString().substring(0, 16));
    setFormNote("");
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (tx: CashTransactionItem) => {
    setModalMode("edit");
    setEditingId(tx.id);
    setFormType(tx.type);
    setFormCategory(tx.category);
    setFormTitle(tx.title);
    setFormAmount(String(tx.amount));
    setFormDate(tx.date_time ? tx.date_time.substring(0, 16) : new Date().toISOString().substring(0, 16));
    setFormNote(tx.note || "");
    setIsModalOpen(true);
  };

  // Save Add/Edit Transaction via API
  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(formAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toastError("กรุณาระบุจำนวนเงินที่ถูกต้อง", "ข้อมูลไม่ถูกต้อง");
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585";
      const token = getStoredToken();
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const payload = {
        type: formType,
        category: formCategory,
        title: formTitle.trim(),
        amount: amountNum,
        date_time: formDate,
        note: formNote.trim(),
      };

      let res;
      if (modalMode === "create") {
        res = await fetch(`${apiUrl}/api/v1/cash-transactions`, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${apiUrl}/api/v1/cash-transactions/${editingId}`, {
          method: "PUT",
          headers,
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        success(
          modalMode === "create" ? "เพิ่มรายการทางการเงินสำเร็จ" : "แก้ไขรายการสำเร็จ",
          "บันทึกข้อมูล"
        );
        setIsModalOpen(false);
        fetchTransactions();
      } else {
        const errJson = await res.json().catch(() => ({}));
        toastError(errJson.error || "ไม่สามารถบันทึกรายการได้", "เกิดข้อผิดพลาด");
      }
    } catch (err) {
      console.error("Error saving cash transaction:", err);
      toastError("เกิดข้อผิดพลาดในการบันทึกข้อมูล", "เกิดข้อผิดพลาด");
    }
  };

  // Delete Transaction via API
  const handleDeleteTransaction = async (id: number) => {
    if (!confirm("คุณต้องการลบรายการนี้ใช่หรือไม่?")) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585";
      const token = getStoredToken();
      const res = await fetch(`${apiUrl}/api/v1/cash-transactions/${id}`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        success("ลบรายการทางการเงินเรียบร้อยแล้ว", "ลบรายการ");
        fetchTransactions();
      } else {
        toastError("ไม่สามารถลบรายการได้", "เกิดข้อผิดพลาด");
      }
    } catch (err) {
      console.error("Error deleting transaction:", err);
      toastError("เกิดข้อผิดพลาดในการลบรายการ", "เกิดข้อผิดพลาด");
    }
  };

  const renderFormattedDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    const datePart = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr.split(" ")[0];
    const rawTime = dateStr.includes("T") ? dateStr.split("T")[1]?.substring(0, 5) : dateStr.split(" ")[1]?.substring(0, 5) || "";

    return (
      <div style={{ lineHeight: 1.25 }}>
        <div className="font-mono" style={{ color: "var(--ink)", fontWeight: 500, fontSize: "0.8rem" }}>
          {datePart}
        </div>
        {rawTime && (
          <div className="font-mono" style={{ fontSize: "0.725rem", color: "var(--ink-soft)", marginTop: "1px" }}>
            {rawTime}
          </div>
        )}
      </div>
    );
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "var(--cream)",
        color: "var(--ink)",
        fontFamily: "'Kanit', sans-serif",
      }}
    >
      <AdminSidebar />

      <main style={{ flex: 1, padding: "1.75rem 2.5rem", overflowY: "auto", minWidth: 0 }}>
        {/* Header */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, lineHeight: 1.2, margin: 0 }}>
              บันทึกรายรับ-รายจ่าย & จัดการ QR รับเงิน
            </h1>
          </div>
        </div>

        {/* KPI Summary Cards Grid matching slip-check layout */}
        <div className="admin-kpi-grid" style={{ marginTop: "1.5rem", marginBottom: "1.5rem" }}>
          {/* Card 1: Income */}
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
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)", fontWeight: 500, margin: 0 }}>
                รายรับรวม (Income)
              </p>
              <div style={{ width: "32px", height: "32px", borderRadius: "0.65rem", backgroundColor: "rgba(34, 197, 94, 0.12)", color: "#22c55e", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <TrendingUp size={18} />
              </div>
            </div>
            <div style={{ marginTop: "0.5rem", marginBottom: "0.35rem" }}>
              <p className="font-display" style={{ fontSize: "1.85rem", fontWeight: 800, color: "#22c55e", margin: 0, lineHeight: 1.15 }}>
                +฿{totalIncome.toLocaleString()}
              </p>
            </div>
            <div>
              <p style={{ fontSize: "0.75rem", color: "var(--ink-soft)", fontWeight: 400, margin: 0 }}>
                คำนวณสุทธิจากรายการรายรับทั้งหมด
              </p>
            </div>
          </div>

          {/* Card 2: Expense */}
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
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)", fontWeight: 500, margin: 0 }}>
                รายจ่ายรวม (Expenses)
              </p>
              <div style={{ width: "32px", height: "32px", borderRadius: "0.65rem", backgroundColor: "rgba(220, 38, 38, 0.12)", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <TrendingDown size={18} />
              </div>
            </div>
            <div style={{ marginTop: "0.5rem", marginBottom: "0.35rem" }}>
              <p className="font-display" style={{ fontSize: "1.85rem", fontWeight: 800, color: "#dc2626", margin: 0, lineHeight: 1.15 }}>
                -฿{totalExpense.toLocaleString()}
              </p>
            </div>
            <div>
              <p style={{ fontSize: "0.75rem", color: "var(--ink-soft)", fontWeight: 400, margin: 0 }}>
                คำนวณสุทธิจากรายการรายจ่ายทั้งหมด
              </p>
            </div>
          </div>

          {/* Card 3: Net Profit */}
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
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)", fontWeight: 500, margin: 0 }}>
                ยอดคงเหลือ / กำไรสุทธิ
              </p>
              <div style={{ width: "32px", height: "32px", borderRadius: "0.65rem", backgroundColor: "rgba(75, 155, 140, 0.12)", color: "var(--teal)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <DollarSign size={18} />
              </div>
            </div>
            <div style={{ marginTop: "0.5rem", marginBottom: "0.35rem" }}>
              <p className="font-display" style={{ fontSize: "1.85rem", fontWeight: 900, color: netBalance >= 0 ? "var(--teal)" : "#dc2626", margin: 0, lineHeight: 1.15 }}>
                ฿{netBalance.toLocaleString()}
              </p>
            </div>
            <div>
              <p style={{ fontSize: "0.75rem", color: "var(--ink-soft)", fontWeight: 400, margin: 0 }}>
                คำนวณสุทธิจากรายรับและรายจ่าย
              </p>
            </div>
          </div>

          {/* Card 4: Navigation / Selection Options matching slip-check card 4 */}
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
                เมนูการจัดการระบบ
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
              {/* Option 1: บันทึกรายรับ-รายจ่าย */}
              <button
                type="button"
                onClick={() => setActiveTab("records")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "0.5rem",
                  padding: "0.55rem 0.85rem",
                  backgroundColor: activeTab === "records" ? "var(--ink)" : "rgba(50, 55, 65, 0.03)",
                  color: activeTab === "records" ? "var(--cream)" : "var(--ink)",
                  borderRadius: "0.75rem",
                  border: activeTab === "records" ? "none" : "1px solid rgba(50, 55, 65, 0.08)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  width: "100%",
                  textAlign: "left",
                }}
              >
                <span style={{ fontSize: "0.85rem", fontWeight: 700, lineHeight: 1.2, fontFamily: "'Kanit', sans-serif" }}>
                  บันทึกรายรับ-รายจ่าย
                </span>
                <Wallet size={16} opacity={activeTab === "records" ? 1 : 0.6} />
              </button>

              {/* Option 2: จัดการ QR รับเงิน */}
              <button
                type="button"
                onClick={() => setActiveTab("qr_settings")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "0.5rem",
                  padding: "0.55rem 0.85rem",
                  backgroundColor: activeTab === "qr_settings" ? "var(--ink)" : "rgba(50, 55, 65, 0.03)",
                  color: activeTab === "qr_settings" ? "var(--cream)" : "var(--ink)",
                  borderRadius: "0.75rem",
                  border: activeTab === "qr_settings" ? "none" : "1px solid rgba(50, 55, 65, 0.08)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  width: "100%",
                  textAlign: "left",
                }}
              >
                <span style={{ fontSize: "0.85rem", fontWeight: 700, lineHeight: 1.2, fontFamily: "'Kanit', sans-serif" }}>
                  จัดการ QR รับเงิน
                </span>
                <QrCode size={16} opacity={activeTab === "qr_settings" ? 1 : 0.6} />
              </button>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* TAB 1: RECORD EXPENSE & INCOME TABLE                            */}
        {/* ============================================================== */}
        {activeTab === "records" && (
          <section
            style={{
              borderRadius: "1.25rem",
              backgroundColor: "var(--card)",
              padding: "1.5rem",
              border: "1px solid rgba(50, 55, 65, 0.1)",
              boxShadow: "0 4px 20px -2px rgba(0,0,0,0.03)",
            }}
          >
            {/* Controls Bar: Filter Tabs & Search / Add */}
            <div className="admin-controls-bar">
              {/* Filter Tabs (Desktop) */}
              <div className="admin-filter-tabs">
                {[
                  { id: "all", label: `ทั้งหมด (${totalCount})` },
                  { id: "income", label: "เฉพาะรายรับ" },
                  { id: "expense", label: "เฉพาะรายจ่าย" },
                ].map((tab) => {
                  const isSelected = filterType === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setFilterType(tab.id as any);
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
                  value={filterType}
                  onChange={(e) => {
                    setFilterType(e.target.value as any);
                    setPage(1);
                  }}
                >
                  <option value="all">ทั้งหมด ({totalCount})</option>
                  <option value="income">เฉพาะรายรับ</option>
                  <option value="expense">เฉพาะรายจ่าย</option>
                </select>
              </div>

              {/* Search & Add Button */}
              <div className="admin-search-wrapper" style={{ gap: "0.75rem" }}>
                <div className="admin-search-box">
                  <Search size={15} color="var(--ink-soft)" style={{ flexShrink: 0 }} />
                  <input
                    type="text"
                    placeholder="ค้นหารายการ, หมวดหมู่, หมายเหตุ..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(1);
                    }}
                  />
                </div>

                <button type="button" onClick={openAddModal} className="admin-add-btn">
                  <Plus size={16} />
                  <span>เพิ่มรายการใหม่</span>
                </button>
              </div>
            </div>

            {/* Desktop / Tablet: Table View */}
            <div className="admin-table-view" style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem", tableLayout: "fixed" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(50, 55, 65, 0.12)", color: "var(--ink)", fontSize: "0.825rem" }}>
                    <th
                      onClick={() => {
                        setDateSort((prev) => (prev === "desc" ? "asc" : "desc"));
                        setPage(1);
                      }}
                      style={{ width: "16%", padding: "0.75rem 0.6rem", cursor: "pointer", userSelect: "none" }}
                    >
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                        <span>วัน-เวลา</span>
                        {dateSort === "desc" ? <ArrowDown size={13} style={{ color: "var(--teal)" }} /> : <ArrowUp size={13} style={{ color: "var(--teal)" }} />}
                      </div>
                    </th>
                    <th style={{ width: "14%", padding: "0.75rem 0.6rem" }}>ประเภท</th>
                    <th style={{ width: "26%", padding: "0.75rem 0.6rem" }}>รายการ / หัวข้อ</th>
                    <th style={{ width: "16%", padding: "0.75rem 0.6rem" }}>หมวดหมู่</th>
                    <th style={{ width: "16%", padding: "0.75rem 0.6rem" }}>จำนวนเงิน (บาท)</th>
                    <th style={{ width: "12%", padding: "0.75rem 0.6rem", textAlign: "center" }}>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", padding: "3rem", color: "var(--ink-soft)" }}>
                        กำลังโหลดข้อมูลธุรกรรมทางการเงิน...
                      </td>
                    </tr>
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", padding: "3rem", color: "var(--ink-soft)" }}>
                        ไม่พบรายการบันทึกรายรับ-รายจ่ายตามเงื่อนไข
                      </td>
                    </tr>
                  ) : (
                    transactions.map((item) => {
                      const isIncome = item.type === "income";
                      return (
                        <tr
                          key={item.id}
                          style={{
                            borderBottom: "1px solid rgba(50, 55, 65, 0.06)",
                            transition: "background-color 0.12s ease",
                          }}
                        >
                          <td style={{ padding: "0.75rem 0.6rem" }}>
                            {renderFormattedDate(item.date_time)}
                          </td>
                          <td style={{ padding: "0.75rem 0.6rem" }}>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.3rem",
                                borderRadius: "9999px",
                                padding: "0.25rem 0.6rem",
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                backgroundColor: isIncome ? "rgba(34, 197, 94, 0.12)" : "rgba(220, 38, 38, 0.12)",
                                color: isIncome ? "#16a34a" : "#dc2626",
                              }}
                            >
                              {isIncome ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                              <span>{isIncome ? "รายรับ" : "รายจ่าย"}</span>
                            </span>
                          </td>
                          <td style={{ padding: "0.75rem 0.6rem" }}>
                            <div style={{ fontWeight: 600, color: "var(--ink)" }}>{item.title}</div>
                            {item.note && (
                              <div style={{ fontSize: "0.75rem", color: "var(--ink-soft)", marginTop: "2px" }}>
                                {item.note}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: "0.75rem 0.6rem" }}>
                            <span
                              style={{
                                fontSize: "0.75rem",
                                padding: "0.2rem 0.5rem",
                                borderRadius: "0.4rem",
                                backgroundColor: "var(--cream)",
                                border: "1px solid rgba(50,55,65,0.08)",
                                color: "var(--ink-soft)",
                                fontWeight: 500,
                              }}
                            >
                              {item.category}
                            </span>
                          </td>
                          <td style={{ padding: "0.75rem 0.6rem" }}>
                            <span
                              className="font-display"
                              style={{
                                fontWeight: 800,
                                fontSize: "0.95rem",
                                color: isIncome ? "#22c55e" : "#dc2626",
                              }}
                            >
                              {isIncome ? "+" : "-"}฿{item.amount.toLocaleString()}
                            </span>
                          </td>
                          <td style={{ padding: "0.75rem 0.6rem", textAlign: "center" }}>
                            <div style={{ display: "flex", gap: "0.35rem", justifyContent: "center" }}>
                              <button
                                type="button"
                                onClick={() => openEditModal(item)}
                                title="แก้ไข"
                                style={{
                                  width: "30px",
                                  height: "30px",
                                  borderRadius: "0.45rem",
                                  border: "1px solid rgba(50,55,65,0.1)",
                                  backgroundColor: "var(--cream)",
                                  color: "var(--ink-soft)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  cursor: "pointer",
                                }}
                              >
                                <Edit3 size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteTransaction(item.id)}
                                title="ลบ"
                                style={{
                                  width: "30px",
                                  height: "30px",
                                  borderRadius: "0.45rem",
                                  border: "1px solid rgba(220, 38, 38, 0.2)",
                                  backgroundColor: "rgba(220, 38, 38, 0.08)",
                                  color: "#dc2626",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  cursor: "pointer",
                                }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile / Narrow Screen View */}
            <div className="admin-cards-view">
              {transactions.length === 0 ? (
                <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: "var(--ink-soft)" }}>
                  ไม่พบรายการบันทึกรายรับ-รายจ่าย
                </div>
              ) : (
                transactions.map((item) => {
                  const isIncome = item.type === "income";
                  return (
                    <div
                      key={item.id}
                      style={{
                        backgroundColor: "var(--cream)",
                        border: "1px solid rgba(50, 55, 65, 0.1)",
                        borderRadius: "0.75rem",
                        padding: "0.95rem 1rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--ink)", display: "block" }}>
                            {item.title}
                          </span>
                          <span style={{ fontSize: "0.75rem", color: "var(--ink-soft)" }}>
                            {item.category}
                          </span>
                        </div>
                        <span
                          className="font-display"
                          style={{
                            fontWeight: 800,
                            fontSize: "1.1rem",
                            color: isIncome ? "#22c55e" : "#dc2626",
                          }}
                        >
                          {isIncome ? "+" : "-"}฿{item.amount.toLocaleString()}
                        </span>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.775rem", color: "var(--ink-soft)", paddingTop: "0.4rem", borderTop: "1px dashed rgba(50,55,65,0.1)" }}>
                        <span>{renderFormattedDate(item.date_time)}</span>
                        <div style={{ display: "flex", gap: "0.35rem" }}>
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            style={{
                              padding: "0.3rem 0.6rem",
                              borderRadius: "0.4rem",
                              border: "1px solid rgba(50,55,65,0.1)",
                              backgroundColor: "var(--card)",
                              color: "var(--ink)",
                              fontSize: "0.75rem",
                              cursor: "pointer",
                            }}
                          >
                            แก้ไข
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTransaction(item.id)}
                            style={{
                              padding: "0.3rem 0.6rem",
                              borderRadius: "0.4rem",
                              border: "1px solid rgba(220, 38, 38, 0.2)",
                              backgroundColor: "rgba(220, 38, 38, 0.08)",
                              color: "#dc2626",
                              fontSize: "0.75rem",
                              cursor: "pointer",
                            }}
                          >
                            ลบ
                          </button>
                        </div>
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
                  แสดงหน้า {page} จาก {totalPages} (ทั้งหมด {totalCount} รายการ)
                </span>

                <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPage(1);
                    }}
                    style={{
                      padding: "0.25rem 0.5rem",
                      borderRadius: "0.4rem",
                      border: "1px solid rgba(50, 55, 65, 0.15)",
                      backgroundColor: "var(--cream)",
                      color: "var(--ink)",
                      fontSize: "0.775rem",
                      fontWeight: 600,
                      outline: "none",
                      cursor: "pointer",
                      fontFamily: "'Kanit', sans-serif",
                    }}
                  >
                    <option value={10}>10 รายการ/หน้า</option>
                    <option value={20}>20 รายการ/หน้า</option>
                    <option value={50}>50 รายการ/หน้า</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.35rem" }}>
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.2rem",
                    padding: "0.35rem 0.65rem",
                    borderRadius: "0.5rem",
                    border: "1px solid rgba(50, 55, 65, 0.15)",
                    backgroundColor: page <= 1 ? "rgba(0,0,0,0.02)" : "var(--cream)",
                    color: page <= 1 ? "var(--ink-soft)" : "var(--ink)",
                    fontSize: "0.775rem",
                    fontWeight: 600,
                    cursor: page <= 1 ? "not-allowed" : "pointer",
                    opacity: page <= 1 ? 0.5 : 1,
                  }}
                >
                  <ChevronLeft size={14} />
                  <span>ก่อนหน้า</span>
                </button>

                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.2rem",
                    padding: "0.35rem 0.65rem",
                    borderRadius: "0.5rem",
                    border: "1px solid rgba(50, 55, 65, 0.15)",
                    backgroundColor: page >= totalPages ? "rgba(0,0,0,0.02)" : "var(--cream)",
                    color: page >= totalPages ? "var(--ink-soft)" : "var(--ink)",
                    fontSize: "0.775rem",
                    fontWeight: 600,
                    cursor: page >= totalPages ? "not-allowed" : "pointer",
                    opacity: page >= totalPages ? 0.5 : 1,
                  }}
                >
                  <span>ถัดไป</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ============================================================== */}
        {/* TAB 2: PROMPTPAY QR SETTINGS                                   */}
        {/* ============================================================== */}
        {activeTab === "qr_settings" && (
          <div className="animate-fade-in promptpay-grid-container" style={{ marginTop: "1.25rem", display: "grid", gap: "1.5rem", alignItems: "start" }}>
            <style jsx>{`
              .promptpay-grid-container {
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
              }
              @media (max-width: 768px) {
                .promptpay-grid-container {
                  grid-template-columns: 1fr !important;
                }
              }
            `}</style>
            {/* Form Column */}
            <div
              style={{
                backgroundColor: "var(--card)",
                borderRadius: "1.25rem",
                padding: "1.75rem",
                border: "1px solid rgba(50, 55, 65, 0.1)",
                boxShadow: "0 4px 20px -2px rgba(0,0,0,0.03)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
                <QrCode size={22} color="var(--teal)" />
                <h2 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0 }}>
                  ตั้งค่าหมายเลขพร้อมเพย์ (PromptPay Config)
                </h2>
              </div>

              <form onSubmit={handleSavePromptpaySettings}>
                {/* PromptPay Account Number */}
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.4rem" }}>
                    หมายเลขพร้อมเพย์ (เบอร์มือถือ หรือ เลขบัตรประชาชน) <span style={{ color: "#dc2626" }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น 0812345678 หรือ 1100501234567"
                    value={promptpayAccount}
                    onChange={(e) => setPromptpayAccount(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.85rem",
                      borderRadius: "0.65rem",
                      border: "1px solid rgba(50,55,65,0.18)",
                      backgroundColor: "var(--cream)",
                      fontSize: "0.95rem",
                      fontWeight: 600,
                      outline: "none",
                      fontFamily: "'Kanit', sans-serif",
                    }}
                  />
                  <span style={{ fontSize: "0.75rem", color: "var(--ink-soft)", marginTop: "0.25rem", display: "block" }}>
                    ใช้สำหรับสร้าง QR Code แบบระบุยอดเงินอัตโนมัติในหน้าชำระเงิน POS
                  </span>
                </div>

                {/* Account Name */}
                <div style={{ marginBottom: "1.25rem" }}>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.4rem" }}>
                    ชื่อบัญชี / ชื่อร้านค้าที่จะแสดง <span style={{ color: "#dc2626" }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น ถั่วทอง น้ำเต้าหู้"
                    value={promptpayName}
                    onChange={(e) => setPromptpayName(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.85rem",
                      borderRadius: "0.65rem",
                      border: "1px solid rgba(50,55,65,0.18)",
                      backgroundColor: "var(--cream)",
                      fontSize: "0.95rem",
                      outline: "none",
                      fontFamily: "'Kanit', sans-serif",
                    }}
                  />
                </div>

                {/* OCR Expected Receiver Name */}
                <div style={{ marginBottom: "1.25rem" }}>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.4rem" }}>
                    ชื่อผู้รับสำหรับ OCR (Expected Receiver Name)
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น นาย สมศักดิ์ หรือ TongLong Store"
                    value={promptpayReceiverName}
                    onChange={(e) => setPromptpayReceiverName(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.85rem",
                      borderRadius: "0.65rem",
                      border: "1px solid rgba(50,55,65,0.18)",
                      backgroundColor: "var(--cream)",
                      fontSize: "0.95rem",
                      outline: "none",
                      fontFamily: "'Kanit', sans-serif",
                    }}
                  />
                  <span style={{ fontSize: "0.75rem", color: "var(--ink-soft)", marginTop: "0.25rem", display: "block" }}>
                    ระบุชื่อผู้รับเงินที่ปรากฏในสลิป เพื่อใช้สำหรับเปรียบเทียบในระบบสแกนสลิป OCR อัตโนมัติ
                  </span>
                </div>

                <button
                  type="submit"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "0.75rem",
                    border: "none",
                    backgroundColor: "var(--teal)",
                    color: "#fff",
                    fontSize: "0.95rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.4rem",
                    boxShadow: "0 4px 12px rgba(75, 155, 140, 0.3)",
                    transition: "transform 0.15s ease",
                  }}
                >
                  <Save size={16} />
                  <span>บันทึกข้อมูลพร้อมเพย์</span>
                </button>
              </form>
            </div>

            {/* QR Preview Column */}
            <div
              style={{
                backgroundColor: "var(--card)",
                borderRadius: "1.25rem",
                padding: "1.75rem",
                border: "1px solid rgba(50, 55, 65, 0.1)",
                boxShadow: "0 4px 20px -2px rgba(0,0,0,0.03)",
                textAlign: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", marginBottom: "0.4rem" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>ตัวอย่าง QR Code (Live Preview)</h3>
              </div>
              <p style={{ fontSize: "0.775rem", color: "var(--ink-soft)", marginBottom: "1rem" }}>
                QR Code จะคำนวณยอดเงินตามออเดอร์ในหน้าชำระเงิน POS โดยอัตโนมัติ
              </p>

              {/* Live Box */}
              <div
                style={{
                  backgroundColor: "#fff",
                  borderRadius: "1rem",
                  padding: "1.5rem",
                  border: "1px solid rgba(50,55,65,0.1)",
                  display: "inline-block",
                  width: "100%",
                  maxWidth: "320px",
                  margin: "0 auto",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
                }}
              >
                <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--teal)", marginBottom: "0.5rem", wordBreak: "break-word" }}>
                  {promptpayName}
                </p>

                <div style={{ width: "100%", maxWidth: "200px", aspectRatio: "1/1", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {previewQrUrl ? (
                    <img src={previewQrUrl} alt="PromptPay Preview" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                  ) : (
                    <span style={{ fontSize: "0.75rem", color: "var(--ink-soft)" }}>กรุณาระบุหมายเลขพร้อมเพย์</span>
                  )}
                </div>

                <div style={{ marginTop: "0.5rem", padding: "0.3rem 0.75rem", borderRadius: "9999px", backgroundColor: "rgba(75,155,140,0.1)", color: "var(--teal)", fontSize: "0.85rem", fontWeight: 800, wordBreak: "break-word" }}>
                  ทดสอบยอด: ฿{testAmount || "0"}
                </div>
              </div>

              {/* Test Amount Input */}
              <div style={{ marginTop: "1rem", maxWidth: "220px", margin: "1rem auto 0" }}>
                <label style={{ display: "block", fontSize: "0.75rem", color: "var(--ink-soft)", marginBottom: "0.25rem" }}>
                  ทดสอบระบุยอดเงิน (บาท):
                </label>
                <input
                  type="number"
                  value={testAmount}
                  onChange={(e) => setTestAmount(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.4rem 0.6rem",
                    borderRadius: "0.5rem",
                    border: "1px solid rgba(50,55,65,0.15)",
                    textAlign: "center",
                    fontSize: "0.9rem",
                    fontWeight: 700,
                    backgroundColor: "var(--cream)",
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Modal */}
        {isModalOpen && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.4)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: "1rem",
            }}
          >
            <div
              style={{
                backgroundColor: "var(--card)",
                borderRadius: "1.25rem",
                width: "100%",
                maxWidth: "480px",
                padding: "1.75rem",
                boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
                border: "1px solid rgba(50,55,65,0.1)",
              }}
            >
              <h3 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "1rem", color: "var(--ink)" }}>
                {modalMode === "create" ? "เพิ่มรายการใหม่" : "แก้ไขรายการ"}
              </h3>

              <form onSubmit={handleSaveTransaction}>
                {/* Type Selection */}
                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setFormType("expense");
                      setFormCategory("วัตถุดิบ");
                    }}
                    style={{
                      flex: 1,
                      padding: "0.6rem",
                      borderRadius: "0.6rem",
                      border: formType === "expense" ? "2px solid #dc2626" : "1px solid rgba(50,55,65,0.15)",
                      backgroundColor: formType === "expense" ? "rgba(220,38,38,0.08)" : "var(--cream)",
                      color: formType === "expense" ? "#dc2626" : "var(--ink)",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      cursor: "pointer",
                    }}
                  >
                    รายจ่าย (Expense)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormType("income");
                      setFormCategory("รายรับทั่วไป");
                    }}
                    style={{
                      flex: 1,
                      padding: "0.6rem",
                      borderRadius: "0.6rem",
                      border: formType === "income" ? "2px solid #22c55e" : "1px solid rgba(50,55,65,0.15)",
                      backgroundColor: formType === "income" ? "rgba(34,197,94,0.08)" : "var(--cream)",
                      color: formType === "income" ? "#22c55e" : "var(--ink)",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      cursor: "pointer",
                    }}
                  >
                    รายรับ (Income)
                  </button>
                </div>

                {/* Category (Show only if Expense) */}
                {formType === "expense" && (
                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.3rem" }}>
                      หมวดหมู่รายจ่าย
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.5rem 0.75rem",
                        borderRadius: "0.6rem",
                        border: "1px solid rgba(50,55,65,0.15)",
                        backgroundColor: "var(--cream)",
                        fontSize: "0.9rem",
                        outline: "none",
                        fontFamily: "'Kanit', sans-serif",
                      }}
                    >
                      <option value="วัตถุดิบ">วัตถุดิบ</option>
                      <option value="บรรจุภัณฑ์">บรรจุภัณฑ์</option>
                      <option value="อื่นๆ">อื่นๆ</option>
                    </select>
                  </div>
                )}

                {/* Title */}
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.3rem" }}>
                    หัวข้อ / รายการ <span style={{ color: "#dc2626" }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น ซื้อถั่วเหลืองออร์แกนิค 10 กก."
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "0.5rem 0.75rem",
                      borderRadius: "0.6rem",
                      border: "1px solid rgba(50,55,65,0.15)",
                      backgroundColor: "var(--cream)",
                      fontSize: "0.9rem",
                      outline: "none",
                      fontFamily: "'Kanit', sans-serif",
                    }}
                  />
                </div>

                {/* Amount & Date */}
                <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.3rem" }}>
                      จำนวนเงิน (บาท) <span style={{ color: "#dc2626" }}>*</span>
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value)}
                      required
                      style={{
                        width: "100%",
                        padding: "0.5rem 0.75rem",
                        borderRadius: "0.6rem",
                        border: "1px solid rgba(50,55,65,0.15)",
                        backgroundColor: "var(--cream)",
                        fontSize: "0.9rem",
                        outline: "none",
                        fontFamily: "'Kanit', sans-serif",
                      }}
                    />
                  </div>

                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.3rem" }}>
                      วัน-เวลา
                    </label>
                    <input
                      type="datetime-local"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.5rem 0.75rem",
                        borderRadius: "0.6rem",
                        border: "1px solid rgba(50,55,65,0.15)",
                        backgroundColor: "var(--cream)",
                        fontSize: "0.85rem",
                        outline: "none",
                        fontFamily: "'Kanit', sans-serif",
                      }}
                    />
                  </div>
                </div>

                {/* Note */}
                <div style={{ marginBottom: "1.25rem" }}>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.3rem" }}>
                    บันทึกเพิ่มเติม (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น ซื้อจากร้านเจ๊หมวย"
                    value={formNote}
                    onChange={(e) => setFormNote(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.5rem 0.75rem",
                      borderRadius: "0.6rem",
                      border: "1px solid rgba(50,55,65,0.15)",
                      backgroundColor: "var(--cream)",
                      fontSize: "0.85rem",
                      outline: "none",
                      fontFamily: "'Kanit', sans-serif",
                    }}
                  />
                </div>

                {/* Action Buttons */}
                <div style={{ display: "flex", gap: "0.6rem" }}>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    style={{
                      flex: 1,
                      padding: "0.65rem",
                      borderRadius: "0.6rem",
                      border: "1px solid rgba(50,55,65,0.15)",
                      backgroundColor: "var(--cream)",
                      color: "var(--ink)",
                      fontWeight: 600,
                      cursor: "pointer",
                      fontSize: "0.875rem",
                    }}
                  >
                    ยกเลิก
                  </button>

                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      padding: "0.65rem",
                      borderRadius: "0.6rem",
                      border: "none",
                      backgroundColor: "var(--teal)",
                      color: "#fff",
                      fontWeight: 700,
                      cursor: "pointer",
                      fontSize: "0.875rem",
                    }}
                  >
                    {modalMode === "create" ? "บันทึกรายการ" : "บันทึกการแก้ไข"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
