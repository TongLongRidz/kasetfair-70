"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import JsBarcode from "jsbarcode";
import QRCode from "qrcode";
import {
  Check,
  AlertCircle,
  QrCode as QrIcon,
  Download,
  Image as ImageIcon,
} from "lucide-react";
import NotFound from "@/app/not-found";

interface OrderItemTopping {
  id: number;
  topping_id: number;
  topping_price: number;
  is_included_in_combo: boolean;
  topping?: {
    name_th: string;
    name_en: string;
  };
}

interface OrderItem {
  id: number;
  product_id: number;
  temperature: "iced" | "hot";
  sweetness_level: string;
  unit_price: number;
  quantity: number;
  note?: string;
  product?: {
    name_th: string;
    name_en: string;
    image_url?: string;
  };
  order_item_toppings?: OrderItemTopping[];
}

interface OrderDetail {
  id: number;
  uuid?: string;
  queue_no: string;
  method: string;
  total_amount: number;
  payment_method: string;
  order_status: "new_order" | "ready" | "completed" | "cancelled";
  created_at: string;
  estimated_pickup_time?: string;
  note?: string;
  order_items: OrderItem[];
}

export default function OrderTrackingPage() {
  const params = useParams();
  const uuid = params?.uuid as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState(false);
  const [qrSvg, setQrSvg] = useState<string>("");
  const [savingImage, setSavingImage] = useState(false);
  const [showSaveBtn, setShowSaveBtn] = useState(true);
  const [isPrinting, setIsPrinting] = useState(true);
  const receiptRef = useRef<HTMLDivElement>(null);

  // Disable scrolling during the receipt printing animation (2.3s)
  useEffect(() => {
    if (!order) return;
    setIsPrinting(true);
    const timer = setTimeout(() => {
      setIsPrinting(false);
    }, 2300);
    return () => clearTimeout(timer);
  }, [order?.uuid]);

  // Lock body/html scroll while printing
  useEffect(() => {
    if (isPrinting) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [isPrinting]);

  // Auto-hide save button when user is inactive (fade out after 3.5s), fade back in on any interaction
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const resetInactivityTimer = () => {
      setShowSaveBtn(true);
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setShowSaveBtn(false);
      }, 3500);
    };

    // Initial timer
    resetInactivityTimer();

    const events = ["mousemove", "mousedown", "touchstart", "touchmove", "scroll", "keydown"];
    events.forEach((event) => {
      window.addEventListener(event, resetInactivityTimer, { passive: true });
    });

    return () => {
      clearTimeout(timeoutId);
      events.forEach((event) => {
        window.removeEventListener(event, resetInactivityTimer);
      });
    };
  }, []);

  // Auto-cache order to localStorage for returning visits
  useEffect(() => {
    if (order?.uuid) {
      try {
        const saved = JSON.parse(localStorage.getItem("recent_orders") || "[]");
        const filtered = saved.filter((o: { uuid: string }) => o.uuid !== order.uuid);
        filtered.unshift({
          uuid: order.uuid,
          queue_no: order.queue_no,
          created_at: order.created_at,
        });
        localStorage.setItem("recent_orders", JSON.stringify(filtered.slice(0, 10)));
      } catch (e) {
        console.error("Failed to save order to localStorage", e);
      }
    }
  }, [order?.uuid, order?.queue_no, order?.created_at]);

  const handleSaveImage = async () => {
    if (!receiptRef.current) return;
    try {
      setSavingImage(true);
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(receiptRef.current, {
        pixelRatio: 2,
        backgroundColor: "#FFFDF9",
        cacheBust: true,
        skipFonts: true,
        filter: (node) => {
          if (
            node instanceof HTMLElement &&
            (node.id === "save-receipt-image-btn" || node.classList?.contains("no-export"))
          ) {
            return false;
          }
          return true;
        },
      });

      const fileName = `receipt-${order?.queue_no || "order"}.png`;

      // Try native file sharing for mobile if supported
      try {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], fileName, { type: "image/png" });
        if (typeof navigator !== "undefined" && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `ใบเสร็จคิว ${order?.queue_no || ""}`,
            text: `ใบเสร็จคำสั่งซื้อ คิว #${order?.queue_no || ""}`,
          });
          return;
        }
      } catch {
        // Fallback to standard download
      }

      // Standard download fallback
      const link = document.createElement("a");
      link.download = fileName;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to export receipt image", err);
      alert("ไม่สามารถบันทึกภาพได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setSavingImage(false);
    }
  };

  const isValidUuid = (id: string) => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
  };

  const fetchOrderDetail = async () => {
    if (!uuid || !isValidUuid(uuid)) {
      setIsNotFound(true);
      setLoading(false);
      return;
    }
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585";
      const res = await fetch(`${apiUrl}/api/v1/orders/${uuid}`);
      const json = await res.json();
      if (res.ok && json.data) {
        setOrder(json.data);
        setError(null);
        setIsNotFound(false);
      } else {
        // If order not found or invalid id, show 404
        setIsNotFound(true);
      }
    } catch (err) {
      console.error("Failed to fetch order tracking detail", err);
      if (!order) {
        setIsNotFound(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!uuid || !isValidUuid(uuid)) {
      setIsNotFound(true);
      setLoading(false);
      return;
    }
    fetchOrderDetail();
    // Auto-polling status every 6 seconds
    const interval = setInterval(() => {
      fetchOrderDetail();
    }, 6000);
    return () => clearInterval(interval);
  }, [uuid]);

  // Generate pure transparent SVG QR code with UUID text directly
  useEffect(() => {
    const currentUuid = order?.uuid || uuid;
    if (!currentUuid) return;

    QRCode.toString(currentUuid, {
      type: "svg",
      margin: 0,
      color: {
        dark: "#1A1D20",
        light: "#00000000",
      },
    })
      .then((svgString) => {
        const responsiveSvg = svgString.replace('<svg ', '<svg style="width:100%;height:100%;display:block;" ');
        setQrSvg(responsiveSvg);
      })
      .catch((err) => console.error("Error generating tracking QR SVG:", err));
  }, [order?.uuid, uuid]);

  // Barcode renderer function (pure barcode without displaying text/uuid)
  const renderBarcode = (svgElement: SVGSVGElement | null) => {
    if (!svgElement) return;
    const currentUuid = order?.uuid || uuid;
    if (!currentUuid) return;

    try {
      JsBarcode(svgElement, currentUuid, {
        format: "CODE128",
        lineColor: "#1A1D20",
        width: 1.4,
        height: 48,
        displayValue: false,
        background: "transparent",
      });
    } catch (e) {
      console.error("Failed to render barcode:", e);
    }
  };

  // Callback ref triggered immediately when SVG element mounts to DOM
  const barcodeCallbackRef = useCallback(
    (node: SVGSVGElement | null) => {
      if (node) {
        renderBarcode(node);
      }
    },
    [order?.uuid, uuid]
  );

  // Backup effect on order changes
  useEffect(() => {
    const el = document.getElementById("order-barcode-svg") as SVGSVGElement | null;
    if (el) {
      renderBarcode(el);
    }
  }, [order, loading, uuid]);



  const formatDate = (isoString?: string) => {
    if (!isoString) return "";
    try {
      const d = new Date(isoString);
      const formatted = d.toLocaleDateString("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      return `${formatted} น.`;
    } catch {
      return isoString;
    }
  };

  const totalCups = order?.order_items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  if (isNotFound || (!loading && !order)) {
    return <NotFound />;
  }

  if (loading && !order) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#EFECE6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            border: "4px solid rgba(75, 155, 140, 0.2)",
            borderTopColor: "var(--teal)",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#EFECE6",
        color: "var(--ink)",
        fontFamily: "'Kanit', sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "1.5rem",
      }}
    >
      <main style={{ maxWidth: "420px", width: "100%", margin: "0 auto" }}>
        {order ? (
          /* Receipt Printer Slot Wrapper */
          <div style={{ position: "relative", width: "100%" }}>
            {/* 1. PRINTER BACK CASING (Behind Paper - zIndex: 10) */}
            <div
              className="animate-printer-overlay no-export"
              style={{
                position: "absolute",
                top: "-42px",
                left: "-6px",
                right: "-6px",
                height: "56px",
                zIndex: 10,
                backgroundColor: "#13171d",
                borderRadius: "0.85rem 0.85rem 0 0",
                border: "1px solid #2d333f",
                boxShadow: "0 10px 25px rgba(0, 0, 0, 0.4)",
              }}
            />

            {/* 2. RECEIPT PAPER MASK (Middle Layer - zIndex: 20) */}
            <div
              className="animate-receipt-mask"
              style={{
                width: "100%",
                position: "relative",
                zIndex: 20,
              }}
            >
              {/* Receipt Paper Container */}
              <div
                ref={receiptRef}
                className="animate-receipt-print"
                style={{
                  position: "relative",
                  backgroundColor: "#FFFDF9",
                  border: "1px solid rgba(50, 55, 65, 0.08)",
                  overflow: "hidden",
                }}
              >
                {/* Save Image Button (Top Right of Receipt - Circular Light Blue Icon with Inactivity Fade) */}
                <button
                  id="save-receipt-image-btn"
                  className="no-export"
                  onClick={handleSaveImage}
                  disabled={savingImage}
                  title="บันทึกใบเสร็จเป็นรูปภาพ"
                  aria-label="บันทึกใบเสร็จเป็นรูปภาพ"
                  style={{
                    position: "absolute",
                    top: "1.1rem",
                    right: "1.1rem",
                    zIndex: 10,
                    width: "38px",
                    height: "38px",
                    borderRadius: "50%",
                    backgroundColor: "#E0F2FE",
                    color: "#0284c7",
                    border: "1px solid rgba(2, 132, 199, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: savingImage ? "not-allowed" : "pointer",
                    boxShadow: "0 2px 8px rgba(2, 132, 199, 0.12)",
                    opacity: showSaveBtn || savingImage ? 1 : 0,
                    pointerEvents: showSaveBtn && !savingImage ? "auto" : savingImage ? "auto" : "none",
                    transform: showSaveBtn || savingImage ? "scale(1)" : "scale(0.85)",
                    transition: "opacity 0.45s ease, transform 0.45s cubic-bezier(0.2, 0.8, 0.2, 1)",
                    padding: 0,
                  }}
                >
                  <Download size={18} strokeWidth={2.4} />
                </button>

                <div style={{ padding: "1.5rem" }}>
                  {/* 1. STORE LOGO & BRAND HEADER */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      paddingBottom: "1.25rem",
                      borderBottom: "2px dashed rgba(50, 55, 65, 0.15)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.75rem",
                      }}
                    >
                      {/* Brand Emblem */}
                      <div
                        style={{
                          width: "44px",
                          height: "44px",
                          borderRadius: "0.85rem",
                          backgroundColor: "var(--ink)",
                          color: "var(--cream)",
                          display: "grid",
                          placeItems: "center",
                          fontSize: "1.35rem",
                          fontWeight: 800,
                          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.12)",
                          flexShrink: 0,
                        }}
                      >
                        ถ
                      </div>

                      <div style={{ textAlign: "left", lineHeight: 1.15 }}>
                        <h1
                          style={{
                            fontSize: "1.2rem",
                            fontWeight: 800,
                            color: "var(--ink)",
                            letterSpacing: "-0.01em",
                            margin: 0,
                          }}
                        >
                          ถั่วทอง | M__
                        </h1>
                        <span
                          className="font-mono"
                          style={{
                            display: "block",
                            fontSize: "10px",
                            textTransform: "uppercase",
                            letterSpacing: "0.2em",
                            fontWeight: 700,
                            color: "var(--ink-soft)",
                            marginTop: "2px",
                          }}
                        >
                          Thuathong Soy Milk
                        </span>
                      </div>
                    </div>

                    <p style={{ fontSize: "0.75rem", color: "var(--ink-soft)", marginTop: "0.5rem", textAlign: "center" }}>
                      เกษตรแฟร์ มหาวิทยาลัยเกษตรศาสตร์ บางเขน
                    </p>
                  </div>

                  {/* Receipt Date & Order Meta */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.4rem",
                      width: "100%",
                      marginTop: "1rem",
                      fontSize: "0.8rem",
                      color: "var(--ink-soft)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span>วันที่</span>
                      <span style={{ fontWeight: 600, color: "var(--ink)" }}>{formatDate(order.created_at)}</span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span>วิธีชำระเงิน</span>
                      <span style={{ fontWeight: 700, color: "var(--ink)" }}>
                        {order.payment_method === "promptpay" ? "พร้อมเพย์ QR Code" : "เงินสด (Cash)"}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span>ช่องทาง</span>
                      <span style={{ fontWeight: 600, color: "var(--ink)" }}>
                        {order.method === "online" ? "สั่งออนไลน์" : "Walk-in หน้าร้าน"}
                      </span>
                    </div>
                  </div>

                  {/* 2. QUEUE NUMBER & QR CONTAINER (2 Columns) */}
                  <div
                    style={{
                      margin: "1.1rem 0",
                      padding: "1.1rem 1.15rem",
                      backgroundColor: "var(--cream)",
                      borderRadius: "0.95rem",
                      border: "2px dashed var(--teal)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "0.9rem",
                      textAlign: "left",
                    }}
                  >
                    {/* Left Column: Queue Number */}
                    <div
                      style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        textAlign: "center",
                      }}
                    >
                      <span style={{ fontSize: "0.82rem", color: "var(--ink-soft)", fontWeight: 600 }}>
                        หมายเลขคิว
                      </span>

                      <p
                        className="font-mono"
                        style={{
                          fontSize: "3.1rem",
                          fontWeight: 900,
                          color: "var(--teal)",
                          lineHeight: 1,
                          marginTop: "3px",
                          letterSpacing: "0.02em",
                          marginBottom: 0,
                        }}
                      >
                        {order.queue_no}
                      </p>
                    </div>

                    {/* Divider */}
                    <div
                      style={{
                        width: "1px",
                        alignSelf: "stretch",
                        backgroundColor: "rgba(75, 155, 140, 0.25)",
                      }}
                    />

                    {/* Right Column: QR Code */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        textAlign: "center",
                        flexShrink: 0,
                      }}
                    >
                      <div
                        style={{
                          width: "88px",
                          height: "88px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {qrSvg ? (
                          <div
                            style={{
                              width: "100%",
                              height: "100%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                            dangerouslySetInnerHTML={{ __html: qrSvg }}
                          />
                        ) : (
                          <QrIcon size={32} color="var(--ink-soft)" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 3. ORDER STATUS TRACKER (Horizontal Stepper) */}
                  {(() => {
                    if (order.order_status === "cancelled") {
                      return (
                        <div
                          style={{
                            marginBottom: "1.25rem",
                            padding: "1rem",
                            borderRadius: "1rem",
                            backgroundColor: "rgba(220, 53, 69, 0.08)",
                            border: "1px solid rgba(220, 53, 69, 0.2)",
                            color: "#dc3545",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.75rem",
                          }}
                        >
                          <AlertCircle size={28} color="#dc3545" />
                          <div>
                            <div style={{ fontWeight: 800, fontSize: "0.95rem" }}>ยกเลิกคำสั่งซื้อ</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--ink-soft)" }}>ออเดอร์นี้ถูกยกเลิกแล้ว</div>
                          </div>
                        </div>
                      );
                    }

                    const STEPS = [
                      {
                        key: "new_order",
                        num: 1,
                        label: "รับออเดอร์",
                      },
                      {
                        key: "preparing",
                        num: 2,
                        label: "กำลังทำ",
                      },
                      {
                        key: "ready",
                        num: 3,
                        label: "พร้อมรับ",
                      },
                      {
                        key: "completed",
                        num: 4,
                        label: "เสร็จสิ้น",
                      },
                    ];

                    // Determine active step index (0-indexed)
                    // new_order -> Step 1 ("รับออเดอร์") is passed (✓), Step 2 ("กำลังทำ") is active (pulsing dot)
                    // ready -> Step 1 & 2 passed (✓), Step 3 ("พร้อมรับ") is active
                    // completed -> All steps passed (✓)
                    const getActiveIndex = (status: OrderDetail["order_status"]) => {
                      switch (status) {
                        case "new_order":
                          return 1; // Step 1 ("กำลังทำ") is active, Step 0 ("รับออเดอร์") is passed (✓)
                        case "ready":
                          return 2; // Step 2 ("พร้อมรับ") is active, Steps 0, 1 passed (✓)
                        case "completed":
                          return 4; // All steps passed (✓)
                        default:
                          return 1;
                      }
                    };

                    const currentIndex = getActiveIndex(order.order_status);

                    return (
                      <div
                        style={{
                          marginBottom: "0.85rem",
                          padding: "0.75rem 0.85rem",
                          borderRadius: "0.85rem",
                          backgroundColor: "#FFF",
                          border: "1px solid rgba(75, 155, 140, 0.2)",
                          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02)",
                        }}
                      >
                        {/* Header: Fixed Title */}
                        <div
                          style={{
                            marginBottom: "0.65rem",
                          }}
                        >
                          <h3
                            style={{
                              margin: 0,
                              fontSize: "0.88rem",
                              fontWeight: 800,
                              color: "var(--ink)",
                              letterSpacing: "-0.01em",
                            }}
                          >
                            สถานะคำสั่งซื้อ
                          </h3>
                        </div>

                        {/* Horizontal 4-Step Stepper */}
                        <div style={{ position: "relative", width: "100%", padding: "0.1rem 0" }}>
                          {/* Connecting Line 1 (Node 0 to Node 1) */}
                          <div
                            style={{
                              position: "absolute",
                              top: "14px",
                              left: "12.5%",
                              width: "25%",
                              height: "2.5px",
                              backgroundColor: currentIndex >= 1 ? "var(--teal)" : "#E2E6E3",
                              zIndex: 1,
                              transition: "background-color 0.3s ease",
                            }}
                          />
                          {/* Connecting Line 2 (Node 1 to Node 2) */}
                          <div
                            style={{
                              position: "absolute",
                              top: "14px",
                              left: "37.5%",
                              width: "25%",
                              height: "2.5px",
                              backgroundColor: currentIndex >= 2 ? "var(--teal)" : "#E2E6E3",
                              zIndex: 1,
                              transition: "background-color 0.3s ease",
                            }}
                          />
                          {/* Connecting Line 3 (Node 2 to Node 3) */}
                          <div
                            style={{
                              position: "absolute",
                              top: "14px",
                              left: "62.5%",
                              width: "25%",
                              height: "2.5px",
                              backgroundColor: currentIndex >= 3 ? "var(--teal)" : "#E2E6E3",
                              zIndex: 1,
                              transition: "background-color 0.3s ease",
                            }}
                          />

                          {/* 4 Step Nodes */}
                          <div style={{ display: "flex", width: "100%", position: "relative", zIndex: 2 }}>
                            {STEPS.map((step, idx) => {
                              const isPassed = idx < currentIndex;
                              const isCurrent = idx === currentIndex;

                              return (
                                <div
                                  key={step.key}
                                  style={{
                                    flex: 1,
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    textAlign: "center",
                                  }}
                                >
                                  {/* Node Circle */}
                                  <div
                                    style={{
                                      width: "28px",
                                      height: "28px",
                                      borderRadius: "50%",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      backgroundColor: isPassed ? "var(--teal)" : "#FFF",
                                      border: isCurrent
                                        ? "2.5px solid var(--teal)"
                                        : isPassed
                                          ? "none"
                                          : "1.5px solid #E2E6E3",
                                      boxShadow: isCurrent ? "0 0 0 2.5px rgba(75, 155, 140, 0.15)" : "none",
                                      transition: "all 0.3s ease",
                                    }}
                                  >
                                    {isPassed ? (
                                      <Check size={14} color="#FFF" strokeWidth={3} />
                                    ) : isCurrent ? (
                                      <div
                                        style={{
                                          position: "relative",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          width: "100%",
                                          height: "100%",
                                        }}
                                      >
                                        {/* Pulsing Outer Ping Ring */}
                                        <span
                                          className="pulsing-ring"
                                          style={{
                                            position: "absolute",
                                            width: "16px",
                                            height: "16px",
                                            borderRadius: "50%",
                                            backgroundColor: "var(--teal)",
                                            pointerEvents: "none",
                                          }}
                                        />
                                        {/* Pulsing Solid Inner Dot */}
                                        <span
                                          className="pulsing-dot"
                                          style={{
                                            position: "relative",
                                            width: "10px",
                                            height: "10px",
                                            borderRadius: "50%",
                                            backgroundColor: "var(--teal)",
                                            zIndex: 2,
                                          }}
                                        />
                                      </div>
                                    ) : (
                                      <span
                                        style={{
                                          fontSize: "0.72rem",
                                          fontWeight: 700,
                                          color: "#9CA5A0",
                                        }}
                                      >
                                        {step.num}
                                      </span>
                                    )}
                                  </div>

                                  {/* Label Below Node */}
                                  <span
                                    style={{
                                      marginTop: "0.35rem",
                                      fontSize: "0.72rem",
                                      fontWeight: isCurrent ? 800 : isPassed ? 600 : 500,
                                      color: isCurrent ? "var(--teal)" : isPassed ? "var(--ink)" : "#9CA5A0",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {step.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* 4. RECEIPT ITEM BREAKDOWN */}
                  <div
                    style={{
                      paddingTop: "0.75rem",
                      borderTop: "2px dashed rgba(50, 55, 65, 0.15)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "0.75rem",
                      }}
                    >
                      <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--ink)" }}>
                        รายการสั่งซื้อ ({totalCups} แก้ว)
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "var(--ink-soft)" }}>
                        ราคา (บาท)
                      </span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      {order.order_items?.map((item, idx) => {
                        const itemTotal = item.unit_price * item.quantity;
                        return (
                          <div
                            key={item.id || idx}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              fontSize: "0.85rem",
                              lineHeight: 1.35,
                            }}
                          >
                            <div style={{ paddingRight: "0.5rem" }}>
                              <div style={{ fontWeight: 700, color: "var(--ink)" }}>
                                {item.quantity}x {item.product?.name_th || "เครื่องดื่ม"}
                              </div>
                              <div style={{ fontSize: "0.75rem", color: "var(--ink-soft)", marginTop: "1px" }}>
                                {item.temperature === "iced" ? "เย็น" : "ร้อน"} • หวาน {item.sweetness_level}
                              </div>
                              {item.order_item_toppings && item.order_item_toppings.length > 0 && (
                                <div style={{ fontSize: "0.75rem", color: "var(--teal)", fontWeight: 600, marginTop: "2px" }}>
                                  + {item.order_item_toppings.map((t) => t.topping?.name_th || "ท็อปปิ้ง").join(", ")}
                                </div>
                              )}
                            </div>

                            <div className="font-mono" style={{ fontWeight: 800, color: "var(--ink)", flexShrink: 0 }}>
                              ฿{itemTotal.toLocaleString()}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 5. SUMMARY / TOTAL PAYMENT */}
                  <div
                    style={{
                      marginTop: "1.25rem",
                      paddingTop: "1rem",
                      borderTop: "2px dashed rgba(50, 55, 65, 0.15)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span style={{ fontSize: "1rem", fontWeight: 800, color: "var(--ink)" }}>
                        ยอดรวมสุทธิ
                      </span>
                      <span
                        className="font-mono"
                        style={{ fontSize: "1.5rem", fontWeight: 900, color: "var(--teal)" }}
                      >
                        ฿{order.total_amount.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* 6. RECEIPT FOOTER & BARCODE */}
                  <div
                    style={{
                      marginTop: "1.5rem",
                      paddingTop: "1rem",
                      borderTop: "1px dotted rgba(50, 55, 65, 0.15)",
                      textAlign: "center",
                    }}
                  >
                    <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--ink)" }}>
                      ขอบคุณที่อุดหนุนร้านถั่วทอง 🙏
                    </p>
                    {/* Barcode Generated from UUID */}
                    <div style={{ marginTop: "1rem", display: "flex", justifyContent: "center" }}>
                      <svg
                        id="order-barcode-svg"
                        ref={barcodeCallbackRef}
                        style={{
                          maxWidth: "100%",
                          height: "auto",
                          display: "block",
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Serrated / Jagged Bottom Receipt Cut Effect */}
                <div
                  style={{
                    height: "12px",
                    width: "100%",
                    background:
                      "radial-gradient(circle, transparent, transparent 50%, #FFFDF9 50%, #FFFDF9 100%) -7px -8px / 16px 16px repeat-x",
                    transform: "rotate(180deg)",
                  }}
                />
              </div>
            </div>

            {/* 3. PRINTER FRONT CUTTER LIP (In Front of Paper - zIndex: 30) */}
            <div
              className="animate-printer-overlay no-export"
              style={{
                position: "absolute",
                top: "-12px",
                left: "-6px",
                right: "-6px",
                height: "14px",
                zIndex: 30,
                backgroundColor: "#1e2229",
                borderRadius: "0 0 0.4rem 0.4rem",
                border: "1px solid #333a48",
                borderTop: "none",
                boxShadow: "0 6px 14px rgba(0, 0, 0, 0.45)",
              }}
            >
              {/* Metal Cutter Blade Edge */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "2px",
                  backgroundColor: "#94a3b8",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.5)",
                }}
              />
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
