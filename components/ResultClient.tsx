"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { SpinResult } from "@/lib/randomize";

export default function ResultClient({ budget }: { budget: number }) {
  const [data, setData] = useState<SpinResult | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const seen = useRef<string[]>([]);

  const spin = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const r = await fetch("/api/randomize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ budget, exclude: seen.current }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "สุ่มไม่สำเร็จ");
      seen.current.push(j.key);
      setData(j);
    } catch (e) {
      setErr((e as Error).message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [budget]);

  useEffect(() => { spin(); }, [spin]);

  async function share() {
    if (!data) return;
    const text = `มื้อนี้กิน "${data.menu.name}" ที่ ${data.shop.name} (${data.menu.price} บาท) ${data.mapsUrl}`;
    if (navigator.share) { try { await navigator.share({ text }); return; } catch {} }
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading && !data)
    return <div className="panel" style={{ textAlign: "center", padding: 60 }}><div className="spinner" role="status" aria-label="กำลังสุ่ม" /><p className="muted">กำลังหาร้านในงบ {budget} บาท…</p></div>;

  if (err)
    return (
      <div className="panel">
        <div className="alert err">{err}</div>
        <Link href="/" className="btn">เปลี่ยนงบ</Link>
      </div>
    );
  if (!data) return null;

  const { shop, menu } = data;
  return (
    <div className="grid2" style={{ gridTemplateColumns: "1.3fr 1fr", opacity: loading ? 0.6 : 1 }}>
      <section className="panel">
        <span className={`badge ${data.mode === "AI" ? "blue" : ""}`}>{data.mode === "AI" ? "เลือกโดย AI Gemini" : "สุ่มโดยระบบ"}</span>{" "}
        <span className={`badge ${shop.source === "DB" ? "ok" : ""}`}>{shop.source === "DB" ? "ร้านพาร์ทเนอร์ (อนุมัติแล้ว)" : shop.source === "GOOGLE" ? "จาก Google Places" : "จาก OpenStreetMap"}</span>
        <h1 style={{ margin: "14px 0 4px" }}>{shop.name}</h1>
        <p className="muted small" style={{ margin: 0 }}>
          {shop.zone ?? shop.address ?? "รอบ ม.รังสิต"} · ห่าง ม.รังสิต {shop.distanceKm} กม. (~{shop.minutes} นาที)
          {shop.rating ? ` · ★ ${shop.rating}${shop.ratingCount ? ` (${shop.ratingCount})` : ""}` : ""}
          {shop.hours ? ` · เปิด ${shop.hours}` : ""}
        </p>
        <div className="menu-hero">{menu.name}</div>
        <span className="price-tag">{menu.price}.-</span>
        {menu.estimated && <p className="muted small">* ราคาเป็นค่าประมาณจาก AI (แหล่งข้อมูลแผนที่ไม่มีราคาเมนู) โปรดเช็กหน้าร้านอีกครั้ง</p>}
        {menu.description && <p className="muted">{menu.description}</p>}
        <div className="humor">💬 {data.humor}</div>
        <a className="btn btn-blue btn-block" href={data.mapsUrl} target="_blank" rel="noopener noreferrer">
          เปิด Google Maps นำทางทันที
        </a>
        <div className="row" style={{ marginTop: 10 }}>
          <button className="btn" onClick={spin} disabled={loading}>🎲 สุ่มใหม่ (Re-roll)</button>
          <button className="btn" onClick={share}>{copied ? "คัดลอกลิงก์แล้ว ✓" : "แชร์เข้ากลุ่มไลน์"}</button>
        </div>
      </section>

      <aside className="panel">
        <h3>เส้นทางจาก ม.รังสิต</h3>
        <p className="muted small">ระยะทาง {shop.distanceKm} กม. · ใช้เวลาประมาณ {shop.minutes} นาที (ขับรถ/มอเตอร์ไซค์)</p>
        <h3 style={{ marginTop: 24 }}>ร้านทางเลือกใกล้เคียงในงบ {budget}.-</h3>
        {data.alternatives.length === 0 && <p className="muted small">ยังไม่มีร้านทางเลือก</p>}
        {data.alternatives.map((a) => (
          <div className="item" key={a.name}>
            <div>{a.name}<div className="muted small">{a.distanceKm} กม.</div></div>
            <b>{a.price}.-</b>
          </div>
        ))}
        <Link href="/" className="btn btn-block" style={{ marginTop: 16 }}>เปลี่ยนงบ</Link>
      </aside>
    </div>
  );
}
