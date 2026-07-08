import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { SubmitForm } from "@/components/SubmitForm";
import { TelegramLogin } from "@/components/TelegramLogin";
import { LogoMark, ShieldIcon } from "@/components/icons";

export const metadata = { title: "Add a review" };
export const dynamic = "force-dynamic";

export default async function SubmitPage({
  searchParams,
}: {
  searchParams: { entity?: string; q?: string };
}) {
  const user = await getCurrentUser();

  if (!user) {
    const returnTo = `/submit${
      searchParams.entity
        ? `?entity=${searchParams.entity}`
        : searchParams.q
        ? `?q=${encodeURIComponent(searchParams.q)}`
        : ""
    }`;
    return (
      <div className="container-page flex justify-center py-10">
        <div className="w-full max-w-md card p-8 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/20 text-brand-soft ring-1 ring-brand/30">
            <LogoMark width={28} height={28} />
          </div>
          <h1 className="text-xl font-bold">Sign in to add a review</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
            Reviews are tied to your Telegram identity and moderated before
            publishing.
          </p>
          <div className="my-6 flex justify-center">
            {env.TELEGRAM_BOT_TOKEN ? (
              <TelegramLogin botUsername={env.BOT_USERNAME} returnTo={returnTo} />
            ) : (
              <p className="text-sm text-amber-200">
                Telegram login isn't configured yet — see the README.
              </p>
            )}
          </div>
          <Link href="/" className="link-muted text-sm">
            ← Back home
          </Link>
        </div>
      </div>
    );
  }

  // Resolve prefilled entity (from a card's "Add review" button).
  let initialEntity: {
    id: string;
    name: string;
    type: "COMPANY" | "SPECIALIST";
    avatarUrl?: string | null;
  } | null = null;

  if (searchParams.entity) {
    try {
      const e = await prisma.entity.findUnique({
        where: { slug: searchParams.entity },
        select: {
          id: true,
          name: true,
          type: true,
          avatarUrl: true,
          status: true,
        },
      });
      if (e && e.status === "APPROVED") {
        initialEntity = {
          id: e.id,
          name: e.name,
          type: e.type,
          avatarUrl: e.avatarUrl,
        };
      }
    } catch {
      /* db not reachable — fall through to blank form */
    }
  }

  return (
    <div className="container-page max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Add a review</h1>
        <p className="mt-1 text-sm text-muted">
          Share verified information with evidence. Our moderators check every
          submission before it appears.
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-brand/20 bg-brand/5 p-4 text-sm text-muted">
        <ShieldIcon className="mt-0.5 shrink-0 text-brand-soft" width={18} height={18} />
        <p>
          Reviews are published only after admin approval. Provide facts and
          evidence — unsupported or abusive reports are rejected and may lead to
          a ban.
        </p>
      </div>

      <SubmitForm initialEntity={initialEntity} initialQuery={searchParams.q} />
    </div>
  );
}
