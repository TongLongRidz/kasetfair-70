"use client";

import React, { useState } from "react";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  ChefHat,
  Coffee,
  Sparkles,
  ArrowRight,
  Filter,
  Volume2,
  RefreshCw,
  Search,
} from "lucide-react";

interface KitchenOrderItem {
  id: number;
  product_name_th: string;
  sweetness: string;
  toppings: string[];
  quantity: number;
  note?: string;
}

interface KitchenOrder {
  id: number;
  queue_number: string;
  method: "walkin" | "online";
  customer_name?: string;
  order_status: "preparing" | "ready" | "completed";
  estimated_pickup_time?: string;
  ordered_at: string;
  items: KitchenOrderItem[];
}

const INITIAL_KITCHEN_ORDERS: KitchenOrder[] = [
  {
    id: 1042,
    queue_number: "A102",
    method: "walkin",
    customer_name: "คุณสมชาย",
    order_status: "preparing",
    ordered_at: "11:25",
    items: [
      {
        id: 1,
        product_name_th: "น้ำเต้าหู้มัทฉะ",
        sweetness: "50%",
        toppings: ["ไข่มุกบราวน์ชูการ์", "เฉาก๊วยหนึบ"],
        quantity: 2,
        note: "แยกน้ำแข็ง 1 แก้ว",
      },
      {
        id: 2,
        product_name_th: "น้ำเต้าหู้ดั้งเดิม",
        sweetness: "0%",
        toppings: ["เม็ดแมงลัก"],
        quantity: 1,
      },
    ],
  },
  {
    id: 1043,
    queue_number: "B045",
    method: "online",
    customer_name: "คุณฟ้า",
    order_status: "preparing",
    estimated_pickup_time: "11:45",
    ordered_at: "11:20",
    items: [
      {
        id: 3,
        product_name_th: "น้ำเต้าหู้ชาไทย",
        sweetness: "25%",
        toppings: ["เมล็ดเจีย"],
        quantity: 1,
      },
      {
        id: 4,
        product_name_th: "น้ำเต้าหู้นมเย็น",
        sweetness: "50%",
        toppings: ["สาคูใบเตย"],
        quantity: 1,
      },
    ],
  },
  {
    id: 1040,
    queue_number: "A101",
    method: "walkin",
    customer_name: "คุณกานต์",
    order_status: "ready",
    ordered_at: "11:15",
    items: [
      {
        id: 5,
        product_name_th: "คอมโบเซ็ตมัทฉะ + ไข่มุก + เฉาก๊วย",
        sweetness: "50%",
        toppings: ["ไข่มุกบราวน์ชูการ์", "เฉาก๊วยหนึบ"],
        quantity: 1,
      },
    ],
  },
  {
    id: 1039,
    queue_number: "B044",
    method: "online",
    customer_name: "คุณเบียร์",
    order_status: "ready",
    estimated_pickup_time: "11:30",
    ordered_at: "11:10",
    items: [
      {
        id: 6,
        product_name_th: "น้ำเต้าหู้ช็อกโกแลต",
        sweetness: "50%",
        toppings: ["ถั่วแดงกวนหวานมัน"],
        quantity: 2,
      },
    ],
  },
];

