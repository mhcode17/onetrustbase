import { redirect } from "next/navigation";
import { TelegramLogin } from "@/components/TelegramLogin";
import { getCurrentUser } from "@/lib/auth";
import { env } from "@/lib/env";
import { LogoMark, ShieldIcon, TelegramIcon } from "@/components/icons";

export const metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { returnTo?: string };
}) {
  const user = await getCurrentUser();
  const returnTo = searchParams.returnTo || "/";
  if (user) redirect(returnTo);

  const configured = Boolean(env.TELEGRAM_BOT_TOKEN);

  return (
    <div className="container-page flex justify-center py-10">
      <div className="w-full max-w-md">
        <div className="card p-8 text-center animate-fade-in">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/20 text-brand-soft ring-1 ring-brand/30">
            <LogoMark width={28} height={28} />
          </div>
          <h1 className="text-2xl font-bold">Sign in to GetReport</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
            Access is Telegram-only. We use it to keep the community
            accountable — no passwords, no email.
          </p>

          <div className="my-8 flex justify-center">
            {configured ? (
              <TelegramLogin
                botUsername={env.BOT_USERNAME}
                returnTo={returnTo}
              />
            ) : (
              <div className="rounded-xl border border-warn/30 bg-warn/10 p-4 text-left text-sm text-amber-200">
                <p className="font-semibold">Telegram login isn't configured yet.</p>
                <p className="mt-1 text-amber-200/80">
                  Set <code>TELEGRAM_BOT_TOKEN</code> and{" "}
                  <code>NEXT_PUBLIC_TELEGRAM_BOT_USERNAME</code> in your{" "}
                  <code>.env</code> file, then restart the server. See the
                  README for step-by-step setup.
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-muted">
            <TelegramIcon width={14} height={14} className="text-brand-soft" />
            Secured by Telegram Login · signature verified server-side
          </div>
        </div>

        <div className="mt-4 flex items-start gap-3 rounded-xl border border-line bg-bg-soft/40 p-4 text-sm text-muted">
          <ShieldIcon className="mt-0.5 shrink-0 text-brand-soft" width={18} height={18} />
          <p>
            Your reviews are tied to your Telegram identity and moderated before
            publishing. Abuse or false reports can lead to a ban.
          </p>
        </div>
      </div>
    </div>
  );
}
