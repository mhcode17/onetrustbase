import { NextResponse } from "next/server";
import { verifyTelegramLogin, parseTelegramAuth } from "@/lib/telegram";
import { loginWithTelegram } from "@/lib/auth";

export async function POST(req: Request) {
  let body: Record<string, string>;
  try {
    const raw = await req.json();
    // Telegram sends numbers/strings; coerce everything to string for hashing.
    body = Object.fromEntries(
      Object.entries(raw).map(([k, v]) => [k, String(v)])
    );
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const check = verifyTelegramLogin(body);
  if (!check.ok) {
    return NextResponse.json(
      { error: check.reason ?? "Verification failed." },
      { status: 401 }
    );
  }

  const auth = parseTelegramAuth(body);
  if (!auth.id) {
    return NextResponse.json({ error: "Missing Telegram id." }, { status: 400 });
  }

  try {
    const user = await loginWithTelegram(auth);
    return NextResponse.json({ ok: true, role: user.role });
  } catch (e) {
    console.error("Telegram login failed:", e);
    return NextResponse.json(
      { error: "Could not complete login. Is the database running?" },
      { status: 500 }
    );
  }
}
