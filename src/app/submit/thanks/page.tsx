import Link from "next/link";
import { CheckIcon, ClockIcon } from "@/components/icons";

export const metadata = { title: "Submitted" };

export default function ThanksPage() {
  return (
    <div className="container-page flex justify-center py-14">
      <div className="w-full max-w-lg card p-10 text-center animate-fade-in">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-ok/15 text-ok ring-1 ring-ok/30">
          <CheckIcon width={32} height={32} />
        </div>
        <h1 className="text-2xl font-bold">Thanks — it's in the queue</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm text-muted">
          Your review has been submitted and is now pending moderation. Once an
          admin approves it, it will appear on the card (and any newly proposed
          card will go live too).
        </p>
        <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full bg-warn/10 px-3 py-1.5 text-sm text-amber-200 ring-1 ring-warn/30">
          <ClockIcon width={16} height={16} /> Pending admin review
        </div>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/me" className="btn-ghost">
            View my reviews
          </Link>
          <Link href="/search" className="btn-primary">
            Back to search
          </Link>
        </div>
      </div>
    </div>
  );
}
