import Link from "next/link";
import clsx from "clsx";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { EntityAvatar } from "@/components/Avatar";
import { StatusBadge, TypeBadge, BlacklistBadge } from "@/components/Badges";
import { ActionButton } from "@/components/ActionButton";
import { setEntityStatusAction } from "@/lib/actions/admin";
import { PlusIcon } from "@/components/icons";

export const metadata = { title: "Cards" };
export const dynamic = "force-dynamic";

const tabs = [
  { key: "PENDING", label: "Pending" },
  { key: "APPROVED", label: "Approved" },
  { key: "REJECTED", label: "Rejected" },
  { key: "ALL", label: "All" },
] as const;

export default async function AdminEntitiesPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string };
}) {
  const status = (
    ["PENDING", "APPROVED", "REJECTED", "ALL"].includes(searchParams.status ?? "")
      ? searchParams.status
      : "PENDING"
  ) as "PENDING" | "APPROVED" | "REJECTED" | "ALL";
  const q = searchParams.q?.trim() ?? "";

  const where: Prisma.EntityWhereInput = {
    ...(status !== "ALL" ? { status } : {}),
    ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
  };

  const entities = await prisma.entity.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { _count: { select: { reviews: true, news: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cards</h1>
          <p className="mt-1 text-sm text-muted">
            Manage companies and specialists. Approve user-proposed cards here.
          </p>
        </div>
        <Link href="/admin/entities/new" className="btn-primary">
          <PlusIcon width={16} height={16} /> New card
        </Link>
      </div>

      <div className="flex items-center gap-2">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/admin/entities?status=${t.key}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            className={clsx(
              "rounded-lg px-3.5 py-1.5 text-sm font-medium transition",
              status === t.key
                ? "bg-brand text-white"
                : "border border-line bg-bg-soft/60 text-muted hover:text-slate-200"
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {entities.length === 0 ? (
        <div className="card p-10 text-center text-muted">No cards found.</div>
      ) : (
        <div className="space-y-2">
          {entities.map((e) => (
            <div key={e.id} className="card flex flex-wrap items-center gap-4 p-4">
              <EntityAvatar name={e.name} type={e.type} avatarUrl={e.avatarUrl} size={44} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-slate-100">{e.name}</span>
                  <TypeBadge type={e.type} />
                  <StatusBadge status={e.status} />
                  {e.isBlacklisted && <BlacklistBadge />}
                </div>
                <p className="mt-0.5 text-xs text-muted">
                  {e._count.reviews} review{e._count.reviews === 1 ? "" : "s"} ·{" "}
                  {e._count.news} event{e._count.news === 1 ? "" : "s"}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {e.status === "PENDING" && (
                  <>
                    <ActionButton
                      action={setEntityStatusAction.bind(null, e.id, "APPROVED")}
                      className="btn-ok"
                    >
                      Approve
                    </ActionButton>
                    <ActionButton
                      action={setEntityStatusAction.bind(null, e.id, "REJECTED")}
                      className="btn-ghost"
                    >
                      Reject
                    </ActionButton>
                  </>
                )}
                {e.status === "APPROVED" && (
                  <Link href={`/entity/${e.slug}`} className="btn-ghost">
                    View
                  </Link>
                )}
                <Link href={`/admin/entities/${e.id}/edit`} className="btn-ghost">
                  Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
