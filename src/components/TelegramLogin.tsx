"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    onTelegramAuth?: (user: Record<string, unknown>) => void;
  }
}

/**
 * Renders the official Telegram Login Widget. On success it posts the signed
 * payload to /api/auth/telegram, which verifies the signature server-side.
 */
export function TelegramLogin({
  botUsername,
  returnTo = "/",
}: {
  botUsername: string;
  returnTo?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    window.onTelegramAuth = async (user) => {
      setStatus("loading");
      try {
        const res = await fetch("/api/auth/telegram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(user),
        });
        const data = await res.json();
        if (!res.ok) {
          setStatus("error");
          setMessage(data.error ?? "Login failed.");
          return;
        }
        router.refresh();
        router.push(returnTo || "/");
      } catch {
        setStatus("error");
        setMessage("Network error. Please try again.");
      }
    };

    // Inject the widget script only once.
    const el = containerRef.current;
    if (el && !el.querySelector("script")) {
      const script = document.createElement("script");
      script.src = "https://telegram.org/js/telegram-widget.js?22";
      script.async = true;
      script.setAttribute("data-telegram-login", botUsername);
      script.setAttribute("data-size", "large");
      script.setAttribute("data-radius", "12");
      script.setAttribute("data-request-access", "write");
      script.setAttribute("data-onauth", "onTelegramAuth(user)");
      el.appendChild(script);
    }

    return () => {
      window.onTelegramAuth = undefined;
    };
  }, [botUsername, returnTo, router]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div ref={containerRef} className="min-h-[48px]" />
      {status === "loading" && (
        <p className="text-sm text-muted">Signing you in…</p>
      )}
      {status === "error" && (
        <p className="text-sm text-red-300">{message}</p>
      )}
    </div>
  );
}
