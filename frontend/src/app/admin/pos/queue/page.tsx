"use client";

import React, { useState, useEffect } from "react";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import { getStoredToken } from "@/lib/auth";
import {
  Bell,
  CheckCircle2,
  Coffee,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Clock,
  RotateCcw,
  Volume2,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Scan,
  QrCode,
  X,
  Search,
  Camera,
  AlertCircle,
} from "lucide-react";

interface OrderItem {
  id: number;
  product_name_th: string;
  sweetness: string;
  toppings: string[];
  quantity: number;
  note?: string;
  is_combo?: boolean;
  combo_recipes?: string[];
}

interface QueueOrder {
  id: number;
  uuid: string;
  queue_no: string;
  method: "walkin" | "online";
  order_status: "new_order" | "preparing" | "ready" | "completed" | "cancelled";
  created_at: string;
  raw_created_at: string;
  total_amount: number;
  note?: string;
  items: OrderItem[];
}

export default function QueuePickupPage() {
  const [range, setRange] = useState<"วันนี้" | "ทั้งงาน">("วันนี้");
  const [orders, setOrders] = useState<QueueOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"active" | "new_order" | "ready" | "completed">("active");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [page, setPage] = useState<number>(1);
  const pageSize = 12;
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showScanner, setShowScanner] = useState<boolean>(false);
  const [manualCode, setManualCode] = useState<string>("");
  const [scanMessage, setScanMessage] = useState<{ type: "success" | "error" | "warning"; text: string } | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const manualInputRef = React.useRef<HTMLInputElement>(null);

  // Confirmation Modal State for Actions (Ready & Completed)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    order: QueueOrder | null;
    targetStatus: "ready" | "completed";
    fromScan?: boolean;
  }>({
    isOpen: false,
    order: null,
    targetStatus: "ready",
    fromScan: false,
  });

  // Sync fullscreen change events (e.g. user presses Esc)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      // Fallback state toggle if browser fullscreen API is restricted
      setIsFullscreen((prev) => !prev);
    }
  };

  const fetchOrders = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585";
      const res = await fetch(`${apiUrl}/api/v1/orders?page_size=500`);
      const json = await res.json();
      if (res.ok && Array.isArray(json.data)) {
        const mapped: QueueOrder[] = json.data.map((o: any) => {
          const rawItems = o.order_items || o.items || [];
          const items: OrderItem[] = rawItems.map((it: any) => {
            let toppings: string[] = [];
            if (Array.isArray(it.order_item_toppings)) {
              toppings = it.order_item_toppings
                .map((t: any) => t.topping?.name_th || t.topping_name_th || t.name || "")
                .filter(Boolean);
            } else if (Array.isArray(it.toppings)) {
              toppings = it.toppings
                .map((t: any) => (typeof t === "string" ? t : t.topping_name_th || t.name || ""))
                .filter(Boolean);
            }

            let sweetStr = "ปกติ";
            if (it.sweetness_level !== undefined && it.sweetness_level !== null && it.sweetness_level !== "") {
              const s = String(it.sweetness_level).replace(/%/g, "").trim();
              sweetStr = s ? `${s}%` : "ปกติ";
            } else if (it.sweetness) {
              const s = String(it.sweetness).replace(/%/g, "").trim();
              sweetStr = s ? `${s}%` : "ปกติ";
            }

            // Check Combo detection & recipes
            const isCombo = Boolean(
              it.product?.is_combo ||
              (it.product?.combo_recipes && it.product.combo_recipes.length > 0) ||
              (Array.isArray(it.order_item_toppings) && it.order_item_toppings.some((t: any) => t.is_included_in_combo))
            );

            // Combo ingredients / recipes
            const comboRecipes: string[] = [];
            if (it.product?.combo_recipes && Array.isArray(it.product.combo_recipes)) {
              it.product.combo_recipes.forEach((r: any) => {
                if (r.base_product?.name_th && !comboRecipes.includes(r.base_product.name_th)) {
                  comboRecipes.push(r.base_product.name_th);
                }
                if (r.topping?.name_th && !comboRecipes.includes(r.topping.name_th)) {
                  comboRecipes.push(r.topping.name_th);
                }
              });
            }
            if (Array.isArray(it.order_item_toppings)) {
              it.order_item_toppings.forEach((t: any) => {
                if (t.is_included_in_combo) {
                  const tName = t.topping?.name_th || t.topping_name_th || "";
                  if (tName && !comboRecipes.includes(tName)) {
                    comboRecipes.push(tName);
                  }
                }
              });
            }
            if (isCombo && comboRecipes.length === 0 && it.product?.desc_th) {
              comboRecipes.push(it.product.desc_th);
            }

            return {
              id: it.id || 0,
              product_name_th: it.product?.name_th || it.product_name_th || it.name || "เครื่องดื่ม",
              sweetness: sweetStr,
              toppings,
              quantity: it.quantity || 1,
              note: it.note || it.special_instructions || "",
              is_combo: isCombo,
              combo_recipes: comboRecipes,
            };
          });

          const rawCreated = o.created_at || new Date().toISOString();
          let formattedTime = "";
          try {
            const d = new Date(rawCreated);
            formattedTime = d.toLocaleTimeString("th-TH", {
              hour: "2-digit",
              minute: "2-digit",
            }) + " น.";
          } catch {
            formattedTime = "-";
          }

          return {
            id: o.id,
            uuid: o.uuid || "",
            queue_no: o.queue_no || `A${String(o.id).padStart(3, "0")}`,
            method: o.method === "online" ? "online" : "walkin",
            order_status: o.order_status || "new_order",
            created_at: formattedTime,
            raw_created_at: rawCreated,
            total_amount: Number(o.total_amount) || 0,
            note: o.note || "",
            items,
          };
        });
        setOrders(mapped);
      }
    } catch (err) {
      console.error("Failed to fetch queue orders", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (orderId: number, nextStatus: "ready" | "completed" | "new_order") => {
    setUpdatingId(orderId);

    // Optimistic UI update
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, order_status: nextStatus } : o))
    );

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585";
      const token = getStoredToken();
      await fetch(`${apiUrl}/api/v1/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ order_status: nextStatus }),
      });
      fetchOrders();
    } catch (err) {
      console.error("Failed to update order status", err);
    } finally {
      setUpdatingId(null);
    }
  };

  // Open Confirmation Modal from UI button click
  const openConfirmModal = (order: QueueOrder, targetStatus: "ready" | "completed", fromScan = false) => {
    setConfirmModal({
      isOpen: true,
      order,
      targetStatus,
      fromScan,
    });
  };

  // Execute Confirmed Status Change
  const handleConfirmAction = async () => {
    if (!confirmModal.order) return;
    const orderId = confirmModal.order.id;
    const targetStatus = confirmModal.targetStatus;
    const qNo = confirmModal.order.queue_no;
    const wasFromScan = confirmModal.fromScan;

    setConfirmModal({ isOpen: false, order: null, targetStatus: "ready", fromScan: false });

    await handleUpdateStatus(orderId, targetStatus);

    if (wasFromScan || showScanner) {
      setScanMessage({
        type: "success",
        text: `ยืนยันส่งมอบเครื่องดื่มคิว [${qNo}] เรียบร้อย!`,
      });
      setManualCode("");
      setTimeout(() => setScanMessage(null), 3500);
    }
  };

  // Handle Scan / Manual Entry: First check readiness, then show confirmation modal or warning
  const handleScanOrInputPickup = async (rawInput: string) => {
    const code = rawInput.trim();
    if (!code) return;

    // Look up in current loaded orders
    let targetOrder = orders.find(
      (o) =>
        o.uuid.toLowerCase() === code.toLowerCase() ||
        o.queue_no.toLowerCase() === code.toLowerCase() ||
        String(o.id) === code
    );

    // If not found in memory, try fetching from API
    if (!targetOrder) {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585";
        const res = await fetch(`${apiUrl}/api/v1/orders/${code}`);
        const json = await res.json();
        if (res.ok && json.data) {
          const o = json.data;
          targetOrder = {
            id: o.id,
            uuid: o.uuid || "",
            queue_no: o.queue_no || `A${String(o.id).padStart(3, "0")}`,
            method: o.method === "online" ? "online" : "walkin",
            order_status: o.order_status || "new_order",
            created_at: "-",
            raw_created_at: o.created_at || "",
            total_amount: Number(o.total_amount) || 0,
            note: o.note || "",
            items: [],
          };
        }
      } catch (e) {
        console.error("Fetch order error:", e);
      }
    }

    if (!targetOrder) {
      setScanMessage({
        type: "error",
        text: `ไม่พบออเดอร์ "${code}" ในระบบ`,
      });
      setTimeout(() => setScanMessage(null), 4000);
      return;
    }

    // 1. ถ้าออเดอร์ยังไม่พร้อมเสิร์ฟ (สถานะ new_order หรือ preparing)
    if (targetOrder.order_status === "new_order" || targetOrder.order_status === "preparing") {
      setScanMessage({
        type: "warning",
        text: `⚠️ คิว [${targetOrder.queue_no}] ยังไม่พร้อมเสิร์ฟ (กำลังทำเครื่องดื่มอยู่ในครัว)`,
      });
      setTimeout(() => setScanMessage(null), 5000);
      return;
    }

    // 2. ถ้าออเดอร์รับไปเรียบร้อยแล้ว
    if (targetOrder.order_status === "completed") {
      setScanMessage({
        type: "warning",
        text: `ℹ️ คิว [${targetOrder.queue_no}] ได้รับเครื่องดื่มไปเรียบร้อยแล้ว`,
      });
      setTimeout(() => setScanMessage(null), 4000);
      return;
    }

    // 3. ถ้าออเดอร์พร้อมเสิร์ฟ (ready) -> เปิด Modal เพื่อให้กดยืนยันการส่งมอบเครื่องดื่ม
    openConfirmModal(targetOrder, "completed", true);
  };

  // Camera stream controls & BarcodeDetector/QR scanning
  const startCamera = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setCameraActive(true);
      }
    } catch (err) {
      console.warn("Camera access not available or denied", err);
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Continuously scan video stream if BarcodeDetector API is supported in browser
  useEffect(() => {
    let animationFrameId: number;
    let detector: any = null;

    if (cameraActive && typeof window !== "undefined" && "BarcodeDetector" in window) {
      try {
        // @ts-ignore
        detector = new window.BarcodeDetector({
          formats: ["qr_code"],
        });
      } catch (e) {
        console.warn("BarcodeDetector init error", e);
      }
    }

    const detectFrame = async () => {
      if (detector && videoRef.current && videoRef.current.readyState >= 2) {
        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes && barcodes.length > 0) {
            const rawValue = barcodes[0].rawValue;
            if (rawValue) {
              handleScanOrInputPickup(rawValue);
              // Pause briefly before scanning next
              await new Promise((r) => setTimeout(r, 1500));
            }
          }
        } catch {
          // ignore detection frame errors
        }
      }
      if (cameraActive) {
        animationFrameId = requestAnimationFrame(detectFrame);
      }
    };

    if (cameraActive && detector) {
      detectFrame();
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [cameraActive, orders]);

  // Handle hardware USB Barcode/QR scanner keyboard wedge (fast keystrokes ending with Enter)
  useEffect(() => {
    let buffer = "";
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in regular text inputs
      if (
        document.activeElement &&
        (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA") &&
        document.activeElement !== manualInputRef.current
      ) {
        return;
      }

      const now = Date.now();
      if (now - lastKeyTime > 150) {
        buffer = ""; // reset buffer if typing delay is too long
      }
      lastKeyTime = now;

      if (e.key === "Enter") {
        if (buffer.length >= 3) {
          handleScanOrInputPickup(buffer);
          buffer = "";
        }
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [orders]);

  // Clean up camera on modal close
  useEffect(() => {
    if (!showScanner) {
      stopCamera();
    }
  }, [showScanner]);

  // Filter by Date Range ("วันนี้" vs "ทั้งงาน")
  const isToday = (isoDate: string) => {
    if (!isoDate) return false;
    const d = new Date(isoDate);
    const today = new Date();
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  };

  const rangeFilteredOrders = orders.filter((o) => {
    if (range === "วันนี้") {
      return isToday(o.raw_created_at);
    }
    return true;
  });

  // Tab Filtering & Default display:
  // "active" (default) -> แสดง new_order (รวม preparing) และ ready
  // "new_order" -> แสดงเฉพาะ new_order / preparing
  // "ready" -> แสดงเฉพาะ ready
  // "completed" -> แสดงเฉพาะ completed
  const tabFilteredOrders = rangeFilteredOrders.filter((o) => {
    if (activeTab === "active") {
      return o.order_status === "new_order" || o.order_status === "preparing" || o.order_status === "ready";
    }
    if (activeTab === "new_order") {
      return o.order_status === "new_order" || o.order_status === "preparing";
    }
    if (activeTab === "ready") {
      return o.order_status === "ready";
    }
    if (activeTab === "completed") {
      return o.order_status === "completed";
    }
    return true;
  });

  // FIFO Sorting: เก่าสุดขึ้นก่อนเหมือนหน้า Kitchen (ยกเว้น tab completed ให้แสดงใหม่อยู่บนสุด)
  const sortedOrders = [...tabFilteredOrders].sort((a, b) => {
    const timeA = new Date(a.raw_created_at).getTime() || a.id;
    const timeB = new Date(b.raw_created_at).getTime() || b.id;
    if (activeTab === "completed") {
      return timeB - timeA; // completed แสดงล่าสุดก่อน
    }
    return timeA - timeB; // FIFO เก่าสุดขึ้นก่อนเหมือนครัว
  });

  const totalPages = Math.max(1, Math.ceil(sortedOrders.length / pageSize));
  const paginatedOrders = sortedOrders.slice((page - 1) * pageSize, page * pageSize);

  // KPI Calculations based on date range
  const newOrderOrders = rangeFilteredOrders.filter(
    (o) => o.order_status === "new_order" || o.order_status === "preparing"
  );
  const readyOrders = rangeFilteredOrders.filter((o) => o.order_status === "ready");
  const completedOrders = rangeFilteredOrders.filter((o) => o.order_status === "completed");

  const newOrderCount = newOrderOrders.length;
  const readyCount = readyOrders.length;
  const completedCount = completedOrders.length;
  const activeCount = newOrderCount + readyCount;

  const newOrderCups = newOrderOrders.reduce((sum, o) => sum + o.items.reduce((s, it) => s + (it.quantity || 1), 0), 0);
  const readyCups = readyOrders.reduce((sum, o) => sum + o.items.reduce((s, it) => s + (it.quantity || 1), 0), 0);
  const completedCups = completedOrders.reduce((sum, o) => sum + o.items.reduce((s, it) => s + (it.quantity || 1), 0), 0);

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "var(--cream)",
        fontFamily: "'Kanit', sans-serif",
        position: "relative",
      }}
    >
      {!isFullscreen && <AdminSidebar />}

      <main
        className={isFullscreen ? "pos-fullscreen-mobile" : ""}
        style={{
          flex: 1,
          padding: isFullscreen ? "1.5rem 2rem" : "1.75rem 2.5rem",
          overflowY: "auto",
          minWidth: 0,
        }}
      >
        {/* Header Section */}
        <div
          className="pos-header-section"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "0.75rem",
          }}
        >
          <div className="pos-header-title">
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--ink)", lineHeight: 1.2, margin: 0 }}>
              คิว
            </h1>
          </div>

          {/* Action Group: Fullscreen Button (Left) + Filter (วันนี้ / ทั้งงาน) (Right) */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              flexWrap: "wrap",
            }}
          >
            {/* Scanner Button (สแกนรับคิว) */}
            <button
              type="button"
              onClick={() => {
                setShowScanner(true);
                startCamera();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.45rem",
                padding: "0.55rem 1.05rem",
                borderRadius: "9999px",
                border: "none",
                backgroundColor: "var(--teal)",
                color: "#fff",
                fontSize: "0.875rem",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 2px 10px rgba(75, 155, 140, 0.28)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.03)";
                e.currentTarget.style.filter = "brightness(0.92)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.filter = "none";
              }}
            >
              <Scan size={17} />
              <span>สแกนรับเครื่องดื่ม</span>
            </button>

            {/* Fullscreen Toggle Button */}
            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? "ออกจากโหมดเต็มจอ" : "แสดงผลเต็มจอ"}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.55rem 0.95rem",
                borderRadius: "9999px",
                border: "1px solid rgba(50, 55, 65, 0.12)",
                backgroundColor: isFullscreen ? "var(--ink)" : "var(--card)",
                color: isFullscreen ? "var(--cream)" : "var(--ink)",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.03)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 size={16} />
                  <span>ย่อจอ</span>
                </>
              ) : (
                <>
                  <Maximize2 size={16} />
                  <span>เต็มจอ</span>
                </>
              )}
            </button>

            {/* Date Range Toggle (วันนี้ vs ทั้งงาน) */}
            <div
              style={{
                display: "flex",
                borderRadius: "9999px",
                backgroundColor: "var(--card)",
                padding: "0.25rem",
                border: "1px solid rgba(50, 55, 65, 0.12)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              }}
            >
              {(["วันนี้", "ทั้งงาน"] as const).map((r) => {
                const isSelected = range === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setRange(r);
                      setPage(1);
                    }}
                    style={{
                      borderRadius: "9999px",
                      padding: "0.4rem 1.15rem",
                      fontSize: "0.85rem",
                      fontWeight: isSelected ? 700 : 500,
                      border: "none",
                      cursor: "pointer",
                      backgroundColor: isSelected ? "var(--ink)" : "transparent",
                      color: isSelected ? "var(--cream)" : "var(--ink-soft)",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3 KPI Cards Grid (เหมือนหน้าครัวและหน้า dashboard: สลับ วันนี้/ทั้งงาน ได้) */}
        <div
          className="admin-kpi-grid"
          style={{
            marginTop: "1.5rem",
            marginBottom: "1.5rem",
          }}
        >
          {/* Card 1: ออเดอร์ใหม่ */}
          <div
            className="admin-kpi-card animate-rise"
            onClick={() => {
              setActiveTab("new_order");
              setPage(1);
            }}
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
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <div>
              <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)", fontWeight: 500, margin: 0 }}>
                ออเดอร์ใหม่ (กำลังทำ)
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
                {newOrderCount}
              </p>
            </div>
            <div>
              <p style={{ fontSize: "0.75rem", color: "var(--ink-soft)", fontWeight: 400, lineHeight: 1.3, margin: 0 }}>
                {newOrderCups} แก้ว ({range})
              </p>
            </div>
          </div>

          {/* Card 2: พร้อมรับ */}
          <div
            className="admin-kpi-card animate-rise"
            onClick={() => {
              setActiveTab("ready");
              setPage(1);
            }}
            style={{
              animationDelay: "45ms",
              borderRadius: "1.25rem",
              backgroundColor: "var(--card)",
              padding: "1.25rem 1.35rem",
              border: "1px solid rgba(50, 55, 65, 0.09)",
              boxShadow: "0 2px 12px -2px rgba(0,0,0,0.03)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxSizing: "border-box",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <div>
              <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)", fontWeight: 500, margin: 0 }}>
                พร้อมรับ (เรียกคิวแล้ว)
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
                {readyCount}
              </p>
            </div>
            <div>
              <p style={{ fontSize: "0.75rem", color: "var(--ink-soft)", fontWeight: 400, lineHeight: 1.3, margin: 0 }}>
                {readyCups} แก้ว ({range})
              </p>
            </div>
          </div>

          {/* Card 3: เสร็จสิ้น */}
          <div
            className="admin-kpi-card animate-rise"
            onClick={() => {
              setActiveTab("completed");
              setPage(1);
            }}
            style={{
              animationDelay: "90ms",
              borderRadius: "1.25rem",
              backgroundColor: "var(--card)",
              padding: "1.25rem 1.35rem",
              border: "1px solid rgba(50, 55, 65, 0.09)",
              boxShadow: "0 2px 12px -2px rgba(0,0,0,0.03)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxSizing: "border-box",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <div>
              <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)", fontWeight: 500, margin: 0 }}>
                เสร็จสิ้น (ส่งมอบแล้ว)
              </p>
            </div>
            <div style={{ marginTop: "0.5rem", marginBottom: "0.35rem" }}>
              <p
                style={{
                  fontSize: "1.85rem",
                  fontWeight: 800,
                  fontFamily: "'Kanit', sans-serif",
                  color: "#000000ff",
                  letterSpacing: "-0.01em",
                  lineHeight: 1.15,
                  margin: 0,
                }}
              >
                {completedCount}
              </p>
            </div>
            <div>
              <p style={{ fontSize: "0.75rem", color: "var(--ink-soft)", fontWeight: 400, lineHeight: 1.3, margin: 0 }}>
                {completedCups} แก้ว ({range})
              </p>
            </div>
          </div>

          {/* Ghost card for row balancing on mobile (2 cols) and wide screens (6 cols) */}
          <div className="admin-kpi-card admin-kpi-card-ghost" aria-hidden="true" />
        </div>

        {/* Filter Bar: Desktop Tabs + Mobile Select พร้อมแสดงจำนวน (...) */}
        <div
          style={{
            backgroundColor: "var(--card)",
            padding: "1rem 1.25rem",
            borderRadius: "1.25rem",
            border: "1px solid rgba(50, 55, 65, 0.1)",
            boxShadow: "0 4px 20px -2px rgba(0,0,0,0.03)",
            marginBottom: "1.25rem",
          }}
        >
          <div className="admin-controls-bar" style={{ marginBottom: 0 }}>
            {/* Left Side: Filter Tabs (Desktop) */}
            <div className="admin-filter-tabs">
              {[
                { id: "active", label: `ยังไม่เสร็จสิ้น (${activeCount})` },
                { id: "new_order", label: `ออเดอร์ใหม่ (${newOrderCount})` },
                { id: "ready", label: `พร้อมรับ (${readyCount})` },
                { id: "completed", label: `เสร็จสิ้น (${completedCount})` },
              ].map((tab) => {
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab.id as any);
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

            {/* Left Side: Filter Dropdown (Mobile) */}
            <div className="admin-filter-dropdown-wrapper">
              <select
                className="admin-filter-select"
                value={activeTab}
                onChange={(e) => {
                  setActiveTab(e.target.value as any);
                  setPage(1);
                }}
              >
                <option value="active">ยังไม่เสร็จสิ้น ({activeCount})</option>
                <option value="new_order">ออเดอร์ใหม่ ({newOrderCount})</option>
                <option value="ready">พร้อมรับ ({readyCount})</option>
                <option value="completed">เสร็จสิ้น ({completedCount})</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders Cards Grid */}
        {sortedOrders.length > 0 ? (
          <>
            <div
              style={{
                marginTop: "1.25rem",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
                gap: "1rem",
              }}
            >
              {paginatedOrders.map((order) => {
                const isReady = order.order_status === "ready";
                const isCompleted = order.order_status === "completed";
                const totalCups = order.items.reduce((s, it) => s + it.quantity, 0);

                return (
                  <div
                    key={order.id}
                    className="animate-rise"
                    style={{
                      backgroundColor: "var(--card)",
                      borderRadius: "1rem",
                      boxSizing: "border-box",
                      border: isReady
                        ? "2px solid var(--teal)"
                        : isCompleted
                        ? "2px solid rgba(22, 163, 74, 0.3)"
                        : "2px solid rgba(50,55,65,0.12)",
                      padding: "1.1rem",
                      boxShadow: isReady
                        ? "0 4px 16px rgba(75, 155, 140, 0.15)"
                        : "0 2px 8px rgba(0,0,0,0.02)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {/* Status Top Tag */}
                    {isReady && (
                      <div
                        style={{
                          position: "absolute",
                          top: 0,
                          right: 0,
                          backgroundColor: "var(--teal)",
                          color: "#fff",
                          fontSize: "0.7rem",
                          fontWeight: 800,
                          padding: "3px 12px",
                          borderBottomLeftRadius: "0.6rem",
                          display: "flex",
                          alignItems: "center",
                          gap: "3px",
                        }}
                      >
                        <Bell size={12} />
                        พร้อมรับ
                      </div>
                    )}

                    {isCompleted && (
                      <div
                        style={{
                          position: "absolute",
                          top: 0,
                          right: 0,
                          backgroundColor: "var(--teal)",
                          color: "#fff",
                          fontSize: "0.7rem",
                          fontWeight: 800,
                          padding: "3px 12px",
                          borderBottomLeftRadius: "0.6rem",
                          display: "flex",
                          alignItems: "center",
                          gap: "3px",
                        }}
                      >
                        <CheckCheck size={12} />
                        ส่งมอบแล้ว
                      </div>
                    )}

                    <div>
                      {/* Top Card Info */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          paddingBottom: "0.75rem",
                          borderBottom: "1px solid rgba(50,55,65,0.08)",
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                            <span
                              className="font-mono"
                              style={{
                                fontSize: "1.6rem",
                                fontWeight: 900,
                                color: isReady ? "var(--teal)" : isCompleted ? "#16a34a" : "var(--ink)",
                                lineHeight: 1,
                              }}
                            >
                              {order.queue_no}
                            </span>
                            <span
                              style={{
                                fontSize: "0.75rem",
                                fontWeight: 800,
                                color: "var(--ink)",
                                backgroundColor: "var(--cream)",
                                padding: "2px 7px",
                                borderRadius: "6px",
                                border: "1px solid rgba(50,55,65,0.08)",
                                lineHeight: 1.2,
                              }}
                            >
                              {order.method === "walkin" ? "หน้าร้าน" : "ออนไลน์"}
                            </span>
                          </div>
                          <p style={{ fontSize: "0.75rem", color: "var(--ink-soft)", margin: "0.25rem 0 0 0" }}>
                            {order.created_at}
                          </p>
                        </div>

                        <div style={{ textAlign: "right", marginTop: isReady || isCompleted ? "1.1rem" : "0" }}>
                          <span
                            style={{
                              fontSize: "0.8rem",
                              fontWeight: 800,
                              color: "var(--ink)",
                              backgroundColor: "var(--cream)",
                              padding: "2px 7px",
                              borderRadius: "6px",
                              border: "1px solid rgba(50,55,65,0.08)",
                            }}
                          >
                            {totalCups} แก้ว
                          </span>
                        </div>
                      </div>

                      {/* Drink Items List */}
                      <div
                        style={{
                          marginTop: "0.75rem",
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.5rem",
                        }}
                      >
                        {order.items.map((item, idx) => (
                          <div
                            key={idx}
                            style={{
                              backgroundColor: "var(--cream)",
                              padding: "0.55rem 0.75rem",
                              borderRadius: "0.65rem",
                              border: item.is_combo ? "1.5px solid rgba(37, 99, 235, 0.35)" : "1px solid rgba(50,55,65,0.06)",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: "0.5rem",
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                                <span
                                  style={{
                                    fontWeight: 700,
                                    color: "var(--ink)",
                                    fontSize: "0.9rem",
                                  }}
                                >
                                  {item.product_name_th}
                                </span>
                                {item.is_combo && (
                                  <span
                                    style={{
                                      fontSize: "0.68rem",
                                      fontWeight: 700,
                                      backgroundColor: "rgba(37, 99, 235, 0.12)",
                                      color: "#2563eb",
                                      padding: "1px 6px",
                                      borderRadius: "5px",
                                      border: "1px solid rgba(37, 99, 235, 0.25)",
                                    }}
                                  >
                                    คอมโบ
                                  </span>
                                )}
                              </div>
                              <span
                                style={{
                                  fontWeight: 900,
                                  color: "var(--teal)",
                                  fontSize: "0.95rem",
                                }}
                              >
                                x{item.quantity}
                              </span>
                            </div>

                            <div
                              style={{
                                marginTop: "0.3rem",
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "0.3rem",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "0.7rem",
                                  backgroundColor: "var(--card)",
                                  padding: "1px 6px",
                                  borderRadius: "4px",
                                  fontWeight: 600,
                                  color: "var(--ink)",
                                  border: "1px solid rgba(50,55,65,0.06)",
                                }}
                              >
                                หวาน {item.sweetness}
                              </span>

                              {/* Combo Recipe / Base & Included Toppings rendered as Badges */}
                              {item.is_combo && item.combo_recipes && item.combo_recipes.map((cr, crIdx) => (
                                <span
                                  key={`cr-${crIdx}`}
                                  style={{
                                    fontSize: "0.7rem",
                                    backgroundColor: "rgba(37, 99, 235, 0.12)",
                                    color: "#1e40af",
                                    padding: "1px 6px",
                                    borderRadius: "4px",
                                    fontWeight: 600,
                                    border: "1px solid rgba(37, 99, 235, 0.2)",
                                  }}
                                >
                                  +{cr}
                                </span>
                              ))}

                              {/* Additional Toppings */}
                              {item.toppings.map((top, tIdx) => (
                                <span
                                  key={tIdx}
                                  style={{
                                    fontSize: "0.7rem",
                                    backgroundColor: "rgba(75,155,140,0.15)",
                                    color: "var(--teal)",
                                    padding: "1px 6px",
                                    borderRadius: "4px",
                                    fontWeight: 600,
                                  }}
                                >
                                  +{top}
                                </span>
                              ))}
                            </div>

                            {/* Item Note */}
                            {item.note && (
                              <div
                                style={{
                                  marginTop: "0.35rem",
                                  fontSize: "0.75rem",
                                  color: "#b45309",
                                  backgroundColor: "rgba(245, 158, 11, 0.12)",
                                  padding: "3px 7px",
                                  borderRadius: "4px",
                                  fontWeight: 600,
                                  lineHeight: 1.3,
                                  border: "1px dashed rgba(245, 158, 11, 0.3)",
                                }}
                              >
                                โน้ต: {item.note}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Order Note (if any) */}
                      {order.note && (
                        <div
                          style={{
                            marginTop: "0.75rem",
                            padding: "0.5rem 0.65rem",
                            borderRadius: "0.5rem",
                            backgroundColor: "rgba(245, 158, 11, 0.08)",
                            border: "1px dashed rgba(245, 158, 11, 0.35)",
                            fontSize: "0.775rem",
                            color: "#b45309",
                            lineHeight: 1.35,
                          }}
                        >
                          <span style={{ fontWeight: 700 }}>โน้ตจากลูกค้า: </span>
                          <span>{order.note}</span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Action CTA Buttons */}
                    <div
                      style={{
                        marginTop: "1rem",
                        paddingTop: "0.75rem",
                        borderTop: "1px solid rgba(50,55,65,0.08)",
                        display: "flex",
                        gap: "0.45rem",
                      }}
                    >
                      {!isReady && !isCompleted ? (
                        <button
                          type="button"
                          disabled={updatingId === order.id}
                          onClick={() => openConfirmModal(order, "ready")}
                          style={{
                            flex: 1,
                            padding: "0.65rem",
                            borderRadius: "0.65rem",
                            border: "none",
                            backgroundColor: "var(--teal)",
                            color: "#fff",
                            fontWeight: 700,
                            fontSize: "0.9rem",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "0.4rem",
                            boxShadow: "0 4px 12px rgba(75, 155, 140, 0.2)",
                          }}
                        >
                          <Bell size={16} />
                          <span>เรียกคิว (พร้อมรับ)</span>
                        </button>
                      ) : isReady ? (
                        <>
                          <button
                            type="button"
                            disabled={updatingId === order.id}
                            onClick={() => handleUpdateStatus(order.id, "new_order")}
                            title="ย้อนกลับเป็นสถานะกำลังทำ"
                            style={{
                              padding: "0.65rem 0.75rem",
                              borderRadius: "0.65rem",
                              border: "1px solid rgba(50,55,65,0.15)",
                              backgroundColor: "transparent",
                              color: "var(--ink-soft)",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <RotateCcw size={15} />
                          </button>

                          <button
                            type="button"
                            disabled={updatingId === order.id}
                            onClick={() => openConfirmModal(order, "completed")}
                            style={{
                              flex: 1,
                              padding: "0.65rem",
                              borderRadius: "0.65rem",
                              border: "none",
                              backgroundColor: "var(--teal)",
                              color: "#fff",
                              fontWeight: 700,
                              fontSize: "0.9rem",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "0.4rem",
                              boxShadow: "0 4px 12px rgba(75, 155, 140, 0.2)",
                            }}
                          >
                            <CheckCheck size={16} />
                            <span>ลูกค้ามารับแล้ว</span>
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          disabled={updatingId === order.id}
                          onClick={() => openConfirmModal(order, "ready")}
                          title="ย้อนกลับเป็นสถานะพร้อมรับ"
                          style={{
                            flex: 1,
                            padding: "0.6rem",
                            borderRadius: "0.65rem",
                            border: "1px solid rgba(50,55,65,0.15)",
                            backgroundColor: "var(--cream)",
                            color: "var(--ink)",
                            fontWeight: 600,
                            fontSize: "0.825rem",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "0.4rem",
                          }}
                        >
                          <RotateCcw size={14} />
                          <span>ย้ายกลับไปพร้อมรับ</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: "1.75rem",
                  padding: "0.75rem 1rem",
                  backgroundColor: "var(--card)",
                  borderRadius: "0.85rem",
                  border: "1px solid rgba(50, 55, 65, 0.1)",
                }}
              >
                <div style={{ fontSize: "0.85rem", color: "var(--ink-soft)" }}>
                  แสดงหน้า <strong style={{ color: "var(--ink)" }}>{page}</strong> จาก ทั้งหมด{" "}
                  <strong style={{ color: "var(--ink)" }}>{totalPages}</strong> หน้า (ทั้งหมด {sortedOrders.length} ออเดอร์)
                </div>

                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem",
                      padding: "0.45rem 0.85rem",
                      fontSize: "0.825rem",
                      fontWeight: 600,
                      borderRadius: "0.5rem",
                      border: "1px solid rgba(50, 55, 65, 0.15)",
                      backgroundColor: page <= 1 ? "rgba(0,0,0,0.03)" : "var(--card)",
                      color: page <= 1 ? "rgba(50,55,65,0.3)" : "var(--ink)",
                      cursor: page <= 1 ? "not-allowed" : "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <ChevronLeft size={16} />
                    ก่อนหน้า
                  </button>

                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem",
                      padding: "0.45rem 0.85rem",
                      fontSize: "0.825rem",
                      fontWeight: 600,
                      borderRadius: "0.5rem",
                      border: "1px solid rgba(50, 55, 65, 0.15)",
                      backgroundColor: page >= totalPages ? "rgba(0,0,0,0.03)" : "var(--card)",
                      color: page >= totalPages ? "rgba(50,55,65,0.3)" : "var(--ink)",
                      cursor: page >= totalPages ? "not-allowed" : "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    ถัดไป
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: "3.5rem 1rem",
              marginTop: "1.5rem",
              backgroundColor: "var(--card)",
              borderRadius: "1rem",
              border: "1px dashed rgba(50,55,65,0.15)",
              color: "var(--ink-soft)",
            }}
          >
            <Coffee size={40} style={{ margin: "0 auto 0.6rem", opacity: 0.35 }} />
            <p style={{ margin: 0, fontWeight: 700, fontSize: "0.95rem" }}>
              {activeTab === "completed"
                ? "ยังไม่มีออเดอร์ที่เสร็จสิ้น"
                : activeTab === "ready"
                ? "ไม่มีออเดอร์ที่พร้อมรับในขณะนี้"
                : activeTab === "new_order"
                ? "ไม่มีออเดอร์กำลังทำในขณะนี้"
                : "ไม่มีรายการคิวค้างในขณะนี้"}
            </p>
          </div>
        )}
      </main>

      {/* Scanner & Manual Queue Pickup Modal */}
      {showScanner && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            backgroundColor: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowScanner(false);
            }
          }}
        >
          <div
            className="animate-modal-pop"
            style={{
              maxWidth: "480px",
              width: "100%",
              backgroundColor: "var(--card)",
              borderRadius: "1.25rem",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
              border: "1px solid rgba(50, 55, 65, 0.15)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "1.1rem 1.35rem",
                borderBottom: "1px solid rgba(50, 55, 65, 0.1)",
                backgroundColor: "var(--cream)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "0.5rem",
                    backgroundColor: "var(--teal)",
                    color: "#fff",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <QrCode size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "var(--ink)" }}>
                    สแกน QR รับเครื่องดื่ม
                  </h3>
                  <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--ink-soft)" }}>
                    สแกน QR Code บนใบเสร็จลูกค้า
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowScanner(false)}
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  border: "none",
                  backgroundColor: "rgba(50, 55, 65, 0.08)",
                  color: "var(--ink)",
                  display: "grid",
                  placeItems: "center",
                  cursor: "pointer",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "1.25rem 1.35rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Scan Toast / Status Message */}
              {scanMessage && (
                <div
                  className="animate-rise"
                  style={{
                    padding: "0.75rem 1rem",
                    borderRadius: "0.75rem",
                    backgroundColor: scanMessage.type === "success" ? "#dcfce7" : "#fee2e2",
                    color: scanMessage.type === "success" ? "#15803d" : "#b91c1c",
                    border: `1px solid ${scanMessage.type === "success" ? "#86efac" : "#fca5a5"}`,
                    fontSize: "0.9rem",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  {scanMessage.type === "success" ? <CheckCheck size={18} /> : <AlertCircle size={18} />}
                  <span>{scanMessage.text}</span>
                </div>
              )}

              {/* Camera Scanner Viewport */}
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: "210px",
                  borderRadius: "0.85rem",
                  backgroundColor: "#0f172a",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: cameraActive ? "block" : "none",
                  }}
                />

                {!cameraActive && (
                  <div
                    style={{
                      textAlign: "center",
                      color: "#94a3b8",
                      padding: "1rem",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <Camera size={34} style={{ opacity: 0.6 }} />
                    <span style={{ fontSize: "0.85rem" }}>เปิดการอนุญาตใช้กล้องเพื่อใช้งาน</span>
                    <button
                      type="button"
                      onClick={startCamera}
                      style={{
                        marginTop: "0.25rem",
                        padding: "0.4rem 0.85rem",
                        borderRadius: "0.5rem",
                        backgroundColor: "#334155",
                        color: "#fff",
                        border: "none",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      เปิดกล้องสแกน
                    </button>
                  </div>
                )}

                {/* Viewfinder Corner Brackets */}
                {cameraActive && (
                  <div
                    style={{
                      position: "absolute",
                      inset: "15% 15%",
                      border: "2px solid rgba(255, 255, 255, 0.5)",
                      borderRadius: "0.75rem",
                      pointerEvents: "none",
                    }}
                  />
                )}
              </div>

              {/* Manual Input Form (เผื่อพิมพ์เลขคิวหรือกรอกเอง) */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    color: "var(--ink)",
                    marginBottom: "0.4rem",
                  }}
                >
                  หรือกรอกหมายเลขคิว / รหัสออเดอร์ด้วยตนเอง:
                </label>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (manualCode.trim()) {
                      handleScanOrInputPickup(manualCode.trim());
                    }
                  }}
                  style={{ display: "flex", gap: "0.5rem" }}
                >
                  <div style={{ position: "relative", flex: 1 }}>
                    <input
                      ref={manualInputRef}
                      type="text"
                      placeholder="เช่น A001 หรือ B005 หรือ UUID..."
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      autoFocus
                      style={{
                        width: "100%",
                        padding: "0.65rem 0.85rem",
                        borderRadius: "0.65rem",
                        border: "1.5px solid rgba(50, 55, 65, 0.2)",
                        fontSize: "0.95rem",
                        fontWeight: 700,
                        backgroundColor: "var(--card)",
                        color: "var(--ink)",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!manualCode.trim()}
                    style={{
                      padding: "0.65rem 1.25rem",
                      borderRadius: "0.65rem",
                      border: "none",
                      backgroundColor: manualCode.trim() ? "var(--teal)" : "rgba(50, 55, 65, 0.2)",
                      color: "#fff",
                      fontSize: "0.9rem",
                      fontWeight: 700,
                      cursor: manualCode.trim() ? "pointer" : "not-allowed",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <CheckCheck size={17} />
                    <span>ยืนยัน</span>
                  </button>
                </form>
              </div>

              {/* Quick Pick: ออเดอร์ที่พร้อมรับในระบบ (คลิกรับได้ทันทีไม่ต้องพิมพ์) */}
              {readyOrders.length > 0 && (
                <div style={{ marginTop: "0.25rem" }}>
                  <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--ink-soft)" }}>
                    คิวที่พร้อมรับในระบบตอนนี้ ({readyOrders.length} คิว):
                  </span>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "0.4rem",
                      marginTop: "0.35rem",
                      maxHeight: "100px",
                      overflowY: "auto",
                    }}
                  >
                    {readyOrders.map((ro) => (
                      <button
                        key={ro.id}
                        type="button"
                        onClick={() => handleScanOrInputPickup(ro.queue_no)}
                        style={{
                          padding: "0.3rem 0.65rem",
                          borderRadius: "0.45rem",
                          border: "1px solid var(--teal)",
                          backgroundColor: "rgba(75, 155, 140, 0.08)",
                          color: "var(--teal)",
                          fontSize: "0.8rem",
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.25rem",
                          transition: "all 0.1s ease",
                        }}
                      >
                        <span>{ro.queue_no}</span>
                        <CheckCheck size={13} />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Confirmation Modal (สำหรับ 'เรียกคิว (พร้อมรับ)' และ 'ลูกค้ามารับแล้ว') */}
      {confirmModal.isOpen && confirmModal.order && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 110,
            backgroundColor: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setConfirmModal({ isOpen: false, order: null, targetStatus: "ready", fromScan: false });
            }
          }}
        >
          <div
            className="animate-modal-pop"
            style={{
              maxWidth: "420px",
              width: "100%",
              backgroundColor: "var(--card)",
              borderRadius: "1.25rem",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
              border: "1px solid rgba(50, 55, 65, 0.15)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "1.1rem 1.35rem",
                borderBottom: "1px solid rgba(50, 55, 65, 0.1)",
                backgroundColor: "var(--cream)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "0.5rem",
                    backgroundColor: "var(--teal)",
                    color: "#fff",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  {confirmModal.targetStatus === "completed" ? <CheckCheck size={20} /> : <Bell size={20} />}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "var(--ink)" }}>
                    {confirmModal.targetStatus === "completed" ? "ยืนยันการส่งมอบเครื่องดื่ม" : "ยืนยันการเรียกคิว"}
                  </h3>
                  <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--ink-soft)" }}>
                    {confirmModal.targetStatus === "completed" ? "ตรวจสอบรายการและส่งมอบให้ลูกค้า" : "เปลี่ยนสถานะเป็นพร้อมรับเครื่องดื่ม"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setConfirmModal({ isOpen: false, order: null, targetStatus: "ready", fromScan: false })}
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  border: "none",
                  backgroundColor: "rgba(50, 55, 65, 0.08)",
                  color: "var(--ink)",
                  display: "grid",
                  placeItems: "center",
                  cursor: "pointer",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "1.25rem 1.35rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Queue Number Highlight Box */}
              <div
                style={{
                  padding: "1rem",
                  borderRadius: "0.85rem",
                  backgroundColor: "var(--cream)",
                  border: "2px dashed var(--teal)",
                  textAlign: "center",
                }}
              >
                <span style={{ fontSize: "0.8rem", color: "var(--ink-soft)", fontWeight: 600 }}>
                  หมายเลขคิว
                </span>
                <p
                  className="font-mono"
                  style={{
                    margin: "0.2rem 0 0 0",
                    fontSize: "2.75rem",
                    fontWeight: 900,
                    color: "var(--teal)",
                    lineHeight: 1,
                  }}
                >
                  {confirmModal.order.queue_no}
                </p>
                <span
                  style={{
                    display: "inline-block",
                    marginTop: "0.4rem",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "var(--ink)",
                    backgroundColor: "var(--card)",
                    padding: "2px 8px",
                    borderRadius: "9999px",
                    border: "1px solid rgba(50, 55, 65, 0.1)",
                  }}
                >
                  {confirmModal.order.method === "walkin" ? "หน้าร้าน (Walk-in)" : "สั่งออนไลน์ (Online)"}
                </span>
              </div>



              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "0.6rem", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setConfirmModal({ isOpen: false, order: null, targetStatus: "ready", fromScan: false })}
                  style={{
                    flex: 1,
                    padding: "0.75rem",
                    borderRadius: "0.75rem",
                    border: "1px solid rgba(50, 55, 65, 0.15)",
                    backgroundColor: "transparent",
                    color: "var(--ink)",
                    fontSize: "0.9rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  ยกเลิก
                </button>

                <button
                  type="button"
                  onClick={handleConfirmAction}
                  style={{
                    flex: 2,
                    padding: "0.75rem",
                    borderRadius: "0.75rem",
                    border: "none",
                    backgroundColor: "var(--teal)",
                    color: "#fff",
                    fontSize: "0.95rem",
                    fontWeight: 800,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.45rem",
                    boxShadow: "0 4px 14px rgba(75, 155, 140, 0.3)",
                  }}
                >
                  {confirmModal.targetStatus === "completed" ? <CheckCheck size={18} /> : <Bell size={18} />}
                  <span>
                    {confirmModal.targetStatus === "completed" ? "ยืนยันส่งมอบแล้ว" : "ยืนยันเรียกคิว"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
