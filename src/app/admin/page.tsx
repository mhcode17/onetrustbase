import { prisma } from "@/lib/db";
import { serialize } from "@/lib/format";
import { ModerationCard } from "@/components/admin/ModerationCard";
import { EmptyState } from "@/components/EmptyState";
import { CheckIcon, ClockIcon, StarIcon } from "@/components/icons";

export const metadata = { title: "Moderation" };
export const dynamic = "force-dynamic";

export default async function AdminModerationPage() {
  const [pending, approvedCount, rejectedCount, pendingCards] = await Promise.all([
    prisma.review.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      include: {
        author: { select: { firstName: true, lastName: true, username: true, photoUrl: true } },
        entity: { select: { name: true, slug: true, type: true, avatarUrl: true, status: true } },
        evidence: true,
        mentions: true,
      },
    }),
    prisma.review.count({ where: { status: "APPROVED" } }),
    prisma.review.count({ where: { status: "REJECTED" } }),
    prisma.entity.count({ where: { status: "PENDING" } }),
  ]);

  const stats = [
    { label: "Pending reviews", value: pending.length, icon: ClockIcon, tone: "text-amber-300" },
    { label: "New cards awaiting", value: pendingCards, icon: StarIcon, tone: "text-brand-soft" },
    { label: "Approved", value: approvedCount, icon: CheckIcon, tone: "text-green-300" },
    { label: "Rejected", value: rejectedCount, icon: ClockIcon, tone: "text-red-300" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Moderation queue</h1>
        <p className="mt-1 text-sm text-muted">
          Approve or reject submitted reviews. Approving a review that proposed a
          new card also publishes that card.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card flex items-center gap-3 p-4">
            <s.icon className={s.tone} />
            <div>
              <div className="text-xl font-bold text-slate-100">{s.value}</div>
              <div className="text-xs text-muted">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {pending.length === 0 ? (
        <EmptyState
          icon={<CheckIcon />}
          title="All caught up"
          description="There are no reviews waiting for moderation right now."
        />
      ) : (
        <div className="space-y-4">
          {pending.map((r) => (
            <ModerationCard key={r.id} review={serialize(r)} />
          ))}
        </div>
      )}
    </div>
  );
}
