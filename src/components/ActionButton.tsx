"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";

type Res = { ok: boolean; error?: string };

/**
 * Generic client button that runs a server action bound to fixed arguments.
 * Used for admin one-click actions (delete news/relation, approve, etc.).
 */
export function ActionButton({
  action,
  children,
  className = "btn-ghost",
  confirm,
  refresh = true,
}: {
  action: () => Promise<Res>;
  children: React.ReactNode;
  className?: string;
  confirm?: string;
  refresh?: boolean;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();

  function onClick() {
    if (confirm && !window.confirm(confirm)) return;
    start(async () => {
      const res = await action();
      if (!res.ok) {
        window.alert(res.error ?? "Action failed.");
        return;
      }
      if (refresh) router.refresh();
    });
  }

  return (
    <button onClick={onClick} disabled={pending} className={clsx(className)}>
      {pending ? "…" : children}
    </button>
  );
}
