import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/rbac";

type Context = { params: { shopId: string } };

function parseShopId(value: string) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function PUT(_: Request, { params }: Context) {
  const g = await guard("shop:favorite");
  if (g.error) return g.error;
  const shopId = parseShopId(params.shopId);
  if (!shopId) return NextResponse.json({ error: "รหัสร้านไม่ถูกต้อง" }, { status: 400 });

  const shop = await prisma.shop.findFirst({ where: { id: shopId, status: "APPROVED" }, select: { id: true } });
  if (!shop) return NextResponse.json({ error: "ไม่พบร้านนี้" }, { status: 404 });

  await prisma.favorite.upsert({
    where: { userId_shopId: { userId: g.session.uid, shopId } },
    create: { userId: g.session.uid, shopId },
    update: {},
  });
  return NextResponse.json({ favorite: true });
}

export async function DELETE(_: Request, { params }: Context) {
  const g = await guard("shop:favorite");
  if (g.error) return g.error;
  const shopId = parseShopId(params.shopId);
  if (!shopId) return NextResponse.json({ error: "รหัสร้านไม่ถูกต้อง" }, { status: 400 });

  await prisma.favorite.deleteMany({ where: { userId: g.session.uid, shopId } });
  return NextResponse.json({ favorite: false });
}
