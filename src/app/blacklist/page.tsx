import Link from "next/link";
import { getBlacklist } from "@/lib/queries";
import { EntityAvatar } from "@/components/Avatar";
import { StarRatingDisplay } from "@/components/StarRating";
import { TypeBadge } from "@/components/Badges";
import { EmptyState } from "@/components/EmptyState";
import { BanIcon, ChevronRight } from "@/components/icons";
import { formatDate } from "@/lib/format";

export const metadata = {
  title: "Blacklist",
  description: "Companies and specialists flagged by One Trust Base moderators.",
};
export const dynamic = "force-dynamic";

export default async function BlacklistPage() {
  let items: Awaited<ReturnType<typeof getBlacklist>> = [];
  let dbError = false;
  try {
    items = await getBlacklist();
  } catch {
    dbError = true;
  }

  return (
    <div className="container-page space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-danger/15 text-danger ring-1 ring-danger/30">
          <BanIcon />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Blacklist</h1>
          <p className="text-sm text-muted">
            Companies and specialists flagged by our moderators, with the reason
            on record.
          </p>
        </div>
      </div>

      {dbError ? (
        <EmptyState
          title="Database not reachable"
          description="Make sure PostgreSQL is running and migrations were applied."
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<BanIcon />}
          title="The blacklist is empty"
          description="No entities have been blacklisted yet. That's a good thing."
        />
      ) : (
        <div className="space-y-3">
          {items.map((e) => (
            <Link
              key={e.slug}
              href={`/entity/${e.slug}`}
              className="card card-hover group flex items-start gap-4 border-danger/20 p-4"
            >
              <EntityAvatar
                name={e.name}
                type={e.type}
                avatarUrl={e.avatarUrl}
                size={56}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-slate-100">{e.name}</h3>
                  <TypeBadge type={e.type} />
                </div>
                {e.blacklistReason && (
                  <p className="mt-1 text-sm text-red-200/80">
                    {e.blacklistReason}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-3">
                  <StarRatingDisplay value={e.ratingAvg} count={e.ratingCount} />
                  <span className="text-xs text-muted">
                    · updated {formatDate(e.updatedAt)}
                  </span>
                </div>
              </div>
              <ChevronRight className="mt-4 text-muted transition group-hover:translate-x-0.5 group-hover:text-red-300" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
