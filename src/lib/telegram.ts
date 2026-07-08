import crypto from "crypto";
import { env } from "./env";

// The payload delivered by the Telegram Login Widget (website) or that we
// synthesise for the bot's own users.
export interface TelegramAuthData {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

/**
 * Verify the signature of a Telegram Login Widget payload.
 * See: https://core.telegram.org/widgets/login#checking-authorization
 */
export function verifyTelegramLogin(
  data: Record<string, string>,
  maxAgeSeconds = 86400
): { ok: boolean; reason?: string } {
  if (!env.TELEGRAM_BOT_TOKEN) {
    return { ok: false, reason: "Bot token not configured on the server." };
  }
  const { hash, ...rest } = data;
  if (!hash) return { ok: false, reason: "Missing hash." };

  const dataCheckString = Object.keys(rest)
    .sort()
    .map((key) => `${key}=${rest[key]}`)
    .join("\n");

  const secretKey = crypto
    .createHash("sha256")
    .update(env.TELEGRAM_BOT_TOKEN)
    .digest();

  const hmac = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  // Constant-time comparison.
  const a = Buffer.from(hmac, "hex");
  const b = Buffer.from(hash, "hex");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { ok: false, reason: "Signature mismatch." };
  }

  const authDate = Number(rest.auth_date);
  if (!Number.isFinite(authDate)) {
    return { ok: false, reason: "Invalid auth_date." };
  }
  const ageSeconds = Math.floor(Date.now() / 1000) - authDate;
  if (ageSeconds > maxAgeSeconds) {
    return { ok: false, reason: "Login data is too old, please try again." };
  }

  return { ok: true };
}

export function parseTelegramAuth(
  data: Record<string, string>
): TelegramAuthData {
  return {
    id: Number(data.id),
    first_name: data.first_name,
    last_name: data.last_name,
    username: data.username,
    photo_url: data.photo_url,
    auth_date: Number(data.auth_date),
    hash: data.hash,
  };
}
