import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import ShopCard from "@/components/ShopCard";

export const dynamic = "force-dynamic";

export default async function Shops() {
  const [shops, session] = await Promise.all([
    prisma.shop.findMany({
      where: { status: "APPROVED" },
      include: { menus: true, reviews: { orderBy: { createdAt: "desc" }, take: 5, include: { user: { select: { name: true } } } } },
      orderBy: { name: "asc" },
    }).catch(() => []),
    getSession(),
  ]);
  const favoriteIds = session?.role === "STUDENT"
    ? new Set((await prisma.favorite.findMany({ where: { userId: session.uid }, select: { shopId: true } })).map((favorite) => favorite.shopId))
    : new Set<number>();
  const ownReviews = session?.role === "STUDENT" && shops.length > 0
    ? await prisma.review.findMany({ where: { userId: session.uid, shopId: { in: shops.map((shop) => shop.id) } }, select: { shopId: true, rating: true, content: true } })
    : [];
  const reviewByShop = new Map(ownReviews.map((review) => [review.shopId, { rating: review.rating, content: review.content }]));
  return (
    <main className="container">
      <h1>ร้านอาหารรอบ ม.รังสิต</h1>
      <p className="muted">เฉพาะร้านพาร์ทเนอร์ที่ Admin อนุมัติแล้ว</p>
      {shops.length === 0 && <div className="panel">ยังไม่มีร้านในระบบ</div>}
      <div className="grid2">
        {shops.map((s) => (
          <ShopCard
            key={s.id}
            shop={s}
            initialFavorite={favoriteIds.has(s.id)}
            reviews={s.reviews.map((review) => ({ id: review.id, rating: review.rating, content: review.content, createdAt: review.createdAt.toISOString(), userName: review.user.name }))}
            myReview={reviewByShop.get(s.id) ?? null}
            role={session?.role ?? null}
          />
        ))}
      </div>
    </main>
  );
}
