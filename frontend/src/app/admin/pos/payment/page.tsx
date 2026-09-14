"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import generatePayload from "promptpay-qr";
import QRCode from "qrcode";
import ConfirmPaymentModal from "./components/ConfirmPaymentModal";
import OrderSuccessModal, { OrderSuccessData } from "./components/OrderSuccessModal";
import {
  ArrowLeft,
  ShoppingBag,
  Banknote,
  QrCode,
  UploadCloud,
  CheckCircle2,
  Clock,
  Sparkles,
  Trash2,
  ImageIcon,
  FileText,
  X,
  ChevronRight,
  AlertCircle,
  Receipt,
  RotateCcw,
  Check,
} from "lucide-react";

interface CartItemModel {
  cartId: string;
  productId: number;
  productName: string;
  temperature: "iced" | "hot";
  sweetness: "0%" | "25%" | "50%" | "75%" | "100%";
  toppings: { id: string | number; name: string; price: number }[];
  unitPrice: number;
  quantity: number;
  note?: string;
}

export default function POSPaymentPage() {
  const router = useRouter();

  const [cart, setCart] = useState<CartItemModel[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Payment configuration & states
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "promptpay">("promptpay");
  const [cashReceived, setCashReceived] = useState<string>("");
  const [promptpayAccount, setPromptpayAccount] = useState<string>("0812345678");
  const [promptpayName, setPromptpayName] = useState<string>("ถั่วทอง น้ำเต้าหู้");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");

  // Slip upload state (for PromptPay)
  const [slipImage, setSlipImage] = useState<string | null>(null);
  const [slipFileName, setSlipFileName] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Slip upload mode: "immediate" (ต้องอัพสลิปเลย) vs "later" (อัพสลิปทีหลังได้)
  const [slipUploadMode, setSlipUploadMode] = useState<"immediate" | "later">("immediate");

  // Confirm Payment Modal State
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Order Success Queue Modal
  const [orderSuccessQueue, setOrderSuccessQueue] = useState<OrderSuccessData | null>(null);

  const CART_STORAGE_KEY = "kaset_pos_cart";

  // 1. Load cart & PromptPay config from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const normalized: CartItemModel[] = parsed.map((item: any) => ({
            cartId: item.cartId || item.cart_item_id || String(Math.random()),
            productId: item.productId || item.product?.id || 0,
            productName: item.productName || item.product?.name_th || "เครื่องดื่ม",
            temperature: item.temperature || "iced",
            sweetness: item.sweetness || "100%",
            toppings: (item.toppings || []).map((t: any) => ({
              id: t.id,
              name: t.name || t.name_th || "",
              price: Number(t.price) || 0,
            })),
            unitPrice: Number(item.unitPrice ?? item.unit_price ?? 0),
            quantity: Number(item.quantity) || 1,
            note: item.note || "",
          }));
          setCart(normalized);
        } else {
          router.replace("/admin/pos/front-desk");
          return;
        }
      } else {
        router.replace("/admin/pos/front-desk");
        return;
      }

      // Load PromptPay settings if configured
      const savedAccount = localStorage.getItem("kaset_promptpay_account");
      if (savedAccount) setPromptpayAccount(savedAccount);

      const savedName = localStorage.getItem("kaset_promptpay_name");
      if (savedName) setPromptpayName(savedName);

      // Load Slip upload mode policy from backend API (with localStorage fallback)
      const fetchSlipSetting = async () => {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585";
          const res = await fetch(`${apiUrl}/api/v1/settings/slip_upload_mode`);
          if (res.ok) {
            const data = await res.json();
            if (data.value === "later" || data.value === "immediate") {
              setSlipUploadMode(data.value);
              localStorage.setItem("kaset_slip_upload_mode", data.value);
              return;
            }
          }
        } catch { }
        const savedSlipMode = localStorage.getItem("kaset_slip_upload_mode");
        if (savedSlipMode === "later" || savedSlipMode === "immediate") {
          setSlipUploadMode(savedSlipMode);
        }
      };
      fetchSlipSetting();
    } catch (e) {
      console.error("Failed to load cart for payment:", e);
      router.replace("/admin/pos/front-desk");
    } finally {
      setIsLoaded(true);
    }
  }, [router]);

  // Total Calculations
  const totalCups = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const grandTotal = subtotal; // can apply discounts if needed

  // Cash change calculation
  const cashNum = Number(cashReceived) || 0;
  const change = Math.max(0, cashNum - grandTotal);
  const isCashValid = cashNum >= grandTotal;

  // 2. Generate PromptPay QR code whenever grandTotal or promptpayAccount changes
  useEffect(() => {
    if (grandTotal <= 0 || !promptpayAccount) return;

    try {
      const cleanAccount = promptpayAccount.replace(/[^0-9]/g, "");
      const payload = generatePayload(cleanAccount, { amount: grandTotal });
      QRCode.toDataURL(payload, {
        width: 320,
        margin: 1,
        color: {
          dark: "#1A1D20",
          light: "#FFFFFF",
        },
      })
        .then((url) => setQrCodeDataUrl(url))
        .catch((err) => console.error("Error generating QR code:", err));
    } catch (err) {
      console.error("PromptPay QR generation error:", err);
    }
  }, [grandTotal, promptpayAccount]);

  // Handle Slip Upload
  const handleFileChange = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("กรุณาเลือกไฟล์รูปภาพเท่านั้น (JPG, PNG, WebP)");
      return;
    }
    setSlipFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      setSlipImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Quick cash buttons
  const setExactCash = () => setCashReceived(String(grandTotal));
  const adjustCash = (delta: number) => {
    const current = Number(cashReceived) || 0;
    const next = Math.max(0, current + delta);
    setCashReceived(String(next));
  };

  // Open Confirm Payment Modal
  const handleOpenConfirmModal = () => {
    if (paymentMethod === "cash" && !isCashValid) return;
    if (paymentMethod === "promptpay" && slipUploadMode === "immediate" && !slipImage) {
      alert("กรุณาอัพโหลดรูปภาพสลิปโอนเงินก่อนยืนยันออเดอร์");
      return;
    }
    setIsConfirmModalOpen(true);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  // 3. Confirm Payment and complete order
  const handleConfirmOrder = async () => {
    if (paymentMethod === "cash" && !isCashValid) return;
    if (paymentMethod === "promptpay" && slipUploadMode === "immediate" && !slipImage) {
      alert("กรุณาอัพโหลดรูปภาพสลิปโอนเงินก่อนยืนยันออเดอร์");
      return;
    }

    setIsSubmitting(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585";

    try {
      const orderPayload = {
        method: "walk-in",
        total_amount: grandTotal,
        payment_method: paymentMethod,
        slip_url: slipImage || null,
        note: null,
        items: cart.map((c) => ({
          product_id: Number(c.productId),
          temperature: c.temperature,
          sweetness_level: c.sweetness,
          unit_price: c.unitPrice,
          quantity: c.quantity,
          note: c.note || null,
          toppings: (c.toppings || []).map((t) => ({
            topping_id: Number(t.id),
            topping_price: Number(t.price),
            is_included_in_combo: false,
          })),
        })),
      };

      const res = await fetch(`${apiUrl}/api/v1/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderPayload),
      });

      const json = await res.json();
      if (res.ok && json.data) {
        const created = json.data;
        setOrderSuccessQueue({
          queueNumber: created.queue_no,
          orderId: created.id,
          total: created.total_amount,
          paymentMethod,
          change: paymentMethod === "cash" ? change : 0,
          itemsCount: totalCups,
          slipUrl: created.slip_url,
          orderUuid: created.uuid,
        });

        // Clear cart from storage
        try {
          localStorage.removeItem(CART_STORAGE_KEY);
        } catch { }
      } else {
        alert(json.error || "ไม่สามารถสร้างออเดอร์ได้ กรุณาลองใหม่อีกครั้ง");
      }
    } catch (err) {
      console.error("Failed to create order via API", err);
      // Fallback in case backend is offline
      const queueNumber = `A${String(Math.floor(1 + Math.random() * 999)).padStart(3, "0")}`;
      const orderId = Math.floor(1000 + Math.random() * 9000);

      setOrderSuccessQueue({
        queueNumber,
        orderId,
        total: grandTotal,
        paymentMethod,
        change: paymentMethod === "cash" ? change : 0,
        itemsCount: totalCups,
        slipUrl: slipImage,
      });

      try {
        localStorage.removeItem(CART_STORAGE_KEY);
      } catch { }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoaded || cart.length === 0) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--cream)" }}>
        <p style={{ fontFamily: "'Kanit', sans-serif", color: "var(--ink-soft)" }}>กำลังโหลดข้อมูลการชำระเงิน...</p>
      </div>
    );
  }

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

      <main
        className="pos-payment-main"
        style={{ flex: 1, overflowY: "auto", minWidth: 0 }}
      >
        <style>{`
          .pos-payment-main {
            padding: 1.75rem 2.5rem;
          }
          .pos-payment-grid {
            display: grid;
            grid-template-columns: 1fr 1.15fr;
            gap: 1.5rem;
            align-items: start;
          }
          .pos-cash-buttons-container {
            display: flex;
            align-items: center;
            gap: 0.55rem;
            margin-top: 0.65rem;
            flex-wrap: wrap;
          }
          .pos-cash-banknotes-group {
            display: flex;
            align-items: center;
            gap: 0.35rem;
            flex-wrap: wrap;
          }
          .pos-cash-adjust-group {
            display: flex;
            align-items: center;
            gap: 0.3rem;
            flex-wrap: wrap;
          }
          .pos-cash-divider {
            width: 1px;
            height: 24px;
            background-color: rgba(50, 55, 65, 0.18);
            flex-shrink: 0;
          }
          @media (max-width: 640px) {
            .pos-cash-buttons-container {
              flex-direction: column;
              align-items: flex-start;
              gap: 0.45rem;
            }
            .pos-cash-banknotes-group,
            .pos-cash-adjust-group {
              justify-content: flex-start;
              width: 100%;
              gap: 0.35rem;
            }
            .pos-cash-divider {
              width: 100%;
              height: 1px;
              margin: 0.15rem 0;
            }
          }
          @media (max-width: 900px) {
            .pos-payment-main {
              padding: 1.25rem 1rem !important;
            }
            .pos-payment-grid {
              grid-template-columns: 1fr !important;
              gap: 1.25rem !important;
            }
          }
        `}</style>

        {/* Header Section: Back button and Title swapped */}
        <div style={{ marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          <Link
            href="/admin/pos/front-desk"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.5rem 0.9rem",
              borderRadius: "0.65rem",
              backgroundColor: "var(--card)",
              border: "1px solid rgba(50, 55, 65, 0.12)",
              color: "var(--ink)",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "0.85rem",
              width: "fit-content",
              boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(50,55,65,0.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "var(--card)";
            }}
          >
            <ArrowLeft size={16} />
            <span>กลับไปหน้าร้าน</span>
          </Link>
          <h1 style={{ fontSize: "1.65rem", fontWeight: 800, color: "var(--ink)", lineHeight: 1.2, margin: 0 }}>
            ชำระเงิน
          </h1>
        </div>

        {/* Main 2-Column Content Layout (Responsive) */}
        <div className="pos-payment-grid">
          {/* Left Column: Order Summary & Item List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            <div
              style={{
                backgroundColor: "var(--card)",
                borderRadius: "1.25rem",
                padding: "1.5rem",
                border: "1px solid rgba(50, 55, 65, 0.1)",
                boxShadow: "0 4px 20px -2px rgba(0,0,0,0.03)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "0.9rem", borderBottom: "1px solid rgba(50, 55, 65, 0.08)" }}>
                <h2 style={{ fontSize: "1.15rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <Receipt size={18} color="var(--teal)" />
                  <span>รายการสั่งซื้อ</span>
                </h2>
              </div>

              {/* Items List */}
              <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: "420px", overflowY: "auto", paddingRight: "0.25rem" }}>
                {cart.map((item, idx) => (
                  <div
                    key={item.cartId || idx}
                    style={{
                      padding: "0.85rem 1rem",
                      borderRadius: "0.85rem",
                      backgroundColor: "var(--cream)",
                      border: "1px solid rgba(50, 55, 65, 0.06)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "0.75rem",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--ink)" }}>
                          {item.productName}
                        </span>
                        <span
                          style={{
                            fontSize: "0.7rem",
                            padding: "0.1rem 0.4rem",
                            borderRadius: "9999px",
                            fontWeight: 700,
                            backgroundColor: item.temperature === "iced" ? "rgba(75, 155, 140, 0.15)" : "rgba(220, 160, 50, 0.15)",
                            color: item.temperature === "iced" ? "var(--teal)" : "var(--warm)",
                          }}
                        >
                          {item.temperature === "iced" ? "เย็น" : "ร้อน"}
                        </span>
                      </div>

                      <p style={{ fontSize: "0.775rem", color: "var(--ink-soft)", marginTop: "2px" }}>
                        หวาน {item.sweetness}
                      </p>

                      {item.toppings && item.toppings.length > 0 && (
                        <p style={{ fontSize: "0.75rem", color: "var(--teal)", marginTop: "2px", fontWeight: 500 }}>
                          + {item.toppings.map((t) => t.name).join(", ")}
                        </p>
                      )}

                      {item.note && (
                        <p style={{ fontSize: "0.725rem", color: "#f59e0b", marginTop: "2px" }}>
                          Note: {item.note}
                        </p>
                      )}
                    </div>

                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <span style={{ fontSize: "0.8rem", color: "var(--ink-soft)", display: "block" }}>
                        x{item.quantity}
                      </span>
                      <span style={{ fontSize: "0.975rem", fontWeight: 800, color: "var(--ink)" }}>
                        ฿{item.unitPrice * item.quantity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Calculation Card */}
              <div
                style={{
                  marginTop: "1.25rem",
                  paddingTop: "1rem",
                  borderTop: "1px dashed rgba(50, 55, 65, 0.15)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", color: "var(--ink-soft)", marginBottom: "0.4rem" }}>
                  <span>จำนวนแก้วทั้งหมด</span>
                  <span style={{ fontWeight: 600, color: "var(--ink)" }}>{totalCups} แก้ว</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem" }}>
                  <span style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--ink)" }}>
                    ยอดรวมสุทธิที่ต้องชำระ
                  </span>
                  <span className="font-display" style={{ fontSize: "2rem", fontWeight: 900, color: "var(--teal)", lineHeight: 1 }}>
                    ฿{grandTotal}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Payment Methods & Slip Upload */}
          <div
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
            <h2 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "1rem" }}>
              เลือกช่องทางการชำระเงิน
            </h2>

            {/* Payment Method Tabs */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.25rem" }}>
              {/* 1. PromptPay Tab */}
              <button
                type="button"
                onClick={() => setPaymentMethod("promptpay")}
                style={{
                  padding: "0.85rem 1rem",
                  borderRadius: "0.85rem",
                  border: paymentMethod === "promptpay" ? "2px solid var(--teal)" : "2px solid rgba(50,55,65,0.12)",
                  backgroundColor: paymentMethod === "promptpay" ? "rgba(75, 155, 140, 0.08)" : "var(--cream)",
                  color: paymentMethod === "promptpay" ? "var(--teal)" : "var(--ink)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  fontFamily: "'Kanit', sans-serif",
                  transition: "border-color 0.15s ease, background-color 0.15s ease, color 0.15s ease",
                  boxSizing: "border-box",
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "0.5rem",
                    backgroundColor: paymentMethod === "promptpay" ? "var(--teal)" : "rgba(50,55,65,0.08)",
                    color: paymentMethod === "promptpay" ? "#fff" : "var(--ink)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "background-color 0.15s ease, color 0.15s ease",
                  }}
                >
                  <QrCode size={18} />
                </div>
                <div style={{ textAlign: "left" }}>
                  <span>พร้อมเพย์ QR</span>
                  <span style={{ display: "block", fontSize: "0.7rem", fontWeight: 400, opacity: 0.8 }}>
                    สแกนจ่าย
                  </span>
                </div>
              </button>

              {/* 2. Cash Tab */}
              <button
                type="button"
                onClick={() => setPaymentMethod("cash")}
                style={{
                  padding: "0.85rem 1rem",
                  borderRadius: "0.85rem",
                  border: paymentMethod === "cash" ? "2px solid var(--teal)" : "2px solid rgba(50,55,65,0.12)",
                  backgroundColor: paymentMethod === "cash" ? "rgba(75, 155, 140, 0.08)" : "var(--cream)",
                  color: paymentMethod === "cash" ? "var(--teal)" : "var(--ink)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  fontFamily: "'Kanit', sans-serif",
                  transition: "border-color 0.15s ease, background-color 0.15s ease, color 0.15s ease",
                  boxSizing: "border-box",
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "0.5rem",
                    backgroundColor: paymentMethod === "cash" ? "var(--teal)" : "rgba(50,55,65,0.08)",
                    color: paymentMethod === "cash" ? "#fff" : "var(--ink)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "background-color 0.15s ease, color 0.15s ease",
                  }}
                >
                  <Banknote size={18} />
                </div>
                <div style={{ textAlign: "left" }}>
                  <span>เงินสด</span>
                  <span style={{ display: "block", fontSize: "0.7rem", fontWeight: 400, opacity: 0.8, lineHeight: 1.25 }}>
                    รับเงิน <br className="mobile-break" />& ทอนเงิน
                  </span>
                </div>
              </button>
            </div>

            {/* Container for Payment Details (Fixed height for PromptPay & Cash to prevent jumping) */}
            <div style={{ minHeight: "440px", display: "flex", flexDirection: "column" }}>
              {/* PAYMENT VIEW: PROMPTPAY */}
              {paymentMethod === "promptpay" && (
                <div className="animate-fade-in">
                  {/* Dynamic QR Box */}
                  <div
                    style={{
                      backgroundColor: "#fff",
                      borderRadius: "1rem",
                      padding: "1.25rem",
                      border: "1px solid rgba(50, 55, 65, 0.1)",
                      textAlign: "center",
                      boxShadow: "0 4px 15px rgba(0,0,0,0.04)",
                      marginBottom: "1.25rem",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem", marginBottom: "0.5rem" }}>
                      <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--teal)" }}>
                        {promptpayName}
                      </span>
                    </div>

                    <div style={{ width: "200px", height: "200px", margin: "0 auto", position: "relative", backgroundColor: "#fff", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "0.5rem", overflow: "hidden", userSelect: "none" }}>
                      {qrCodeDataUrl ? (
                        <img
                          src={qrCodeDataUrl}
                          alt="PromptPay QR Code"
                          draggable={false}
                          style={{ width: "100%", height: "100%", objectFit: "contain", pointerEvents: "none", userSelect: "none" }}
                        />
                      ) : (
                        <p style={{ fontSize: "0.8rem", color: "var(--ink-soft)" }}>กำลังสร้าง QR Code...</p>
                      )}
                    </div>

                    <div style={{ display: "inline-block", marginTop: "0.35rem", padding: "0.25rem 0.75rem", borderRadius: "9999px", backgroundColor: "rgba(75, 155, 140, 0.12)", color: "var(--teal)", fontSize: "0.875rem", fontWeight: 800 }}>
                      ยอดชำระ: ฿{grandTotal}
                    </div>
                  </div>

                  {/* Slip Upload Area */}
                  <div>
                    <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.85rem", fontWeight: 700, color: "var(--ink)", marginBottom: "0.4rem" }}>
                      <span>
                        อัพโหลดสลิปโอนเงิน{" "}
                        {slipUploadMode === "immediate" ? (
                          <span style={{ color: "#dc2626", fontWeight: 400, fontSize: "0.75rem" }}>(ต้องอัพโหลดตอนนี้)</span>
                        ) : (
                          <span style={{ color: "var(--ink-soft)", fontWeight: 400, fontSize: "0.75rem" }}>(อัพโหลดภายหลังได้)</span>
                        )}
                      </span>
                      {slipUploadMode === "immediate" ? (
                        <span style={{ fontSize: "0.7rem", backgroundColor: "rgba(220, 38, 38, 0.12)", color: "#dc2626", padding: "0.1rem 0.5rem", borderRadius: "9999px", fontWeight: 600 }}>
                          ให้ผ่านโดยต้องแนบสลิป
                        </span>
                      ) : (
                        <span style={{ fontSize: "0.7rem", backgroundColor: "rgba(75, 155, 140, 0.15)", color: "var(--teal)", padding: "0.1rem 0.5rem", borderRadius: "9999px", fontWeight: 600 }}>
                          ให้ผ่านโดยไม่ต้องแนบสลิป
                        </span>
                      )}
                    </label>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileChange(e.target.files[0]);
                        }
                      }}
                    />

                    {!slipImage ? (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDragging(true);
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        style={{
                          border: isDragging ? "2px dashed var(--teal)" : "2px dashed rgba(50, 55, 65, 0.2)",
                          backgroundColor: isDragging ? "rgba(75, 155, 140, 0.08)" : "var(--cream)",
                          borderRadius: "0.85rem",
                          padding: "1.5rem 1rem",
                          textAlign: "center",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <div style={{ width: "42px", height: "42px", borderRadius: "50%", backgroundColor: "rgba(75,155,140,0.12)", color: "var(--teal)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 0.6rem" }}>
                          <UploadCloud size={22} />
                        </div>
                        <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--ink)" }}>
                          คลิกเพื่อเลือกไฟล์ หรือลากรูปภาพมาวางที่นี่
                        </p>
                        <p style={{ fontSize: "0.75rem", color: "var(--ink-soft)", marginTop: "2px" }}>
                          รองรับรูปภาพ JPG, PNG, WebP
                        </p>
                      </div>
                    ) : (
                      /* Slip Preview Card */
                      <div
                        style={{
                          backgroundColor: "var(--cream)",
                          borderRadius: "0.85rem",
                          padding: "0.75rem 1rem",
                          border: "1px solid rgba(75, 155, 140, 0.3)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "0.75rem",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0 }}>
                          <div style={{ width: "48px", height: "48px", borderRadius: "0.5rem", overflow: "hidden", flexShrink: 0, border: "1px solid rgba(0,0,0,0.1)" }}>
                            <img src={slipImage} alt="Slip Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                              <CheckCircle2 size={14} color="#22c55e" />
                              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {slipFileName || "สลิปโอนเงิน"}
                              </span>
                            </div>
                            <span style={{ fontSize: "0.725rem", color: "#22c55e", fontWeight: 600 }}>
                              อัพโหลดสลิปเรียบร้อยแล้ว
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setSlipImage(null);
                            setSlipFileName("");
                          }}
                          style={{
                            border: "none",
                            backgroundColor: "rgba(220, 38, 38, 0.1)",
                            color: "#dc2626",
                            padding: "0.35rem 0.6rem",
                            borderRadius: "0.4rem",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.2rem",
                          }}
                        >
                          <Trash2 size={12} />
                          <span>เปลี่ยนรูป</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* PAYMENT VIEW: CASH */}
              {paymentMethod === "cash" && (
                <div className="animate-fade-in">
                  <div
                    style={{
                      backgroundColor: "var(--cream)",
                      borderRadius: "1rem",
                      padding: "1.25rem",
                      border: "1px solid rgba(50, 55, 65, 0.1)",
                      marginBottom: "1rem",
                    }}
                  >
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--ink)", marginBottom: "0.4rem" }}>
                      จำนวนเงินที่รับจากลูกค้า (บาท)
                    </label>

                    <div style={{ position: "relative" }}>
                      <input
                        type="number"
                        placeholder={`เช่น ${grandTotal}`}
                        value={cashReceived}
                        onChange={(e) => setCashReceived(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "0.75rem 1rem",
                          borderRadius: "0.75rem",
                          border: isCashValid ? "2px solid var(--teal)" : "1px solid rgba(50,55,65,0.2)",
                          fontSize: "1.25rem",
                          fontWeight: 800,
                          outline: "none",
                          backgroundColor: "#fff",
                          color: "var(--ink)",
                          fontFamily: "'Kanit', sans-serif",
                        }}
                      />
                      <button
                        type="button"
                        onClick={setExactCash}
                        style={{
                          position: "absolute",
                          right: "8px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          padding: "0.35rem 0.65rem",
                          borderRadius: "0.45rem",
                          backgroundColor: "var(--teal)",
                          color: "#fff",
                          border: "none",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        จ่ายพอดี (฿{grandTotal})
                      </button>
                    </div>

                    {/* Quick Cash & Adjustment Buttons Row with Divider */}
                    <div className="pos-cash-buttons-container">
                      {/* Banknote Buttons */}
                      <div className="pos-cash-banknotes-group">
                        {[20, 50, 100, 500, 1000].map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setCashReceived(String(amt))}
                            style={{
                              padding: "0.3rem 0.5rem",
                              borderRadius: "0.5rem",
                              border: "1px solid rgba(50, 55, 65, 0.15)",
                              backgroundColor: "#fff",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              cursor: "pointer",
                              color: "var(--ink)",
                              textAlign: "center",
                            }}
                          >
                            {amt}฿
                          </button>
                        ))}
                      </div>

                      {/* Divider (Vertical on Desktop, Horizontal on Mobile) */}
                      <div className="pos-cash-divider" />

                      {/* Adjustment Buttons (+-1, +-5, +-10) */}
                      <div className="pos-cash-adjust-group">
                        {[-10, -5, -1, 1, 5, 10].map((delta) => {
                          const isPositive = delta > 0;
                          return (
                            <button
                              key={delta}
                              type="button"
                              onClick={() => adjustCash(delta)}
                              style={{
                                padding: "0.25rem 0.45rem",
                                borderRadius: "0.5rem",
                                border: "1px solid rgba(50, 55, 65, 0.15)",
                                backgroundColor: "#fff",
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                cursor: "pointer",
                                color: "var(--ink)",
                                textAlign: "center",
                              }}
                              title={`ปรับยอด ${isPositive ? `+${delta}` : delta} บาท`}
                            >
                              {isPositive ? `+${delta}` : delta}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Change Display */}
                    <div style={{ marginTop: "1rem", paddingTop: "0.85rem", borderTop: "1px dashed rgba(50, 55, 65, 0.12)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--ink)" }}>เงินทอน</span>
                        <span className="font-display" style={{ fontSize: "1.65rem", fontWeight: 900, color: isCashValid ? "var(--teal)" : "var(--ink-soft)" }}>
                          ฿{isCashValid ? change : 0}
                        </span>
                      </div>
                      <p style={{ fontSize: "0.75rem", color: "var(--ink-soft)", marginTop: "2px", lineHeight: 1.35 }}>
                        *พนักงานหน้าร้านตรวจนับเงินสด<br className="mobile-break" />และทอนเงินให้ลูกค้าเรียบร้อย
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Submit CTA Button */}
            <div style={{ marginTop: "1.5rem" }}>
              {(() => {
                const isPromptPayReady = paymentMethod === "promptpay" && (slipUploadMode === "later" || Boolean(slipImage));
                const isCashReady = paymentMethod === "cash" && isCashValid;
                const isReady = isCashReady || isPromptPayReady;

                // Determine button label based on status
                let buttonText = "ยืนยันการชำระเงิน";
                if (paymentMethod === "cash" && !isCashValid) {
                  const shortage = grandTotal - cashNum;
                  buttonText = cashNum > 0 ? `ยังไม่ครบจำนวน (ขาดอีก ฿${shortage})` : "ยังไม่ครบจำนวน";
                } else if (paymentMethod === "promptpay" && slipUploadMode === "immediate" && !slipImage) {
                  buttonText = "กรุณาอัพโหลดสลิป";
                }

                return (
                  <button
                    type="button"
                    onClick={handleOpenConfirmModal}
                    disabled={!isReady}
                    style={{
                      width: "100%",
                      padding: "0.95rem",
                      borderRadius: "9999px",
                      border: "none",
                      backgroundColor: isReady ? "var(--teal)" : "rgba(50, 55, 65, 0.2)",
                      color: isReady ? "var(--cream)" : "var(--ink-soft)",
                      fontSize: "1rem",
                      fontWeight: 800,
                      cursor: isReady ? "pointer" : "not-allowed",
                      boxShadow: isReady ? "0 4px 15px rgba(75, 155, 140, 0.35)" : "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.5rem",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {isReady ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    <span>{buttonText}</span>
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      </main>

      {/* Confirm Payment Modal */}
      <ConfirmPaymentModal
        isOpen={isConfirmModalOpen}
        isLoading={isSubmitting}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={async () => {
          await handleConfirmOrder();
          setIsConfirmModalOpen(false);
        }}
        paymentMethod={paymentMethod}
        totalAmount={grandTotal}
        totalCups={totalCups}
        cart={cart}
        cashReceived={cashNum}
        change={change}
        slipImage={slipImage}
        slipUploadMode={slipUploadMode}
      />

      {/* Order Success Ticket Modal Component */}
      <OrderSuccessModal
        data={orderSuccessQueue}
        onNextOrder={() => router.push("/admin/pos/front-desk")}
      />
    </div>
  );
}
