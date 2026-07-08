"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SearchIcon } from "./icons";

export function SearchBar({
  defaultValue = "",
  autoFocus = false,
  size = "md",
}: {
  defaultValue?: string;
  autoFocus?: boolean;
  size?: "md" | "lg";
}) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = value.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  }

  return (
    <form onSubmit={submit} className="relative w-full">
      <SearchIcon
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
        width={size === "lg" ? 22 : 18}
        height={size === "lg" ? 22 : 18}
      />
      <input
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search a company or specialist by name…"
        className={
          size === "lg"
            ? "input pl-12 pr-28 py-4 text-base"
            : "input pl-11 pr-24"
        }
      />
      <button
        type="submit"
        className="btn-primary absolute right-1.5 top-1/2 -translate-y-1/2 py-2"
      >
        Search
      </button>
    </form>
  );
}
