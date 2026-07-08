"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { upsertEntityAction } from "@/lib/actions/admin";
import { BuildingIcon, UserIcon } from "@/components/icons";

interface EntityValues {
  id?: string;
  type?: "COMPANY" | "SPECIALIST";
  name?: string;
  headline?: string | null;
  description?: string | null;
  location?: string | null;
  website?: string | null;
  avatarUrl?: string | null;
  registrationNo?: string | null;
  aliases?: string | null;
}

export function EntityForm({ entity }: { entity?: EntityValues }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [type, setType] = useState<"COMPANY" | "SPECIALIST">(
    entity?.type ?? "SPECIALIST"
  );

  function submit(fd: FormData) {
    setError("");
    fd.set("type", type);
    if (entity?.id) fd.set("id", entity.id);
    start(async () => {
      const res = await upsertEntityAction(fd);
      if (res.ok && res.redirect) router.push(res.redirect);
      else if (res.ok) router.push("/admin/entities");
      else setError(res.error ?? "Failed to save.");
    });
  }

  return (
    <form action={submit} className="card space-y-4 p-6">
      <div>
        <label className="label">Type</label>
        <div className="flex gap-2">
          {(["SPECIALIST", "COMPANY"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={clsx(
                "flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition",
                type === t
                  ? "border-brand bg-brand/15 text-brand-soft"
                  : "border-line bg-bg-soft/60 text-muted hover:text-slate-200"
              )}
            >
              {t === "COMPANY" ? <BuildingIcon width={16} height={16} /> : <UserIcon width={16} height={16} />}
              {t === "COMPANY" ? "Company" : "Specialist"}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label">Name *</label>
        <input name="name" required defaultValue={entity?.name ?? ""} className="input" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Headline / role</label>
          <input name="headline" defaultValue={entity?.headline ?? ""} className="input" placeholder="e.g. Investment broker" />
        </div>
        <div>
          <label className="label">Location</label>
          <input name="location" defaultValue={entity?.location ?? ""} className="input" />
        </div>
      </div>

      <div>
        <label className="label">Description</label>
        <textarea name="description" rows={4} defaultValue={entity?.description ?? ""} className="input" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Website</label>
          <input name="website" defaultValue={entity?.website ?? ""} className="input" placeholder="https://…" />
        </div>
        <div>
          <label className="label">Avatar URL</label>
          <input name="avatarUrl" defaultValue={entity?.avatarUrl ?? ""} className="input" placeholder="https://…/photo.jpg" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">
            {type === "COMPANY" ? "Registration number" : "Registration / ID"}
          </label>
          <input name="registrationNo" defaultValue={entity?.registrationNo ?? ""} className="input" />
        </div>
        <div>
          <label className="label">Aliases (comma separated)</label>
          <input name="aliases" defaultValue={entity?.aliases ?? ""} className="input" placeholder="e.g. Johnny D, J. Doe" />
        </div>
      </div>

      {error && <p className="text-sm text-red-300">{error}</p>}

      <div className="flex gap-2">
        <button className="btn-primary" disabled={pending}>
          {pending ? "Saving…" : entity?.id ? "Save changes" : "Create card"}
        </button>
        <button type="button" onClick={() => router.back()} className="btn-ghost">
          Cancel
        </button>
      </div>
    </form>
  );
}
