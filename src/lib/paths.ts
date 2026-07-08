import path from "path";

// Shared filesystem paths (safe to import from anywhere, incl. the bot).
export const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
