"use client";

import { useState } from "react";
import clsx from "clsx";
import { DocIcon, ImageIcon, LinkIcon, XIcon } from "./icons";

export interface EvidenceItem {
  id: string;
  type: "IMAGE" | "DOCUMENT" | "LINK";
  url: string;
  caption?: string | null;
}

export function EvidenceGallery({ items }: { items: EvidenceItem[] }) {
  const [preview, setPreview] = useState<string | null>(null);
  if (!items.length) return null;

  const images = items.filter((i) => i.type === "IMAGE");
  const files = items.filter((i) => i.type === "DOCUMENT");
  const links = items.filter((i) => i.type === "LINK");

  return (
    <div className="mt-3 space-y-3">
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {images.map((img) => (
            <button
              key={img.id}
              onClick={() => setPreview(img.url)}
              className="group relative aspect-square overflow-hidden rounded-lg border border-line bg-bg-soft"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.caption ?? "evidence"}
                className="h-full w-full object-cover transition group-hover:scale-105"
              />
              <span className="absolute inset-0 bg-black/0 transition group-hover:bg-black/20" />
            </button>
          ))}
        </div>
      )}

      {(files.length > 0 || links.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {files.map((f) => (
            <a
              key={f.id}
              href={f.url}
              target="_blank"
              rel="noreferrer"
              className="chip hover:border-brand/40"
            >
              <DocIcon width={14} height={14} />
              {f.caption ?? "Document"}
            </a>
          ))}
          {links.map((l) => (
            <a
              key={l.id}
              href={l.url}
              target="_blank"
              rel="noreferrer"
              className="chip hover:border-brand/40"
            >
              <LinkIcon width={14} height={14} />
              {new URL(l.url).hostname.replace("www.", "")}
            </a>
          ))}
        </div>
      )}

      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setPreview(null)}
        >
          <button
            className="absolute right-4 top-4 rounded-full bg-bg-elev p-2 text-slate-200"
            onClick={() => setPreview(null)}
          >
            <XIcon />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="evidence preview"
            className="max-h-[90vh] max-w-full rounded-xl object-contain"
          />
        </div>
      )}
    </div>
  );
}

export function EvidenceCount({ items }: { items: EvidenceItem[] }) {
  const n = items.length;
  if (!n) return null;
  const hasImg = items.some((i) => i.type === "IMAGE");
  return (
    <span className={clsx("chip", "text-muted")}>
      {hasImg ? <ImageIcon width={14} height={14} /> : <DocIcon width={14} height={14} />}
      {n} {n === 1 ? "attachment" : "attachments"}
    </span>
  );
}
