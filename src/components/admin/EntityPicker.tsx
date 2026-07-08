"use client";

import { useEffect, useRef, useState } from "react";
import { EntityAvatar } from "@/components/Avatar";
import { SearchIcon, XIcon } from "@/components/icons";

export interface PickedEntity {
  id: string;
  name: string;
  type: "COMPANY" | "SPECIALIST";
  avatarUrl?: string | null;
}

export function EntityPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: PickedEntity | null;
  onChange: (e: PickedEntity | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<PickedEntity[]>([]);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (value) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/entities?q=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        setHits(data.results ?? []);
      } catch {
        setHits([]);
      }
    }, 250);
    return () => clearTimeout(timer.current);
  }, [query, value]);

  return (
    <div>
      <label className="label">{label}</label>
      {value ? (
        <div className="flex items-center gap-3 rounded-xl border border-brand/40 bg-brand/10 p-2.5">
          <EntityAvatar name={value.name} type={value.type} avatarUrl={value.avatarUrl} size={36} />
          <span className="flex-1 text-sm font-medium text-slate-100">{value.name}</span>
          <button type="button" onClick={() => onChange(null)} className="btn-ghost px-2">
            <XIcon width={16} height={16} />
          </button>
        </div>
      ) : (
        <div className="relative">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" width={16} height={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setOpen(true)}
              placeholder="Search a card…"
              className="input pl-10"
            />
          </div>
          {open && hits.length > 0 && (
            <ul className="absolute z-20 mt-1 w-full divide-y divide-line overflow-hidden rounded-xl border border-line bg-bg-card shadow-soft">
              {hits.map((h) => (
                <li key={h.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(h);
                      setOpen(false);
                    }}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-bg-elev"
                  >
                    <EntityAvatar name={h.name} type={h.type} avatarUrl={h.avatarUrl} size={30} />
                    <span className="text-sm text-slate-100">{h.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
