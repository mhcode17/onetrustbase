import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getEntityBySlug } from "@/lib/queries";
import { getCurrentUser } from "@/lib/auth";
import { serialize, formatDate, RELATION_LABEL } from "@/lib/format";
import { deleteNewsAction } from "@/lib/actions/admin";
import { EntityAvatar } from "@/components/Avatar";
import { StarRatingDisplay } from "@/components/StarRating";
import { BlacklistBadge, TypeBadge } from "@/components/Badges";
import { EntityCard } from "@/components/EntityCard";
import { ReviewItem } from "@/components/ReviewItem";
import { AdminEntityTools } from "@/components/AdminEntityTools";
import { ActionButton } from "@/components/ActionButton";
import { EmptyState } from "@/components/EmptyState";
import {
  BanIcon,
  LinkIcon,
  NewsIcon,
  PlusIcon,
  StarIcon,
  XIcon,
} from "@/components/icons";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  try {
    const entity = await getEntityBySlug(params.slug);
    if (!entity) return { title: "Not found" };
    return {
      title: entity.name,
      description: entity.headline ?? `Reviews and information about ${entity.name}.`,
    };
  } catch {
    return { title: "Card" };
  }
}

export default async function EntityPage({
  params,
}: {
  params: { slug: string };
}) {
  let entity;
  try {
    entity = await getEntityBySlug(params.slug);
  } catch {
    return (
      <div className="container-page">
        <EmptyState
          title="Database not reachable"
          description="Could not load this card. Make sure PostgreSQL is running."
        />
      </div>
    );
  }
  if (!entity) notFound();

  const user = await getCurrentUser();
  const isAdmin = user?.role === "ADMIN";

  // Combine directed relations into a single display list.
  const connections = [
    ...entity.relationsFrom.map((r) => ({
      id: r.id,
      label: RELATION_LABEL[r.type] ?? "connected with",
      note: r.note,
      other: r.toEntity,
    })),
    ...entity.relationsTo.map((r) => ({
      id: r.id,
      label: `${RELATION_LABEL[r.type] ?? "connected with"} (reverse)`,
      note: r.note,
      other: r.fromEntity,
    })),
  ];

  return (
    <div className="container-page space-y-8">
      <Link href="/search" className="link-muted text-sm">
        ← Back to search
      </Link>

      {/* Header */}
      <header className="card overflow-hidden">
        {entity.isBlacklisted && (
          <div className="flex items-start gap-3 border-b border-danger/30 bg-danger/10 px-6 py-4">
            <BanIcon className="mt-0.5 shrink-0 text-danger" />
            <div>
              <p className="font-semibold text-red-200">Blacklisted</p>
              {entity.blacklistReason && (
                <p className="mt-0.5 text-sm text-red-200/80">
                  {entity.blacklistReason}
                </p>
              )}
            </div>
          </div>
        )}
        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
          <EntityAvatar
            name={entity.name}
            type={entity.type}
            avatarUrl={entity.avatarUrl}
            size={88}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-100">{entity.name}</h1>
              <TypeBadge type={entity.type} />
              {entity.isBlacklisted && <BlacklistBadge />}
            </div>
            {entity.headline && (
              <p className="mt-1 text-muted">{entity.headline}</p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <StarRatingDisplay
                value={entity.ratingAvg}
                count={entity.ratingCount}
                size={18}
              />
              {entity.location && (
                <span className="text-sm text-muted">📍 {entity.location}</span>
              )}
              {entity.website && (
                <a
                  href={entity.website}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-brand-soft hover:underline"
                >
                  <LinkIcon width={14} height={14} /> Website
                </a>
              )}
            </div>
          </div>
          <Link href={`/submit?entity=${entity.slug}`} className="btn-primary">
            <PlusIcon width={16} height={16} /> Add review
          </Link>
        </div>

        {entity.description && (
          <div className="border-t border-line px-6 py-5">
            <p className="whitespace-pre-line text-sm leading-relaxed text-slate-300">
              {entity.description}
            </p>
            {(entity.aliases || entity.registrationNo) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {entity.aliases && (
                  <span className="chip">Aliases: {entity.aliases}</span>
                )}
                {entity.registrationNo && (
                  <span className="chip">Reg. no: {entity.registrationNo}</span>
                )}
              </div>
            )}
          </div>
        )}
      </header>

      {isAdmin && (
        <AdminEntityTools
          entityId={entity.id}
          isBlacklisted={entity.isBlacklisted}
          blacklistReason={entity.blacklistReason}
        />
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left column: reviews + news */}
        <div className="space-y-8 lg:col-span-2">
          {/* News / events */}
          {entity.news.length > 0 && (
            <section>
              <h2 className="section-title mb-4 flex items-center gap-2">
                <NewsIcon className="text-brand-soft" /> Events & news
              </h2>
              <ol className="relative space-y-4 border-l border-line pl-6">
                {entity.news.map((n) => (
                  <li key={n.id} className="relative">
                    <span className="absolute -left-[1.65rem] top-1.5 h-3 w-3 rounded-full bg-brand ring-4 ring-bg" />
                    <div className="card p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs text-muted">
                            {formatDate(n.eventDate)}
                          </p>
                          <h3 className="mt-0.5 font-semibold text-slate-100">
                            {n.title}
                          </h3>
                        </div>
                        {isAdmin && (
                          <ActionButton
                            action={deleteNewsAction.bind(null, n.id)}
                            confirm="Delete this event?"
                            className="text-muted hover:text-red-300"
                          >
                            <XIcon width={16} height={16} />
                          </ActionButton>
                        )}
                      </div>
                      <p className="mt-2 whitespace-pre-line text-sm text-slate-300">
                        {n.body}
                      </p>
                      {n.sourceUrl && (
                        <a
                          href={n.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-sm text-brand-soft hover:underline"
                        >
                          <LinkIcon width={14} height={14} /> Source
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* Reviews */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="section-title flex items-center gap-2">
                <StarIcon className="text-amber-400" /> Reviews
                <span className="text-sm font-normal text-muted">
                  ({entity.ratingCount})
                </span>
              </h2>
            </div>
            {entity.reviews.length === 0 ? (
              <EmptyState
                icon={<StarIcon />}
                title="No reviews yet"
                description="Be the first to share verified information about this card."
                actionHref={`/submit?entity=${entity.slug}`}
                actionLabel="Add the first review"
              />
            ) : (
              <div className="space-y-4">
                {entity.reviews.map((r) => (
                  <ReviewItem key={r.id} review={serialize(r)} isAdmin={isAdmin} />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right column: connections */}
        <aside className="space-y-6">
          <section className="card p-5">
            <h2 className="section-title mb-4 flex items-center gap-2 text-base">
              <LinkIcon className="text-brand-soft" width={18} height={18} />
              Connections
            </h2>
            {connections.length === 0 ? (
              <p className="text-sm text-muted">
                No known connections recorded yet.
              </p>
            ) : (
              <ul className="space-y-3">
                {connections.map((c) => (
                  <li key={c.id}>
                    <p className="mb-1 text-xs text-muted">{c.label}</p>
                    <EntityCard entity={c.other} />
                    {c.note && (
                      <p className="mt-1 text-xs text-muted">{c.note}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="card bg-gradient-to-br from-brand/10 to-transparent p-5 text-sm text-muted">
            <p className="font-medium text-slate-200">Spotted something wrong?</p>
            <p className="mt-1">
              Reviews are moderated. If information here is inaccurate, submit a
              review with evidence and our admins will look into it.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
