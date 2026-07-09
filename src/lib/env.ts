// Centralised, validated access to environment variables.

function required(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (v === undefined || v === "") {
    // Don't hard-crash at import time in dev so the site can still render a
    // helpful message; surface a clear error at the call site instead.
    return "";
  }
  return v;
}

export const env = {
  DATABASE_URL: required("DATABASE_URL"),
  TELEGRAM_BOT_TOKEN: required("TELEGRAM_BOT_TOKEN"),
  BOT_USERNAME:
    process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? "onetrustbase_bot",
  SESSION_SECRET: required(
    "SESSION_SECRET",
    "dev-insecure-secret-change-me-please-32chars"
  ),
  APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  BOOTSTRAP_ADMIN_TELEGRAM_IDS: (
    process.env.BOOTSTRAP_ADMIN_TELEGRAM_IDS ?? ""
  )
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
};

export function assertTelegramConfigured() {
  if (!env.TELEGRAM_BOT_TOKEN) {
    throw new Error(
      "TELEGRAM_BOT_TOKEN is not set. Add it to your .env file (see .env.example)."
    );
  }
}
