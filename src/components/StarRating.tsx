"use client";

import { useState } from "react";
import clsx from "clsx";
import { StarFilled, StarIcon } from "./icons";

export function StarRatingDisplay({
  value,
  count,
  size = 16,
  className,
}: {
  value: number;
  count?: number;
  size?: number;
  className?: string;
}) {
  const rounded = Math.round(value * 2) / 2;
  return (
    <div className={clsx("inline-flex items-center gap-1.5", className)}>
      <div className="flex items-center gap-0.5 text-amber-400">
        {[1, 2, 3, 4, 5].map((i) => {
          const filled = i <= Math.floor(rounded);
          const half = !filled && i - 0.5 === rounded;
          return (
            <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
              <StarIcon width={size} height={size} className="absolute inset-0 text-slate-600" />
              {(filled || half) && (
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: half ? size / 2 : size }}
                >
                  <StarFilled width={size} height={size} />
                </span>
              )}
            </span>
          );
        })}
      </div>
      {typeof count === "number" && (
        <span className="text-xs text-muted">
          {value > 0 ? value.toFixed(1) : "—"}
          {count > 0 && ` (${count})`}
        </span>
      )}
    </div>
  );
}

export function StarRatingInput({
  name,
  defaultValue = 0,
}: {
  name: string;
  defaultValue?: number;
}) {
  const [value, setValue] = useState(defaultValue);
  const [hover, setHover] = useState(0);
  const active = hover || value;
  return (
    <div className="flex items-center gap-1">
      <input type="hidden" name={name} value={value} />
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          aria-label={`${i} star${i > 1 ? "s" : ""}`}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => setValue(i)}
          className="text-amber-400 transition hover:scale-110"
        >
          {i <= active ? (
            <StarFilled width={28} height={28} />
          ) : (
            <StarIcon width={28} height={28} className="text-slate-600" />
          )}
        </button>
      ))}
      <span className="ml-2 text-sm text-muted">
        {value ? `${value}/5` : "Tap to rate"}
      </span>
    </div>
  );
}
