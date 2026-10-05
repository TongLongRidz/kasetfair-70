"use client";
import React, { useState, useEffect } from "react";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import { getStoredToken, getStoredUser, hasPermission } from "@/lib/auth";
import { useToast } from "@/components/ui/toast";
import CustomDropdown from "@/components/ui/CustomDropdown";
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
  UserCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Receipt,
  Users,
} from "lucide-react";

export interface DebtItem {
  id: number;
  cash_transaction_id?: number;
  staff_id: number;
  staff?: {
    id: number;
    name: string;
    username: string;
  };
  paid_by_staff_id?: number;
  paid_by_staff?: {
    id: number;
    name: string;
    username: string;
  };
  amount: number;
  is_paid: boolean;
  paid_at?: string;
  note?: string;
  created_at?: string;
  cash_transaction?: {
    title: string;
    category: string;
  };
}

export interface StaffUser {
  id: number;
  name: string;
  username: string;
  role?: {
    name_th?: string;
    key?: string;
  };
}

export interface StaffDebtSummary {
  staff_id: number;
  staff_name: string;
  unpaid_amount: number;
  unpaid_count: number;
  paid_amount: number;
}

export interface CashTransactionItem {
  id: number;
  type: "income" | "expense";
  category: string;
  title: string;
  amount: number;
  date_time: string;
  note?: string;
  created_at?: string;
  debt?: DebtItem;
}

