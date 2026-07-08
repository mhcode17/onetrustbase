"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { recomputeEntityRating } from "@/lib/ratings";
import { newsSchema, relationSchema, blacklistSchema } from "@/lib/validation";
import { uniqueEntitySlug } from "@/lib/slug";
import type { ActionResult } from "./reviews";

async function audit(
  adminId: string,
  action: string,
  targetType: string,
  targetId?: string,
  meta?: unknown
) {
  await prisma.adminAuditLog.create({
    data: {
      adminId,
      action,
      targetType,
      targetId: targetId ?? null,
      meta: meta ? JSON.stringify(meta) : null,
    },
  });
}

// ── Review moderation ─────────────────────────────────────────
export async function moderateReviewAction(
  reviewId: string,
  decision: "APPROVE" | "REJECT",
  note?: string
): Promise<ActionResult> {
  const admin = await requireAdmin();
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: { entity: true },
  });
  if (!review) return { ok: false, error: "Review not found." };

  const status = decision === "APPROVE" ? "APPROVED" : "REJECTED";

  await prisma.review.update({
    where: { id: reviewId },
    data: {
      status,
      moderatorId: admin.id,
      moderationNote: note?.trim() || null,
      moderatedAt: new Date(),
    },
  });

  // If the review proposed a new card, mirror the decision on the card
  // (unless the card was already approved via another review).
  if (review.createdEntity && review.entity.status === "PENDING") {
    await prisma.entity.update({
      where: { id: review.entityId },
      data: { status: decision === "APPROVE" ? "APPROVED" : "REJECTED" },
    });
  } else if (decision === "APPROVE" && review.entity.status !== "APPROVED") {
    await prisma.entity.update({
      where: { id: review.entityId },
      data: { status: "APPROVED" },
    });
  }

  await recomputeEntityRating(review.entityId);
  await audit(admin.id, `review.${decision.toLowerCase()}`, "review", reviewId);

  revalidatePath("/admin");
  revalidatePath(`/entity/${review.entity.slug}`);
  return { ok: true };
}

// ── Blacklist toggle ──────────────────────────────────────────
export async function toggleBlacklistAction(
  formData: FormData
): Promise<ActionResult> {
  const admin = await requireAdmin();
  const parsed = blacklistSchema.safeParse({
    entityId: formData.get("entityId"),
    isBlacklisted: formData.get("isBlacklisted") === "true",
    reason: formData.get("reason") ?? "",
  });
  if (!parsed.success) return { ok: false, error: "Invalid input." };

  const entity = await prisma.entity.update({
    where: { id: parsed.data.entityId },
    data: {
      isBlacklisted: parsed.data.isBlacklisted,
      blacklistReason: parsed.data.reason || null,
    },
  });
  await audit(admin.id, "entity.blacklist", "entity", entity.id, {
    isBlacklisted: parsed.data.isBlacklisted,
  });

  revalidatePath("/admin");
  revalidatePath("/blacklist");
  revalidatePath(`/entity/${entity.slug}`);
  return { ok: true };
}

// ── Entity approval (for user-proposed cards) ─────────────────
export async function setEntityStatusAction(
  entityId: string,
  status: "APPROVED" | "REJECTED" | "PENDING"
): Promise<ActionResult> {
  const admin = await requireAdmin();
  const entity = await prisma.entity.update({
    where: { id: entityId },
    data: { status },
  });
  await audit(admin.id, "entity.status", "entity", entityId, { status });
  revalidatePath("/admin");
  revalidatePath(`/entity/${entity.slug}`);
  return { ok: true };
}

