import Link from "next/link";
import { EntityForm } from "@/components/admin/EntityForm";

export const metadata = { title: "New card" };
export const dynamic = "force-dynamic";

export default function NewEntityPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/entities" className="link-muted text-sm">
          ← Cards
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Create a card</h1>
        <p className="mt-1 text-sm text-muted">
          Cards you create here are published immediately.
        </p>
      </div>
      <EntityForm />
    </div>
  );
}
