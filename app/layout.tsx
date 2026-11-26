import type { Metadata } from "next";
import { Anuphan } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const font = Anuphan({ subsets: ["thai", "latin"], variable: "--font", display: "swap" });

export const metadata: Metadata = {
  title: "กินอะไรดีมอนี้ | สุ่มอาหารรอบ ม.รังสิต",
  description: "สุ่มร้านและเมนูตามงบ รอบมหาวิทยาลัยรังสิต พร้อมนำทางด้วย Google Maps",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={font.variable}>
      <body>
        <Navbar />
        {children}
        <footer className="container muted small" style={{ paddingTop: 0 }}>
          กินอะไรดีมอนี้ © 2026 · Next.js + Prisma + TiDB · OPENSTREETMAP & Gemini
        </footer>
      </body>
    </html>
  );
}