// ── Create / edit entity ──────────────────────────────────────
export async function upsertEntityAction(
  formData: FormData
): Promise<ActionResult> {
  const admin = await requireAdmin();
  const id = (formData.get("id") as string) || "";
  const name = (formData.get("name") as string)?.trim();
  const type = formData.get("type") as "COMPANY" | "SPECIALIST";
  if (!name || !type) return { ok: false, error: "Name and type are required." };

  const fields = {
    name,
    type,
    headline: ((formData.get("headline") as string) || "").trim() || null,
    description: ((formData.get("description") as string) || "").trim() || null,
    location: ((formData.get("location") as string) || "").trim() || null,
    website: ((formData.get("website") as string) || "").trim() || null,
    avatarUrl: ((formData.get("avatarUrl") as string) || "").trim() || null,
    registrationNo:
      ((formData.get("registrationNo") as string) || "").trim() || null,
    aliases: ((formData.get("aliases") as string) || "").trim() || null,
  };

  let slug: string;
  if (id) {
    const updated = await prisma.entity.update({ where: { id }, data: fields });
    slug = updated.slug;
    await audit(admin.id, "entity.update", "entity", id);
  } else {
    slug = await uniqueEntitySlug(name);
    const created = await prisma.entity.create({
      data: { ...fields, slug, status: "APPROVED", createdById: admin.id },
    });
    await audit(admin.id, "entity.create", "entity", created.id);
  }

  revalidatePath("/admin");
  revalidatePath(`/entity/${slug}`);
  return { ok: true, redirect: `/entity/${slug}` };
}

// ── News / events ─────────────────────────────────────────────
export async function addNewsAction(formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const parsed = newsSchema.safeParse({
    entityId: formData.get("entityId"),
    title: (formData.get("title") as string)?.trim(),
    body: (formData.get("body") as string)?.trim(),
    sourceUrl: formData.get("sourceUrl") ?? "",
    eventDate: formData.get("eventDate") ?? "",
  });
  if (!parsed.success) {
    const first = parsed.error.errors[0];
    return { ok: false, error: first?.message ?? "Invalid input." };
  }
  const d = parsed.data;
  const entity = await prisma.entity.findUnique({
    where: { id: d.entityId },
    select: { slug: true },
  });
  await prisma.newsEvent.create({
    data: {
      entityId: d.entityId,
      title: d.title,
      body: d.body,
      sourceUrl: d.sourceUrl || null,
      eventDate: d.eventDate ? new Date(d.eventDate) : new Date(),
      createdById: admin.id,
    },
  });
  await audit(admin.id, "news.create", "entity", d.entityId);
  if (entity) revalidatePath(`/entity/${entity.slug}`);
  revalidatePath("/admin");
  return { ok: true };
}

export async function deleteNewsAction(id: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  const news = await prisma.newsEvent.delete({
    where: { id },
    include: { entity: { select: { slug: true } } },
  });
  await audit(admin.id, "news.delete", "news", id);
  revalidatePath(`/entity/${news.entity.slug}`);
  return { ok: true };
}

// ── Relations ─────────────────────────────────────────────────
export async function addRelationAction(
  formData: FormData
): Promise<ActionResult> {
  const admin = await requireAdmin();
  const parsed = relationSchema.safeParse({
    fromEntityId: formData.get("fromEntityId"),
    toEntityId: formData.get("toEntityId"),
    type: formData.get("type"),
    note: formData.get("note") ?? "",
  });
  if (!parsed.success) return { ok: false, error: "Invalid relation." };
  if (parsed.data.fromEntityId === parsed.data.toEntityId)
    return { ok: false, error: "An entity cannot be related to itself." };

  try {
    await prisma.entityRelation.create({
      data: {
        fromEntityId: parsed.data.fromEntityId,
        toEntityId: parsed.data.toEntityId,
        type: parsed.data.type,
        note: parsed.data.note || null,
      },
    });
  } catch {
    return { ok: false, error: "That relation already exists." };
  }
  await audit(admin.id, "relation.create", "entity", parsed.data.fromEntityId);
  revalidatePath("/admin");
  return { ok: true };
}

export async function deleteRelationAction(id: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  await prisma.entityRelation.delete({ where: { id } });
  await audit(admin.id, "relation.delete", "relation", id);
  revalidatePath("/admin");
  return { ok: true };
}

// ── User management ───────────────────────────────────────────
export async function setUserRoleAction(
  userId: string,
  role: "USER" | "ADMIN"
): Promise<ActionResult> {
  const admin = await requireAdmin();
  await prisma.user.update({ where: { id: userId }, data: { role } });
  await audit(admin.id, "user.role", "user", userId, { role });
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function setUserBanAction(
  userId: string,
  isBanned: boolean
): Promise<ActionResult> {
  const admin = await requireAdmin();
  await prisma.user.update({ where: { id: userId }, data: { isBanned } });
  await audit(admin.id, "user.ban", "user", userId, { isBanned });
  revalidatePath("/admin/users");
  return { ok: true };
}
