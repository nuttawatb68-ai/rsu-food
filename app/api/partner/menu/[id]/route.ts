import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/rbac";
import { readMenu } from "@/lib/menu";

// ตรวจความเป็นเจ้าของ: แก้/ลบได้เฉพาะเมนูของร้านตัวเอง
async function ownMenu(id: string, uid: number) {
  const item = await prisma.menuItem.findUnique({ where: { id: Number(id) }, include: { shop: true } });
  return item && item.shop.ownerId === uid ? item : null;
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const g = await guard("menu:manage_own");
  if (g.error) return g.error;
  if (!(await ownMenu(params.id, g.session.uid))) return NextResponse.json({ error: "ไม่พบเมนู" }, { status: 404 });
  const data = readMenu(await req.json().catch(() => ({})));
  if (!data) return NextResponse.json({ error: "ข้อมูลเมนูไม่ถูกต้อง" }, { status: 400 });
  return NextResponse.json(await prisma.menuItem.update({ where: { id: Number(params.id) }, data }));
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const g = await guard("menu:manage_own");
  if (g.error) return g.error;
  if (!(await ownMenu(params.id, g.session.uid))) return NextResponse.json({ error: "ไม่พบเมนู" }, { status: 404 });
  await prisma.menuItem.delete({ where: { id: Number(params.id) } });
  return NextResponse.json({ ok: true });
}
