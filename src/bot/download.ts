import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import type { Api } from "grammy";
import { env } from "../lib/env";
import { UPLOAD_DIR } from "../lib/paths";

/**
 * Download a Telegram file (by file_id) and save it under /public/uploads.
 * Returns the public URL path.
 */
export async function downloadTelegramFile(
  api: Api,
  fileId: string,
  fallbackExt = ".jpg"
): Promise<string> {
  const file = await api.getFile(fileId);
  if (!file.file_path) throw new Error("File path unavailable.");

  const url = `https://api.telegram.org/file/bot${env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download file (${res.status}).`);
  const buffer = Buffer.from(await res.arrayBuffer());

  await mkdir(UPLOAD_DIR, { recursive: true });
  const ext = path.extname(file.file_path) || fallbackExt;
  const name = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;
  await writeFile(path.join(UPLOAD_DIR, name), buffer);
  return `/uploads/${name}`;
}
