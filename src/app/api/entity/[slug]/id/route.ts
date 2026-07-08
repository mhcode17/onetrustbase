import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const entity = await prisma.entity.findUnique({
      where: { slug: params.slug },
      select: { id: true, status: true },
    });
    if (!entity || entity.status !== "APPROVED") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ id: entity.id });
  } catch {
    return NextResponse.json({ error: "Unavailable" }, { status: 500 });
  }
}
