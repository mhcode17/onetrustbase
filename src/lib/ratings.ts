import { prisma } from "./db";

/**
 * Recompute and cache an entity's rating aggregate from its APPROVED reviews.
 * Call this whenever a review is approved, rejected, or deleted.
 */
export async function recomputeEntityRating(entityId: string) {
  const agg = await prisma.review.aggregate({
    where: { entityId, status: "APPROVED" },
    _avg: { rating: true },
    _count: { rating: true },
  });

  await prisma.entity.update({
    where: { id: entityId },
    data: {
      ratingAvg: agg._avg.rating ?? 0,
      ratingCount: agg._count.rating ?? 0,
    },
  });
}
