import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/rbac";
import { str, num, timeOk } from "@/lib/validate";

const STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const g = await guard("shop:review");
  if (g.error) return g.error;
  const b = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};

  if (b.status !== undefined) {
    if (!STATUSES.includes(b.status)) return NextResponse.json({ error: "สถานะไม่ถูกต้อง" }, { status: 400 });
    data.status = b.status;
  }
  if (b.name !== undefined) data.name = str(b.name, 100);
  if (b.zone !== undefined) data.zone = str(b.zone, 60);
  if (b.address !== undefined) data.address = str(b.address, 200) || null;
  if (b.openTime !== undefined) { const t = str(b.openTime, 5); if (!timeOk(t)) return NextResponse.json({ error: "เวลาเปิดไม่ถูกต้อง" }, { status: 400 }); data.openTime = t; }
  if (b.closeTime !== undefined) { const t = str(b.closeTime, 5); if (!timeOk(t)) return NextResponse.json({ error: "เวลาปิดไม่ถูกต้อง" }, { status: 400 }); data.closeTime = t; }
  if (b.lat !== undefined) { const v = num(b.lat, -90, 90); if (v === null) return NextResponse.json({ error: "lat ไม่ถูกต้อง" }, { status: 400 }); data.lat = v; }
  if (b.lng !== undefined) { const v = num(b.lng, -180, 180); if (v === null) return NextResponse.json({ error: "lng ไม่ถูกต้อง" }, { status: 400 }); data.lng = v; }
  if (data.name === "") return NextResponse.json({ error: "ชื่อร้านห้ามว่าง" }, { status: 400 });

  try {
    await prisma.shop.update({ where: { id: Number(params.id) }, data });
  } catch {
    return NextResponse.json({ error: "ไม่พบร้านนี้" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const g = await guard("shop:delete_any");
  if (g.error) return g.error;
  try {
    await prisma.shop.delete({ where: { id: Number(params.id) } }); // เมนูของร้านถูกลบตาม (cascade)
  } catch {
    return NextResponse.json({ error: "ไม่พบร้านนี้" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
