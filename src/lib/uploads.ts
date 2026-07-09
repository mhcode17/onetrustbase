import "server-only";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { UPLOAD_DIR } from "./paths";

export { UPLOAD_DIR };

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const DOC_TYPES = [
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export interface SavedFile {
  url: string;
  type: "IMAGE" | "DOCUMENT";
  caption: string;
}

export async function saveEvidenceFiles(files: File[]): Promise<SavedFile[]> {
  await mkdir(UPLOAD_DIR, { recursive: true });
  const saved: SavedFile[] = [];

  for (const file of files) {
    if (!file || file.size === 0) continue;
    if (file.size > MAX_BYTES) {
      throw new Error(`"${file.name}" exceeds the 10 MB limit.`);
    }
    const isImage = IMAGE_TYPES.includes(file.type);
    const isDoc = DOC_TYPES.includes(file.type);
    if (!isImage && !isDoc) {
      throw new Error(`"${file.name}" has an unsupported file type.`);
    }

    const ext = path.extname(file.name).slice(0, 10) || (isImage ? ".png" : ".bin");
    const id = crypto.randomBytes(12).toString("hex");
    const filename = `${Date.now()}-${id}${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(UPLOAD_DIR, filename), buffer);

    saved.push({
      url: `/uploads/${filename}`,
      type: isImage ? "IMAGE" : "DOCUMENT",
      caption: file.name,
    });
  }

  return saved;
}

/**
 * Delete locally-stored evidence files from disk (e.g. when an admin deletes a
 * review or a whole card). External links (type LINK) and non-/uploads paths
 * are skipped. Missing files are ignored.
 */
export async function deleteLocalEvidenceFiles(
  items: { type: string; url: string }[]
): Promise<void> {
  for (const it of items) {
    if (it.type === "LINK") continue;
    if (!it.url.startsWith("/uploads/")) continue;
    const file = path.join(UPLOAD_DIR, path.basename(it.url));
    try {
      await unlink(file);
    } catch {
      // File already gone — nothing to do.
    }
  }
}
