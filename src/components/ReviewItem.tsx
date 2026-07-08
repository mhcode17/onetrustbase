import Link from "next/link";
import { UserAvatar } from "./Avatar";
import { StarRatingDisplay } from "./StarRating";
import { EvidenceGallery, type EvidenceItem } from "./Evidence";
import { LinkIcon } from "./icons";
import { displayName, timeAgo } from "@/lib/format";

export interface ReviewItemData {
  id: string;
  rating: number;
  title: string;
  body: string;
  createdAt: string | Date;
  author: {
    firstName?: string | null;
    lastName?: string | null;
    username?: string | null;
    photoUrl?: string | null;
  };
  evidence: EvidenceItem[];
  mentions: {
    id: string;
    name: string;
    note?: string | null;
    linkedEntity?: { slug: string; name: string; type: string } | null;
  }[];
}

export function ReviewItem({ review }: { review: ReviewItemData }) {
  return (
    <article className="card p-5 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <UserAvatar
            name={displayName(review.author)}
            photoUrl={review.author.photoUrl}
            size={40}
          />
          <div>
            <p className="text-sm font-medium text-slate-100">
              {displayName(review.author)}
            </p>
            <p className="text-xs text-muted">{timeAgo(review.createdAt)}</p>
          </div>
        </div>
        <StarRatingDisplay value={review.rating} size={16} />
      </div>

      <h3 className="mt-4 text-base font-semibold text-slate-100">
        {review.title}
      </h3>
      <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-slate-300">
        {review.body}
      </p>

      {review.mentions.length > 0 && (
        <div className="mt-3">
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted">
            Connected with
          </p>
          <div className="flex flex-wrap gap-2">
            {review.mentions.map((m) =>
              m.linkedEntity ? (
                <Link
                  key={m.id}
                  href={`/entity/${m.linkedEntity.slug}`}
                  className="chip hover:border-brand/40"
                  title={m.note ?? undefined}
                >
                  <LinkIcon width={14} height={14} /> {m.linkedEntity.name}
                </Link>
              ) : (
                <span key={m.id} className="chip" title={m.note ?? undefined}>
                  {m.name}
                </span>
              )
            )}
          </div>
        </div>
      )}

      <EvidenceGallery items={review.evidence} />
    </article>
  );
}
