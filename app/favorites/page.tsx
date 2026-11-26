import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ShopCard from "@/components/ShopCard";

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=%2Ffavorites");
  if (session.role !== "STUDENT") redirect("/");

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.uid, shop: { status: "APPROVED" } },
    include: {
      shop: {
        include: {
          menus: true,
          reviews: { orderBy: { createdAt: "desc" }, take: 5, include: { user: { select: { name: true } } } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  const ownReviews = await prisma.review.findMany({
    where: { userId: session.uid, shopId: { in: favorites.map((favorite) => favorite.shopId) } },
    select: { shopId: true, rating: true, content: true },
  });
  const reviewByShop = new Map(ownReviews.map((review) => [review.shopId, { rating: review.rating, content: review.content }]));

  return (
    <main className="container">
      <h1>ร้านโปรดของฉัน</h1>
      <p className="muted">ร้านที่คุณกดหัวใจไว้</p>
      {favorites.length === 0 ? (
        <section className="panel">
          <p>ยังไม่มีร้านโปรด กดหัวใจที่ร้านที่คุณชอบเพื่อบันทึกไว้ที่นี่</p>
          <Link className="btn btn-pink" href="/shops">เลือกร้านอาหาร</Link>
        </section>
      ) : (
        <div className="grid2">
          {favorites.map(({ shop }) => (
            <ShopCard
              key={shop.id}
              shop={shop}
              initialFavorite
              reviews={shop.reviews.map((review) => ({ id: review.id, rating: review.rating, content: review.content, createdAt: review.createdAt.toISOString(), userName: review.user.name }))}
              myReview={reviewByShop.get(shop.id) ?? null}
              role={session.role}
            />
          ))}
        </div>
      )}
    </main>
  );
}
