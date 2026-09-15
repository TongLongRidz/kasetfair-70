"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import AdminSidebar from "@/components/layouts/AdminSidebar";
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
  CheckCircle2,
  Calendar,
  Tag,
  FileText,
  AlertCircle,
  Sparkles,
  X,
  CreditCard,
} from "lucide-react";

interface Transaction {
  id: string;
  type: "income" | "expense";
  category: string;
  title: string;
  amount: number;
  date: string;
  note?: string;
}

const INITIAL_EXPENSES: Transaction[] = [
  {
    id: "tx-1",
    type: "income",
    category: "ขายเครื่องดื่มหน้าร้าน",
    title: "ยอดขายหน้าร้าน (รอบเช้า)",
    amount: 3450,
    date: "2026-09-11 10:30",
    note: "ยอดขาย 69 แก้ว",
  },
  {
    id: "tx-2",
    type: "expense",
    category: "วัตถุดิบ",
    title: "ซื้อถั่วเหลืองออร์แกนิค 10 กก.",
    amount: 650,
    date: "2026-09-11 08:00",
    note: "ร้านเจ๊หมวย ตลาดสด",
  },
  {
    id: "tx-3",
    type: "expense",
    category: "บรรจุภัณฑ์",
    title: "แก้ว PLA รักษ์โลก + ฝา + หลอด 300 ชุด",
    amount: 480,
    date: "2026-09-10 16:30",
    note: "แพ็คแก้วสำหรับงานเกษตรแฟร์",
  },
  {
    id: "tx-4",
    type: "expense",
    category: "วัตถุดิบ",
    title: "ไข่มุกบราวน์ชูการ์ + เฉาก๊วย + สาคู",
    amount: 390,
    date: "2026-09-10 14:15",
    note: "ท็อปปิ้งสำหรับเติมสต็อก",
  },
  {
    id: "tx-5",
    type: "income",
    category: "ขายเครื่องดื่มหน้าร้าน",
    title: "ยอดขายหน้าร้าน (รอบบ่าย)",
    amount: 5200,
    date: "2026-09-10 19:00",
    note: "ยอดขาย 104 แก้ว",
  },
  {
    id: "tx-6",
    type: "expense",
    category: "ค่าสถานที่/บูธ",
    title: "ค่าเช่าพื้นที่บูธงานเกษตรแฟร์ 70 (มัดจำ)",
    amount: 2500,
    date: "2026-09-08 11:00",
    note: "โซนอาหารและเครื่องดื่ม บูธ B12",
  },
];

