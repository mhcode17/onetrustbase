import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  console.log("🌱 Seeding GetReport demo data…");

  // ── Users ───────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { telegramId: BigInt(100000001) },
    update: { role: "ADMIN" },
    create: {
      telegramId: BigInt(100000001),
      username: "demo_admin",
      firstName: "Demo",
      lastName: "Admin",
      role: "ADMIN",
    },
  });

  const alice = await prisma.user.upsert({
    where: { telegramId: BigInt(100000002) },
    update: {},
    create: {
      telegramId: BigInt(100000002),
      username: "alice",
      firstName: "Alice",
    },
  });

  const bob = await prisma.user.upsert({
    where: { telegramId: BigInt(100000003) },
    update: {},
    create: { telegramId: BigInt(100000003), username: "bob", firstName: "Bob" },
  });

  // ── Entities ────────────────────────────────────────────────
  async function entity(data: {
    name: string;
    type: "COMPANY" | "SPECIALIST";
    headline?: string;
    location?: string;
    description?: string;
    website?: string;
    isBlacklisted?: boolean;
    blacklistReason?: string;
  }) {
    return prisma.entity.upsert({
      where: { slug: slugify(data.name) },
      update: {},
      create: {
        ...data,
        slug: slugify(data.name),
        status: "APPROVED",
        createdById: admin.id,
      },
    });
  }

  const acme = await entity({
    name: "Acme Capital Group",
    type: "COMPANY",
    headline: "Investment & brokerage firm",
    location: "Dubai, UAE",
    description:
      "A brokerage firm offering investment products. Several disputed accounts about withdrawals.",
    website: "https://example.com",
  });

  const brightbuild = await entity({
    name: "BrightBuild Construction",
    type: "COMPANY",
    headline: "General contractor",
    location: "Warsaw, PL",
    description: "Residential and commercial construction contractor.",
  });

  const john = await entity({
    name: "John Karlsson",
    type: "SPECIALIST",
    headline: "Independent investment broker",
    location: "Dubai, UAE",
    description: "Broker who has worked with multiple investment firms.",
    isBlacklisted: true,
    blacklistReason:
      "Multiple verified reports of taking deposits and disappearing. Covered by local media.",
  });

  const maria = await entity({
    name: "Maria Santos",
    type: "SPECIALIST",
    headline: "Freelance architect",
    location: "Warsaw, PL",
    description: "Architect subcontracting for construction firms.",
  });

  // ── Relations ───────────────────────────────────────────────
  async function relate(
    fromId: string,
    toId: string,
    type:
      | "WORKS_AT"
      | "OWNS"
      | "PARTNER"
      | "FORMER_EMPLOYEE"
      | "AFFILIATE"
      | "ASSOCIATED_WITH"
      | "OTHER",
    note?: string
  ) {
    await prisma.entityRelation.upsert({
      where: {
        fromEntityId_toEntityId_type: { fromEntityId: fromId, toEntityId: toId, type },
      },
      update: {},
      create: { fromEntityId: fromId, toEntityId: toId, type, note: note ?? null },
    });
  }

  await relate(john.id, acme.id, "FORMER_EMPLOYEE", "Worked as a broker 2021–2023");
  await relate(maria.id, brightbuild.id, "WORKS_AT", "Subcontracted architect");

  // ── Reviews (approved) ──────────────────────────────────────
  async function review(data: {
    entityId: string;
    authorId: string;
    rating: number;
    title: string;
    body: string;
    links?: string[];
    mentions?: string[];
  }) {
    return prisma.review.create({
      data: {
        entityId: data.entityId,
        authorId: data.authorId,
        rating: data.rating,
        title: data.title,
        body: data.body,
        status: "APPROVED",
        moderatorId: admin.id,
        moderatedAt: new Date(),
        evidence: {
          create: (data.links ?? ["https://example.com/evidence"]).map((u) => ({
            type: "LINK" as const,
            url: u,
          })),
        },
        mentions: {
          create: (data.mentions ?? []).map((m) => ({ name: m })),
        },
      },
    });
  }

  await review({
    entityId: john.id,
    authorId: alice.id,
    rating: 1,
    title: "Took my deposit and vanished",
    body: "I transferred a deposit for an investment product. After that he stopped responding and blocked me. Reported to authorities.",
    mentions: ["Acme Capital Group"],
  });
  await review({
    entityId: john.id,
    authorId: bob.id,
    rating: 1,
    title: "Same story — no withdrawals",
    body: "Could never withdraw funds. Multiple excuses over months, then silence.",
  });
  await review({
    entityId: acme.id,
    authorId: bob.id,
    rating: 2,
    title: "Slow withdrawals, pushy sales",
    body: "The platform works but withdrawals took weeks and the sales pressure was intense.",
  });
  await review({
    entityId: brightbuild.id,
    authorId: alice.id,
    rating: 4,
    title: "Solid work, minor delays",
    body: "Overall good quality construction. Finished about two weeks late but communication was fine.",
  });
  await review({
    entityId: maria.id,
    authorId: bob.id,
    rating: 5,
    title: "Excellent architect",
    body: "Great designs, responsive, delivered on time. Highly recommend.",
  });

  // ── News / events ───────────────────────────────────────────
  await prisma.newsEvent.create({
    data: {
      entityId: john.id,
      title: "Named in local media fraud investigation",
      body: "Local outlet reported multiple victims alleging investment fraud totalling a large sum.",
      sourceUrl: "https://example.com/news/fraud-investigation",
      createdById: admin.id,
    },
  });

  // ── Recompute ratings ───────────────────────────────────────
  for (const id of [acme.id, brightbuild.id, john.id, maria.id]) {
    const agg = await prisma.review.aggregate({
      where: { entityId: id, status: "APPROVED" },
      _avg: { rating: true },
      _count: { rating: true },
    });
    await prisma.entity.update({
      where: { id },
      data: {
        ratingAvg: agg._avg.rating ?? 0,
        ratingCount: agg._count.rating ?? 0,
      },
    });
  }

  // ── A pending review to demo the moderation queue ───────────
  await prisma.review.create({
    data: {
      entityId: acme.id,
      authorId: alice.id,
      rating: 1,
      title: "Pending example — awaiting moderation",
      body: "This is an example review sitting in the moderation queue so you can try approving/rejecting it in the admin panel.",
      status: "PENDING",
      evidence: { create: [{ type: "LINK", url: "https://example.com/proof" }] },
    },
  });

  console.log("✅ Seed complete.");
  console.log(
    "   Demo admin Telegram ID: 100000001 (add it to BOOTSTRAP_ADMIN_TELEGRAM_IDS to log in as admin, or use your own)."
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
