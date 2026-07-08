import Link from "next/link";
import { EntityAvatar } from "./Avatar";
import { StarRatingDisplay } from "./StarRating";
import { BlacklistBadge, TypeBadge } from "./Badges";
import { ChevronRight } from "./icons";

export interface EntityCardData {
  slug: string;
  name: string;
  type: "COMPANY" | "SPECIALIST";
  headline?: string | null;
  location?: string | null;
  avatarUrl?: string | null;
  isBlacklisted: boolean;
  ratingAvg: number;
  ratingCount: number;
}

export function EntityCard({ entity }: { entity: EntityCardData }) {
  return (
    <Link
      href={`/entity/${entity.slug}`}
      className="card card-hover group flex items-center gap-4 p-4 animate-fade-in"
    >
      <EntityAvatar
        name={entity.name}
        type={entity.type}
        avatarUrl={entity.avatarUrl}
        size={56}
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate text-base font-semibold text-slate-100">
            {entity.name}
          </h3>
          <TypeBadge type={entity.type} />
          {entity.isBlacklisted && <BlacklistBadge />}
        </div>
        {entity.headline && (
          <p className="mt-0.5 truncate text-sm text-muted">{entity.headline}</p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <StarRatingDisplay
            value={entity.ratingAvg}
            count={entity.ratingCount}
          />
          {entity.location && (
            <span className="text-xs text-muted">· {entity.location}</span>
          )}
        </div>
      </div>
      <ChevronRight className="text-muted transition group-hover:translate-x-0.5 group-hover:text-brand-soft" />
    </Link>
  );
}
