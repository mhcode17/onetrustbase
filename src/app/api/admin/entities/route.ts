import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Admin-only entity lookup that returns internal IDs (for relation building).
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";

  const results = await prisma.entity.findMany({
    where: {
      status: "APPROVED",
      ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
    },
    select: { id: true, name: true, type: true, avatarUrl: true },
    orderBy: { name: "asc" },
    take: 10,
  });

  return NextResponse.json({ results });
}