export default function POSKitchenPage() {
  const [orders, setOrders] = useState<KitchenOrder[]>(INITIAL_KITCHEN_ORDERS);
  const [activeTab, setActiveTab] = useState<"all" | "walkin" | "online">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "preparing" | "ready">("all");

  // Advance Order Status (preparing -> ready -> completed)
  const handleAdvanceStatus = (orderId: number) => {
    setOrders((prev) =>
      prev
        .map((o) => {
          if (o.id === orderId) {
            if (o.order_status === "preparing") return { ...o, order_status: "ready" as const };
            if (o.order_status === "ready") return { ...o, order_status: "completed" as const };
          }
          return o;
        })
        .filter((o) => o.order_status !== "completed")
    );
  };

  // Revert Status (ready -> preparing)
  const handleRevertStatus = (orderId: number) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, order_status: "preparing" as const } : o))
    );
  };

  // Filter Orders
  const filteredOrders = orders.filter((o) => {
    if (activeTab === "walkin" && o.method !== "walkin") return false;
    if (activeTab === "online" && o.method !== "online") return false;
    if (statusFilter === "preparing" && o.order_status !== "preparing") return false;
    if (statusFilter === "ready" && o.order_status !== "ready") return false;
    return true;
  });

  const preparingCount = orders.filter((o) => o.order_status === "preparing").length;
  const readyCount = orders.filter((o) => o.order_status === "ready").length;

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--cream)", fontFamily: "'Kanit', sans-serif" }}>
      <AdminSidebar />

      <main style={{ flex: 1, padding: "1.75rem 2.5rem", overflowY: "auto", minWidth: 0 }}>
        {/* Header Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--ink)", lineHeight: 1.2 }}>
                ระบบจอครัว & จัดการคิว (Kitchen Queue Display)
              </h1>
            </div>
          </div>

          {/* Quick Stats Banner */}
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", backgroundColor: "var(--card)", padding: "0.5rem 1rem", borderRadius: "0.75rem", border: "1px solid rgba(50,55,65,0.1)" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--ink-soft)" }}>กำลังทำ:</span>
              <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--teal)" }}>{preparingCount}</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", backgroundColor: "var(--card)", padding: "0.5rem 1rem", borderRadius: "0.75rem", border: "1px solid rgba(50,55,65,0.1)" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--ink-soft)" }}>พร้อมรับ:</span>
              <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "#22c55e" }}>{readyCount}</span>
            </div>
          </div>
        </div>

        {/* Filter Navigation Bar */}
        <div
          style={{
            marginTop: "1.25rem",
            backgroundColor: "var(--card)",
            padding: "0.85rem 1.25rem",
            borderRadius: "1rem",
            border: "1px solid rgba(50, 55, 65, 0.1)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          {/* Method Tabs (All, Walk-in, Online) */}
          <div style={{ display: "flex", gap: "0.4rem" }}>
            {[
              { id: "all", label: "ทั้งหมด" },
              { id: "walkin", label: "หน้าร้าน (Walk-in)" },
              { id: "online", label: "สั่งล่วงหน้า (Online)" },
            ].map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  style={{
                    padding: "0.4rem 0.85rem",
                    borderRadius: "0.5rem",
                    border: active ? "none" : "1px solid rgba(50,55,65,0.1)",
                    backgroundColor: active ? "var(--teal)" : "var(--cream)",
                    color: active ? "#fff" : "var(--ink)",
                    fontWeight: active ? 700 : 500,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Status Filter Tabs */}
          <div style={{ display: "flex", gap: "0.4rem" }}>
            {[
              { id: "all", label: "ทุกสถานะ" },
              { id: "preparing", label: "🟡 กำลังชง (Preparing)" },
              { id: "ready", label: "🟢 พร้อมรับ (Ready)" },
            ].map((st) => {
              const active = statusFilter === st.id;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStatusFilter(st.id as any)}
                  style={{
                    padding: "0.4rem 0.85rem",
                    borderRadius: "0.5rem",
                    border: active ? "none" : "1px solid rgba(50,55,65,0.1)",
                    backgroundColor: active ? "rgba(50,55,65,0.08)" : "transparent",
                    color: active ? "var(--ink)" : "var(--ink-soft)",
                    fontWeight: active ? 700 : 500,
                    fontSize: "0.8rem",
                    cursor: "pointer",
                  }}
                >
                  {st.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Kitchen Orders Grid */}
        <div style={{ marginTop: "1.25rem", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.25rem" }}>
          {filteredOrders.map((order) => {
            const isPreparing = order.order_status === "preparing";
            const isWalkin = order.method === "walkin";

            return (
              <div
                key={order.id}
                style={{
                  backgroundColor: "var(--card)",
                  borderRadius: "1.25rem",
                  border: isPreparing ? "2px solid var(--teal)" : "2px solid #22c55e",
                  padding: "1.25rem",
                  boxShadow: "0 6px 18px rgba(0,0,0,0.04)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  {/* Top Order Card Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: "0.75rem", borderBottom: "1px solid rgba(50,55,65,0.08)" }}>
                    <div>
                      <span className="font-mono" style={{ fontSize: "1.85rem", fontWeight: 900, color: "var(--ink)", lineHeight: 1 }}>
                        {order.queue_number}
                      </span>
                      <p style={{ fontSize: "0.75rem", color: "var(--ink-soft)", marginTop: "2px" }}>
                        #{order.id} {order.customer_name ? `• ${order.customer_name}` : ""}
                      </p>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: "4px",
                          backgroundColor: isWalkin ? "rgba(75, 155, 140, 0.15)" : "rgba(230, 81, 0, 0.12)",
                          color: isWalkin ? "var(--teal)" : "#e65100",
                        }}
                      >
                        {isWalkin ? "WALK-IN" : "ONLINE"}
                      </span>
                      <p style={{ fontSize: "0.75rem", color: "var(--ink-soft)", marginTop: "4px" }}>
                        {order.estimated_pickup_time ? `รับเวลา ${order.estimated_pickup_time}` : `สั่งเมื่อ ${order.ordered_at}`}
                      </p>
                    </div>
                  </div>

                  {/* Items List */}
                  <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          backgroundColor: "var(--cream)",
                          padding: "0.75rem",
                          borderRadius: "0.75rem",
                          border: "1px solid rgba(50,55,65,0.06)",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--ink)", lineHeight: 1.3 }}>
                            {item.product_name_th}
                          </span>
                          <span style={{ fontSize: "1.1rem", fontWeight: 900, color: "var(--teal)", minWidth: "24px", textAlign: "right" }}>
                            x{item.quantity}
                          </span>
                        </div>

                        {/* Customization Details (Sweetness, Toppings, Note) */}
                        <div style={{ marginTop: "0.35rem", display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                          <span style={{ fontSize: "0.75rem", backgroundColor: "var(--card)", padding: "2px 6px", borderRadius: "4px", fontWeight: 600, color: "var(--ink)" }}>
                            หวาน: {item.sweetness}
                          </span>
                          {item.toppings.map((top, i) => (
                            <span key={i} style={{ fontSize: "0.75rem", backgroundColor: "rgba(75,155,140,0.15)", color: "var(--teal)", padding: "2px 6px", borderRadius: "4px", fontWeight: 600 }}>
                              +{top}
                            </span>
                          ))}
                        </div>

                        {item.note && (
                          <p style={{ marginTop: "0.35rem", fontSize: "0.75rem", color: "#f59e0b", fontWeight: 600 }}>
                            ⚠️ หมายเหตุ: {item.note}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status Action Buttons */}
                <div style={{ marginTop: "1.25rem", paddingTop: "0.75rem", borderTop: "1px solid rgba(50,55,65,0.08)", display: "flex", gap: "0.5rem" }}>
                  {isPreparing ? (
                    <button
                      type="button"
                      onClick={() => handleAdvanceStatus(order.id)}
                      style={{
                        flex: 1,
                        padding: "0.75rem",
                        borderRadius: "0.75rem",
                        border: "none",
                        backgroundColor: "#22c55e",
                        color: "#fff",
                        fontWeight: 700,
                        fontSize: "0.95rem",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.4rem",
                        boxShadow: "0 2px 8px rgba(34, 197, 94, 0.25)",
                      }}
                    >
                      <CheckCircle2 size={18} />
                      <span>ชงเสร็จแล้ว (พร้อมรับ)</span>
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => handleRevertStatus(order.id)}
                        style={{
                          padding: "0.75rem 1rem",
                          borderRadius: "0.75rem",
                          border: "1px solid rgba(50,55,65,0.15)",
                          backgroundColor: "transparent",
                          color: "var(--ink-soft)",
                          fontWeight: 600,
                          fontSize: "0.85rem",
                          cursor: "pointer",
                        }}
                      >
                        กลับไปชง
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAdvanceStatus(order.id)}
                        style={{
                          flex: 1,
                          padding: "0.75rem",
                          borderRadius: "0.75rem",
                          border: "none",
                          backgroundColor: "var(--teal)",
                          color: "#fff",
                          fontWeight: 700,
                          fontSize: "0.95rem",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.4rem",
                        }}
                      >
                        <CheckCircle2 size={18} />
                        <span>ลูกค้ามารับแล้ว (จบงาน)</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {filteredOrders.length === 0 && (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "4rem 1rem", backgroundColor: "var(--card)", borderRadius: "1.25rem", border: "1px dashed rgba(50,55,65,0.15)", color: "var(--ink-soft)" }}>
              <Coffee size={40} style={{ margin: "0 auto 0.75rem", opacity: 0.4 }} />
              <p style={{ fontSize: "1.1rem", fontWeight: 700 }}>ไม่มีออเดอร์ค้างในครัวขณะนี้</p>
              <p style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>ทุกออเดอร์ถูกชงและส่งมอบให้ลูกค้าเรียบร้อยแล้ว</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
