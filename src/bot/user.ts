import type { User as TgUser } from "grammy/types";
import { prisma } from "../lib/db";
import { env } from "../lib/env";
import type { User } from "@prisma/client";

/**
 * Ensure a Telegram user exists in our DB. In the bot, the Telegram identity
 * is inherent (from ctx.from), so no separate login is required — this is the
 * bot-side equivalent of loginWithTelegram().
 */
export async function ensureBotUser(from: TgUser): Promise<User> {
  const telegramId = BigInt(from.id);
  const isBootstrapAdmin = env.BOOTSTRAP_ADMIN_TELEGRAM_IDS.includes(
    String(from.id)
  );
  return prisma.user.upsert({
    where: { telegramId },
    create: {
      telegramId,
      username: from.username ?? null,
      firstName: from.first_name ?? null,
      lastName: from.last_name ?? null,
      role: isBootstrapAdmin ? "ADMIN" : "USER",
    },
    update: {
      username: from.username ?? null,
      firstName: from.first_name ?? null,
      lastName: from.last_name ?? null,
      lastLoginAt: new Date(),
      ...(isBootstrapAdmin ? { role: "ADMIN" as const } : {}),
    },
  });
}
