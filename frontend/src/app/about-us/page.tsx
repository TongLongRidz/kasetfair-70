import React from "react";
import Navbar from "@/components/layouts/Navbar";
import Footer from "@/components/layouts/Footer";
import { Sparkles, Heart, Award, Users } from "lucide-react";

export default function AboutUsPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "var(--cream)",
        color: "var(--ink)",
        fontFamily: "'Kanit', sans-serif",
      }}
    >
      <Navbar />

      <main style={{ maxWidth: "640px", margin: "0 auto", padding: "1.5rem 1rem 3rem 1rem", flex: 1, width: "100%" }}>
        {/* Hero */}
        <div
          className="animate-rise"
          style={{
            borderRadius: "1.5rem",
            backgroundColor: "var(--ink)",
            color: "var(--cream)",
            padding: "2.25rem 1.5rem",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <span
            className="font-mono"
            style={{
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              color: "var(--warm)",
              fontWeight: 600,
            }}
          >
            OUR STORY
          </span>
          <h1 style={{ fontSize: "1.85rem", fontWeight: 800, lineHeight: 1.15, marginTop: "0.4rem" }}>
            เกี่ยวกับร้านถั่วทอง
          </h1>
          <p style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: "rgba(247, 246, 240, 0.8)", lineHeight: 1.5 }}>
            น้ำเต้าหู้เย็นชื่นใจสูตรพิเศษ คั้นสดจากถั่วเหลืองแท้ 100% ณ งานเกษตรแฟร์ 70
          </p>
        </div>

        {/* Content Section */}
        <section style={{ marginTop: "1.75rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div
            className="animate-rise"
            style={{
              borderRadius: "1.25rem",
              backgroundColor: "var(--card)",
              padding: "1.5rem",
              border: "1px solid rgba(50, 55, 65, 0.1)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.75rem" }}>
              <div
                style={{
                  width: "2.25rem",
                  height: "2.25rem",
                  borderRadius: "0.6rem",
                  backgroundColor: "rgba(75, 155, 140, 0.15)",
                  color: "var(--teal)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Sparkles size={18} />
              </div>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 800, margin: 0 }}>ความตั้งใจของเรา</h2>
            </div>
            <p style={{ fontSize: "0.875rem", color: "var(--ink-soft)", lineHeight: 1.6, margin: 0 }}>
              ร้านถั่วทองก่อตั้งขึ้นด้วยความตั้งใจที่จะนำเสนอน้ำเต้าหู้ที่มีรสชาติกลมกล่อม ทันสมัย หอมมัน สดชื่น เหมาะกับผู้คนทุกเพศทุกวัยที่มาเดินเที่ยวงานเกษตรแฟร์ โดยคัดสรรวัตถุดิบถั่วเหลืองคุณภาพสูง คั้นสดใหม่แก้วต่อแก้ว พร้อมท็อปปิ้งเพื่อสุขภาพหลากหลายชนิด
            </p>
          </div>

          <div
            className="animate-rise"
            style={{
              borderRadius: "1.25rem",
              backgroundColor: "var(--card)",
              padding: "1.5rem",
              border: "1px solid rgba(50, 55, 65, 0.1)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.75rem" }}>
              <div
                style={{
                  width: "2.25rem",
                  height: "2.25rem",
                  borderRadius: "0.6rem",
                  backgroundColor: "rgba(224, 185, 94, 0.2)",
                  color: "#b45309",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Award size={18} />
              </div>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 800, margin: 0 }}>จุดเด่นของถั่วทอง</h2>
            </div>
            <ul style={{ paddingLeft: "1.25rem", margin: 0, fontSize: "0.875rem", color: "var(--ink-soft)", lineHeight: 1.6 }}>
              <li>ถั่วเหลืองแท้ 100% ไม่ผสมนมผงหรือแป้ง</li>
              <li>ปรับระดับความหวานได้ตามใจ (0% ถึง 100%)</li>
              <li>ท็อปปิ้งเพื่อสุขภาพ: เมล็ดเจีย, เม็ดแมงลัก, สาคู, เฉาก๊วย, ถั่วแดง และไข่มุก</li>
              <li>สั่งออนไลน์และสะสมแต้มแลกรางวัลได้ง่าย ๆ ผ่านระบบคิว</li>
            </ul>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
