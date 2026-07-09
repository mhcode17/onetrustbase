"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";
import { UserAvatar } from "./Avatar";
import {
  BanIcon,
  LogoMark,
  MenuIcon,
  PlusIcon,
  SearchIcon,
  ShieldIcon,
} from "./icons";
import { displayName } from "@/lib/format";

interface HeaderUser {
  id: string;
  role: "USER" | "ADMIN";
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
  photoUrl?: string | null;
}

const navLinks = [
  { href: "/search", label: "Search", icon: SearchIcon },
  { href: "/blacklist", label: "Blacklist", icon: BanIcon },
];

export function Header({ user }: { user: HeaderUser | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.refresh();
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-bg/80 backdrop-blur-xl">
      <div className="container-page flex h-16 items-center gap-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/20 text-brand-soft ring-1 ring-brand/30">
            <LogoMark />
          </span>
          <span className="text-lg tracking-tight">
            One <span className="gradient-text">Trust Base</span>
          </span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {navLinks.map((l) => {
            const active = pathname === l.href || pathname.startsWith(l.href + "/");
            return (
              <Link
                key={l.href}
                href={l.href}
                className={clsx(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition",
                  active
                    ? "bg-bg-elev text-white"
                    : "text-muted hover:bg-bg-soft hover:text-slate-200"
                )}
              >
                <l.icon width={16} height={16} />
                {l.label}
              </Link>
            );
          })}
          {user?.role === "ADMIN" && (
            <Link
              href="/admin"
              className={clsx(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition",
                pathname.startsWith("/admin")
                  ? "bg-brand/20 text-brand-soft"
                  : "text-muted hover:bg-bg-soft hover:text-brand-soft"
              )}
            >
              <ShieldIcon width={16} height={16} />
              Admin
            </Link>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link href="/submit" className="btn-primary hidden sm:inline-flex">
            <PlusIcon width={16} height={16} />
            Add review
          </Link>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full border border-line bg-bg-soft/80 py-1 pl-1 pr-3 transition hover:border-brand/40"
              >
                <UserAvatar
                  name={displayName(user)}
                  photoUrl={user.photoUrl}
                  size={30}
                />
                <span className="hidden max-w-[8rem] truncate text-sm text-slate-200 sm:inline">
                  {displayName(user)}
                </span>
              </button>
              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-xl border border-line bg-bg-card shadow-soft animate-fade-in">
                    <div className="border-b border-line px-4 py-3">
                      <p className="truncate text-sm font-medium text-slate-100">
                        {displayName(user)}
                      </p>
                      {user.role === "ADMIN" && (
                        <span className="badge-brand mt-1">Administrator</span>
                      )}
                    </div>
                    <Link
                      href="/me"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2.5 text-sm text-slate-200 hover:bg-bg-elev"
                    >
                      My reviews
                    </Link>
                    {user.role === "ADMIN" && (
                      <Link
                        href="/admin"
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2.5 text-sm text-slate-200 hover:bg-bg-elev"
                      >
                        Admin panel
                      </Link>
                    )}
                    <button
                      onClick={logout}
                      className="block w-full px-4 py-2.5 text-left text-sm text-red-300 hover:bg-bg-elev"
                    >
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link href="/login" className="btn-ghost">
              Sign in
            </Link>
          )}

          <button
            className="btn-ghost px-2 md:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menu"
          >
            <MenuIcon />
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="border-t border-line/60 px-4 py-2 md:hidden">
        <div className="flex items-center gap-2 overflow-x-auto">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="chip whitespace-nowrap"
            >
              <l.icon width={14} height={14} /> {l.label}
            </Link>
          ))}
          <Link href="/submit" className="chip whitespace-nowrap">
            <PlusIcon width={14} height={14} /> Add review
          </Link>
          {user?.role === "ADMIN" && (
            <Link href="/admin" className="chip whitespace-nowrap">
              <ShieldIcon width={14} height={14} /> Admin
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
