"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MIN_BUDGET, MAX_BUDGET } from "@/lib/constants";

const PRESETS = [
  { v: 40, l: "ประหยัดสุด" },
  { v: 50, l: "ยอดฮิตเด็กมอ" },
  { v: 70, l: "อิ่มจุใจ" },
  { v: 100, l: "มื้อจัมโบ้โอ้โห้ใหญ่จัง" },
];

export default function BudgetForm() {
  const [b, setB] = useState(50);
  const r = useRouter();
  const set = (n: number) => setB(Math.min(MAX_BUDGET, Math.max(MIN_BUDGET, Math.round(n) || MIN_BUDGET)));
  return (
    <section className="panel" aria-label="ตั้งค่างบ">
      <h2>ตั้งค่าการสุ่มตามเงื่อนไข</h2>
      <p className="muted small">ค้นหาร้านรอบ ม.รังสิต ในรัศมี 10 กม. แล้วให้ AI เลือกเมนูที่ไม่เกินงบ</p>
      <div className="budget-box">
        <button className="stepper" aria-label="ลดงบ 5 บาท" onClick={() => set(b - 5)}>−</button>
        <span className="sym">฿</span>
        <input
          type="number" inputMode="numeric" aria-label="งบประมาณ (บาท)"
          value={b} min={MIN_BUDGET} max={MAX_BUDGET}
          onChange={(e) => setB(Number(e.target.value))}
          onBlur={() => set(b)}
        />
        <span className="muted">บาท</span>
        <button className="stepper" aria-label="เพิ่มงบ 5 บาท" onClick={() => set(b + 5)}>+</button>
      </div>
      <div className="chips">
        {PRESETS.map((p) => (
          <button key={p.v} className={`chip ${b === p.v ? "on" : ""}`} onClick={() => set(p.v)}>
            ฿{p.v} {p.l}
          </button>
        ))}
      </div>
      <button className="btn-cta" onClick={() => r.push(`/result?budget=${b}`)}>
        🎲 สุ่มเมนูตามงบ {b} บาท
      </button>
    </section>
  );
}
