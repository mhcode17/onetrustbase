import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { EntityForm } from "@/components/admin/EntityForm";
import { StatusBadge } from "@/components/Badges";

export const metadata = { title: "Edit card" };
export const dynamic = "force-dynamic";

export default async function EditEntityPage({
  params,
}: {
  params: { id: string };
}) {
  const entity = await prisma.entity.findUnique({ where: { id: params.id } });
  if (!entity) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/entities" className="link-muted text-sm">
          ← Cards
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-2xl font-bold">Edit “{entity.name}”</h1>
          <StatusBadge status={entity.status} />
        </div>
      </div>
      <EntityForm
        entity={{
          id: entity.id,
          type: entity.type,
          name: entity.name,
          headline: entity.headline,
          description: entity.description,
          location: entity.location,
          website: entity.website,
          avatarUrl: entity.avatarUrl,
          registrationNo: entity.registrationNo,
          aliases: entity.aliases,
        }}
      />
    </div>
  );
}
