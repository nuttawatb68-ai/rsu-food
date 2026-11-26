import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import PartnerPanel from "@/components/PartnerPanel";
import ReviewSummary from "@/components/ReviewSummary";

export const dynamic = "force-dynamic";

export default async function PartnerPage() {
  const s = (await getSession())!; // middleware การันตีแล้วว่าเป็น PARTNER
  const shop = await prisma.shop.findFirst({ where: { ownerId: s.uid }, include: { menus: { orderBy: { id: "asc" } } } });
  const [ratingGroups, average, latest] = shop ? await Promise.all([
    prisma.review.groupBy({ by: ["rating"], where: { shopId: shop.id }, _count: { _all: true } }),
    prisma.review.aggregate({ where: { shopId: shop.id }, _avg: { rating: true }, _count: { _all: true } }),
    prisma.review.findMany({
      where: { shopId: shop.id }, orderBy: { createdAt: "desc" }, take: 5,
      select: { id: true, rating: true, content: true, createdAt: true, user: { select: { name: true } } },
    }),
  ]) : [[], { _avg: { rating: null }, _count: { _all: 0 } }, []];
  const counts = Array(6).fill(0) as number[];
  for (const group of ratingGroups) counts[group.rating] = group._count._all;
  return (
    <main className="container">
      <h1>พอร์ทัลร้านค้าพาร์ทเนอร์</h1>
      {shop && <ReviewSummary
        total={average._count._all}
        average={average._avg.rating ?? 0}
        counts={counts}
        latest={latest.map((review) => ({ id: review.id, rating: review.rating, content: review.content, createdAt: review.createdAt.toISOString(), userName: review.user.name }))}
      />}
      <PartnerPanel
        shop={shop ? { name: shop.name, zone: shop.zone, address: shop.address ?? "", openTime: shop.openTime, closeTime: shop.closeTime, lat: shop.lat, lng: shop.lng, status: shop.status } : null}
        menus={(shop?.menus ?? []).map((m) => ({ id: m.id, name: m.name, description: m.description ?? "", price: m.price, specialPrice: m.specialPrice }))}
      />
    </main>
  );
}
