import { NextResponse } from "next/server";
import { spin } from "@/lib/randomize";
import { int } from "@/lib/validate";
import { MIN_BUDGET, MAX_BUDGET } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const budget = int(b.budget, MIN_BUDGET, MAX_BUDGET);
  if (!budget) return NextResponse.json({ error: `งบต้องอยู่ระหว่าง ${MIN_BUDGET}-${MAX_BUDGET} บาท` }, { status: 400 });
  const exclude = Array.isArray(b.exclude) ? b.exclude.filter((x: unknown) => typeof x === "string").slice(0, 100) : [];
  const result = await spin(budget, exclude);
  if (!result)
    return NextResponse.json(
      { error: "ยังไม่พบร้านในงบนี้ ลองเพิ่มงบ หรือให้ร้านค้าเพิ่มเมนูราคาประหยัด" },
      { status: 404 }
    );
  return NextResponse.json(result);
}
