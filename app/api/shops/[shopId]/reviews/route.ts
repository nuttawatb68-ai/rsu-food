import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/rbac";
import { str } from "@/lib/validate";

export async function POST(req: Request, { params }: { params: { shopId: string } }) {
  const g = await guard("shop:write_review");
  if (g.error) return g.error;

  const shopId = Number(params.shopId);
  if (!Number.isSafeInteger(shopId) || shopId <= 0)
    return NextResponse.json({ error: "รหัสร้านไม่ถูกต้อง" }, { status: 400 });

  const shop = await prisma.shop.findFirst({ where: { id: shopId, status: "APPROVED" }, select: { id: true } });
  if (!shop) return NextResponse.json({ error: "ไม่พบร้านนี้" }, { status: 404 });

  const parsed: unknown = await req.json().catch(() => null);
  const body = typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
    ? parsed as { rating?: unknown; content?: unknown }
    : {};
  const rating = body.rating;
  const content = str(body.content, 1200);
  if (typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5)
    return NextResponse.json({ error: "ให้คะแนนได้ตั้งแต่ 1 ถึง 5 ดาว" }, { status: 400 });
  if (!content) return NextResponse.json({ error: "กรุณาเขียนรีวิวก่อนส่ง" }, { status: 400 });

  const review = await prisma.review.upsert({
    where: { userId_shopId: { userId: g.session.uid, shopId } },
    create: { userId: g.session.uid, shopId, rating, content },
    update: { rating, content },
    select: {
      id: true, rating: true, content: true, createdAt: true, updatedAt: true,
      user: { select: { name: true } },
    },
  });
  return NextResponse.json(review);
}
