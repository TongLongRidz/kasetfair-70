"use client";

import React from "react";
import Link from "next/link";
import Navbar from "@/components/layouts/Navbar";
import Footer from "@/components/layouts/Footer";
import { Gift, Clock, Sparkles, Award, ChevronRight, Tag } from "lucide-react";

interface PromotionItem {
  id: number;
  name_th: string;
  name_en: string;
  desc_th: string;
  desc_en: string;
  point_usage: number;
  all_limit: number | null;
  person_limit: number | null;
  used_count: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  highlight?: boolean;
}

const PROMOTIONS_DATA: PromotionItem[] = [
  {
    id: 1,
    name_th: "สะสมครบ 5 แต้ม ฟรี 1 แก้ว (เมนูใดก็ได้)",
    name_en: "Collect 5 Points Get 1 Free Any Cup",
    desc_th: "แลกรับเครื่องดื่มน้ำเต้าหู้รสชาติใดก็ได้ ขนาดปกติฟรี 1 แก้ว ไม่รวมท็อปปิ้ง",
    desc_en: "Redeem any standard soy milk drink for free, toppings excluded.",
    point_usage: 5,
    all_limit: 500,
    person_limit: 2,
    used_count: 142,
    start_date: "2026-09-01",
    end_date: "2026-09-15",
    is_active: true,
    highlight: true,
  },
  {
    id: 2,
    name_th: "สะสมครบ 10 แต้ม ฟรีเซ็ตคอมโบ 2 แก้ว + ท็อปปิ้ง",
    name_en: "Collect 10 Points Get Combo Set (2 Cups + Toppings)",
    desc_th: "แลกเซ็ตคอมโบสุดคุ้ม 2 แก้วพร้อมเลือกท็อปปิ้งได้ไม่อั้น 2 อย่าง",
    desc_en: "Redeem 2 cups combo set with 2 free toppings.",
    point_usage: 10,
    all_limit: 200,
    person_limit: 1,
    used_count: 48,
    start_date: "2026-09-01",
    end_date: "2026-09-15",
    is_active: true,
    highlight: true,
  },
  {
    id: 3,
    name_th: "แลกรับส่วนลดท็อปปิ้งฟรี 1 อย่าง (3 แต้ม)",
    name_en: "Free 1 Topping with 3 Points",
    desc_th: "ใช้ 3 แต้ม แลกรับท็อปปิ้งฟรี 1 ชนิดในแก้วใดก็ได้",
    desc_en: "Use 3 points to get 1 free topping on any cup.",
    point_usage: 3,
    all_limit: null,
    person_limit: null,
    used_count: 89,
    start_date: "2026-09-01",
    end_date: "2026-09-30",
    is_active: true,
  },
  {
    id: 4,
    name_th: "โปรเปิดบูธเกษตรแฟร์ 1 แต้ม แลกไข่มุกบราวน์ชูการ์",
    name_en: "Kaset Fair Special: 1 Point for Brown Sugar Boba",
    desc_th: "โปรโมชั่นพิเศษช่วงเปิดงานเกษตรแฟร์ 1 แต้มแลกไข่มุกฟรี 1 เสิร์ฟ",
    desc_en: "Special launch promotion: 1 point for 1 brown sugar boba serving.",
    point_usage: 1,
    all_limit: 100,
    person_limit: 1,
    used_count: 100,
    start_date: "2026-09-01",
    end_date: "2026-09-03",
    is_active: false,
  },
];

