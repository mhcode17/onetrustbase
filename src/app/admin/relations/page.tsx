import Link from "next/link";
import { prisma } from "@/lib/db";
import { RelationForm } from "@/components/admin/RelationForm";
import { ActionButton } from "@/components/ActionButton";
import { deleteRelationAction } from "@/lib/actions/admin";
import { RELATION_LABEL } from "@/lib/format";
import { XIcon } from "@/components/icons";

export const metadata = { title: "Connections" };
export const dynamic = "force-dynamic";

export default async function AdminRelationsPage() {
  const relations = await prisma.entityRelation.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      fromEntity: { select: { name: true, slug: true } },
      toEntity: { select: { name: true, slug: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Connections</h1>
        <p className="mt-1 text-sm text-muted">
          Link specialists to companies and map who is associated with whom.
          Connections appear on both cards.
        </p>
      </div>

      <RelationForm />

      <div>
        <h2 className="section-title mb-3">Existing connections</h2>
        {relations.length === 0 ? (
          <div className="card p-8 text-center text-muted">No connections yet.</div>
        ) : (
          <div className="space-y-2">
            {relations.map((r) => (
              <div key={r.id} className="card flex items-center gap-3 p-4 text-sm">
                <Link href={`/entity/${r.fromEntity.slug}`} className="font-medium text-slate-100 hover:text-brand-soft">
                  {r.fromEntity.name}
                </Link>
                <span className="text-muted">{RELATION_LABEL[r.type]}</span>
                <Link href={`/entity/${r.toEntity.slug}`} className="font-medium text-slate-100 hover:text-brand-soft">
                  {r.toEntity.name}
                </Link>
                {r.note && <span className="text-xs text-muted">· {r.note}</span>}
                <ActionButton
                  action={deleteRelationAction.bind(null, r.id)}
                  confirm="Delete this connection?"
                  className="ml-auto text-muted hover:text-red-300"
                >
                  <XIcon width={16} height={16} />
                </ActionButton>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
