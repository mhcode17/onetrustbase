"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  toggleBlacklistAction,
  addNewsAction,
  deleteEntityAction,
} from "@/lib/actions/admin";
import { BanIcon, NewsIcon, ShieldIcon, XIcon } from "./icons";

export function AdminEntityTools({
  entityId,
  isBlacklisted,
  blacklistReason,
}: {
  entityId: string;
  isBlacklisted: boolean;
  blacklistReason?: string | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState<"none" | "blacklist" | "news">("none");
  const [msg, setMsg] = useState<string>("");

  function run(fd: FormData, action: (f: FormData) => Promise<{ ok: boolean; error?: string }>) {
    setMsg("");
    start(async () => {
      const res = await action(fd);
      if (res.ok) {
        setMsg("Saved.");
        setOpen("none");
        router.refresh();
      } else {
        setMsg(res.error ?? "Something went wrong.");
      }
    });
  }

  function deleteCard() {
    if (
      !window.confirm(
        "Delete this entire card, including all its reviews, evidence, events and connections? This cannot be undone."
      )
    )
      return;
    setMsg("");
    start(async () => {
      const res = await deleteEntityAction(entityId);
      if (res.ok) {
        router.push(res.redirect ?? "/admin/entities");
      } else {
        setMsg(res.error ?? "Could not delete the card.");
      }
    });
  }

  return (
    <div className="card border-brand/30 bg-brand/5 p-5">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-brand-soft">
        <ShieldIcon width={16} height={16} /> Admin tools
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          className="btn-ghost"
          onClick={() => setOpen(open === "blacklist" ? "none" : "blacklist")}
        >
          <BanIcon width={16} height={16} />
          {isBlacklisted ? "Update / remove blacklist" : "Add to blacklist"}
        </button>
        <button
          className="btn-ghost"
          onClick={() => setOpen(open === "news" ? "none" : "news")}
        >
          <NewsIcon width={16} height={16} /> Publish event / news
        </button>
        <button
          className="btn-danger ml-auto"
          onClick={deleteCard}
          disabled={pending}
        >
          <XIcon width={16} height={16} /> Delete card
        </button>
      </div>

      {open === "blacklist" && (
        <form
          action={(fd) => run(fd, toggleBlacklistAction)}
          className="mt-4 space-y-3 border-t border-line pt-4"
        >
          <input type="hidden" name="entityId" value={entityId} />
          <input
            type="hidden"
            name="isBlacklisted"
            value={String(!isBlacklisted)}
          />
          {!isBlacklisted ? (
            <>
              <label className="label">Reason for blacklisting</label>
              <textarea
                name="reason"
                required
                rows={3}
                defaultValue={blacklistReason ?? ""}
                placeholder="Explain why this entity is being blacklisted…"
                className="input"
              />
              <button className="btn-danger" disabled={pending}>
                {pending ? "Saving…" : "Add to blacklist"}
              </button>
            </>
          ) : (
            <>
              <input type="hidden" name="reason" value="" />
              <p className="text-sm text-muted">
                This will remove the entity from the blacklist.
              </p>
              <button className="btn-ok" disabled={pending}>
                {pending ? "Saving…" : "Remove from blacklist"}
              </button>
            </>
          )}
        </form>
      )}

      {open === "news" && (
        <form
          action={(fd) => run(fd, addNewsAction)}
          className="mt-4 space-y-3 border-t border-line pt-4"
        >
          <input type="hidden" name="entityId" value={entityId} />
          <div>
            <label className="label">Title</label>
            <input name="title" required className="input" placeholder="e.g. Fined by regulator for fraud" />
          </div>
          <div>
            <label className="label">Details</label>
            <textarea name="body" required rows={4} className="input" placeholder="What happened…" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Source URL (optional)</label>
              <input name="sourceUrl" className="input" placeholder="https://news.example.com/…" />
            </div>
            <div>
              <label className="label">Event date</label>
              <input type="date" name="eventDate" className="input" />
            </div>
          </div>
          <button className="btn-primary" disabled={pending}>
            {pending ? "Publishing…" : "Publish"}
          </button>
        </form>
      )}

      {msg && <p className="mt-3 text-sm text-muted">{msg}</p>}
    </div>
  );
}