export default function AdminExpensePage() {
  const [activeTab, setActiveTab] = useState<"records" | "qr_settings">("records");

  // Transactions State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State for Add/Edit Transaction
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formType, setFormType] = useState<"income" | "expense">("expense");
  const [formCategory, setFormCategory] = useState("วัตถุดิบ");
  const [formTitle, setFormTitle] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().substring(0, 16));
  const [formNote, setFormNote] = useState("");

  // PromptPay Settings State
  const [promptpayAccount, setPromptpayAccount] = useState("0812345678");
  const [promptpayName, setPromptpayName] = useState("ถั่วทอง น้ำเต้าหู้");
  const [testAmount, setTestAmount] = useState<string>("50");
  const [previewQrUrl, setPreviewQrUrl] = useState<string>("");
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  // 1. Load Data from localStorage
  useEffect(() => {
    try {
      const savedTx = localStorage.getItem("kaset_expenses");
      if (savedTx) {
        const parsed = JSON.parse(savedTx);
        if (Array.isArray(parsed)) {
          setTransactions(parsed);
        } else {
          setTransactions(INITIAL_EXPENSES);
        }
      } else {
        setTransactions(INITIAL_EXPENSES);
      }

      const savedAcc = localStorage.getItem("kaset_promptpay_account");
      if (savedAcc) setPromptpayAccount(savedAcc);

      const savedName = localStorage.getItem("kaset_promptpay_name");
      if (savedName) setPromptpayName(savedName);
    } catch {
      setTransactions(INITIAL_EXPENSES);
    }
  }, []);

  // 2. Save Transactions to localStorage
  const saveTransactionsToStorage = (updated: Transaction[]) => {
    setTransactions(updated);
    try {
      localStorage.setItem("kaset_expenses", JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save expenses to localStorage", e);
    }
  };

  // 3. Generate QR Preview
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
  const handleSavePromptpaySettings = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem("kaset_promptpay_account", promptpayAccount.trim());
      localStorage.setItem("kaset_promptpay_name", promptpayName.trim());
      setSaveSuccessNotice(true);
      setTimeout(() => setSaveSuccessNotice(false), 3000);
    } catch (err) {
      console.error("Error saving promptpay settings:", err);
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
  const openEditModal = (tx: Transaction) => {
    setModalMode("edit");
    setEditingId(tx.id);
    setFormType(tx.type);
    setFormCategory(tx.category);
    setFormTitle(tx.title);
    setFormAmount(String(tx.amount));
    setFormDate(tx.date.includes("T") ? tx.date : tx.date.replace(" ", "T"));
    setFormNote(tx.note || "");
    setIsModalOpen(true);
  };

  // Delete Transaction
  const handleDeleteTransaction = (id: string) => {
    if (confirm("คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?")) {
      const updated = transactions.filter((t) => t.id !== id);
      saveTransactionsToStorage(updated);
    }
  };

  // Submit Add / Edit Form
  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formAmount) {
      alert("กรุณากรอกชื่อรายการและจำนวนเงิน");
      return;
    }

    const numAmount = Math.abs(Number(formAmount)) || 0;
    const formattedDate = formDate.replace("T", " ");

    if (modalMode === "create") {
      const newTx: Transaction = {
        id: `tx-${Date.now()}`,
        type: formType,
        category: formCategory,
        title: formTitle.trim(),
        amount: numAmount,
        date: formattedDate,
        note: formNote.trim() || undefined,
      };
      saveTransactionsToStorage([newTx, ...transactions]);
    } else if (editingId) {
      const updated = transactions.map((t) =>
        t.id === editingId
          ? {
              ...t,
              type: formType,
              category: formCategory,
              title: formTitle.trim(),
              amount: numAmount,
              date: formattedDate,
              note: formNote.trim() || undefined,
            }
          : t
      );
      saveTransactionsToStorage(updated);
    }

    setIsModalOpen(false);
  };

  // Calculated Stats
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalIncome - totalExpense;

  // Filtered List
  const filteredTransactions = transactions.filter((t) => {
    if (filterType !== "all" && t.type !== filterType) return false;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(query);
      const matchCategory = t.category.toLowerCase().includes(query);
      const matchNote = (t.note || "").toLowerCase().includes(query);
      return matchTitle || matchCategory || matchNote;
    }
    return true;
  });

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
              <h1 style={{ fontSize: "1.75rem", fontWeight: 800, lineHeight: 1.2 }}>
                บันทึกรายรับ-รายจ่าย & จัดการ QR รับเงิน
              </h1>
              <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)", marginTop: "0.25rem" }}>
                บันทึกต้นทุนรายจ่าย ติดตามกำไรสุทธิ และตั้งค่าบัญชีพร้อมเพย์รับชำระเงิน
              </p>
            </div>
          </div>

          {/* Main Top Navigation Tabs */}
          <div style={{ marginTop: "1.25rem", display: "flex", gap: "0.5rem" }}>
            <button
              type="button"
              onClick={() => setActiveTab("records")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.6rem 1.25rem",
                borderRadius: "0.75rem",
                fontSize: "0.9rem",
                fontWeight: activeTab === "records" ? 700 : 500,
                fontFamily: "'Kanit', sans-serif",
                border: "none",
                cursor: "pointer",
                backgroundColor: activeTab === "records" ? "var(--ink)" : "var(--card)",
                color: activeTab === "records" ? "var(--cream)" : "var(--ink-soft)",
                boxShadow: activeTab === "records" ? "0 4px 12px rgba(0,0,0,0.15)" : "0 1px 4px rgba(0,0,0,0.04)",
                transition: "all 0.15s ease",
              }}
            >
              <Wallet size={16} />
              <span>บันทึกรายรับ-รายจ่าย</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("qr_settings")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.6rem 1.25rem",
                borderRadius: "0.75rem",
                fontSize: "0.9rem",
                fontWeight: activeTab === "qr_settings" ? 700 : 500,
                fontFamily: "'Kanit', sans-serif",
                border: "none",
                cursor: "pointer",
                backgroundColor: activeTab === "qr_settings" ? "var(--ink)" : "var(--card)",
                color: activeTab === "qr_settings" ? "var(--cream)" : "var(--ink-soft)",
                boxShadow: activeTab === "qr_settings" ? "0 4px 12px rgba(0,0,0,0.15)" : "0 1px 4px rgba(0,0,0,0.04)",
                transition: "all 0.15s ease",
              }}
            >
              <QrCode size={16} />
              <span>จัดการ QR รับเงิน (พร้อมเพย์)</span>
            </button>
          </div>

          {/* ============================================================== */}
          {/* TAB 1: RECORD EXPENSE & INCOME                                */}
          {/* ============================================================== */}
          {activeTab === "records" && (
            <div className="animate-fade-in" style={{ marginTop: "1.25rem" }}>
              {/* Summary Stats Cards (อ้างอิงขนาดและ responsive ตามหน้า dashboard) */}
              <div className="admin-kpi-grid" style={{ marginBottom: "1.25rem" }}>
                {/* 1. Income Card */}
                <div
                  className="admin-kpi-card animate-rise"
                  style={{
                    backgroundColor: "var(--card)",
                    padding: "1.25rem 1.35rem",
                    border: "1px solid rgba(50, 55, 65, 0.09)",
                    boxShadow: "0 2px 12px -2px rgba(0,0,0,0.03)",
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
                    <p style={{ fontSize: "0.75rem", color: "var(--ink-soft)", fontWeight: 400, lineHeight: 1.3, margin: 0 }}>
                      บันทึก {transactions.filter((t) => t.type === "income").length} รายการ
                    </p>
                  </div>
                </div>

                {/* 2. Expense Card */}
                <div
                  className="admin-kpi-card animate-rise"
                  style={{
                    backgroundColor: "var(--card)",
                    padding: "1.25rem 1.35rem",
                    border: "1px solid rgba(50, 55, 65, 0.09)",
                    boxShadow: "0 2px 12px -2px rgba(0,0,0,0.03)",
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
                    <p style={{ fontSize: "0.75rem", color: "var(--ink-soft)", fontWeight: 400, lineHeight: 1.3, margin: 0 }}>
                      บันทึก {transactions.filter((t) => t.type === "expense").length} รายการ
                    </p>
                  </div>
                </div>

                {/* 3. Net Profit Card */}
                <div
                  className="admin-kpi-card animate-rise"
                  style={{
                    backgroundColor: "var(--card)",
                    padding: "1.25rem 1.35rem",
                    border: "1px solid rgba(50, 55, 65, 0.09)",
                    boxShadow: "0 2px 12px -2px rgba(0,0,0,0.03)",
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
                    <p style={{ fontSize: "0.75rem", color: "var(--ink-soft)", fontWeight: 400, lineHeight: 1.3, margin: 0 }}>
                      คำนวณสุทธิจากรายรับและรายจ่าย
                    </p>
                  </div>
                </div>

                {/* Ghost card for row balancing on mobile (2 cols) and wide screens (6 cols) */}
                <div className="admin-kpi-card admin-kpi-card-ghost" aria-hidden="true" />
              </div>

              {/* Control & Search Bar */}
              <div
                style={{
                  marginTop: "1.25rem",
                  backgroundColor: "var(--card)",
                  padding: "1.25rem",
                  borderRadius: "1.25rem",
                  border: "1px solid rgba(50, 55, 65, 0.08)",
                  boxShadow: "0 4px 16px -2px rgba(0,0,0,0.02)",
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "1rem",
                }}
              >
                {/* Filter Tabs */}
                <div style={{ display: "flex", gap: "0.4rem" }}>
                  {[
                    { id: "all", label: "ทั้งหมด" },
                    { id: "income", label: "เฉพาะรายรับ" },
                    { id: "expense", label: "เฉพาะรายจ่าย" },
                  ].map((tab) => {
                    const isSelected = filterType === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setFilterType(tab.id as any)}
                        style={{
                          padding: "0.4rem 0.85rem",
                          borderRadius: "0.5rem",
                          fontSize: "0.8rem",
                          fontWeight: isSelected ? 700 : 500,
                          fontFamily: "'Kanit', sans-serif",
                          border: "none",
                          cursor: "pointer",
                          backgroundColor: isSelected ? "var(--ink)" : "var(--cream)",
                          color: isSelected ? "var(--cream)" : "var(--ink)",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {/* Right: Search & Add Button */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                  <div className="admin-search-box" style={{ maxWidth: "240px" }}>
                    <Search size={14} color="var(--ink-soft)" />
                    <input
                      type="text"
                      placeholder="ค้นหารายการ..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={openAddModal}
                    className="admin-add-btn"
                  >
                    <Plus size={16} />
                    <span>เพิ่มรายการใหม่</span>
                  </button>
                </div>
              </div>

              {/* Transactions List */}
              <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {filteredTransactions.length === 0 ? (
                  <div style={{ padding: "3rem", textAlign: "center", backgroundColor: "var(--card)", borderRadius: "1.25rem", border: "1px dashed rgba(50,55,65,0.15)" }}>
                    <p style={{ color: "var(--ink-soft)", fontSize: "0.9rem" }}>ไม่พบรายการบันทึก</p>
                  </div>
                ) : (
                  filteredTransactions.map((item) => {
                    const isIncome = item.type === "income";
                    return (
                      <div
                        key={item.id}
                        style={{
                          backgroundColor: "var(--card)",
                          borderRadius: "1rem",
                          padding: "1rem 1.25rem",
                          border: "1px solid rgba(50, 55, 65, 0.08)",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "1rem",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "1rem", minWidth: 0 }}>
                          <div
                            style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "0.75rem",
                              backgroundColor: isIncome ? "rgba(34, 197, 94, 0.12)" : "rgba(220, 38, 38, 0.12)",
                              color: isIncome ? "#22c55e" : "#dc2626",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            {isIncome ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                          </div>

                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                              <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {item.title}
                              </h4>
                              <span
                                style={{
                                  fontSize: "0.675rem",
                                  padding: "0.15rem 0.45rem",
                                  borderRadius: "0.35rem",
                                  backgroundColor: "var(--cream)",
                                  border: "1px solid rgba(50,55,65,0.08)",
                                  color: "var(--ink-soft)",
                                  fontWeight: 500,
                                }}
                              >
                                {item.category}
                              </span>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "2px", fontSize: "0.75rem", color: "var(--ink-soft)" }}>
                              <span>{item.date}</span>
                              {item.note && <span>• {item.note}</span>}
                            </div>
                          </div>
                        </div>

                        {/* Amount & Actions */}
                        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexShrink: 0 }}>
                          <span
                            className="font-display"
                            style={{
                              fontSize: "1.15rem",
                              fontWeight: 800,
                              color: isIncome ? "#22c55e" : "#dc2626",
                            }}
                          >
                            {isIncome ? "+" : "-"}฿{item.amount.toLocaleString()}
                          </span>

                          <div style={{ display: "flex", gap: "0.3rem" }}>
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
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: PROMPTPAY QR SETTINGS                                   */}
          {/* ============================================================== */}
          {activeTab === "qr_settings" && (
            <div className="animate-fade-in" style={{ marginTop: "1.25rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", alignItems: "start" }}>
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
                  <h2 style={{ fontSize: "1.2rem", fontWeight: 800 }}>
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

                  {saveSuccessNotice && (
                    <div
                      style={{
                        marginBottom: "1rem",
                        padding: "0.65rem 0.85rem",
                        borderRadius: "0.6rem",
                        backgroundColor: "rgba(34, 197, 94, 0.12)",
                        color: "#22c55e",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4rem",
                      }}
                    >
                      <CheckCircle2 size={16} />
                      <span>บันทึกการตั้งค่าพร้อมเพย์เรียบร้อยแล้ว</span>
                    </div>
                  )}

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
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>ตัวอย่าง QR Code (Live Preview)</h3>
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
                    margin: "0 auto",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
                  }}
                >
                  <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--teal)", marginBottom: "0.5rem" }}>
                    {promptpayName}
                  </p>

                  <div style={{ width: "200px", height: "200px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {previewQrUrl ? (
                      <img src={previewQrUrl} alt="PromptPay Preview" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    ) : (
                      <span style={{ fontSize: "0.75rem", color: "var(--ink-soft)" }}>กรุณาระบุหมายเลขพร้อมเพย์</span>
                    )}
                  </div>


                  <div style={{ marginTop: "0.5rem", padding: "0.3rem 0.75rem", borderRadius: "9999px", backgroundColor: "rgba(75,155,140,0.1)", color: "var(--teal)", fontSize: "0.85rem", fontWeight: 800 }}>
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
        </main>

        {/* Modal for Add / Edit Transaction */}
        {isModalOpen && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0, 0, 0, 0.55)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 100,
              padding: "1rem",
            }}
            onClick={() => setIsModalOpen(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="animate-modal-pop"
              style={{
                backgroundColor: "var(--card)",
                borderRadius: "1.25rem",
                width: "100%",
                maxWidth: "460px",
                padding: "1.75rem",
                boxShadow: "0 25px 50px -12px rgba(0,0,0,0.35)",
                border: "1px solid rgba(50, 55, 65, 0.1)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--ink)" }}>
                  {modalMode === "create" ? "เพิ่มรายการบันทึกใหม่" : "แก้ไขรายการบันทึก"}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ border: "none", background: "none", cursor: "pointer", color: "var(--ink-soft)" }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveTransaction}>
                {/* Type Selector (รายรับ / รายจ่าย) */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem", marginBottom: "1rem" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setFormType("income");
                      setFormCategory("ขายเครื่องดื่มหน้าร้าน");
                    }}
                    style={{
                      padding: "0.6rem",
                      borderRadius: "0.65rem",
                      border: formType === "income" ? "2px solid #22c55e" : "1px solid rgba(50,55,65,0.15)",
                      backgroundColor: formType === "income" ? "rgba(34, 197, 94, 0.12)" : "var(--cream)",
                      color: formType === "income" ? "#15803d" : "var(--ink)",
                      fontWeight: 700,
                      cursor: "pointer",
                      fontSize: "0.875rem",
                    }}
                  >
                    + รายรับ (Income)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormType("expense");
                      setFormCategory("วัตถุดิบ");
                    }}
                    style={{
                      padding: "0.6rem",
                      borderRadius: "0.65rem",
                      border: formType === "expense" ? "2px solid #dc2626" : "1px solid rgba(50,55,65,0.15)",
                      backgroundColor: formType === "expense" ? "rgba(220, 38, 38, 0.12)" : "var(--cream)",
                      color: formType === "expense" ? "#dc2626" : "var(--ink)",
                      fontWeight: 700,
                      cursor: "pointer",
                      fontSize: "0.875rem",
                    }}
                  >
                    - รายจ่าย (Expense)
                  </button>
                </div>

                {/* Category */}
                <div style={{ marginBottom: "0.85rem" }}>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.3rem" }}>
                    หมวดหมู่
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.55rem 0.75rem",
                      borderRadius: "0.6rem",
                      border: "1px solid rgba(50,55,65,0.15)",
                      backgroundColor: "var(--cream)",
                      fontSize: "0.875rem",
                      outline: "none",
                      fontFamily: "'Kanit', sans-serif",
                    }}
                  >
                    {formType === "income" ? (
                      <>
                        <option value="ขายเครื่องดื่มหน้าร้าน">ขายเครื่องดื่มหน้าร้าน</option>
                        <option value="ขายของที่ระลึก">ขายของที่ระลึก</option>
                        <option value="เงินสมทบ/สปอนเซอร์">เงินสมทบ/สปอนเซอร์</option>
                        <option value="รายรับอื่นๆ">รายรับอื่นๆ</option>
                      </>
                    ) : (
                      <>
                        <option value="วัตถุดิบ">วัตถุดิบ (ถั่วเหลือง, น้ำตาล, ชา, ท็อปปิ้ง)</option>
                        <option value="บรรจุภัณฑ์">บรรจุภัณฑ์ (แก้ว, ฝา, หลอด, ถุง)</option>
                        <option value="ค่าสถานที่/บูธ">ค่าสถานที่/บูธ</option>
                        <option value="ค่าแรง/เบี้ยเลี้ยง">ค่าแรง/เบี้ยเลี้ยง</option>
                        <option value="อุปกรณ์">อุปกรณ์และเครื่องมือ</option>
                        <option value="รายจ่ายอื่นๆ">รายจ่ายอื่นๆ</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Title */}
                <div style={{ marginBottom: "0.85rem" }}>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.3rem" }}>
                    ชื่อรายการ <span style={{ color: "#dc2626" }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น ซื้อถั่วเหลือง 10 กก."
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "0.55rem 0.75rem",
                      borderRadius: "0.6rem",
                      border: "1px solid rgba(50,55,65,0.15)",
                      backgroundColor: "var(--cream)",
                      fontSize: "0.875rem",
                      outline: "none",
                      fontFamily: "'Kanit', sans-serif",
                    }}
                  />
                </div>

                {/* Amount & Date in 2 columns */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.85rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.3rem" }}>
                      จำนวนเงิน (บาท) <span style={{ color: "#dc2626" }}>*</span>
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value)}
                      required
                      min="0"
                      step="any"
                      style={{
                        width: "100%",
                        padding: "0.55rem 0.75rem",
                        borderRadius: "0.6rem",
                        border: "1px solid rgba(50,55,65,0.15)",
                        backgroundColor: "var(--cream)",
                        fontSize: "0.95rem",
                        fontWeight: 700,
                        outline: "none",
                        fontFamily: "'Kanit', sans-serif",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.3rem" }}>
                      วันที่/เวลา
                    </label>
                    <input
                      type="datetime-local"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.5rem 0.6rem",
                        borderRadius: "0.6rem",
                        border: "1px solid rgba(50,55,65,0.15)",
                        backgroundColor: "var(--cream)",
                        fontSize: "0.8rem",
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
      </div>
  );
}
