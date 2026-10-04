# Product Specification: Kaset Fair 70 (ระบบบริหารจัดการร้านค้าและจุดขาย POS งานเกษตรแฟร์ 70 ปี)

## 1. Product Vision & Overview
**Kaset Fair 70** คือระบบเว็บแอปพลิเคชันบริหารจัดการจุดขาย (POS), จัดการสวัสดิการ/คูปอง, ตรวจสอบสลิปโอนเงิน (PromptPay Slip Verification), และสรุปรายรับ-รายจ่ายสำหรับงานเกษตรแฟร์ 70 ปี โดยเน้นความสะดวกรวดเร็วในการทำงานหน้างานจริงของผู้แคชเชียร์ ความแม่นยำของข้อมูล และความสวยงามทันสมัยของอินเทอร์เฟซ

---

## 2. Target Users & User Roles

| Role | Access & Responsibilities | Key UX Goals |
| :--- | :--- | :--- |
| **Admin / Manager** | เข้าถึง Dashboard, การจัดการผู้ดูแลระบบ (Administrator), จัดการค่าใช้จ่าย (Expenses), ตั้งค่าระบบ (Settings), ตรวจสอบสลิป (Slip Checking) | เห็นภาพรวมรายรับ-รายจ่ายแบบ Real-time, ตรวจสอบรายการสลิปย้อนหลังได้อย่างแม่นยำ |
| **POS Staff / Cashier** | เข้าถึงหน้า POS Checkout, เลือกสินค้า, สแกน QR Code/Barcode, ออกใบเสร็จ PromptPay QR | เลือกสินค้าและปิดการขายได้อย่างรวดเร็ว (< 5 วินาทีต่อออเดอร์) |
| **Member / Customer** | สแกนดูเมนูสินค้า และแสดง QR Code คูปองสวัสดิการ | หน้าจอโหลดไว อ่านง่าย รองรับ Mobile Devices |

---

## 3. Core Product Modules

### 3.1 POS Front Desk & Payment System
- **Product Selector & Cart Management**: ค้นหาและกรองสินค้าตามหมวดหมู่ คำนวณราคารวมอัตโนมัติ
- **Payment Gateway**: รองรับเงินสด (Cash), PromptPay QR Code (พร้อมระบบ Dynamic QR), คูปองสวัสดิการ
- **Animated Order Receipt & Print System**: พิมพ์/แสดงใบเสร็จรับเงินพร้อม animation จำลองเครื่องพิมพ์ใบเสร็จ (Receipt Print Animation)

### 3.2 Dynamic Slip Check & Verification
- **Slip Checking Modal / Page**: ตรวจสอบรูปภาพสลิปที่ลูกค้าโอนเงิน แสดงสถานะความถูกต้อง (Valid / Invalid / Duplicate)
- **Automatic Matching**: เชื่อมต่อกับ Backend API เพื่อตรวจสอบธุรกรรมย้อนหลัง

### 3.3 Expense & Financial Management
- **Expense Recording**: บันทึกรายจ่ายรายวัน/รายบูธ พร้อมแนบสลิป/หลักฐาน
- **Financial Dashboard**: สรุปยอดขายรวม กำไรสุทธิ และสถิติตามช่วงเวลา

### 3.4 Administration & Settings
- **Role-based Authentication**: ระบบล็อกอินและจัดการสิทธิ์ด้วย AuthGuard
- **System Settings**: ตั้งค่าข้อมูลร้านค้า, PromptPay ID, ข้อมูลสวัสดิการ

---

## 4. UX & Product Performance Criteria

1. **Transaction Velocity**: การทำรายการที่หน้า POS ต้องไม่สะดุด ใช้เวลาไม่เกิน 3-5 วินาทีต่อออเดอร์
2. **Mobile Responsiveness**: หน้าจอ Admin และ POS ต้องรองรับ Responsive Layouts (เปลี่ยนเป็น Card View บนอุปกรณ์ที่มีความกว้าง < 768px)
3. **Smooth Micro-interactions**: ใช้ Transition แบบ Exponential Smooth (`cubic-bezier(0.16, 1, 0.3, 1)`) โดยไม่มีอาการ Bouncy หรือ Layout Thrashing
