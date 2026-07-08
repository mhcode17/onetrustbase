import { NextResponse } from "next/server";
import { searchEntities } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const typeParam = searchParams.get("type") ?? "ALL";
  const type = ["ALL", "COMPANY", "SPECIALIST"].includes(typeParam)
    ? (typeParam as "ALL" | "COMPANY" | "SPECIALIST")
    : "ALL";

  try {
    const results = await searchEntities({ q, type, take: 12 });
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json(
      { results: [], error: "Database unavailable." },
      { status: 200 }
    );
  }
}
