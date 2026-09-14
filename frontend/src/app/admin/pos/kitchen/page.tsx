"use client";

import React, { useState, useEffect } from "react";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import {
  Clock,
  Coffee,
  Check,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
} from "lucide-react";

interface KitchenOrderItem {
  id: number;
  product_name_th: string;
  sweetness: string;
  toppings: string[];
  quantity: number;
  note?: string;
  is_combo?: boolean;
  combo_recipes?: string[];
}

interface KitchenOrder {
  id: number;
  order_no: string;
  queue_number: string;
  method: "walkin" | "online";
  customer_name?: string;
  customer_phone?: string;
  order_status: "new_order" | "preparing" | "ready" | "completed";
  ordered_at: string;
  raw_created_at: string;
  raw_updated_at?: string;
  total_cups: number;
  total_amount: number;
  note?: string;
  items: KitchenOrderItem[];
}

export default function POSKitchenPage() {
  const [range, setRange] = useState<"วันนี้" | "ทั้งงาน">("วันนี้");
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [apiCompletedStats, setApiCompletedStats] = useState<{
    completed_orders_count: number;
    completed_cups_count: number;
  } | null>(null);

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

  const fetchStats = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585";
      const dateQuery = range === "วันนี้" ? "today" : "all";
      const res = await fetch(`${apiUrl}/api/v1/orders/stats/kitchen?date=${dateQuery}`);
      if (res.ok) {
        const json = await res.json();
        setApiCompletedStats({
          completed_orders_count: json.completed_orders_count || 0,
          completed_cups_count: json.completed_cups_count || 0,
        });
      }
    } catch (err) {
      // Backend stats fallback handled automatically
    }
  };

  const fetchOrders = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585";
      const res = await fetch(`${apiUrl}/api/v1/orders?page_size=500`);
      const json = await res.json();
      if (res.ok && Array.isArray(json.data)) {
        const mapped: KitchenOrder[] = json.data.map((o: any) => {
          const rawItems = o.order_items || o.items || [];
          const items: KitchenOrderItem[] = rawItems.map((it: any) => {
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

            // Clean sweetness format (prevent 50%%)
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

            const productName = it.product?.name_th || it.product_name_th || it.name || "เครื่องดื่ม";

            return {
              id: it.id || 0,
              product_name_th: productName,
              sweetness: sweetStr,
              toppings: toppings,
              quantity: it.quantity || 1,
              note: it.note || it.special_instructions || "",
              is_combo: isCombo,
              combo_recipes: comboRecipes,
            };
          });

          const totalCups = items.reduce((sum, it) => sum + (it.quantity || 1), 0);
          const rawCreated = o.created_at || o.order_time || new Date().toISOString();
          let formattedTime = "";
          try {
            const d = new Date(rawCreated);
            const timeStr = d.toLocaleTimeString("th-TH", {
              hour: "2-digit",
              minute: "2-digit",
            });
            formattedTime = `${timeStr} น.`;
          } catch {
            formattedTime = "-";
          }

          // Queue number: prioritized from backend queue_no (e.g. A001, B002)
          const queueNo = o.queue_no || o.queue_number || `A${String(o.id).padStart(3, "0")}`;

          return {
            id: o.id,
            order_no: o.order_no || `#ORD-${o.id}`,
            queue_number: queueNo,
            method: o.method === "online" ? "online" : "walkin",
            customer_name: o.customer_name || "",
            customer_phone: o.customer_phone || "",
            order_status: o.order_status || "new_order",
            ordered_at: formattedTime,
            raw_created_at: rawCreated,
            raw_updated_at: o.updated_at || rawCreated,
            total_cups: totalCups || 1,
            total_amount: Number(o.total_amount) || 0,
            note: o.note || "",
            items: items.length > 0 ? items : [
              {
                id: 1,
                product_name_th: "เครื่องดื่ม",
                sweetness: "100%",
                toppings: [],
                quantity: 1,
              }
            ],
          };
        });
        setOrders(mapped);
      }
    } catch (err) {
      console.error("Failed to fetch kitchen orders", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchStats();
    const interval = setInterval(() => {
      fetchOrders();
      fetchStats();
    }, 4000);
    return () => clearInterval(interval);
  }, [range]);

  // Update Status Handler
  const handleUpdateStatus = async (
    orderId: number,
    nextStatus: "new_order" | "preparing" | "ready" | "completed"
  ) => {
    // Optimistic UI update
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, order_status: nextStatus } : o))
    );

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585";
      await fetch(`${apiUrl}/api/v1/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_status: nextStatus }),
      });
      fetchStats();
    } catch (err) {
      console.error("Failed to update order status", err);
    }
  };

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
    return true; // ทั้งงาน
  });

  // KPI Calculations
  const pendingOrders = rangeFilteredOrders.filter(
    (o) => o.order_status === "new_order" || o.order_status === "preparing"
  );
  const completedOrders = rangeFilteredOrders.filter(
    (o) => o.order_status === "ready" || o.order_status === "completed"
  );

  const pendingCount = pendingOrders.length;
  const completedCount = apiCompletedStats ? apiCompletedStats.completed_orders_count : completedOrders.length;

  const pendingCups = pendingOrders.reduce((sum, o) => sum + (o.total_cups || 1), 0);
  const completedCups = apiCompletedStats
    ? apiCompletedStats.completed_cups_count
    : completedOrders.reduce((sum, o) => sum + (o.total_cups || 1), 0);

  // Helper to format time string
  const formatTimeOnly = (isoDate?: string) => {
    if (!isoDate) return "-";
    try {
      const d = new Date(isoDate);
      if (isNaN(d.getTime())) return "-";
      return (
        d.toLocaleTimeString("th-TH", {
          hour: "2-digit",
          minute: "2-digit",
        }) + " น."
      );
    } catch {
      return "-";
    }
  };

  // Find latest ordered time among pending orders (คำสั่งซื้อล่าสุด)
  const latestPendingOrder = [...pendingOrders].sort((a, b) => {
    const timeA = new Date(a.raw_created_at).getTime() || a.id;
    const timeB = new Date(b.raw_created_at).getTime() || b.id;
    return timeB - timeA;
  })[0];
  const latestPendingTime = latestPendingOrder ? formatTimeOnly(latestPendingOrder.raw_created_at) : "-";

  // Find latest completed time among completed/ready orders (สำเร็จล่าสุด)
  const latestCompletedOrder = [...completedOrders].sort((a, b) => {
    const timeA = new Date(a.raw_updated_at || a.raw_created_at).getTime() || a.id;
    const timeB = new Date(b.raw_updated_at || b.raw_created_at).getTime() || b.id;
    return timeB - timeA;
  })[0];
  const latestCompletedTime = latestCompletedOrder
    ? formatTimeOnly(latestCompletedOrder.raw_updated_at || latestCompletedOrder.raw_created_at)
    : "-";

  // Filter all new_order (and preparing) for the kitchen and sort by oldest first (FIFO)
  const kitchenActiveOrders = rangeFilteredOrders
    .filter((o) => o.order_status === "new_order" || o.order_status === "preparing")
    .sort((a, b) => {
      const timeA = new Date(a.raw_created_at).getTime() || a.id;
      const timeB = new Date(b.raw_created_at).getTime() || b.id;
      return timeA - timeB; // เก่าสุดขึ้นก่อน (FIFO)
    });

  const totalPages = Math.max(1, Math.ceil(kitchenActiveOrders.length / pageSize));
  const paginatedOrders = kitchenActiveOrders.slice((page - 1) * pageSize, page * pageSize);

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
        style={{
          flex: 1,
          padding: isFullscreen ? "1.5rem 2rem" : "1.75rem 2.5rem",
          overflowY: "auto",
          minWidth: 0,
        }}
      >
        {/* Header Section */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, lineHeight: 1.2, margin: 0 }}>
              ครัว
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

        {/* KPI Cards Grid (Dashboard clean style - 3 cards) */}
        <div
          style={{
            marginTop: "1.5rem",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "0.85rem",
            marginBottom: "1.5rem",
          }}
        >
          {/* Card 1: ออเดอร์ที่ค้างอยู่ */}
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
            <div>
              <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)", fontWeight: 500, margin: 0 }}>
                ออเดอร์ที่ค้างอยู่
              </p>
            </div>
            <div style={{ marginTop: "0.5rem", marginBottom: "0.35rem" }}>
              <p
                style={{
                  fontSize: "1.85rem",
                  fontWeight: 800,
                  fontFamily: "'Kanit', sans-serif",
                  color: "var(--warm)",
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
                คำสั่งซื้อล่าสุดตอน {latestPendingTime}
              </p>
            </div>
          </div>

          {/* Card 2: ออเดอร์ที่ทำเสร็จ */}
          <div
            className="admin-kpi-card animate-rise"
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
            }}
          >
            <div>
              <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)", fontWeight: 500, margin: 0 }}>
                ออเดอร์ที่ทำเสร็จ
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
                {completedCount}
              </p>
            </div>
            <div>
              <p style={{ fontSize: "0.75rem", color: "var(--ink-soft)", fontWeight: 400, lineHeight: 1.3, margin: 0 }}>
                สำเร็จล่าสุดตอน {latestCompletedTime}
              </p>
            </div>
          </div>

          {/* Card 3: แก้วที่ทำเสร็จ */}
          <div
            className="admin-kpi-card animate-rise"
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
            }}
          >
            <div>
              <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)", fontWeight: 500, margin: 0 }}>
                แก้วที่ทำเสร็จ
              </p>
            </div>
            <div style={{ marginTop: "0.5rem", marginBottom: "0.35rem" }}>
              <p
                style={{
                  fontSize: "1.85rem",
                  fontWeight: 800,
                  fontFamily: "'Kanit', sans-serif",
                  color: "var(--ink)",
                  letterSpacing: "-0.01em",
                  lineHeight: 1.15,
                  margin: 0,
                }}
              >
                {completedCups}
              </p>
            </div>
            <div>
              <p style={{ fontSize: "0.75rem", color: "var(--ink-soft)", fontWeight: 400, lineHeight: 1.3, margin: 0 }}>
                สำเร็จล่าสุดตอน {latestCompletedTime}
              </p>
            </div>
          </div>
        </div>

        {/* Kitchen Orders Cards Grid (แสดงสถานะ new_order หรือ preparing ทีละ 10 ออเดอร์) */}
        {kitchenActiveOrders.length > 0 ? (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "1rem",
              }}
            >
            {paginatedOrders.map((order) => {
                return (
                  <div
                    key={order.id}
                    className="animate-rise"
                    style={{
                      borderRadius: "1rem",
                      backgroundColor: "var(--card)",
                      border: "1px solid rgba(50, 55, 65, 0.12)",
                      boxShadow: "none",
                      padding: "1.1rem",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      transition: "all 0.15s ease",
                      position: "relative",
                    }}
                  >
                    {/* Card Top: Queue & Cups */}
                    <div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          paddingBottom: "0.75rem",
                          borderBottom: "1px solid rgba(50, 55, 65, 0.08)",
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                            <span
                              className="font-mono"
                              style={{
                                fontSize: "1.6rem",
                                fontWeight: 900,
                                color: "var(--ink)",
                                lineHeight: 1,
                              }}
                            >
                              {order.queue_number}
                            </span>
                            <span
                              style={{
                                fontSize: "0.8rem",
                                fontWeight: 800,
                                color: "var(--ink)",
                                backgroundColor: "var(--cream)",
                                padding: "3px 8px",
                                borderRadius: "6px",
                                border: "1px solid rgba(50,55,65,0.08)",
                                lineHeight: 1.2,
                              }}
                            >
                              {order.method === "walkin" ? "หน้าร้าน" : "ออนไลน์"}
                            </span>
                          </div>
                          <p
                            className="font-mono"
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--ink-soft)",
                              margin: "0.25rem 0 0 0",
                            }}
                          >
                            {order.ordered_at}
                          </p>
                        </div>

                        {/* Cups pill */}
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-end",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "0.8rem",
                              fontWeight: 800,
                              color: "var(--ink)",
                              backgroundColor: "var(--cream)",
                              padding: "3px 8px",
                              borderRadius: "6px",
                              border: "1px solid rgba(50,55,65,0.08)",
                              lineHeight: 1.2,
                            }}
                          >
                            {order.total_cups} แก้ว
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
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls (10 items per page) */}
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
                  แสดงหน้า <strong style={{ color: "var(--ink)" }}>{page}</strong> จาก ทั้งหมด <strong style={{ color: "var(--ink)" }}>{totalPages}</strong> หน้า (ทั้งหมด {kitchenActiveOrders.length} ออเดอร์)
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
              color: "var(--ink-soft)",
              backgroundColor: "var(--card)",
              borderRadius: "1rem",
              border: "1px dashed rgba(50,55,65,0.15)",
            }}
          >
            <Coffee size={40} style={{ margin: "0 auto 0.6rem", opacity: 0.35 }} />
            <p style={{ margin: 0, fontWeight: 700, fontSize: "0.95rem" }}>
              ไม่มีออเดอร์ค้างในครัว
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

