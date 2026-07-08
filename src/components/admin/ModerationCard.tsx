"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { moderateReviewAction } from "@/lib/actions/admin";
import { EntityAvatar } from "@/components/Avatar";
import { StarRatingDisplay } from "@/components/StarRating";
import { EvidenceGallery, type EvidenceItem } from "@/components/Evidence";
import { TypeBadge } from "@/components/Badges";
import { CheckIcon, XIcon } from "@/components/icons";

interface ModReview {
  id: string;
  rating: number;
  title: string;
  body: string;
  createdEntity: boolean;
  createdAt: string | Date;
  author: { firstName?: string | null; lastName?: string | null; username?: string | null; photoUrl?: string | null };
  entity: { name: string; slug: string; type: "COMPANY" | "SPECIALIST"; avatarUrl?: string | null; status: string };
  evidence: EvidenceItem[];
  mentions: { id: string; name: string; note?: string | null }[];
}

function authorName(a: ModReview["author"]) {
  const full = [a.firstName, a.lastName].filter(Boolean).join(" ");
  return full || (a.username ? `@${a.username}` : "Telegram user");
}

export function ModerationCard({ review }: { review: ModReview }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [showReject, setShowReject] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  function decide(decision: "APPROVE" | "REJECT") {
    setError("");
    start(async () => {
      const res = await moderateReviewAction(review.id, decision, note);
      if (res.ok) router.refresh();
      else setError(res.error ?? "Failed.");
    });
  }

  return (
    <article className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <EntityAvatar name={review.entity.name} type={review.entity.type} avatarUrl={review.entity.avatarUrl} size={44} />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-100">{review.entity.name}</span>
              <TypeBadge type={review.entity.type} />
              {review.createdEntity && (
                <span className="badge-warn">New card</span>
              )}
            </div>
            <p className="text-xs text-muted">
              by {authorName(review.author)}
            </p>
          </div>
        </div>
        <StarRatingDisplay value={review.rating} size={16} />
      </div>

      <h3 className="mt-4 font-semibold text-slate-100">{review.title}</h3>
      <p className="mt-1.5 whitespace-pre-line text-sm text-slate-300">{review.body}</p>

      {review.mentions.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {review.mentions.map((m) => (
            <span key={m.id} className="chip" title={m.note ?? undefined}>
              {m.name}
            </span>
          ))}
        </div>
      )}

      <EvidenceGallery items={review.evidence} />

      {error && <p className="mt-3 text-sm text-red-300">{error}</p>}

      {showReject && (
        <div className="mt-4 space-y-2 border-t border-line pt-4">
          <label className="label">Reason for rejection (shown to author)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="input"
            placeholder="e.g. Evidence doesn't support the claim."
          />
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
        <button className="btn-ok" disabled={pending} onClick={() => decide("APPROVE")}>
          <CheckIcon width={16} height={16} /> Approve
          {review.createdEntity ? " (+ publish card)" : ""}
        </button>
        {showReject ? (
          <button className="btn-danger" disabled={pending} onClick={() => decide("REJECT")}>
            <XIcon width={16} height={16} /> Confirm reject
          </button>
        ) : (
          <button className="btn-ghost" onClick={() => setShowReject(true)}>
            <XIcon width={16} height={16} /> Reject
          </button>
        )}
        {review.entity.status === "APPROVED" && (
          <Link href={`/entity/${review.entity.slug}`} className="link-muted ml-auto text-sm">
            View card →
          </Link>
        )}
      </div>
    </article>
  );
}
