"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  BuildingIcon,
  ClockIcon,
  LinkIcon,
  ShieldIcon,
  UserIcon,
} from "@/components/icons";

const items = [
  { href: "/admin", label: "Moderation", icon: ClockIcon, exact: true },
  { href: "/admin/entities", label: "Cards", icon: BuildingIcon },
  { href: "/admin/relations", label: "Connections", icon: LinkIcon },
  { href: "/admin/users", label: "Users", icon: UserIcon },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="card p-2">
      <div className="mb-1 flex items-center gap-2 px-3 py-2 text-sm font-semibold text-brand-soft">
        <ShieldIcon width={16} height={16} /> Admin
      </div>
      <div className="flex gap-1 lg:flex-col">
        {items.map((it) => {
          const active = it.exact
            ? pathname === it.href
            : pathname === it.href || pathname.startsWith(it.href + "/");
          return (
            <Link
              key={it.href}
              href={it.href}
              className={clsx(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition",
                active
                  ? "bg-brand/15 text-brand-soft"
                  : "text-muted hover:bg-bg-elev hover:text-slate-200"
              )}
            >
              <it.icon width={16} height={16} />
              {it.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
