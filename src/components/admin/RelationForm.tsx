"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addRelationAction } from "@/lib/actions/admin";
import { EntityPicker, type PickedEntity } from "./EntityPicker";
import { RELATION_LABEL } from "@/lib/format";
import { LinkIcon } from "@/components/icons";

const RELATION_TYPES = [
  "WORKS_AT",
  "OWNS",
  "PARTNER",
  "FORMER_EMPLOYEE",
  "AFFILIATE",
  "ASSOCIATED_WITH",
  "OTHER",
] as const;

export function RelationForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [from, setFrom] = useState<PickedEntity | null>(null);
  const [to, setTo] = useState<PickedEntity | null>(null);
  const [type, setType] = useState<string>("WORKS_AT");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);

  function submit() {
    setError("");
    setOk(false);
    if (!from || !to) {
      setError("Pick both cards.");
      return;
    }
    const fd = new FormData();
    fd.set("fromEntityId", from.id);
    fd.set("toEntityId", to.id);
    fd.set("type", type);
    fd.set("note", note);
    start(async () => {
      const res = await addRelationAction(fd);
      if (res.ok) {
        setOk(true);
        setFrom(null);
        setTo(null);
        setNote("");
        router.refresh();
      } else {
        setError(res.error ?? "Failed.");
      }
    });
  }

  return (
    <div className="card space-y-4 p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <EntityPicker label="From (subject)" value={from} onChange={setFrom} />
        <EntityPicker label="To (connected with)" value={to} onChange={setTo} />
      </div>
      <div>
        <label className="label">Relationship</label>
        <select value={type} onChange={(e) => setType(e.target.value)} className="input">
          {RELATION_TYPES.map((t) => (
            <option key={t} value={t}>
              {RELATION_LABEL[t]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Note (optional)</label>
        <input value={note} onChange={(e) => setNote(e.target.value)} className="input" placeholder="Context for this connection" />
      </div>

      {error && <p className="text-sm text-red-300">{error}</p>}
      {ok && <p className="text-sm text-green-300">Connection added.</p>}

      <button onClick={submit} disabled={pending} className="btn-primary">
        <LinkIcon width={16} height={16} /> {pending ? "Adding…" : "Add connection"}
      </button>
    </div>
  );
}
