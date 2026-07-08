import Link from "next/link";
import { SearchBar } from "@/components/SearchBar";
import { EntityCard } from "@/components/EntityCard";
import {
  getHomeStats,
  getRecentEntities,
  getTopBlacklisted,
} from "@/lib/queries";
import {
  BanIcon,
  BuildingIcon,
  CheckIcon,
  LinkIcon,
  NewsIcon,
  ShieldIcon,
  StarIcon,
  UploadIcon,
  UserIcon,
} from "@/components/icons";

export const dynamic = "force-dynamic";

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

export default async function HomePage() {
  const stats = await safe(getHomeStats, {
    companies: 0,
    specialists: 0,
    reviews: 0,
    blacklisted: 0,
  });
  const recent = await safe(() => getRecentEntities(6), []);
  const blacklisted = await safe(() => getTopBlacklisted(4), []);

  const statCards = [
    { label: "Companies", value: stats.companies, icon: BuildingIcon },
    { label: "Specialists", value: stats.specialists, icon: UserIcon },
    { label: "Verified reviews", value: stats.reviews, icon: StarIcon },
    { label: "Blacklisted", value: stats.blacklisted, icon: BanIcon },
  ];

  return (
    <div className="container-page space-y-16">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-line bg-gradient-to-b from-bg-soft/70 to-bg-card/40 px-6 py-16 sm:px-12 sm:py-20">
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <span className="chip mx-auto mb-5">
            <ShieldIcon width={14} height={14} /> Community-sourced ·
            Admin-verified
          </span>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Know who you're <span className="gradient-text">dealing with</span>.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted">
            Search verified reviews, evidence and connections for companies and
            specialists. See who is linked to whom — and who ended up on the
            blacklist.
          </p>
          <div className="mx-auto mt-8 max-w-2xl">
            <SearchBar size="lg" />
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-sm text-muted">
            <Link href="/submit" className="btn-primary">
              <UploadIcon width={16} height={16} /> Add a review
            </Link>
            <Link href="/blacklist" className="btn-ghost">
              <BanIcon width={16} height={16} /> View blacklist
            </Link>
          </div>
        </div>
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {statCards.map((s) => (
          <div key={s.label} className="card flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand/15 text-brand-soft">
              <s.icon />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-100">
                {s.value.toLocaleString("en-US")}
              </div>
              <div className="text-xs text-muted">{s.label}</div>
            </div>
          </div>
        ))}
      </section>

      {/* How it works */}
      <section>
        <h2 className="section-title mb-5">How it works</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: UploadIcon,
              title: "1. Submit with evidence",
              text: "Sign in with Telegram and add a review. Attach screenshots, documents or links, and name who the subject is connected with.",
            },
            {
              icon: CheckIcon,
              title: "2. Admins verify",
              text: "Every submission is reviewed by our moderators before it appears — so the base stays free of false information.",
            },
            {
              icon: LinkIcon,
              title: "3. Explore connections",
              text: "Each company and specialist gets a card with ratings, verified reviews, published events and their known connections.",
            },
          ].map((f) => (
            <div key={f.title} className="card p-6">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand/15 text-brand-soft">
                <f.icon />
              </div>
              <h3 className="font-semibold text-slate-100">{f.title}</h3>
              <p className="mt-2 text-sm text-muted">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Recently added */}
      {recent.length > 0 && (
        <section>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="section-title">Recently added</h2>
            <Link href="/search" className="link-muted text-sm">
              Browse all →
            </Link>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {recent.map((e) => (
              <EntityCard key={e.slug} entity={e} />
            ))}
          </div>
        </section>
      )}

      {/* Blacklist highlight */}
      {blacklisted.length > 0 && (
        <section>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="section-title flex items-center gap-2">
              <BanIcon className="text-danger" /> On the blacklist
            </h2>
            <Link href="/blacklist" className="link-muted text-sm">
              Full list →
            </Link>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {blacklisted.map((e) => (
              <EntityCard key={e.slug} entity={e} />
            ))}
          </div>
        </section>
      )}

      {/* Bot CTA */}
      <section className="card flex flex-col items-center gap-4 bg-gradient-to-r from-brand/10 to-accent/5 p-8 text-center sm:flex-row sm:text-left">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/20 text-brand-soft">
          <NewsIcon />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-100">
            Prefer Telegram? Use the bot.
          </h3>
          <p className="text-sm text-muted">
            Search cards, read reviews and submit new reports right inside
            Telegram — with the same account you use here.
          </p>
        </div>
        <Link href="/about" className="btn-ghost">
          Learn more
        </Link>
      </section>
    </div>
  );
}
