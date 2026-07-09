import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { UPLOAD_DIR } from "@/lib/paths";

// Serve uploaded evidence files from disk at request time.
//
// Why this exists: Next.js only serves files that were present in `public/`
// when the server started, so evidence uploaded at runtime (via the site or
// the bot) would 404 until the next restart. This route reads straight from
// the uploads directory on every request, so new files work immediately.
export const dynamic = "force-dynamic";

const CONTENT_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".pdf": "application/pdf",
  ".txt": "text/plain; charset=utf-8",
  ".doc": "application/msword",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

export async function GET(
  _req: Request,
  { params }: { params: { path: string[] } }
) {
  // Only allow a single flat filename — no nested paths or traversal.
  const name = params.path?.[params.path.length - 1] ?? "";
  const safe = path.basename(name);
  if (!safe || safe !== name) {
    return new NextResponse("Not found", { status: 404 });
  }

  const filePath = path.join(UPLOAD_DIR, safe);
  if (!filePath.startsWith(UPLOAD_DIR)) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const data = await readFile(filePath);
    const ext = path.extname(safe).toLowerCase();
    return new NextResponse(data, {
      headers: {
        "Content-Type": CONTENT_TYPES[ext] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Length": String(data.length),
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
