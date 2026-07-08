import Link from "next/link";
import { env } from "@/lib/env";
import {
  CheckIcon,
  LinkIcon,
  ShieldIcon,
  TelegramIcon,
  UploadIcon,
} from "@/components/icons";

export const metadata = { title: "How it works" };

export default function AboutPage() {
  const botUrl = `https://t.me/${env.BOT_USERNAME}`;
  return (
    <div className="container-page max-w-3xl space-y-10">
      <div>
        <h1 className="text-3xl font-bold">How GetReport works</h1>
        <p className="mt-2 text-muted">
          A community-sourced, admin-verified register of reviews on companies
          and specialists.
        </p>
      </div>

      <section className="space-y-4">
        {[
          {
            icon: TelegramIcon,
            title: "Telegram-only sign in",
            text: "You sign in with your Telegram account — no passwords, no email. This keeps reviews accountable to a real identity.",
          },
          {
            icon: UploadIcon,
            title: "Submit with evidence",
            text: "Anyone signed in can add a review, for cards that already exist or brand-new ones. Every review must include evidence: screenshots, documents or links, plus who the subject is connected with.",
          },
          {
            icon: CheckIcon,
            title: "Admins verify everything",
            text: "Each submission enters a moderation queue. Admins approve or reject it before it becomes visible — so the base stays free of false information.",
          },
          {
            icon: LinkIcon,
            title: "Cards, ratings & connections",
            text: "Approved reviews build a card for each company or specialist, with an aggregate rating, published events/news, and a map of who they're connected with.",
          },
          {
            icon: ShieldIcon,
            title: "Blacklist",
            text: "Entities with serious, verified issues can be placed on a dedicated blacklist with the reason on record.",
          },
        ].map((f) => (
          <div key={f.title} className="card flex gap-4 p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-brand-soft">
              <f.icon />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100">{f.title}</h3>
              <p className="mt-1 text-sm text-muted">{f.text}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="card bg-gradient-to-r from-brand/10 to-accent/5 p-6">
        <h2 className="text-lg font-semibold text-slate-100">Use it in Telegram</h2>
        <p className="mt-1 text-sm text-muted">
          Search cards, read reviews and submit reports right inside Telegram.
        </p>
        <a href={botUrl} target="_blank" rel="noreferrer" className="btn-primary mt-4">
          <TelegramIcon width={16} height={16} /> Open @{env.BOT_USERNAME}
        </a>
      </section>

      <div className="flex gap-3">
        <Link href="/search" className="btn-ghost">
          Search the base
        </Link>
        <Link href="/submit" className="btn-primary">
          Add a review
        </Link>
      </div>
    </div>
  );
}
