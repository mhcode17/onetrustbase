"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";
import {
  ChevronLeft,
  ChevronRight,
  DocIcon,
  ImageIcon,
  LinkIcon,
  XIcon,
} from "./icons";

export interface EvidenceItem {
  id: string;
  type: "IMAGE" | "DOCUMENT" | "LINK";
  url: string;
  caption?: string | null;
}

export function EvidenceGallery({ items }: { items: EvidenceItem[] }) {
  const [index, setIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  const images = items.filter((i) => i.type === "IMAGE");

  useEffect(() => setMounted(true), []);

  // Keyboard controls + background scroll lock while the viewer is open.
  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIndex(null);
      else if (e.key === "ArrowRight")
        setIndex((i) => (i === null ? i : (i + 1) % images.length));
      else if (e.key === "ArrowLeft")
        setIndex((i) => (i === null ? i : (i - 1 + images.length) % images.length));
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [index, images.length]);

  if (!items.length) return null;

  const files = items.filter((i) => i.type === "DOCUMENT");
  const links = items.filter((i) => i.type === "LINK");
  const current = index !== null ? images[index] : null;

  return (
    <div className="mt-3 space-y-3">
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setIndex(i)}
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

      {mounted &&
        current &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
            onClick={() => setIndex(null)}
          >
            <button
              className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
              onClick={() => setIndex(null)}
              aria-label="Close"
            >
              <XIcon />
            </button>

            {images.length > 1 && (
              <>
                <button
                  className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIndex((i) => (i === null ? i : (i - 1 + images.length) % images.length));
                  }}
                  aria-label="Previous"
                >
                  <ChevronLeft />
                </button>
                <button
                  className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIndex((i) => (i === null ? i : (i + 1) % images.length));
                  }}
                  aria-label="Next"
                >
                  <ChevronRight />
                </button>
              </>
            )}

            <figure
              className="flex max-h-full max-w-full flex-col items-center gap-3"
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={current.url}
                alt={current.caption ?? "evidence"}
                className="max-h-[92vh] max-w-[96vw] rounded-lg object-contain shadow-2xl"
              />
              {(current.caption || images.length > 1) && (
                <figcaption className="text-center text-sm text-white/70">
                  {current.caption}
                  {images.length > 1 && (
                    <span className="ml-2 text-white/50">
                      {index! + 1} / {images.length}
                    </span>
                  )}
                </figcaption>
              )}
            </figure>
          </div>,
          document.body
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
