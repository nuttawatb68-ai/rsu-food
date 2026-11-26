import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/rbac";
import { str, num, timeOk } from "@/lib/validate";
import { distanceKm } from "@/lib/geo";
import { RSU, RADIUS_KM, ZONES } from "@/lib/constants";

export async function POST(req: Request) {
  const g = await guard("shop:submit_own");
  if (g.error) return g.error;

  const b = await req.json().catch(() => ({}));
  const name = str(b.name, 100);
  const zone = ZONES.includes(b.zone) ? b.zone : "";
  const address = str(b.address, 200) || null;
  const openTime = str(b.openTime, 5);
  const closeTime = str(b.closeTime, 5);
  const lat = num(b.lat, -90, 90);
  const lng = num(b.lng, -180, 180);

  if (!name || !zone) return NextResponse.json({ error: "กรอกชื่อร้านและเลือกโซนให้ครบ" }, { status: 400 });
  if (!timeOk(openTime) || !timeOk(closeTime)) return NextResponse.json({ error: "เวลาเปิด-ปิดไม่ถูกต้อง (HH:MM)" }, { status: 400 });
  if (lat === null || lng === null) return NextResponse.json({ error: "พิกัด GPS ไม่ถูกต้อง" }, { status: 400 });
  if (distanceKm(RSU.lat, RSU.lng, lat, lng) > RADIUS_KM)
    return NextResponse.json({ error: `ร้านต้องอยู่ในรัศมี ${RADIUS_KM} กม. จาก ม.รังสิต` }, { status: 400 });

  const mine = await prisma.shop.findFirst({ where: { ownerId: g.session.uid } });
  const data = { name, zone, address, openTime, closeTime, lat, lng, status: "PENDING" as const };
  // แก้ข้อมูลร้านทุกครั้ง => กลับไปรออนุมัติใหม่ (Admin ต้องตรวจก่อนแสดงบนเว็บ)
  const shop = mine
    ? await prisma.shop.update({ where: { id: mine.id }, data })
    : await prisma.shop.create({ data: { ...data, ownerId: g.session.uid } });
  return NextResponse.json({ id: shop.id, status: shop.status });
}
