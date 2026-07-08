import "server-only";
import { redirect } from "next/navigation";
import type { User } from "@prisma/client";
import { prisma } from "./db";
import { env } from "./env";
import { getSession, createSession } from "./session";
import type { TelegramAuthData } from "./telegram";

/**
 * Create or update a user from a verified Telegram identity, then start a
 * session for them. Also promotes bootstrap admins on first login.
 */
export async function loginWithTelegram(auth: TelegramAuthData): Promise<User> {
  const telegramId = BigInt(auth.id);
  const isBootstrapAdmin = env.BOOTSTRAP_ADMIN_TELEGRAM_IDS.includes(
    String(auth.id)
  );

  const user = await prisma.user.upsert({
    where: { telegramId },
    create: {
      telegramId,
      username: auth.username ?? null,
      firstName: auth.first_name ?? null,
      lastName: auth.last_name ?? null,
      photoUrl: auth.photo_url ?? null,
      role: isBootstrapAdmin ? "ADMIN" : "USER",
    },
    update: {
      username: auth.username ?? null,
      firstName: auth.first_name ?? null,
      lastName: auth.last_name ?? null,
      photoUrl: auth.photo_url ?? null,
      lastLoginAt: new Date(),
      // Never demote here; only ensure bootstrap admins are promoted.
      ...(isBootstrapAdmin ? { role: "ADMIN" as const } : {}),
    },
  });

  await createSession({
    userId: user.id,
    telegramId: String(user.telegramId),
    role: user.role,
  });

  return user;
}

/** Returns the logged-in user (from DB) or null. */
export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession();
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });
  if (!user || user.isBanned) return null;
  return user;
}

/** Require a logged-in user or redirect to /login. */
export async function requireUser(returnTo?: string): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    const q = returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : "";
    redirect(`/login${q}`);
  }
  return user;
}

/** Require an admin user or redirect. */
export async function requireAdmin(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?returnTo=/admin");
  if (user.role !== "ADMIN") redirect("/");
  return user;
}
