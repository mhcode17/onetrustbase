import { z } from "zod";

export const entityTypeSchema = z.enum(["COMPANY", "SPECIALIST"]);

export const mentionSchema = z.object({
  name: z.string().min(1).max(160),
  note: z.string().max(500).optional().or(z.literal("")),
});

// A review submitted against an EXISTING entity.
export const reviewForExistingSchema = z.object({
  mode: z.literal("existing"),
  entityId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().min(4).max(160),
  body: z.string().min(20).max(6000),
  mentions: z.array(mentionSchema).max(20).optional(),
});

// A review that also PROPOSES a new entity (card) not yet in the base.
export const reviewForNewSchema = z.object({
  mode: z.literal("new"),
  newEntityType: entityTypeSchema,
  newEntityName: z.string().min(2).max(160),
  newEntityHeadline: z.string().max(160).optional().or(z.literal("")),
  newEntityLocation: z.string().max(160).optional().or(z.literal("")),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().min(4).max(160),
  body: z.string().min(20).max(6000),
  mentions: z.array(mentionSchema).max(20).optional(),
});

export const submitReviewSchema = z.discriminatedUnion("mode", [
  reviewForExistingSchema,
  reviewForNewSchema,
]);

export type SubmitReviewInput = z.infer<typeof submitReviewSchema>;

export const newsSchema = z.object({
  entityId: z.string().min(1),
  title: z.string().min(4).max(200),
  body: z.string().min(10).max(8000),
  sourceUrl: z.string().url().optional().or(z.literal("")),
  eventDate: z.string().optional(),
});

export const relationSchema = z.object({
  fromEntityId: z.string().min(1),
  toEntityId: z.string().min(1),
  type: z.enum([
    "WORKS_AT",
    "OWNS",
    "PARTNER",
    "FORMER_EMPLOYEE",
    "AFFILIATE",
    "ASSOCIATED_WITH",
    "OTHER",
  ]),
  note: z.string().max(500).optional().or(z.literal("")),
});

export const blacklistSchema = z.object({
  entityId: z.string().min(1),
  isBlacklisted: z.boolean(),
  reason: z.string().max(2000).optional().or(z.literal("")),
});
