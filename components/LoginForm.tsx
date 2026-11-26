"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm({ next }: { next?: string }) {
  const r = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [role, setRole] = useState<"STUDENT" | "PARTNER">("STUDENT");
  const [f, setF] = useState({ name: "", email: "", password: "", studentId: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const up = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr("");
    const res = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...f, role }),
    });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setErr(j.error || "เกิดข้อผิดพลาด");
    // ส่งไปหน้าที่เหมาะกับ role
    const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : null;
    r.push(j.role === "ADMIN" ? "/admin" : j.role === "PARTNER" ? "/partner" : safeNext || "/");
    r.refresh();
  }

  return (
    <form className="panel" onSubmit={submit}>
      <h2>{mode === "login" ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}</h2>
      <div className="tabs" role="tablist">
        <button type="button" className={mode === "login" ? "on" : ""} onClick={() => setMode("login")}>เข้าสู่ระบบ</button>
        <button type="button" className={mode === "register" ? "on" : ""} onClick={() => setMode("register")}>สมัครใหม่</button>
      </div>

      {mode === "register" && (
        <>
          <div className="tabs">
            <button type="button" className={role === "STUDENT" ? "on" : ""} onClick={() => setRole("STUDENT")}>นักศึกษา/บุคลากร</button>
            <button type="button" className={role === "PARTNER" ? "on" : ""} onClick={() => setRole("PARTNER")}>ร้านค้าพาร์ทเนอร์</button>
          </div>
          <label className="f" htmlFor="name">{role === "PARTNER" ? "ชื่อเจ้าของร้าน" : "ชื่อ-นามสกุล"}</label>
          <input id="name" className="input" required value={f.name} onChange={(e) => up("name", e.target.value)} />
          {role === "STUDENT" && (
            <>
              <label className="f" htmlFor="sid">รหัสนักศึกษา (ไม่บังคับ)</label>
              <input id="sid" className="input" inputMode="numeric" maxLength={10} value={f.studentId} onChange={(e) => up("studentId", e.target.value)} />
            </>
          )}
        </>
      )}

      <label className="f" htmlFor="email">อีเมล</label>
      <input id="email" type="email" className="input" required autoComplete="email" value={f.email} onChange={(e) => up("email", e.target.value)} />
      <label className="f" htmlFor="pw">รหัสผ่าน (อย่างน้อย 8 ตัว)</label>
      <input id="pw" type="password" className="input" required minLength={8} autoComplete={mode === "login" ? "current-password" : "new-password"} value={f.password} onChange={(e) => up("password", e.target.value)} />

      {err && <div className="alert err" role="alert">{err}</div>}
      <button className="btn btn-pink btn-block" style={{ marginTop: 16 }} disabled={busy}>
        {busy ? "กำลังดำเนินการ…" : mode === "login" ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
      </button>
      <Link href="/" className="btn btn-block" style={{ marginTop: 10 }}>สุ่มอาหารทันทีโดยไม่ต้องเข้าสู่ระบบ (Guest)</Link>
    </form>
  );
}
