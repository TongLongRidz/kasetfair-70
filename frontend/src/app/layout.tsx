import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ถั่วทอง | น้ำเต้าหู้เย็นชื่นใจ เกษตรแฟร์ 70",
  description: "สั่งน้ำเต้าหู้ ชานม และเครื่องดื่มสดจากร้านถั่วทอง บูธเกษตรแฟร์ 70 พร้อมสะสมแต้มและติดตามคิวออนไลน์",
  openGraph: {
    title: "ถั่วทอง | น้ำเต้าหู้เย็นชื่นใจ",
    description: "เมนูเครื่องดื่มสดใหม่ทุกวัน สั่งล่วงหน้า สะสมแต้ม และเช็คคิวได้ที่งานเกษตรแฟร์ 70",
    type: "website",
  },
};

import { cookies } from "next/headers";
import { ToastProvider } from "@/components/ui/toast";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const lang = cookieStore.get("kaset_app_lang")?.value || "th";

  return (
    <html lang={lang}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Anton&family=IBM+Plex+Mono:wght@400;500;600&family=Kanit:wght@300;400;500;600;700&family=Mitr:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
