"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { submitReviewAction } from "@/lib/actions/reviews";
import { StarRatingInput } from "./StarRating";
import { EntityAvatar } from "./Avatar";
import {
  BuildingIcon,
  DocIcon,
  ImageIcon,
  LinkIcon,
  PlusIcon,
  SearchIcon,
  UploadIcon,
  UserIcon,
  XIcon,
} from "./icons";

interface EntityLite {
  id?: string;
  slug?: string;
  name: string;
  type: "COMPANY" | "SPECIALIST";
  headline?: string | null;
  avatarUrl?: string | null;
}

interface SearchHit {
  slug: string;
  name: string;
  type: "COMPANY" | "SPECIALIST";
  headline?: string | null;
  avatarUrl?: string | null;
  ratingAvg: number;
  ratingCount: number;
}

export function SubmitForm({
  initialEntity,
  initialQuery,
}: {
  initialEntity?: (EntityLite & { id: string }) | null;
  initialQuery?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");

  const [mode, setMode] = useState<"existing" | "new">(
    initialEntity ? "existing" : "new"
  );

  // Existing-entity search
  const [selected, setSelected] = useState<{ id: string; name: string; type: "COMPANY" | "SPECIALIST"; avatarUrl?: string | null } | null>(
    initialEntity ? { id: initialEntity.id, name: initialEntity.name, type: initialEntity.type, avatarUrl: initialEntity.avatarUrl } : null
  );
  const [query, setQuery] = useState(initialQuery ?? "");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();

  // New-entity fields
  const [newType, setNewType] = useState<"COMPANY" | "SPECIALIST">("SPECIALIST");
  const [newName, setNewName] = useState(
    !initialEntity && initialQuery ? initialQuery : ""
  );

  // Mentions
  const [mentions, setMentions] = useState<{ name: string; note: string }[]>([]);
  // Evidence
  const [files, setFiles] = useState<File[]>([]);
  const [links, setLinks] = useState<string[]>([]);
  const [linkDraft, setLinkDraft] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debounced search
  useEffect(() => {
    if (mode !== "existing" || selected) return;
    if (!query.trim()) {
      setHits([]);
      return;
    }
    setSearching(true);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        setHits(data.results ?? []);
      } catch {
        setHits([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(searchTimer.current);
  }, [query, mode, selected]);

  async function pickHit(hit: SearchHit) {
    // Need the id; fetch it from a lightweight endpoint via slug.
    try {
      const res = await fetch(`/api/entity/${hit.slug}/id`);
      const data = await res.json();
      if (data.id) {
        setSelected({ id: data.id, name: hit.name, type: hit.type, avatarUrl: hit.avatarUrl });
      }
    } catch {
      setError("Could not select that entity, please try again.");
    }
  }

  function onFiles(list: FileList | null) {
    if (!list) return;
    setFiles((prev) => [...prev, ...Array.from(list)].slice(0, 10));
  }

  function addLink() {
    const u = linkDraft.trim();
    if (/^https?:\/\//i.test(u)) {
      setLinks((prev) => [...prev, u]);
      setLinkDraft("");
    } else {
      setError("Links must start with http:// or https://");
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const fd = new FormData();
    fd.set("mode", mode);
    if (mode === "existing") {
      if (!selected) {
        setError("Please choose a company or specialist first.");
        return;
      }
      fd.set("entityId", selected.id);
    } else {
      if (newName.trim().length < 2) {
        setError("Please enter the name of the company or specialist.");
        return;
      }
      fd.set("newEntityType", newType);
      fd.set("newEntityName", newName.trim());
      const headline = (document.getElementById("newEntityHeadline") as HTMLInputElement)?.value ?? "";
      const location = (document.getElementById("newEntityLocation") as HTMLInputElement)?.value ?? "";
      fd.set("newEntityHeadline", headline);
      fd.set("newEntityLocation", location);
    }

    const form = e.target as HTMLFormElement;
    fd.set("rating", (form.elements.namedItem("rating") as HTMLInputElement).value);
    fd.set("title", (form.elements.namedItem("title") as HTMLInputElement).value);
    fd.set("body", (form.elements.namedItem("body") as HTMLTextAreaElement).value);
    fd.set("mentions", JSON.stringify(mentions.filter((m) => m.name.trim())));
    fd.set("evidenceLinks", JSON.stringify(links));
    files.forEach((f) => fd.append("files", f));

    start(async () => {
      const res = await submitReviewAction(fd);
      if (res.ok && res.redirect) {
        router.push(res.redirect);
      } else {
        setError(res.error ?? "Something went wrong.");
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* Step 1: target */}
      <section className="card p-6">
        <h2 className="section-title mb-1">1. Who is this review about?</h2>
        <p className="mb-4 text-sm text-muted">
          Choose an existing card, or add someone new — admins will review the
          new card before it goes live.
        </p>

        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => setMode("existing")}
            className={clsx(
              "flex-1 rounded-xl border px-4 py-3 text-sm font-medium transition",
              mode === "existing"
                ? "border-brand bg-brand/15 text-brand-soft"
                : "border-line bg-bg-soft/60 text-muted hover:text-slate-200"
            )}
          >
            <SearchIcon className="mx-auto mb-1" /> Already in the base
          </button>
          <button
            type="button"
            onClick={() => setMode("new")}
            className={clsx(
              "flex-1 rounded-xl border px-4 py-3 text-sm font-medium transition",
              mode === "new"
                ? "border-brand bg-brand/15 text-brand-soft"
                : "border-line bg-bg-soft/60 text-muted hover:text-slate-200"
            )}
          >
            <PlusIcon className="mx-auto mb-1" /> Not in the base yet
          </button>
        </div>

        {mode === "existing" ? (
          selected ? (
            <div className="flex items-center gap-3 rounded-xl border border-brand/40 bg-brand/10 p-3">
              <EntityAvatar name={selected.name} type={selected.type} avatarUrl={selected.avatarUrl} size={44} />
              <div className="flex-1">
                <p className="font-medium text-slate-100">{selected.name}</p>
                <p className="text-xs text-muted">
                  {selected.type === "COMPANY" ? "Company" : "Specialist"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="btn-ghost px-2"
              >
                <XIcon width={16} height={16} />
              </button>
            </div>
          ) : (
            <div>
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" width={18} height={18} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name…"
                  className="input pl-11"
                />
              </div>
              {searching && <p className="mt-2 text-xs text-muted">Searching…</p>}
              {hits.length > 0 && (
                <ul className="mt-2 divide-y divide-line overflow-hidden rounded-xl border border-line">
                  {hits.map((h) => (
                    <li key={h.slug}>
                      <button
                        type="button"
                        onClick={() => pickHit(h)}
                        className="flex w-full items-center gap-3 bg-bg-soft/40 px-3 py-2.5 text-left hover:bg-bg-elev"
                      >
                        <EntityAvatar name={h.name} type={h.type} avatarUrl={h.avatarUrl} size={36} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-100">{h.name}</p>
                          <p className="truncate text-xs text-muted">
                            {h.type === "COMPANY" ? "Company" : "Specialist"}
                            {h.headline ? ` · ${h.headline}` : ""}
                          </p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {query.trim() && !searching && hits.length === 0 && (
                <div className="mt-2 rounded-xl border border-line bg-bg-soft/40 p-3 text-sm text-muted">
                  No card found.{" "}
                  <button
                    type="button"
                    className="text-brand-soft hover:underline"
                    onClick={() => {
                      setMode("new");
                      setNewName(query);
                    }}
                  >
                    Add “{query.trim()}” as a new card →
                  </button>
                </div>
              )}
            </div>
          )
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2">
              {(["SPECIALIST", "COMPANY"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setNewType(t)}
                  className={clsx(
                    "flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition",
                    newType === t
                      ? "border-brand bg-brand/15 text-brand-soft"
                      : "border-line bg-bg-soft/60 text-muted hover:text-slate-200"
                  )}
                >
                  {t === "COMPANY" ? <BuildingIcon width={16} height={16} /> : <UserIcon width={16} height={16} />}
                  {t === "COMPANY" ? "Company" : "Specialist"}
                </button>
              ))}
            </div>
            <div>
              <label className="label">Name *</label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={newType === "COMPANY" ? "e.g. Acme Holdings LLC" : "e.g. John Doe"}
                className="input"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Role / industry (optional)</label>
                <input id="newEntityHeadline" className="input" placeholder="e.g. Investment broker" />
              </div>
              <div>
                <label className="label">Location (optional)</label>
                <input id="newEntityLocation" className="input" placeholder="e.g. Dubai, UAE" />
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Step 2: the review */}
      <section className="card p-6">
        <h2 className="section-title mb-4">2. Your review</h2>
        <div className="space-y-4">
          <div>
            <label className="label">Rating *</label>
            <StarRatingInput name="rating" />
          </div>
          <div>
            <label className="label">Title *</label>
            <input name="title" required maxLength={160} className="input" placeholder="Sum up your experience in one line" />
          </div>
          <div>
            <label className="label">Details *</label>
            <textarea
              name="body"
              required
              rows={6}
              maxLength={6000}
              className="input"
              placeholder="Describe what happened, with as much factual detail as possible. What did they do? When? What was the outcome?"
            />
            <p className="mt-1 text-xs text-muted">
              Minimum 20 characters. Stick to facts you can back up with evidence.
            </p>
          </div>
        </div>
      </section>

      {/* Step 3: connections */}
      <section className="card p-6">
        <h2 className="section-title mb-1">3. Who are they connected with?</h2>
        <p className="mb-4 text-sm text-muted">
          Name people or companies involved (optional but helpful).
        </p>
        <div className="space-y-2">
          {mentions.map((m, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={m.name}
                onChange={(e) => {
                  const copy = [...mentions];
                  copy[i].name = e.target.value;
                  setMentions(copy);
                }}
                placeholder="Name"
                className="input flex-1"
              />
              <input
                value={m.note}
                onChange={(e) => {
                  const copy = [...mentions];
                  copy[i].note = e.target.value;
                  setMentions(copy);
                }}
                placeholder="How they're connected (optional)"
                className="input flex-1"
              />
              <button
                type="button"
                onClick={() => setMentions(mentions.filter((_, x) => x !== i))}
                className="btn-ghost px-2"
              >
                <XIcon width={16} height={16} />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setMentions([...mentions, { name: "", note: "" }])}
          className="btn-ghost mt-3"
        >
          <PlusIcon width={16} height={16} /> Add connection
        </button>
      </section>

      {/* Step 4: evidence */}
      <section className="card p-6">
        <h2 className="section-title mb-1">4. Evidence *</h2>
        <p className="mb-4 text-sm text-muted">
          Attach at least one screenshot, document or link. This is required —
          reviews without proof are rejected.
        </p>

        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            onFiles(e.dataTransfer.files);
          }}
          className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-line bg-bg-soft/40 px-6 py-8 text-center transition hover:border-brand/50"
        >
          <UploadIcon className="text-brand-soft" />
          <p className="text-sm text-slate-200">
            Click to upload or drag & drop
          </p>
          <p className="text-xs text-muted">
            Images (PNG, JPG, WEBP, GIF) or documents (PDF, DOC, TXT) · max 10 MB each
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.txt"
            className="hidden"
            onChange={(e) => onFiles(e.target.files)}
          />
        </div>

        {files.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {files.map((f, i) => (
              <span key={i} className="chip">
                {f.type.startsWith("image/") ? (
                  <ImageIcon width={14} height={14} />
                ) : (
                  <DocIcon width={14} height={14} />
                )}
                <span className="max-w-[10rem] truncate">{f.name}</span>
                <button
                  type="button"
                  onClick={() => setFiles(files.filter((_, x) => x !== i))}
                  className="text-muted hover:text-red-300"
                >
                  <XIcon width={12} height={12} />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="mt-4">
          <label className="label">Or add a link as evidence</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <LinkIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" width={16} height={16} />
              <input
                value={linkDraft}
                onChange={(e) => setLinkDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addLink();
                  }
                }}
                placeholder="https://…"
                className="input pl-10"
              />
            </div>
            <button type="button" onClick={addLink} className="btn-ghost">
              Add
            </button>
          </div>
          {links.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {links.map((l, i) => (
                <span key={i} className="chip">
                  <LinkIcon width={14} height={14} />
                  <span className="max-w-[12rem] truncate">{l}</span>
                  <button
                    type="button"
                    onClick={() => setLinks(links.filter((_, x) => x !== i))}
                    className="text-muted hover:text-red-300"
                  >
                    <XIcon width={12} height={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <p className="text-xs text-muted">
          By submitting, you confirm the information is truthful. False reports
          can lead to a ban.
        </p>
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Submitting…" : "Submit for review"}
        </button>
      </div>
    </form>
  );
}
