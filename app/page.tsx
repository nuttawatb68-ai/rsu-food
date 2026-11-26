import BudgetForm from "@/components/BudgetForm";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  let shops = 0, spins = 0;
  try {
    [shops, spins] = await Promise.all([prisma.shop.count({ where: { status: "APPROVED" } }), prisma.spinLog.count()]);
  } catch {}
  return (
    <main className="container">
      <div className="hero">
        <span className="badge blue">RSU Campus Food · เมืองเอก รังสิต</span>
        <h1>มื้อนี้กินอะไรดีมอนี้?</h1>
        <p className="muted">เลือกงบ แล้วระบบจะหาร้านรอบ ม.รังสิต พร้อมเมนูและปุ่มนำทางให้ทันที</p>
        <div className="stats">
          <div className="stat"><b>{shops}</b><span className="muted small">ร้านพาร์ทเนอร์</span></div>
          <div className="stat"><b>10 กม.</b><span className="muted small">รัศมีค้นหา</span></div>
          <div className="stat"><b>{spins}</b><span className="muted small">ครั้งที่สุ่มแล้ว</span></div>
        </div>
      </div>
      <BudgetForm />
    </main>
  );
}
