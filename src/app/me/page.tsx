import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { StatusBadge } from "@/components/Badges";
import { StarRatingDisplay } from "@/components/StarRating";
import { EmptyState } from "@/components/EmptyState";
import { UserAvatar } from "@/components/Avatar";
import { displayName, timeAgo } from "@/lib/format";
import { StarIcon } from "@/components/icons";

export const metadata = { title: "My reviews" };
export const dynamic = "force-dynamic";

export default async function MyReviewsPage() {
  const user = await requireUser("/me");

  const reviews = await prisma.review.findMany({
    where: { authorId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      entity: { select: { name: true, slug: true, type: true, status: true } },
      _count: { select: { evidence: true } },
    },
  });

  return (
    <div className="container-page max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <UserAvatar name={displayName(user)} photoUrl={user.photoUrl} size={56} />
        <div>
          <h1 className="text-2xl font-bold">{displayName(user)}</h1>
          <p className="text-sm text-muted">
            {user.role === "ADMIN" ? "Administrator · " : ""}
            {reviews.length} review{reviews.length === 1 ? "" : "s"} submitted
          </p>
        </div>
      </div>

      {reviews.length === 0 ? (
        <EmptyState
          icon={<StarIcon />}
          title="You haven't submitted anything yet"
          description="Found something worth reporting? Add a review with evidence."
          actionHref="/submit"
          actionLabel="Add a review"
        />
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-slate-100">{r.title}</h3>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    on{" "}
                    {r.entity.status === "APPROVED" ? (
                      <Link
                        href={`/entity/${r.entity.slug}`}
                        className="text-brand-soft hover:underline"
                      >
                        {r.entity.name}
                      </Link>
                    ) : (
                      <span className="text-slate-300">
                        {r.entity.name}{" "}
                        <span className="text-xs">(card pending approval)</span>
                      </span>
                    )}{" "}
                    · {timeAgo(r.createdAt)} · {r._count.evidence} attachment
                    {r._count.evidence === 1 ? "" : "s"}
                  </p>
                </div>
                <StarRatingDisplay value={r.rating} size={14} />
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-slate-300">{r.body}</p>
              {r.status === "REJECTED" && r.moderationNote && (
                <p className="mt-2 rounded-lg bg-danger/10 px-3 py-2 text-sm text-red-200">
                  Moderator note: {r.moderationNote}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
