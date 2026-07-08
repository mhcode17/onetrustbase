"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { uniqueEntitySlug } from "@/lib/slug";
import { saveEvidenceFiles } from "@/lib/uploads";
import { submitReviewSchema } from "@/lib/validation";

export interface ActionResult {
  ok: boolean;
  error?: string;
  redirect?: string;
}

export async function submitReviewAction(
  formData: FormData
): Promise<ActionResult> {
  const user = await requireUser("/submit");
  if (user.isBanned) return { ok: false, error: "Your account is suspended." };

  // Parse mentions (JSON) and evidence links (JSON).
  let mentions: { name: string; note?: string }[] = [];
  try {
    const raw = formData.get("mentions");
    if (typeof raw === "string" && raw) mentions = JSON.parse(raw);
  } catch {
    /* ignore malformed mentions */
  }

  let evidenceLinks: string[] = [];
  try {
    const raw = formData.get("evidenceLinks");
    if (typeof raw === "string" && raw) evidenceLinks = JSON.parse(raw);
  } catch {
    /* ignore */
  }

  const mode = formData.get("mode");
  const base = {
    rating: formData.get("rating"),
    title: (formData.get("title") as string)?.trim(),
    body: (formData.get("body") as string)?.trim(),
    mentions,
  };

  const parsed = submitReviewSchema.safeParse(
    mode === "new"
      ? {
          mode: "new",
          newEntityType: formData.get("newEntityType"),
          newEntityName: (formData.get("newEntityName") as string)?.trim(),
          newEntityHeadline: (formData.get("newEntityHeadline") as string) ?? "",
          newEntityLocation: (formData.get("newEntityLocation") as string) ?? "",
          ...base,
        }
      : {
          mode: "existing",
          entityId: formData.get("entityId"),
          ...base,
        }
  );

  if (!parsed.success) {
    const first = parsed.error.errors[0];
    return {
      ok: false,
      error: first ? `${first.path.join(".")}: ${first.message}` : "Invalid input.",
    };
  }
  const data = parsed.data;

  // Require at least one piece of evidence (file or link).
  const files = formData
    .getAll("files")
    .filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0 && evidenceLinks.length === 0) {
    return {
      ok: false,
      error: "Please attach at least one piece of evidence (a screenshot, document, or link).",
    };
  }

  // Resolve / create the target entity.
  let entityId: string;
  let createdEntity = false;
  if (data.mode === "existing") {
    const entity = await prisma.entity.findUnique({
      where: { id: data.entityId },
      select: { id: true, status: true },
    });
    if (!entity) return { ok: false, error: "That card no longer exists." };
    entityId = entity.id;
  } else {
    const slug = await uniqueEntitySlug(data.newEntityName);
    const created = await prisma.entity.create({
      data: {
        type: data.newEntityType,
        name: data.newEntityName,
        slug,
        headline: data.newEntityHeadline || null,
        location: data.newEntityLocation || null,
        status: "PENDING", // becomes visible only after an admin approves it
        createdById: user.id,
      },
    });
    entityId = created.id;
    createdEntity = true;
  }

  // Save evidence files to disk.
  let savedFiles;
  try {
    savedFiles = await saveEvidenceFiles(files);
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to save evidence.",
    };
  }

  // Persist the review + evidence + mentions in one transaction.
  await prisma.review.create({
    data: {
      entityId,
      authorId: user.id,
      rating: data.rating,
      title: data.title,
      body: data.body,
      status: "PENDING",
      createdEntity,
      evidence: {
        create: [
          ...savedFiles.map((f) => ({
            type: f.type,
            url: f.url,
            caption: f.caption,
          })),
          ...evidenceLinks
            .filter((u) => /^https?:\/\//i.test(u))
            .map((u) => ({ type: "LINK" as const, url: u, caption: null })),
        ],
      },
      mentions: {
        create: mentions
          .filter((m) => m.name?.trim())
          .map((m) => ({ name: m.name.trim(), note: m.note?.trim() || null })),
      },
    },
  });

  revalidatePath("/admin");
  return {
    ok: true,
    redirect: "/submit/thanks",
  };
}
