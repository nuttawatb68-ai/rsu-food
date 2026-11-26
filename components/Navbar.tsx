import Link from "next/link";
import { getSession } from "@/lib/auth";
import LogoutButton from "./LogoutButton";

export default async function Navbar() {
  let s = null;
  try { s = await getSession(); } catch {}
  return (
    <header className="nav">
      <Link href="/" className="brand">
        GIN A-RAI DEE MOR NEE
        <small>RSU Food Randomizer & AI</small>
      </Link>
      <nav className="navlinks" aria-label="เมนูหลัก">
        <Link href="/">หน้าแรก & สุ่มอาหาร</Link>
        <Link href="/shops">ร้านอาหารรอบ ม.รังสิต</Link>
        {s?.role === "STUDENT" && <Link href="/favorites">ร้านโปรด</Link>}
        {s?.role === "PARTNER" && <Link href="/partner">แดชบอร์ดร้านค้า</Link>}
        {s?.role === "ADMIN" && <Link href="/admin">แดชบอร์ดผู้ดูแล</Link>}
      </nav>
      <div className="userbox">
        {s ? (
          <>
            <span>{s.name} <span className="badge pink">{s.role}</span></span>
            <LogoutButton />
          </>
        ) : (
          <Link href="/login" className="btn btn-pink btn-sm">เข้าสู่ระบบ</Link>
        )}
      </div>
    </header>
  );
}
