# Design System & Guidelines: Kaset Fair 70

 เอกสารอ้างอิงระบบดีไซน์ (Design System Tokens), Component Specs, และเกณฑ์ Impeccable UI/UX Quality สำหรับโปรเจกต์ Kaset Fair 70

---

## 1. Design System Tokens (Color Palette)

โปรเจกต์นี้ใช้ระบบสี **OKLCH Color Space** เพื่อความสว่างและความสดใสที่สมดุล สอดรับทั้งสว่าง (Light) และแก้วมืด (Dark Glassmorphic)

```css
:root {
  --radius: 0.625rem;
  --cream: oklch(0.968 0.014 92);     /* Primary Background */
  --ink: oklch(0.205 0.02 250);       /* Main Text / Dark Contrast */
  --ink-soft: oklch(0.42 0.02 250);   /* Secondary / Muted Text */
  --teal: oklch(0.55 0.095 205);      /* Primary Brand / Accent Action */
  --pearl: oklch(0.36 0.03 25);       /* Subtle Border / Neutral Dark */
  --warm: oklch(0.72 0.15 72);        /* Highlight / Alert Warm Accent */
  --card: oklch(0.986 0.008 94);      /* Card Surface / Elevator Container */
}
```

---

## 2. Typography System

| Usage / Scope | Font Family | Fallback | CSS Class |
| :--- | :--- | :--- | :--- |
| **Thai & Body Text** | `Kanit` | `sans-serif` | `.font-thai`, `body` |
| **Display & Big Headers** | `Anton` | `sans-serif` | `.font-display` |
| **Price / Barcode / Order ID** | `IBM Plex Mono` | `monospace` | `.font-mono` |

---

## 3. Motion & Micro-Interactions Standards

### 3.1 Easing Curves (Impeccable Easing Rule)
- **Standard Smooth Curve**: `cubic-bezier(0.16, 1, 0.3, 1)` (ใช้กับ Modal, Drawer, Rise, Slide ทุกชนิด)
- **Strict Prohibition**: ห้ามใช้ Bounce Easing เช่น `cubic-bezier(0.34, 1.56, 0.64, 1)` หรือ Elastic Keyframes ที่สร้างความรบกวนสายตา

### 3.2 Performance Rule (No Layout Thrashing)
- Animation ทุกชนิดต้องทำผ่านคุณสมบัติ `transform` (`scale`, `translate`) และ `opacity` เท่านั้น
- ห้าม animate `width`, `height`, `margin`, หรือ `padding` โดยตรง (ยกเว้น CSS Grid Height technique สำหรับ Accordion Drawer)

---

## 4. Layout & Responsive Breakpoints

| Breakpoint | Target Screen | Adaptation Behavior |
| :--- | :--- | :--- |
| `< 480px` | Mobile (Extra Small) | Hero Banner ย่อรูป, ซ่อน Nav Menu Links, ปรับ Font display เป็น 1.35rem |
| `< 768px` | Mobile & Small Tablet | เปลี่ยน Admin Sidebar เป็น Mobile Topbar + Accordion Drawer, สลับ Table View เป็น Card View |
| `769px - 1399px` | Tablet / Laptop | แสดง KPI Grid 3 คอลัมน์ |
| `>= 1400px` | Wide Desktop | แสดง KPI Grid 6 คอลัมน์ |

---

## 5. Component Patterns & Visual Polish

### 5.1 Receipt Print Animation System
- ใช้ `.animate-receipt-print` รวมกับ `.animate-printer-overlay` เพื่อจำลองภาพการพิมพ์สลิปที่สมจริงและสมูท 
- มีการหน่วงเวลาและ Scale จาก `0.94` ไปยัง `1.0` พร้อมเงา `box-shadow: 0 12px 35px rgba(0,0,0,0.08)` อย่างเป็นธรรมชาติ

### 5.2 Sleek Scrollbar Standard
```css
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-thumb {
  background: rgba(50, 55, 65, 0.2);
  border-radius: 9999px;
}
```

---

## 6. Impeccable Anti-Pattern Checklist (61 Rules Summary)

- [x] **No Raw Primary Colors**: ใช้เฉพาะ OKLCH Tokens (`var(--teal)`, `var(--cream)`, ฯลฯ)
- [x] **No Bouncy Animations**: ทุก keyframe ใช้ `cubic-bezier(0.16, 1, 0.3, 1)`
- [x] **No Text Clipping**: ตัวอักษรบนมือถือมี responsive text handling และ `.truncate` / `line-clamp` ป้องกันข้อความล้น
- [x] **No Janky Scroll**: ใช้ `scrollbar-gutter: stable;` และ custom scrollbar ที่ลื่นไหล
- [x] **Accessible Contrast**: ตัวหนังสือทุกตำแหน่งผ่านเกณฑ์อัตราส่วนคอนทราสต์ WCAG AA
