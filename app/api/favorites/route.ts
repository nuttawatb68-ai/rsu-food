import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/rbac";

export async function GET() {
  const g = await guard("shop:favorite");
  if (g.error) return g.error;

  const favorites = await prisma.favorite.findMany({
    where: { userId: g.session.uid, shop: { status: "APPROVED" } },
    select: { shopId: true },
  });
  return NextResponse.json(favorites.map((favorite) => favorite.shopId));
}
