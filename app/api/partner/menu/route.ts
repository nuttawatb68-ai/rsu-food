import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/rbac";
import { readMenu } from "@/lib/menu";

export async function POST(req: Request) {
  const g = await guard("menu:manage_own");
  if (g.error) return g.error;
  const shop = await prisma.shop.findFirst({ where: { ownerId: g.session.uid } });
  if (!shop) return NextResponse.json({ error: "กรุณาบันทึกข้อมูลร้านก่อนเพิ่มเมนู" }, { status: 400 });
  const data = readMenu(await req.json().catch(() => ({})));
  if (!data) return NextResponse.json({ error: "กรอกชื่อเมนูและราคาให้ถูกต้อง" }, { status: 400 });
  const item = await prisma.menuItem.create({ data: { ...data, shopId: shop.id } });
  return NextResponse.json(item);
}
