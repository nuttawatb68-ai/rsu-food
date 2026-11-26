import { prisma } from "@/lib/prisma";
import AdminPanel from "@/components/AdminPanel";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [spins, avg, users, shops, ratingGroups] = await Promise.all([
    prisma.spinLog.count(),
    prisma.spinLog.aggregate({ _avg: { budget: true } }),
    prisma.user.count(),
    prisma.shop.findMany({
      include: {
        owner: { select: { name: true, email: true } },
        menus: true,
        _count: { select: { reviews: true } },
        reviews: {
          orderBy: { createdAt: "desc" }, take: 5,
          select: { id: true, rating: true, content: true, createdAt: true, user: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.review.groupBy({ by: ["shopId", "rating"], _count: { _all: true } }),
  ]);
  const ratingCounts = new Map<number, number[]>();
  for (const group of ratingGroups) {
    const counts = ratingCounts.get(group.shopId) ?? Array(6).fill(0) as number[];
    counts[group.rating] = group._count._all;
    ratingCounts.set(group.shopId, counts);
  }
  return (
    <main className="container">
      <h1>ศูนย์ควบคุมระบบ (Admin)</h1>
      <AdminPanel
        stats={{
          spins, users, avgBudget: Math.round(avg._avg.budget ?? 0),
          approved: shops.filter((s) => s.status === "APPROVED").length,
          pending: shops.filter((s) => s.status === "PENDING").length,
        }}
        api={{ places: !!process.env.GOOGLE_PLACES_API_KEY, gemini: !!process.env.GEMINI_API_KEY }}
        shops={shops.map((s) => ({
          id: s.id, name: s.name, zone: s.zone, address: s.address ?? "", openTime: s.openTime, closeTime: s.closeTime,
          lat: s.lat, lng: s.lng, status: s.status, owner: `${s.owner.name} (${s.owner.email})`,
          menus: s.menus.map((m) => `${m.name} ${m.specialPrice ?? m.price}฿`).join(", "),
          reviewSummary: {
            total: s._count.reviews,
            counts: ratingCounts.get(s.id) ?? Array(6).fill(0),
            average: s._count.reviews
              ? (ratingCounts.get(s.id) ?? []).reduce((sum, count, rating) => sum + count * rating, 0) / s._count.reviews
              : 0,
            latest: s.reviews.map((review) => ({
              id: review.id, rating: review.rating, content: review.content,
              createdAt: review.createdAt.toISOString(), userName: review.user.name,
            })),
          },
        }))}
      />
    </main>
  );
}
