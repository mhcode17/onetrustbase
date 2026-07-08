import Link from "next/link";
import { SearchBar } from "@/components/SearchBar";
import { EntityCard } from "@/components/EntityCard";
import { EmptyState } from "@/components/EmptyState";
import { searchEntities } from "@/lib/queries";
import { SearchIcon } from "@/components/icons";
import clsx from "clsx";

export const metadata = { title: "Search" };
export const dynamic = "force-dynamic";

const filters = [
  { key: "ALL", label: "All" },
  { key: "COMPANY", label: "Companies" },
  { key: "SPECIALIST", label: "Specialists" },
] as const;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string; type?: string };
}) {
  const q = searchParams.q?.trim() ?? "";
  const type = (
    ["ALL", "COMPANY", "SPECIALIST"].includes(searchParams.type ?? "")
      ? searchParams.type
      : "ALL"
  ) as "ALL" | "COMPANY" | "SPECIALIST";

  let results: Awaited<ReturnType<typeof searchEntities>> = [];
  let dbError = false;
  try {
    results = await searchEntities({ q, type });
  } catch {
    dbError = true;
  }

  function filterHref(key: string) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (key !== "ALL") params.set("type", key);
    const s = params.toString();
    return `/search${s ? `?${s}` : ""}`;
  }

  return (
    <div className="container-page space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Search</h1>
        <p className="mt-1 text-sm text-muted">
          Find companies and specialists. Only admin-approved cards are shown.
        </p>
      </div>

      <SearchBar defaultValue={q} autoFocus />

      <div className="flex items-center gap-2">
        {filters.map((f) => (
          <Link
            key={f.key}
            href={filterHref(f.key)}
            className={clsx(
              "rounded-lg px-3.5 py-1.5 text-sm font-medium transition",
              type === f.key
                ? "bg-brand text-white"
                : "border border-line bg-bg-soft/60 text-muted hover:text-slate-200"
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {dbError ? (
        <EmptyState
          icon={<SearchIcon />}
          title="Database not reachable"
          description="Could not query the database. Make sure PostgreSQL is running and migrations were applied (see README)."
        />
      ) : results.length === 0 ? (
        <EmptyState
          icon={<SearchIcon />}
          title={q ? `No results for “${q}”` : "Nothing here yet"}
          description={
            q
              ? "Not in the base yet? You can add the first review and propose a new card."
              : "Try searching for a company or specialist by name."
          }
          actionHref={q ? `/submit?q=${encodeURIComponent(q)}` : "/submit"}
          actionLabel="Add a review"
        />
      ) : (
        <>
          <p className="text-sm text-muted">
            {results.length} result{results.length === 1 ? "" : "s"}
            {q && (
              <>
                {" "}
                for <span className="text-slate-200">“{q}”</span>
              </>
            )}
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            {results.map((e) => (
              <EntityCard key={e.slug} entity={e} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
