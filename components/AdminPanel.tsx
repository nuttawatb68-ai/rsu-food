"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import ReviewSummary from "./ReviewSummary";

type ReviewItem = { id: number; rating: number; content: string; createdAt: string; userName: string };
type S = {
  id: number; name: string; zone: string; address: string; openTime: string; closeTime: string;
  lat: number; lng: number; status: string; owner: string; menus: string;
  reviewSummary: { total: number; average: number; counts: number[]; latest: ReviewItem[] };
};
type Props = { stats: { spins: number; users: number; avgBudget: number; approved: number; pending: number }; api: { places: boolean; gemini: boolean }; shops: S[] };

export default function AdminPanel({ stats, api, shops }: Props) {
  const r = useRouter();
  const [err, setErr] = useState("");
  const [edit, setEdit] = useState<S | null>(null);

  async function act(url: string, method: string, body?: unknown) {
    setErr("");
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    if (!res.ok) return setErr((await res.json().catch(() => ({}))).error || "เกิดข้อผิดพลาด");
    setEdit(null);
    r.refresh();
  }
  const pending = shops.filter((s) => s.status === "PENDING");
  const Stat = ({ n, l }: { n: string | number; l: string }) => <div className="stat panel" style={{ textAlign: "left" }}><b style={{ fontSize: "1.8rem", color: "var(--text)" }}>{n}</b><span className="muted small">{l}</span></div>;

  return (
    <>
      <div className="grid4" style={{ margin: "16px 0" }}>
        <Stat n={stats.spins} l="จำนวนการสุ่มทั้งหมด" />
        <Stat n={stats.approved} l="ร้านที่เปิดใช้งาน" />
        <Stat n={`฿${stats.avgBudget}`} l="งบเฉลี่ยที่เด็กเลือก" />
        <Stat n={stats.users} l="ผู้ใช้ทั้งหมด" />
      </div>

      <div className="panel" style={{ marginBottom: 16 }}>
        <h3>สถานะ API (ตั้งค่าไว้ใน Environment Variables)</h3>
        <span className={`badge ${api.places ? "ok" : "warn"}`}>Google Places: {api.places ? "เชื่อมต่อแล้ว" : "ไม่ได้ใช้ (ใช้ OpenStreetMap แทน)"}</span>{" "}
        <span className={`badge ${api.gemini ? "ok" : "warn"}`}>Gemini: {api.gemini ? "เชื่อมต่อแล้ว" : "ยังไม่ตั้งค่า"}</span>
      </div>

      {err && <div className="alert err" role="alert">{err}</div>}

      <section className="panel" style={{ marginBottom: 16 }}>
        <h2>คำขอเข้าร่วมระบบ <span className="badge warn">{pending.length} รอดำเนินการ</span></h2>
        {pending.length === 0 && <p className="muted">ไม่มีคำขอที่รออนุมัติ</p>}
        {pending.map((s) => (
          <div className="item" key={s.id}>
            <div>
              <b>{s.name}</b> <span className="muted small">· {s.zone}</span>
              <div className="small">เมนู: {s.menus || "— ยังไม่มีเมนู —"}</div>
              <div className="muted small">{s.owner} · GPS {s.lat}, {s.lng}</div>
            </div>
            <div className="actions">
              <button className="btn btn-pink btn-sm" onClick={() => act(`/api/admin/shops/${s.id}`, "PATCH", { status: "APPROVED" })}>อนุมัติ</button>
              <button className="btn btn-sm" onClick={() => act(`/api/admin/shops/${s.id}`, "PATCH", { status: "REJECTED" })}>ปฏิเสธ</button>
            </div>
          </div>
        ))}
      </section>

      <section className="panel" style={{ marginBottom: 16 }}>
        <h2>สรุปรีวิวร้าน (สำหรับผู้ดูแล)</h2>
        {shops.length === 0 && <p className="muted">ยังไม่มีร้านในระบบ</p>}
        <div className="grid2">
          {shops.map((shop) => (
            <div key={shop.id}>
              <h3>{shop.name}</h3>
              <ReviewSummary {...shop.reviewSummary} />
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>ร้านทั้งหมดในระบบ</h2>
        <div className="tablewrap">
          <table>
            <thead><tr><th>ร้าน</th><th>โซน</th><th>เวลา</th><th>สถานะ</th><th>จัดการ</th></tr></thead>
            <tbody>
              {shops.map((s) => (
                <tr key={s.id}>
                  <td><b>{s.name}</b><div className="muted small">{s.owner}</div></td>
                  <td>{s.zone}</td>
                  <td>{s.openTime}-{s.closeTime}</td>
                  <td><span className={`badge ${s.status === "APPROVED" ? "ok" : s.status === "PENDING" ? "warn" : "bad"}`}>{s.status}</span></td>
                  <td className="actions">
                    <button className="btn btn-sm" onClick={() => setEdit(s)}>แก้ไข</button>
                    <button className="btn btn-sm btn-bad" onClick={() => confirm(`ลบร้าน "${s.name}" และเมนูทั้งหมด?`) && act(`/api/admin/shops/${s.id}`, "DELETE")}>ลบ</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {edit && (
          <div style={{ marginTop: 16, padding: 16, background: "var(--panel2)", borderRadius: 12 }}>
            <h3>แก้ไข: {edit.name}</h3>
            <label className="f" htmlFor="en">ชื่อร้าน</label>
            <input id="en" className="input" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
            <div className="row">
              <div><label className="f" htmlFor="ez">โซน</label><input id="ez" className="input" value={edit.zone} onChange={(e) => setEdit({ ...edit, zone: e.target.value })} /></div>
              <div><label className="f" htmlFor="eo">เปิด</label><input id="eo" type="time" className="input" value={edit.openTime} onChange={(e) => setEdit({ ...edit, openTime: e.target.value })} /></div>
              <div><label className="f" htmlFor="ec">ปิด</label><input id="ec" type="time" className="input" value={edit.closeTime} onChange={(e) => setEdit({ ...edit, closeTime: e.target.value })} /></div>
            </div>
            <label className="f" htmlFor="ea">ที่อยู่</label>
            <input id="ea" className="input" value={edit.address} onChange={(e) => setEdit({ ...edit, address: e.target.value })} />
            <div className="row">
              <div><label className="f" htmlFor="ela">lat</label><input id="ela" className="input" value={edit.lat} onChange={(e) => setEdit({ ...edit, lat: e.target.value as unknown as number })} /></div>
              <div><label className="f" htmlFor="eln">lng</label><input id="eln" className="input" value={edit.lng} onChange={(e) => setEdit({ ...edit, lng: e.target.value as unknown as number })} /></div>
            </div>
            <div className="row" style={{ marginTop: 12 }}>
              <button className="btn btn-pink" onClick={() => act(`/api/admin/shops/${edit.id}`, "PATCH", { name: edit.name, zone: edit.zone, address: edit.address, openTime: edit.openTime, closeTime: edit.closeTime, lat: edit.lat, lng: edit.lng })}>บันทึกการแก้ไข</button>
              <button className="btn" onClick={() => setEdit(null)}>ยกเลิก</button>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
