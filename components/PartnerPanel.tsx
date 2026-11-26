"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ZONES } from "@/lib/constants";

type Shop = { name: string; zone: string; address: string; openTime: string; closeTime: string; lat: number; lng: number; status: string };
type Menu = { id: number; name: string; description: string; price: number; specialPrice: number | null };
const STATUS: Record<string, [string, string]> = {
  PENDING: ["รอ Admin อนุมัติ", "warn"], APPROVED: ["เปิดใช้งานอยู่", "ok"], REJECTED: ["ถูกปฏิเสธ — แก้ไขแล้วส่งใหม่", "bad"],
};

async function call(url: string, method: string, body?: unknown) {
  const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || "เกิดข้อผิดพลาด");
  return j;
}

export default function PartnerPanel({ shop, menus }: { shop: Shop | null; menus: Menu[] }) {
  const r = useRouter();
  const [f, setF] = useState<Shop>(shop ?? { name: "", zone: ZONES[1], address: "", openTime: "09:00", closeTime: "21:00", lat: 13.9655, lng: 100.5878, status: "" });
  const [msg, setMsg] = useState<{ t: "err" | "okk"; m: string } | null>(null);
  const [edit, setEdit] = useState<number | "new" | null>(null);
  const [m, setM] = useState({ name: "", description: "", price: "", specialPrice: "" });

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    try { await fn(); setMsg({ t: "okk", m: ok }); r.refresh(); } catch (e) { setMsg({ t: "err", m: (e as Error).message }); }
  };
  const openEdit = (x: Menu | null) => {
    setEdit(x ? x.id : "new");
    setM(x ? { name: x.name, description: x.description, price: String(x.price), specialPrice: x.specialPrice ? String(x.specialPrice) : "" } : { name: "", description: "", price: "", specialPrice: "" });
  };

  return (
    <div className="grid2" style={{ gridTemplateColumns: "1fr 1.2fr", alignItems: "start" }}>
      <section className="panel">
        <h2>ข้อมูลร้าน & พิกัดนำทาง</h2>
        {shop && <p>สถานะ: <span className={`badge ${STATUS[shop.status][1]}`}>{STATUS[shop.status][0]}</span></p>}
        <div className="alert info small">การแก้ไขข้อมูลร้านจะส่งให้ Admin ตรวจอนุมัติใหม่ ระหว่างนั้นร้านจะยังไม่แสดงบนเว็บ</div>
        <label className="f" htmlFor="sn">ชื่อร้าน</label>
        <input id="sn" className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <div className="row">
          <div>
            <label className="f" htmlFor="zn">โซน</label>
            <select id="zn" className="input" value={f.zone} onChange={(e) => setF({ ...f, zone: e.target.value })}>
              {ZONES.map((z) => <option key={z}>{z}</option>)}
            </select>
          </div>
          <div>
            <label className="f" htmlFor="ot">เวลาเปิด</label>
            <input id="ot" type="time" className="input" value={f.openTime} onChange={(e) => setF({ ...f, openTime: e.target.value })} />
          </div>
          <div>
            <label className="f" htmlFor="ct">เวลาปิด</label>
            <input id="ct" type="time" className="input" value={f.closeTime} onChange={(e) => setF({ ...f, closeTime: e.target.value })} />
          </div>
        </div>
        <label className="f" htmlFor="ad">ที่อยู่ / จุดสังเกต</label>
        <input id="ad" className="input" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} />
        <div className="row">
          <div><label className="f" htmlFor="la">ละติจูด</label><input id="la" className="input" inputMode="decimal" value={f.lat} onChange={(e) => setF({ ...f, lat: e.target.value as unknown as number })} /></div>
          <div><label className="f" htmlFor="ln">ลองจิจูด</label><input id="ln" className="input" inputMode="decimal" value={f.lng} onChange={(e) => setF({ ...f, lng: e.target.value as unknown as number })} /></div>
        </div>
        <button className="btn btn-sm" style={{ marginTop: 8 }} onClick={() => navigator.geolocation?.getCurrentPosition((p) => setF({ ...f, lat: Number(p.coords.latitude.toFixed(6)), lng: Number(p.coords.longitude.toFixed(6)) }), () => setMsg({ t: "err", m: "เข้าถึงตำแหน่งไม่ได้ กรุณากรอกเอง" }))}>
          📍 ใช้ตำแหน่งปัจจุบัน (ยืนอยู่หน้าร้าน)
        </button>
        <p className="muted small">หรือเปิด Google Maps → กดค้างที่หน้าร้าน → ตัวเลขแรกคือละติจูด ตัวที่สองคือลองจิจูด</p>
        <button className="btn btn-blue btn-block" onClick={() => run(() => call("/api/partner/shop", "POST", f), "ส่งข้อมูลร้านแล้ว รอ Admin อนุมัติ")}>
          บันทึกและส่งอนุมัติ
        </button>
        {msg && <div className={`alert ${msg.t}`} role="status">{msg.m}</div>}
      </section>

      <section className="panel">
        <div className="item" style={{ borderBottom: 0, paddingTop: 0 }}>
          <div><h2 style={{ margin: 0 }}>จัดการเมนูและราคา</h2><span className="muted small">แนะนำให้มีเมนูราคาไม่เกิน 50 บาท เพื่อให้ถูกสุ่มเจอ</span></div>
          <button className="btn btn-sm" disabled={!shop} onClick={() => openEdit(null)}>+ เพิ่มเมนู</button>
        </div>
        {!shop && <div className="alert info">บันทึกข้อมูลร้านทางซ้ายก่อน แล้วจึงเพิ่มเมนูได้</div>}
        {menus.map((x) => (
          <div className="item" key={x.id}>
            <div>
              <b>{x.name}</b>
              {x.description && <div className="muted small">{x.description}</div>}
              <div className="small">ราคา {x.price}฿{x.specialPrice ? <span className="badge blue" style={{ marginLeft: 8 }}>พิเศษ {x.specialPrice}฿</span> : null}</div>
            </div>
            <div className="actions">
              <button className="btn btn-sm" onClick={() => openEdit(x)}>แก้ไข</button>
              <button className="btn btn-sm btn-bad" onClick={() => confirm(`ลบ "${x.name}" ?`) && run(() => call(`/api/partner/menu/${x.id}`, "DELETE"), "ลบเมนูแล้ว")}>ลบ</button>
            </div>
          </div>
        ))}
        {shop && menus.length === 0 && <p className="muted">ยังไม่มีเมนู กด “+ เพิ่มเมนู”</p>}

        {edit !== null && (
          <div style={{ marginTop: 16, padding: 16, background: "var(--panel2)", borderRadius: 12 }}>
            <h3>{edit === "new" ? "เพิ่มเมนูใหม่" : "แก้ไขเมนู"}</h3>
            <label className="f" htmlFor="mn">ชื่อเมนู</label>
            <input id="mn" className="input" value={m.name} onChange={(e) => setM({ ...m, name: e.target.value })} />
            <label className="f" htmlFor="md">รายละเอียด (ไม่บังคับ)</label>
            <input id="md" className="input" value={m.description} onChange={(e) => setM({ ...m, description: e.target.value })} />
            <div className="row">
              <div><label className="f" htmlFor="mp">ราคาปกติ (฿)</label><input id="mp" className="input" inputMode="numeric" value={m.price} onChange={(e) => setM({ ...m, price: e.target.value })} /></div>
              <div><label className="f" htmlFor="ms">ราคาพิเศษ นศ. (฿)</label><input id="ms" className="input" inputMode="numeric" value={m.specialPrice} onChange={(e) => setM({ ...m, specialPrice: e.target.value })} /></div>
            </div>
            <div className="row" style={{ marginTop: 12 }}>
              <button className="btn btn-pink" onClick={() => run(async () => {
                await call(edit === "new" ? "/api/partner/menu" : `/api/partner/menu/${edit}`, edit === "new" ? "POST" : "PATCH", m);
                setEdit(null);
              }, "บันทึกเมนูแล้ว")}>บันทึกเมนู</button>
              <button className="btn" onClick={() => setEdit(null)}>ยกเลิก</button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
