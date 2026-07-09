import Link from "next/link";
import { LogoMark } from "./icons";

export function Footer() {
  return (
    <footer className="border-t border-line/70 bg-bg-soft/40">
      <div className="container-page flex flex-col items-center justify-between gap-4 py-8 sm:flex-row">
        <div className="flex items-center gap-2 text-sm text-muted">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/15 text-brand-soft">
            <LogoMark width={16} height={16} />
          </span>
          <span>
            One <span className="text-slate-300">Trust Base</span> — community
            reviews, admin-verified.
          </span>
        </div>
        <nav className="flex items-center gap-5 text-sm text-muted">
          <Link href="/search" className="hover:text-slate-200">
            Search
          </Link>
          <Link href="/blacklist" className="hover:text-slate-200">
            Blacklist
          </Link>
          <Link href="/submit" className="hover:text-slate-200">
            Add review
          </Link>
          <Link href="/about" className="hover:text-slate-200">
            How it works
          </Link>
        </nav>
      </div>
    </footer>
  );
}