export default function PromotionPage() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--cream)", color: "var(--ink)", fontFamily: "'Kanit', sans-serif" }}>
      <Navbar />

      <main style={{ maxWidth: "640px", margin: "0 auto", padding: "1.5rem 1rem 3rem 1rem" }}>
        {/* Hero Header */}
        <div
          className="animate-rise"
          style={{
            borderRadius: "1.5rem",
            backgroundColor: "var(--teal)",
            color: "var(--cream)",
            padding: "2rem 1.5rem",
            boxShadow: "0 10px 30px rgba(75, 155, 140, 0.25)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ position: "relative", zIndex: 2 }}>
            <span
              className="font-mono"
              style={{
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                color: "rgba(247, 246, 240, 0.8)",
                fontWeight: 600,
              }}
            >
              PROMOTIONS
            </span>
            <h1 style={{ fontSize: "1.85rem", fontWeight: 800, lineHeight: 1.15, marginTop: "0.4rem" }}>
              โปรโมชั่น
            </h1>
            <p style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: "rgba(247, 246, 240, 0.9)", lineHeight: 1.4 }}>
              รวมโปรโมชั่นและสิทธิพิเศษสุดคุ้มในงานเกษตรแฟร์ 70
            </p>
          </div>

          <div
            style={{
              position: "absolute",
              right: "-1.5rem",
              bottom: "-1.5rem",
              width: "120px",
              height: "120px",
              borderRadius: "50%",
              backgroundColor: "rgba(255, 255, 255, 0.08)",
              pointerEvents: "none",
            }}
          />
        </div>

        {/* Promotions List */}
        <section style={{ marginTop: "1.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800 }}>รายการโปรโมชั่น</h2>
            <span className="font-mono" style={{ fontSize: "12px", color: "var(--ink-soft)" }}>
              {PROMOTIONS_DATA.length} รายการ
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {PROMOTIONS_DATA.map((promo, idx) => {
              const now = new Date();
              const isExpired = promo.end_date ? new Date(promo.end_date) < now : false;

              return (
              <div
                key={promo.id}
                className="animate-rise"
                style={{
                  animationDelay: `${idx * 60}ms`,
                  borderRadius: "1.25rem",
                  backgroundColor: "var(--card)",
                  border: promo.highlight && !isExpired ? "2px solid var(--teal)" : "1px solid rgba(50, 55, 65, 0.1)",
                  padding: "1.25rem",
                  boxShadow: promo.highlight && !isExpired ? "0 4px 20px rgba(75, 155, 140, 0.12)" : "0 2px 8px rgba(0, 0, 0, 0.02)",
                  opacity: !promo.is_active || isExpired ? 0.6 : 1,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                      <span
                        style={{
                          borderRadius: "9999px",
                          backgroundColor: isExpired
                            ? "rgba(220, 38, 38, 0.12)"
                            : promo.is_active
                            ? "rgba(75, 155, 140, 0.15)"
                            : "rgba(50, 55, 65, 0.1)",
                          color: isExpired
                            ? "#dc2626"
                            : promo.is_active
                            ? "var(--teal)"
                            : "var(--ink-soft)",
                          padding: "0.2rem 0.65rem",
                          fontSize: "11px",
                          fontWeight: 700,
                        }}
                      >
                        {isExpired ? "หมดเวลาใช้งาน" : promo.is_active ? "ใช้ได้เลย" : "ปิดใช้งาน"}
                      </span>
                      {promo.highlight && (
                        <span
                          style={{
                            borderRadius: "9999px",
                            backgroundColor: "var(--warm)",
                            color: "var(--ink)",
                            padding: "0.2rem 0.65rem",
                            fontSize: "11px",
                            fontWeight: 700,
                          }}
                        >
                          ยอดนิยม ⭐
                        </span>
                      )}
                    </div>

                    <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginTop: "0.4rem", color: "var(--ink)" }}>
                      {promo.name_th}
                    </h3>
                    <p className="font-mono" style={{ fontSize: "0.75rem", color: "var(--ink-soft)", marginTop: "1px" }}>
                      {promo.name_en}
                    </p>
                    <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)", marginTop: "0.35rem", lineHeight: 1.4 }}>
                      {promo.desc_th}
                    </p>
                  </div>

                  <div style={{ textAlign: "right", minWidth: "70px" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--ink-soft)" }}>ใช้</span>
                    <p className="font-display" style={{ fontSize: "1.85rem", color: "var(--teal)", lineHeight: 1 }}>
                      {promo.point_usage}
                    </p>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--ink)" }}>แต้ม</span>
                  </div>
                </div>

                <hr style={{ margin: "0.85rem 0", borderColor: "rgba(50, 55, 65, 0.08)" }} />

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem", color: "var(--ink-soft)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <Clock size={13} />
                    <span>ระยะเวลา: {promo.start_date} ถึง {promo.end_date}</span>
                  </div>
                  {promo.is_active && !isExpired && (
                    <Link
                      href="/#menu"
                      style={{
                        color: "var(--teal)",
                        fontWeight: 700,
                        textDecoration: "none",
                        display: "flex",
                        alignItems: "center",
                        gap: "2px",
                      }}
                    >
                      <span>สั่งซื้อเครื่องดื่ม</span>
                      <ChevronRight size={14} />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