export default function AdminExpensePage() {
  const { success, error: toastError } = useToast();
  const [activeTab, setActiveTab] = useState<"records" | "debts" | "qr_settings">("records");

  const [canEditExpense, setCanEditExpense] = useState<boolean>(true);
  const [canViewQr, setCanViewQr] = useState<boolean>(true);
  const [canEditQr, setCanEditQr] = useState<boolean>(true);

  useEffect(() => {
    const user = getStoredUser();
    if (user) {
      setCanEditExpense(hasPermission("expense.edit", user));
      setCanViewQr(hasPermission("qrcode.view", user) || hasPermission("qrcode.edit", user));
      setCanEditQr(hasPermission("qrcode.edit", user));
    }
  }, []);

  // Cash Transactions API State
  const [transactions, setTransactions] = useState<CashTransactionItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalIncome, setTotalIncome] = useState<number>(0);
  const [totalExpense, setTotalExpense] = useState<number>(0);
  const [netBalance, setNetBalance] = useState<number>(0);
  const [totalUnpaidDebt, setTotalUnpaidDebt] = useState<number>(0);

  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateSort, setDateSort] = useState<"desc" | "asc">("desc");
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(true);

  // Staff list for Debt dropdown
  const [staffList, setStaffList] = useState<StaffUser[]>([]);

  // Debts Tab State
  const [debtsList, setDebtsList] = useState<DebtItem[]>([]);
  const [staffDebtSummaries, setStaffDebtSummaries] = useState<StaffDebtSummary[]>([]);
  const [debtFilterPaid, setDebtFilterPaid] = useState<"all" | "unpaid" | "paid">("all");
  const [debtLoading, setDebtLoading] = useState<boolean>(false);

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
  const [paidByStaffId, setPaidByStaffId] = useState<string>("");
  const [isPaidDebt, setIsPaidDebt] = useState<boolean>(false);

  // PromptPay Settings State
  const [promptpayAccount, setPromptpayAccount] = useState("");
  const [promptpayName, setPromptpayName] = useState("");
  const [promptpayReceiverName, setPromptpayReceiverName] = useState("");
  const [testAmount, setTestAmount] = useState<string>("50");
  const [previewQrUrl, setPreviewQrUrl] = useState<string>("");

  // Fetch Staff Users List for Dropdown
  const fetchStaffList = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585";
      const token = getStoredToken();
      const res = await fetch(`${apiUrl}/api/v1/staffs`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        const json = await res.json();
        setStaffList(json.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch staff list:", err);
    }
  };

  // Fetch Debts List & Summaries
  const fetchDebts = async () => {
    setDebtLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585";
      const token = getStoredToken();
      const queryParams = new URLSearchParams();

      if (debtFilterPaid === "unpaid") queryParams.append("is_paid", "false");
      if (debtFilterPaid === "paid") queryParams.append("is_paid", "true");

      const res = await fetch(`${apiUrl}/api/v1/debts?${queryParams.toString()}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        const json = await res.json();
        setDebtsList(json.data || []);
        setStaffDebtSummaries(json.staff_summaries || []);
      }
    } catch (err) {
      console.error("Failed to fetch debts:", err);
    } finally {
      setDebtLoading(false);
    }
  };

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
        setTotalUnpaidDebt(json.total_unpaid_debt || 0);
      }
    } catch (err) {
      console.error("Failed to fetch cash transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffList();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [page, pageSize, filterType, dateSort, searchQuery]);

  useEffect(() => {
    if (activeTab === "debts") {
      fetchDebts();
    }
  }, [activeTab, debtFilterPaid]);

  // Load PromptPay & System Settings from API
  useEffect(() => {
    const fetchSettings = async () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585";
      try {
        const res = await fetch(`${apiUrl}/api/v1/settings/promptpay_target`);
        if (res.ok) {
          const data = await res.json();
          if (data.value) setPromptpayAccount(data.value);
        }
      } catch {}

      try {
        const res = await fetch(`${apiUrl}/api/v1/settings/promptpay_name`);
        if (res.ok) {
          const data = await res.json();
          if (data.value) setPromptpayName(data.value);
        }
      } catch {}

      try {
        const res = await fetch(`${apiUrl}/api/v1/settings/ocr_name`);
        if (res.ok) {
          const data = await res.json();
          if (data.value) setPromptpayReceiverName(data.value);
        }
      } catch {}
    };

    fetchSettings();
  }, []);

  // Update Live Preview QR Code
  useEffect(() => {
    if (!promptpayAccount.trim()) {
      setPreviewQrUrl("");
      return;
    }

    try {
      const cleanAccount = promptpayAccount.trim().replace(/[^0-9]/g, "");
      const amountNum = parseFloat(testAmount) || 0;
      const payload = generatePayload(cleanAccount, { amount: amountNum > 0 ? amountNum : undefined });

      QRCode.toDataURL(payload, { width: 400, margin: 2 }, (err, url) => {
        if (!err && url) {
          setPreviewQrUrl(url);
        } else {
          setPreviewQrUrl("");
        }
      });
    } catch {
      setPreviewQrUrl("");
    }
  }, [promptpayAccount, testAmount]);

  // Save PromptPay Settings
  const handleSavePromptpaySettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAccount = promptpayAccount.trim();
    const cleanName = promptpayName.trim();
    const cleanReceiverName = promptpayReceiverName.trim();

    if (!cleanAccount) {
      toastError("กรุณาระบุหมายเลขพร้อมเพย์", "ข้อมูลไม่ครบถ้วน");
      return;
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
    setPaidByStaffId("");
    setIsPaidDebt(false);
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
    if (tx.debt && tx.debt.staff_id) {
      setPaidByStaffId(String(tx.debt.staff_id));
      setIsPaidDebt(tx.debt.is_paid || false);
    } else {
      setPaidByStaffId("");
      setIsPaidDebt(false);
    }
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

      const staffIdNum = paidByStaffId ? parseInt(paidByStaffId, 10) : 0;

      const payload = {
        type: formType,
        category: formCategory,
        title: formTitle.trim(),
        amount: amountNum,
        date_time: formDate,
        note: formNote.trim(),
        paid_by_staff_id: formType === "expense" ? staffIdNum : 0,
        is_paid: formType === "expense" && staffIdNum > 0 ? isPaidDebt : false,
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
        if (activeTab === "debts") fetchDebts();
      } else {
        const errJson = await res.json().catch(() => ({}));
        toastError(errJson.error || "ไม่สามารถบันทึกรายการได้", "เกิดข้อผิดพลาด");
      }
    } catch (err) {
      console.error("Error saving cash transaction:", err);
      toastError("เกิดข้อผิดพลาดในการบันทึกข้อมูล", "เกิดข้อผิดพลาด");
    }
  };

  // Toggle Debt Paid Status directly
  const handleToggleDebtPaid = async (debtId: number) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585";
      const token = getStoredToken();
      const res = await fetch(`${apiUrl}/api/v1/debts/${debtId}/pay`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        const json = await res.json();
        const updatedDebt = json.data;
        success(
          updatedDebt.is_paid
            ? "อัปเดตสถานะเป็น: จ่ายคืนพนักงานเรียบร้อยแล้ว"
            : "อัปเดตสถานะเป็น: ค้างชำระพนักงาน",
          "อัปเดตสถานะการจ่ายคืน"
        );
        fetchTransactions();
        fetchDebts();
      } else {
        toastError("ไม่สามารถอัปเดตสถานะการคืนเงินได้", "เกิดข้อผิดพลาด");
      }
    } catch (err) {
      console.error("Error toggling debt status:", err);
      toastError("เกิดข้อผิดพลาดในการอัปเดตสถานะ", "เกิดข้อผิดพลาด");
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
        if (activeTab === "debts") fetchDebts();
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

      <main style={{ flex: 1, padding: "1.75rem 2.5rem", minWidth: 0 }}>
        {/* Header with Navigation Tab Switcher matching slip-check layout */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, lineHeight: 1.2, margin: 0 }}>
              บันทึกรายรับ-รายจ่าย & จัดการ QR รับเงิน
            </h1>
          </div>

          {/* Navigation Tab Switcher */}
          <div
            style={{
              display: "flex",
              borderRadius: "9999px",
              backgroundColor: "var(--card)",
              padding: "0.25rem",
              border: "1px solid rgba(50, 55, 65, 0.12)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab("records")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                borderRadius: "9999px",
                padding: "0.45rem 1.1rem",
                fontSize: "0.85rem",
                fontWeight: activeTab === "records" ? 700 : 500,
                border: "none",
                cursor: "pointer",
                backgroundColor: activeTab === "records" ? "var(--ink)" : "transparent",
                color: activeTab === "records" ? "var(--cream)" : "var(--ink-soft)",
                transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                fontFamily: "'Kanit', sans-serif",
              }}
            >
              <Receipt size={15} />
              <span>บันทึกรายรับ-รายจ่าย</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("debts")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                borderRadius: "9999px",
                padding: "0.45rem 1.1rem",
                fontSize: "0.85rem",
                fontWeight: activeTab === "debts" ? 700 : 500,
                border: "none",
                cursor: "pointer",
                backgroundColor: activeTab === "debts" ? "var(--ink)" : "transparent",
                color: activeTab === "debts" ? "var(--cream)" : "var(--ink-soft)",
                transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                fontFamily: "'Kanit', sans-serif",
              }}
            >
              <UserCheck size={15} />
              <span>พนักงานสำรองจ่าย (Debt)</span>
              {totalUnpaidDebt > 0 && (
                <span
                  style={{
                    backgroundColor: "#dc2626",
                    color: "#fff",
                    borderRadius: "9999px",
                    padding: "0.1rem 0.45rem",
                    fontSize: "0.7rem",
                    fontWeight: 800,
                    lineHeight: 1,
                  }}
                >
                  ฿{totalUnpaidDebt.toLocaleString()}
                </span>
              )}
            </button>

            {canViewQr && (
              <button
                type="button"
                onClick={() => setActiveTab("qr_settings")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  borderRadius: "9999px",
                  padding: "0.45rem 1.1rem",
                  fontSize: "0.85rem",
                  fontWeight: activeTab === "qr_settings" ? 700 : 500,
                  border: "none",
                  cursor: "pointer",
                  backgroundColor: activeTab === "qr_settings" ? "var(--ink)" : "transparent",
                  color: activeTab === "qr_settings" ? "var(--cream)" : "var(--ink-soft)",
                  transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                  fontFamily: "'Kanit', sans-serif",
                }}
              >
                <QrCode size={15} />
                <span>จัดการ QR รับเงิน</span>
              </button>
            )}
          </div>
        </div>

        {/* 3 Pure Metric Cards Grid (Only show in records tab) */}
        {activeTab === "records" && (
          <div className="admin-kpi-grid" style={{ marginTop: "1.5rem", marginBottom: "1.5rem" }}>
            {/* Card 1: Income */}
            <div
              className="admin-kpi-card animate-rise"
              style={{
                borderRadius: "1.25rem",
                backgroundColor: "var(--card)",
                padding: "1.25rem 1.35rem",
                border: "1px solid rgba(50, 55, 65, 0.08)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxSizing: "border-box",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)", fontWeight: 600, margin: 0 }}>
                  รายรับรวม (Income)
                </p>
              </div>
              <div style={{ marginTop: "0.5rem", marginBottom: "0.35rem" }}>
                <p className="font-display" style={{ fontSize: "1.85rem", fontWeight: 800, color: "var(--teal)", margin: 0, lineHeight: 1.15 }}>
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
                border: "1px solid rgba(50, 55, 65, 0.08)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxSizing: "border-box",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)", fontWeight: 600, margin: 0 }}>
                  รายจ่ายรวม (Expenses)
                </p>
              </div>
              <div style={{ marginTop: "0.5rem", marginBottom: "0.35rem" }}>
                <p className="font-display" style={{ fontSize: "1.85rem", fontWeight: 800, color: "var(--warm)", margin: 0, lineHeight: 1.15 }}>
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
                border: "1px solid rgba(50, 55, 65, 0.08)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxSizing: "border-box",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)", fontWeight: 600, margin: 0 }}>
                  ยอดคงเหลือ / กำไรสุทธิ
                </p>
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
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 1: RECORD EXPENSE & INCOME TABLE                            */}
        {/* ============================================================== */}
        {activeTab === "records" && (
          <section
            style={{
              backgroundColor: "var(--card)",
              borderRadius: "1.25rem",
              padding: "1.5rem",
              border: "1px solid rgba(50, 55, 65, 0.1)",
              boxShadow: "0 4px 20px -2px rgba(0,0,0,0.03)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Controls Bar: Filter & Sort on Left & Add Button / Search on Right */}
            <div className="admin-controls-bar">
              <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "center" }}>
                <CustomDropdown
                  options={[
                    { value: "all", label: "ทุกประเภทรายการ" },
                    { value: "income", label: "เฉพาะรายรับ (Income)" },
                    { value: "expense", label: "เฉพาะรายจ่าย (Expenses)" },
                  ]}
                  value={filterType}
                  onChange={(val) => {
                    setFilterType(val as any);
                    setPage(1);
                  }}
                  minWidth="180px"
                />

                <button
                  type="button"
                  onClick={() => setDateSort(dateSort === "desc" ? "asc" : "desc")}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    padding: "0.45rem 0.85rem",
                    borderRadius: "0.6rem",
                    backgroundColor: "var(--cream)",
                    border: "1px solid rgba(50, 55, 65, 0.15)",
                    fontSize: "0.825rem",
                    fontWeight: 600,
                    fontFamily: "'Kanit', sans-serif",
                    color: "var(--ink)",
                    cursor: "pointer",
                  }}
                >
                  <ArrowUpDown size={14} />
                  <span>{dateSort === "desc" ? "ล่าสุดก่อน (DESC)" : "เก่าสุดก่อน (ASC)"}</span>
                </button>
              </div>

              <div className="admin-search-wrapper">
                {canEditExpense && (
                  <button
                    type="button"
                    className="admin-add-btn"
                    onClick={openAddModal}
                  >
                    <Plus size={16} />
                    <span>บันทึกรายการใหม่</span>
                  </button>
                )}

                <div className="admin-search-box">
                  <Search size={15} color="var(--ink-soft)" style={{ flexShrink: 0 }} />
                  <input
                    type="text"
                    placeholder="ค้นหาชื่อรายการ / หมวดหมู่..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(1);
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Desktop / Tablet: Table View */}
            <div className="admin-table-view" style={{ overflowX: "visible", minHeight: "318px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem", tableLayout: "fixed" }}>
                <thead>
                  <tr
                    style={{
                      borderBottom: "2px solid rgba(50, 55, 65, 0.12)",
                      color: "var(--ink)",
                      fontSize: "0.925rem",
                      fontWeight: 600,
                      height: "48px",
                      letterSpacing: "0.01em",
                    }}
                  >
                    <th style={{ padding: "0.6rem", width: "45px", textAlign: "center", color: "var(--ink)" }}>#</th>
                    <th style={{ padding: "0.6rem", width: "120px", color: "var(--ink)" }}>วัน-เวลา</th>
                    <th style={{ padding: "0.6rem", width: "110px", color: "var(--ink)" }}>ประเภท</th>
                    <th style={{ padding: "0.6rem", color: "var(--ink)" }}>รายการ / สำรองจ่าย</th>
                    <th style={{ padding: "0.6rem", width: "120px", color: "var(--ink)" }}>หมวดหมู่</th>
                    <th style={{ padding: "0.6rem", width: "130px", color: "var(--ink)", textAlign: "right" }}>จำนวนเงิน</th>
                    <th style={{ padding: "0.6rem", width: "90px", textAlign: "center" }}>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", height: "270px", padding: "1rem", color: "var(--ink-soft)" }}>
                        <Receipt size={32} color="var(--ink-soft)" style={{ margin: "0 auto 0.5rem", opacity: 0.5 }} />
                        <p style={{ fontWeight: 600 }}>ไม่พบรายการบันทึกรายรับ-รายจ่ายตามเงื่อนไข</p>
                      </td>
                    </tr>
                  ) : (
                    transactions.map((item, idx) => {
                      const isIncome = item.type === "income";
                      const runningNumber = (page - 1) * pageSize + idx + 1;
                      const isLastRow = idx === transactions.length - 1;

                      return (
                        <tr
                          key={item.id}
                          style={{
                            borderBottom: isLastRow ? "none" : "1px solid rgba(50, 55, 65, 0.06)",
                            transition: "background-color 0.15s ease",
                            height: "54px",
                            boxSizing: "border-box",
                          }}
                        >
                          {/* Running Number */}
                          <td className="font-mono" style={{ padding: "0.5rem 0.6rem", textAlign: "center", fontSize: "0.8rem", color: "var(--ink-soft)" }}>
                            {runningNumber}
                          </td>

                          {/* Date & Time */}
                          <td style={{ padding: "0.5rem 0.6rem" }}>
                            {renderFormattedDate(item.date_time)}
                          </td>

                          {/* Type */}
                          <td style={{ padding: "0.5rem 0.6rem" }}>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.25rem",
                                borderRadius: "9999px",
                                padding: "0.2rem 0.55rem",
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                backgroundColor: isIncome ? "rgba(75, 155, 140, 0.12)" : "rgba(245, 158, 11, 0.12)",
                                color: isIncome ? "var(--teal)" : "var(--warm)",
                              }}
                            >
                              {isIncome ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                              <span>{isIncome ? "รายรับ" : "รายจ่าย"}</span>
                            </span>
                          </td>

                          {/* Title & Notes / Debt */}
                          <td style={{ padding: "0.5rem 0.6rem", overflow: "hidden", textOverflow: "ellipsis" }}>
                            <div style={{ fontWeight: 600, color: "var(--ink)", fontSize: "0.875rem" }}>
                              {item.title}
                            </div>
                            {item.note && (
                              <div style={{ fontSize: "0.75rem", color: "var(--ink-soft)", marginTop: "1px" }}>
                                {item.note}
                              </div>
                            )}

                            {!isIncome && item.debt && (
                              <div style={{ marginTop: "0.25rem" }}>
                                <button
                                  type="button"
                                  disabled={!canEditExpense}
                                  onClick={() => canEditExpense && handleToggleDebtPaid(item.debt!.id)}
                                  title={canEditExpense ? "คลิกเพื่อเปลี่ยนสถานะการจ่ายคืนพนักงาน" : undefined}
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "0.25rem",
                                    fontSize: "0.7rem",
                                    fontWeight: 700,
                                    borderRadius: "9999px",
                                    padding: "0.15rem 0.5rem",
                                    border: item.debt.is_paid
                                      ? "1px solid rgba(75, 155, 140, 0.3)"
                                      : "1px solid rgba(220, 38, 38, 0.3)",
                                    backgroundColor: item.debt.is_paid
                                      ? "rgba(75, 155, 140, 0.1)"
                                      : "rgba(220, 38, 38, 0.1)",
                                    color: item.debt.is_paid ? "var(--teal)" : "#dc2626",
                                    cursor: canEditExpense ? "pointer" : "default",
                                    fontFamily: "'Kanit', sans-serif",
                                  }}
                                >
                                  {item.debt.is_paid ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />}
                                  <span>
                                    {item.debt.is_paid
                                      ? `จ่ายคืน ${item.debt.staff?.name || "พนักงาน"} แล้ว`
                                      : `ติด ${item.debt.staff?.name || "พนักงาน"} ฿${item.debt.amount.toLocaleString()}`}
                                  </span>
                                </button>
                              </div>
                            )}
                          </td>

                          {/* Category */}
                          <td style={{ padding: "0.5rem 0.6rem" }}>
                            <span
                              style={{
                                fontSize: "0.75rem",
                                padding: "0.2rem 0.55rem",
                                borderRadius: "0.45rem",
                                backgroundColor: "var(--cream)",
                                border: "1px solid rgba(50,55,65,0.1)",
                                color: "var(--ink-soft)",
                                fontWeight: 600,
                                display: "inline-block",
                              }}
                            >
                              {item.category}
                            </span>
                          </td>

                          {/* Amount */}
                          <td style={{ padding: "0.5rem 0.6rem", textAlign: "right" }}>
                            <span
                              className="font-display"
                              style={{
                                fontWeight: 800,
                                fontSize: "1.05rem",
                                color: isIncome ? "var(--teal)" : "var(--warm)",
                              }}
                            >
                              {isIncome ? "+" : "-"}฿{item.amount.toLocaleString()}
                            </span>
                          </td>

                          {/* Actions */}
                          <td style={{ padding: "0.5rem 0.6rem", textAlign: "center" }}>
                            {canEditExpense ? (
                              <div style={{ display: "flex", gap: "0.35rem", justifyContent: "center" }}>
                                <button
                                  type="button"
                                  onClick={() => openEditModal(item)}
                                  title="แก้ไข"
                                  style={{
                                    width: "30px",
                                    height: "30px",
                                    borderRadius: "0.5rem",
                                    border: "1px solid rgba(50,55,65,0.12)",
                                    backgroundColor: "var(--cream)",
                                    color: "var(--ink-soft)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: "pointer",
                                    transition: "all 0.15s ease",
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
                                    borderRadius: "0.5rem",
                                    border: "1px solid rgba(220,38,38,0.2)",
                                    backgroundColor: "rgba(220,38,38,0.05)",
                                    color: "#dc2626",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: "pointer",
                                    transition: "all 0.15s ease",
                                  }}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            ) : (
                              <span style={{ color: "var(--ink-soft)", fontSize: "0.75rem" }}>-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile / Narrow Screen: Cards View */}
            <div className="admin-cards-view">
              {transactions.length === 0 ? (
                <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: "var(--ink-soft)" }}>
                  <Receipt size={36} color="var(--ink-soft)" style={{ margin: "0 auto 0.5rem", opacity: 0.5 }} />
                  <p style={{ fontWeight: 600 }}>ไม่พบรายการบันทึกรายรับ-รายจ่ายตามเงื่อนไข</p>
                </div>
              ) : (
                transactions.map((item, idx) => {
                  const isIncome = item.type === "income";
                  const runningNumber = (page - 1) * pageSize + idx + 1;

                  return (
                    <div
                      key={item.id}
                      style={{
                        backgroundColor: "var(--cream)",
                        border: "1px solid rgba(50, 55, 65, 0.1)",
                        borderRadius: "0.75rem",
                        padding: "0.85rem 0.95rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.6rem",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <span
                            className="font-mono"
                            style={{
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              color: "var(--ink-soft)",
                              backgroundColor: "rgba(50, 55, 65, 0.08)",
                              padding: "0.15rem 0.45rem",
                              borderRadius: "0.35rem",
                            }}
                          >
                            #{runningNumber}
                          </span>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.25rem",
                              borderRadius: "9999px",
                              padding: "0.15rem 0.5rem",
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              backgroundColor: isIncome ? "rgba(75, 155, 140, 0.12)" : "rgba(245, 158, 11, 0.12)",
                              color: isIncome ? "var(--teal)" : "var(--warm)",
                            }}
                          >
                            {isIncome ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                            <span>{isIncome ? "รายรับ" : "รายจ่าย"}</span>
                          </span>
                          <span
                            style={{
                              fontSize: "0.7rem",
                              padding: "0.15rem 0.45rem",
                              borderRadius: "0.35rem",
                              backgroundColor: "rgba(50,55,65,0.06)",
                              color: "var(--ink-soft)",
                              fontWeight: 600,
                            }}
                          >
                            {item.category}
                          </span>
                        </div>

                        {canEditExpense && (
                          <div style={{ display: "flex", gap: "0.35rem" }}>
                            <button
                              type="button"
                              onClick={() => openEditModal(item)}
                              style={{
                                padding: "0.3rem",
                                borderRadius: "0.4rem",
                                border: "1px solid rgba(50,55,65,0.12)",
                                backgroundColor: "var(--card)",
                                color: "var(--ink)",
                                cursor: "pointer",
                              }}
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTransaction(item.id)}
                              style={{
                                padding: "0.3rem",
                                borderRadius: "0.4rem",
                                border: "1px solid rgba(220,38,38,0.2)",
                                backgroundColor: "rgba(220,38,38,0.05)",
                                color: "#dc2626",
                                cursor: "pointer",
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <div>
                          <div style={{ fontSize: "0.925rem", fontWeight: 700, color: "var(--ink)" }}>{item.title}</div>
                          {item.note && (
                            <div style={{ fontSize: "0.75rem", color: "var(--ink-soft)", marginTop: "2px" }}>
                              {item.note}
                            </div>
                          )}
                        </div>
                        <div
                          className="font-display"
                          style={{
                            fontWeight: 900,
                            fontSize: "1.15rem",
                            color: isIncome ? "var(--teal)" : "var(--warm)",
                          }}
                        >
                          {isIncome ? "+" : "-"}฿{item.amount.toLocaleString()}
                        </div>
                      </div>

                      {!isIncome && item.debt && (
                        <div style={{ paddingTop: "0.2rem" }}>
                          <button
                            type="button"
                            disabled={!canEditExpense}
                            onClick={() => canEditExpense && handleToggleDebtPaid(item.debt!.id)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.25rem",
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              borderRadius: "9999px",
                              padding: "0.15rem 0.5rem",
                              border: item.debt.is_paid
                                ? "1px solid rgba(75, 155, 140, 0.3)"
                                : "1px solid rgba(220, 38, 38, 0.3)",
                              backgroundColor: item.debt.is_paid
                                ? "rgba(75, 155, 140, 0.1)"
                                : "rgba(220, 38, 38, 0.1)",
                              color: item.debt.is_paid ? "var(--teal)" : "#dc2626",
                              cursor: canEditExpense ? "pointer" : "default",
                            }}
                          >
                            {item.debt.is_paid ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />}
                            <span>
                              {item.debt.is_paid
                                ? `จ่ายคืน ${item.debt.staff?.name || "พนักงาน"} แล้ว`
                                : `ติด ${item.debt.staff?.name || "พนักงาน"} ฿${item.debt.amount.toLocaleString()}`}
                            </span>
                          </button>
                        </div>
                      )}

                      <div style={{ borderTop: "1px solid rgba(50,55,65,0.06)", paddingTop: "0.4rem", fontSize: "0.725rem", color: "var(--ink-soft)" }}>
                        วัน-เวลา: {item.date_time ? item.date_time.replace("T", " ").substring(0, 16) : "-"}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination Controls (Standard Slip Check / Account Style) */}
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
                  <CustomDropdown
                    options={[
                      { value: 5, label: "5 รายการ / หน้า" },
                      { value: 10, label: "10 รายการ / หน้า" },
                      { value: 20, label: "20 รายการ / หน้า" },
                      { value: 50, label: "50 รายการ / หน้า" },
                    ]}
                    value={pageSize}
                    onChange={(val) => {
                      setPageSize(Number(val));
                      setPage(1);
                    }}
                    size="sm"
                    minWidth="140px"
                  />
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  style={{
                    padding: "0.35rem 0.65rem",
                    borderRadius: "0.4rem",
                    border: "1px solid rgba(50, 55, 65, 0.15)",
                    backgroundColor: "var(--cream)",
                    color: page <= 1 ? "rgba(50, 55, 65, 0.3)" : "var(--ink)",
                    cursor: page <= 1 ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    fontSize: "0.8rem",
                    fontFamily: "'Kanit', sans-serif",
                  }}
                >
                  <ChevronLeft size={14} />
                  <span style={{ marginLeft: "2px" }}>ก่อนหน้า</span>
                </button>

                {/* Page Number Buttons */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = i + 1;
                  if (totalPages > 5 && page > 3) {
                    pageNum = Math.min(page - 2 + i, totalPages - 4 + i);
                  }
                  const isCurrent = page === pageNum;
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setPage(pageNum)}
                      style={{
                        minWidth: "28px",
                        height: "28px",
                        padding: "0 0.4rem",
                        borderRadius: "0.4rem",
                        border: isCurrent ? "none" : "1px solid rgba(50, 55, 65, 0.15)",
                        backgroundColor: isCurrent ? "var(--teal)" : "var(--cream)",
                        color: isCurrent ? "#fff" : "var(--ink)",
                        fontWeight: isCurrent ? 700 : 500,
                        fontSize: "0.8rem",
                        cursor: "pointer",
                        fontFamily: "'Kanit', sans-serif",
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  style={{
                    padding: "0.35rem 0.65rem",
                    borderRadius: "0.4rem",
                    border: "1px solid rgba(50, 55, 65, 0.15)",
                    backgroundColor: "var(--cream)",
                    color: page >= totalPages ? "rgba(50, 55, 65, 0.3)" : "var(--ink)",
                    cursor: page >= totalPages ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    fontSize: "0.8rem",
                    fontFamily: "'Kanit', sans-serif",
                  }}
                >
                  <span style={{ marginRight: "2px" }}>ถัดไป</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ============================================================== */}
        {/* TAB 2: DEBT & STAFF ADVANCE PAYMENTS MANAGEMENT                */}
        {/* ============================================================== */}
        {activeTab === "debts" && (
          <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Staff Debt Overview Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
              <div
                style={{
                  backgroundColor: "var(--card)",
                  borderRadius: "1.25rem",
                  padding: "1.25rem 1.5rem",
                  border: "1px solid rgba(50, 55, 65, 0.08)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                }}
              >
                <div style={{ fontSize: "0.85rem", color: "var(--ink-soft)", fontWeight: 600 }}>
                  ยอดติดเงินพนักงานทั้งหมด (ยังไม่ได้จ่าย)
                </div>
                <div className="font-display" style={{ fontSize: "1.85rem", fontWeight: 800, color: "#dc2626", marginTop: "0.4rem" }}>
                  ฿{totalUnpaidDebt.toLocaleString()}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--ink-soft)", marginTop: "0.25rem" }}>
                  คำนวณจากรายการที่พนักงานสำรองจ่ายและยังไม่ได้ชำระคืน
                </div>
              </div>

              {staffDebtSummaries.map((s) => (
                <div
                  key={s.staff_id}
                  style={{
                    backgroundColor: "var(--card)",
                    borderRadius: "1.25rem",
                    padding: "1.25rem 1.5rem",
                    border: "1px solid rgba(50, 55, 65, 0.08)",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--ink)" }}>{s.staff_name}</div>
                    {s.unpaid_count > 0 ? (
                      <span style={{ fontSize: "0.7rem", backgroundColor: "rgba(220, 38, 38, 0.1)", color: "#dc2626", borderRadius: "9999px", padding: "0.15rem 0.5rem", fontWeight: 700 }}>
                        ค้าง {s.unpaid_count} รายการ
                      </span>
                    ) : (
                      <span style={{ fontSize: "0.7rem", backgroundColor: "rgba(75, 155, 140, 0.1)", color: "var(--teal)", borderRadius: "9999px", padding: "0.15rem 0.5rem", fontWeight: 700 }}>
                        ครบถ้วนแล้ว
                      </span>
                    )}
                  </div>

                  <div className="font-display" style={{ fontSize: "1.5rem", fontWeight: 800, color: s.unpaid_amount > 0 ? "#dc2626" : "var(--teal)", marginTop: "0.4rem" }}>
                    ฿{s.unpaid_amount.toLocaleString()}
                  </div>

                  <div style={{ fontSize: "0.75rem", color: "var(--ink-soft)", marginTop: "0.2rem" }}>
                    ชำระคืนแล้วสะสม: ฿{s.paid_amount.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            {/* Debt Table Section */}
            <section
              style={{
                backgroundColor: "var(--card)",
                borderRadius: "1.25rem",
                padding: "1.5rem",
                border: "1px solid rgba(50, 55, 65, 0.1)",
                boxShadow: "0 4px 20px -2px rgba(0,0,0,0.03)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div className="admin-controls-bar">
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Users size={20} color="var(--teal)" />
                  <h2 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0 }}>
                    รายการพนักงานออกเงินก่อน (Debt Records)
                  </h2>
                </div>

                <div className="admin-search-wrapper">
                  <CustomDropdown
                    options={[
                      { value: "all", label: "สถานะ: ทั้งหมด" },
                      { value: "unpaid", label: "เฉพาะยังไม่ได้จ่าย (ค้างชำระ)" },
                      { value: "paid", label: "เฉพาะจ่ายคืนแล้ว" },
                    ]}
                    value={debtFilterPaid}
                    onChange={(val) => setDebtFilterPaid(val as any)}
                    minWidth="180px"
                  />
                </div>
              </div>

              {/* Desktop / Tablet: Debt Table View */}
              <div className="admin-table-view" style={{ overflowX: "visible" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem", tableLayout: "fixed" }}>
                  <thead>
                    <tr
                      style={{
                        borderBottom: "2px solid rgba(50, 55, 65, 0.12)",
                        color: "var(--ink)",
                        fontSize: "0.925rem",
                        fontWeight: 600,
                        height: "48px",
                        letterSpacing: "0.01em",
                      }}
                    >
                      <th style={{ padding: "0.6rem", width: "160px", color: "var(--ink)" }}>พนักงานที่ออกก่อน</th>
                      <th style={{ padding: "0.6rem", color: "var(--ink)" }}>รายการรายจ่าย</th>
                      <th style={{ padding: "0.6rem", width: "130px", color: "var(--ink)", textAlign: "right" }}>จำนวนเงิน</th>
                      <th style={{ padding: "0.6rem", width: "130px", color: "var(--ink)" }}>สถานะ</th>
                      <th style={{ padding: "0.6rem", width: "140px", color: "var(--ink)" }}>ผู้คืนเงิน</th>
                      <th style={{ padding: "0.6rem", width: "140px", textAlign: "center" }}>จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {debtsList.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: "center", height: "200px", padding: "1rem", color: "var(--ink-soft)" }}>
                          <Users size={32} color="var(--ink-soft)" style={{ margin: "0 auto 0.5rem", opacity: 0.5 }} />
                          <p style={{ fontWeight: 600 }}>ไม่พบรายการค้างชำระพนักงาน</p>
                        </td>
                      </tr>
                    ) : (
                      debtsList.map((d, idx) => {
                        const isLastRow = idx === debtsList.length - 1;
                        return (
                          <tr
                            key={d.id}
                            style={{
                              borderBottom: isLastRow ? "none" : "1px solid rgba(50, 55, 65, 0.06)",
                              transition: "background-color 0.15s ease",
                              height: "54px",
                              boxSizing: "border-box",
                            }}
                          >
                            <td style={{ padding: "0.5rem 0.6rem" }}>
                              <div style={{ fontWeight: 700, color: "var(--ink)", fontSize: "0.875rem" }}>
                                {d.staff?.name || "ไม่ระบุ"}
                              </div>
                              <div className="font-mono" style={{ fontSize: "0.725rem", color: "var(--ink-soft)" }}>
                                @{d.staff?.username || "-"}
                              </div>
                            </td>
                            <td style={{ padding: "0.5rem 0.6rem", overflow: "hidden", textOverflow: "ellipsis" }}>
                              <div style={{ fontWeight: 600, color: "var(--ink)", fontSize: "0.875rem" }}>
                                {d.cash_transaction?.title || "รายการรายจ่าย"}
                              </div>
                              {d.note && (
                                <div style={{ fontSize: "0.75rem", color: "var(--ink-soft)", marginTop: "1px" }}>
                                  {d.note}
                                </div>
                              )}
                            </td>
                            <td style={{ padding: "0.5rem 0.6rem", textAlign: "right" }}>
                              <span className="font-display" style={{ fontWeight: 800, fontSize: "1.05rem", color: "#dc2626" }}>
                                ฿{d.amount.toLocaleString()}
                              </span>
                            </td>
                            <td style={{ padding: "0.5rem 0.6rem" }}>
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.25rem",
                                  borderRadius: "9999px",
                                  padding: "0.2rem 0.55rem",
                                  fontSize: "0.75rem",
                                  fontWeight: 700,
                                  backgroundColor: d.is_paid ? "rgba(75, 155, 140, 0.12)" : "rgba(220, 38, 38, 0.12)",
                                  color: d.is_paid ? "var(--teal)" : "#dc2626",
                                }}
                              >
                                {d.is_paid ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                                <span>{d.is_paid ? "จ่ายคืนแล้ว" : "ยังไม่ได้จ่าย"}</span>
                              </span>
                            </td>
                            <td style={{ padding: "0.5rem 0.6rem" }}>
                              {d.is_paid && d.paid_by_staff ? (
                                <div style={{ fontSize: "0.825rem", fontWeight: 700, color: "var(--teal)" }}>
                                  {d.paid_by_staff.name}
                                </div>
                              ) : (
                                <span style={{ color: "var(--ink-soft)", fontSize: "0.8rem" }}>-</span>
                              )}
                            </td>
                            <td style={{ padding: "0.5rem 0.6rem", textAlign: "center" }}>
                              {canEditExpense ? (
                                <button
                                  type="button"
                                  onClick={() => handleToggleDebtPaid(d.id)}
                                  style={{
                                    padding: "0.35rem 0.75rem",
                                    borderRadius: "0.5rem",
                                    border: "none",
                                    backgroundColor: d.is_paid ? "var(--cream)" : "var(--teal)",
                                    color: d.is_paid ? "var(--ink)" : "#fff",
                                    fontWeight: 700,
                                    fontSize: "0.775rem",
                                    cursor: "pointer",
                                    fontFamily: "'Kanit', sans-serif",
                                    boxShadow: d.is_paid ? "none" : "0 2px 8px rgba(75,155,140,0.25)",
                                  }}
                                >
                                  {d.is_paid ? "เป็นยังไม่ได้จ่าย" : "จ่ายคืนแล้ว"}
                                </button>
                              ) : (
                                <span style={{ color: "var(--ink-soft)", fontSize: "0.75rem" }}>-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile / Narrow Screen: Debt Cards View */}
              <div className="admin-cards-view">
                {debtsList.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: "var(--ink-soft)" }}>
                    <Users size={36} color="var(--ink-soft)" style={{ margin: "0 auto 0.5rem", opacity: 0.5 }} />
                    <p style={{ fontWeight: 600 }}>ไม่พบรายการค้างชำระพนักงาน</p>
                  </div>
                ) : (
                  debtsList.map((d) => (
                    <div
                      key={d.id}
                      style={{
                        backgroundColor: "var(--cream)",
                        border: "1px solid rgba(50, 55, 65, 0.1)",
                        borderRadius: "0.75rem",
                        padding: "0.85rem 0.95rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontWeight: 700, color: "var(--ink)", fontSize: "0.9rem" }}>
                            {d.staff?.name || "ไม่ระบุ"}
                          </div>
                          <div className="font-mono" style={{ fontSize: "0.75rem", color: "var(--ink-soft)" }}>
                            @{d.staff?.username || "-"}
                          </div>
                        </div>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.25rem",
                            borderRadius: "9999px",
                            padding: "0.15rem 0.5rem",
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            backgroundColor: d.is_paid ? "rgba(75, 155, 140, 0.12)" : "rgba(220, 38, 38, 0.12)",
                            color: d.is_paid ? "var(--teal)" : "#dc2626",
                          }}
                        >
                          {d.is_paid ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />}
                          <span>{d.is_paid ? "จ่ายคืนแล้ว" : "ยังไม่ได้จ่าย"}</span>
                        </span>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontSize: "0.85rem", color: "var(--ink)" }}>{d.cash_transaction?.title}</div>
                        <div className="font-display" style={{ fontWeight: 900, fontSize: "1.1rem", color: "#dc2626" }}>
                          ฿{d.amount.toLocaleString()}
                        </div>
                      </div>

                      <div style={{ borderTop: "1px solid rgba(50,55,65,0.06)", paddingTop: "0.4rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontSize: "0.75rem", color: "var(--ink-soft)" }}>
                          {d.is_paid && d.paid_by_staff ? `คืนโดย: ${d.paid_by_staff.name}` : ""}
                        </div>
                        {canEditExpense && (
                          <button
                            type="button"
                            onClick={() => handleToggleDebtPaid(d.id)}
                            style={{
                              padding: "0.3rem 0.7rem",
                              borderRadius: "0.4rem",
                              border: "none",
                              backgroundColor: d.is_paid ? "var(--card)" : "var(--teal)",
                              color: d.is_paid ? "var(--ink)" : "#fff",
                              fontWeight: 700,
                              fontSize: "0.75rem",
                              cursor: "pointer",
                            }}
                          >
                            {d.is_paid ? "เป็นยังไม่ได้จ่าย" : "จ่ายคืนแล้ว"}
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: PROMPTPAY QR SETTINGS                                   */}
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

                {canEditQr && (
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
                )}
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
                      border: formType === "expense" ? "2px solid var(--warm)" : "1px solid rgba(50,55,65,0.15)",
                      backgroundColor: formType === "expense" ? "rgba(245,158,11,0.08)" : "var(--cream)",
                      color: formType === "expense" ? "var(--warm)" : "var(--ink)",
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
                      setPaidByStaffId("");
                    }}
                    style={{
                      flex: 1,
                      padding: "0.6rem",
                      borderRadius: "0.6rem",
                      border: formType === "income" ? "2px solid var(--teal)" : "1px solid rgba(50,55,65,0.15)",
                      backgroundColor: formType === "income" ? "rgba(75,155,140,0.08)" : "var(--cream)",
                      color: formType === "income" ? "var(--teal)" : "var(--ink)",
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
                    <CustomDropdown
                      options={[
                        { value: "วัตถุดิบ", label: "วัตถุดิบ" },
                        { value: "บรรจุภัณฑ์", label: "บรรจุภัณฑ์" },
                        { value: "อื่นๆ", label: "อื่นๆ" },
                      ]}
                      value={formCategory}
                      onChange={(val) => setFormCategory(val)}
                      minWidth="100%"
                    />
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

                {/* Staff Advance Payment (Debt Section - only for Expense) */}
                {formType === "expense" && (
                  <div
                    style={{
                      marginBottom: "1rem",
                      padding: "0.85rem",
                      borderRadius: "0.75rem",
                      backgroundColor: "rgba(50,55,65,0.03)",
                      border: "1px solid rgba(50,55,65,0.08)",
                    }}
                  >
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.35rem" }}>
                      ผู้สำรองจ่าย / ใครออกเงินก่อน (Debt System)
                    </label>

                    <CustomDropdown
                      options={[
                        { value: "", label: "-- ไม่ระบุ (เงินกองกลาง/ร้านจ่ายตรง) --" },
                        ...staffList.map((s) => ({
                          value: String(s.id),
                          label: `${s.name} (${s.role?.name_th || "Staff"})`,
                        })),
                      ]}
                      value={paidByStaffId}
                      onChange={(val) => setPaidByStaffId(val)}
                      minWidth="100%"
                    />

                    {paidByStaffId !== "" && (
                      <div style={{ marginTop: "0.75rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
                        <input
                          type="checkbox"
                          id="isPaidDebtCheckbox"
                          checked={isPaidDebt}
                          onChange={(e) => setIsPaidDebt(e.target.checked)}
                          style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "var(--teal)" }}
                        />
                        <label
                          htmlFor="isPaidDebtCheckbox"
                          style={{ fontSize: "0.825rem", fontWeight: 600, color: isPaidDebt ? "var(--teal)" : "#dc2626", cursor: "pointer" }}
                        >
                          {isPaidDebt ? "🟢 จ่ายคืนพนักงานเรียบร้อยแล้ว" : "🔴 ติดเงินไว้ (ยังไม่ได้จ่ายคืนพนักงาน)"}
                        </label>
                      </div>
                    )}
                  </div>
                )}

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
