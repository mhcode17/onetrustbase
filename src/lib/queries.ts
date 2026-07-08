import "server-only";
import { prisma } from "./db";
import type { EntityType, Prisma } from "@prisma/client";

export const entityCardSelect = {
  slug: true,
  name: true,
  type: true,
  headline: true,
  location: true,
  avatarUrl: true,
  isBlacklisted: true,
  ratingAvg: true,
  ratingCount: true,
} satisfies Prisma.EntitySelect;

export interface SearchParams {
  q?: string;
  type?: EntityType | "ALL";
  blacklistedOnly?: boolean;
  take?: number;
}

export async function searchEntities({
  q,
  type = "ALL",
  blacklistedOnly = false,
  take = 40,
}: SearchParams) {
  const where: Prisma.EntityWhereInput = {
    status: "APPROVED",
    ...(type !== "ALL" ? { type } : {}),
    ...(blacklistedOnly ? { isBlacklisted: true } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { aliases: { contains: q, mode: "insensitive" } },
            { headline: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  return prisma.entity.findMany({
    where,
    select: entityCardSelect,
    orderBy: [{ isBlacklisted: "desc" }, { ratingCount: "desc" }, { name: "asc" }],
    take,
  });
}

export async function getEntityBySlug(slug: string) {
  const entity = await prisma.entity.findUnique({
    where: { slug },
    include: {
      reviews: {
        where: { status: "APPROVED" },
        orderBy: { createdAt: "desc" },
        include: {
          author: {
            select: {
              firstName: true,
              lastName: true,
              username: true,
              photoUrl: true,
            },
          },
          evidence: true,
          mentions: {
            include: { linkedEntity: { select: { slug: true, name: true, type: true } } },
          },
        },
      },
      news: { orderBy: { eventDate: "desc" } },
      relationsFrom: {
        include: {
          toEntity: { select: entityCardSelect },
        },
      },
      relationsTo: {
        include: {
          fromEntity: { select: entityCardSelect },
        },
      },
    },
  });
  if (!entity || entity.status !== "APPROVED") return null;
  return entity;
}

export async function getBlacklist() {
  return prisma.entity.findMany({
    where: { status: "APPROVED", isBlacklisted: true },
    select: { ...entityCardSelect, blacklistReason: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getHomeStats() {
  const [companies, specialists, reviews, blacklisted] = await Promise.all([
    prisma.entity.count({ where: { status: "APPROVED", type: "COMPANY" } }),
    prisma.entity.count({ where: { status: "APPROVED", type: "SPECIALIST" } }),
    prisma.review.count({ where: { status: "APPROVED" } }),
    prisma.entity.count({ where: { status: "APPROVED", isBlacklisted: true } }),
  ]);
  return { companies, specialists, reviews, blacklisted };
}

export async function getRecentEntities(take = 6) {
  return prisma.entity.findMany({
    where: { status: "APPROVED" },
    select: entityCardSelect,
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function getTopBlacklisted(take = 4) {
  return prisma.entity.findMany({
    where: { status: "APPROVED", isBlacklisted: true },
    select: entityCardSelect,
    orderBy: { ratingCount: "desc" },
    take,
  });
}
