import { Bot, InlineKeyboard } from "grammy";
import { prisma } from "../lib/db";
import { env, assertTelegramConfigured } from "../lib/env";
import { uniqueEntitySlug } from "../lib/slug";
import { ensureBotUser } from "./user";
import { downloadTelegramFile } from "./download";

assertTelegramConfigured();

const bot = new Bot(env.TELEGRAM_BOT_TOKEN);
const WEB = env.APP_URL.replace(/\/$/, "");

// ── In-memory draft state for the "add review" flow ───────────
type Step = "search" | "chooseType" | "rating" | "title" | "body" | "evidence";
interface Draft {
  step: Step;
  entityId?: string;
  entityName?: string;
  newType?: "COMPANY" | "SPECIALIST";
  newName?: string;
  rating?: number;
  title?: string;
  body?: string;
  evidence: { type: "IMAGE" | "DOCUMENT" | "LINK"; url: string; caption: string | null }[];
}
const drafts = new Map<number, Draft>();

function stars(n: number) {
  return "★".repeat(n) + "☆".repeat(5 - n);
}

// ── Commands ──────────────────────────────────────────────────
bot.command("start", async (ctx) => {
  if (ctx.from) await ensureBotUser(ctx.from);
  await ctx.reply(
    `👋 <b>Welcome to One Trust Base</b>\n\n` +
      `Search verified reviews on companies and specialists — and add your own.\n\n` +
      `• Just send me a <b>name</b> to search\n` +
      `• /add — submit a new review (with evidence)\n` +
      `• /blacklist — see flagged entities\n` +
      `• /help — all commands\n\n` +
      `Everything you submit is moderated by admins before it goes live.`,
    { parse_mode: "HTML" }
  );
});

bot.command("help", async (ctx) => {
  await ctx.reply(
    `<b>Commands</b>\n\n` +
      `/add — add a review (guided, with photo evidence)\n` +
      `/blacklist — list blacklisted entities\n` +
      `/cancel — cancel the current action\n\n` +
      `Or simply type a <b>name</b> to search the base.`,
    { parse_mode: "HTML" }
  );
});

bot.command("cancel", async (ctx) => {
  if (ctx.from) drafts.delete(ctx.from.id);
  await ctx.reply("Cancelled. Send a name to search, or /add to start again.");
});

bot.command("blacklist", async (ctx) => {
  const items = await prisma.entity.findMany({
    where: { status: "APPROVED", isBlacklisted: true },
    orderBy: { updatedAt: "desc" },
    take: 10,
    select: { name: true, slug: true, type: true, blacklistReason: true },
  });
  if (items.length === 0) {
    await ctx.reply("✅ The blacklist is currently empty.");
    return;
  }
  const kb = new InlineKeyboard();
  let text = "🚫 <b>Blacklist</b>\n\n";
  for (const e of items) {
    text += `• <b>${escape(e.name)}</b>${e.blacklistReason ? ` — ${escape(e.blacklistReason)}` : ""}\n`;
    kb.text(`View ${trim(e.name, 20)}`, `view:${e.slug}`).row();
  }
  await ctx.reply(text, { parse_mode: "HTML", reply_markup: kb });
});

bot.command("add", async (ctx) => {
  if (!ctx.from) return;
  await ensureBotUser(ctx.from);
  drafts.set(ctx.from.id, { step: "search", evidence: [] });
  await ctx.reply(
    "📝 <b>New review</b>\n\nWho is it about? Send the <b>name</b> of the company or specialist. " +
      "If they're not in the base yet, I'll help you add them.\n\nSend /cancel to stop.",
    { parse_mode: "HTML" }
  );
});

// ── Callback queries ──────────────────────────────────────────
bot.callbackQuery(/^view:(.+)$/, async (ctx) => {
  const slug = ctx.match[1];
  await ctx.answerCallbackQuery();
  await sendCard(ctx, slug);
});

bot.callbackQuery(/^pick:(.+)$/, async (ctx) => {
  const id = ctx.match[1];
  const draft = ctx.from ? drafts.get(ctx.from.id) : null;
  await ctx.answerCallbackQuery();
  if (!draft) return;
  const entity = await prisma.entity.findUnique({
    where: { id },
    select: { id: true, name: true },
  });
  if (!entity) return;
  draft.entityId = entity.id;
  draft.entityName = entity.name;
  draft.step = "rating";
  await askRating(ctx);
});

bot.callbackQuery("newentity", async (ctx) => {
  const draft = ctx.from ? drafts.get(ctx.from.id) : null;
  await ctx.answerCallbackQuery();
  if (!draft) return;
  draft.step = "chooseType";
  await ctx.reply(
    "Is this a company or a specialist?",
    {
      reply_markup: new InlineKeyboard()
        .text("🏢 Company", "type:COMPANY")
        .text("👤 Specialist", "type:SPECIALIST"),
    }
  );
});

bot.callbackQuery(/^type:(COMPANY|SPECIALIST)$/, async (ctx) => {
  const draft = ctx.from ? drafts.get(ctx.from.id) : null;
  await ctx.answerCallbackQuery();
  if (!draft) return;
  draft.newType = ctx.match[1] as "COMPANY" | "SPECIALIST";
  draft.step = "rating";
  await askRating(ctx);
});

bot.callbackQuery(/^rate:([1-5])$/, async (ctx) => {
  const draft = ctx.from ? drafts.get(ctx.from.id) : null;
  await ctx.answerCallbackQuery();
  if (!draft) return;
  draft.rating = Number(ctx.match[1]);
  draft.step = "title";
  await ctx.reply(
    `Rating: ${stars(draft.rating)}\n\nNow send a short <b>title</b> for your review.`,
    { parse_mode: "HTML" }
  );
});

bot.callbackQuery("done", async (ctx) => {
  await ctx.answerCallbackQuery();
  await finishDraft(ctx);
});

// ── Message handling (text + photos + documents) ─────────────
bot.on("message", async (ctx) => {
  if (!ctx.from) return;
  const draft = drafts.get(ctx.from.id);

  // Not in a flow → treat text as a search query.
  if (!draft) {
    const q = ctx.message.text?.trim();
    if (!q) return;
    await doSearch(ctx, q);
    return;
  }

  // In a flow.
  switch (draft.step) {
    case "search": {
      const q = ctx.message.text?.trim();
      if (!q) {
        await ctx.reply("Please send a name as text.");
        return;
      }
      draft.newName = q;
      const results = await prisma.entity.findMany({
        where: {
          status: "APPROVED",
          name: { contains: q, mode: "insensitive" },
        },
        select: { id: true, name: true, type: true },
        take: 6,
      });
      const kb = new InlineKeyboard();
      results.forEach((r) =>
        kb.text(`${r.type === "COMPANY" ? "🏢" : "👤"} ${trim(r.name, 30)}`, `pick:${r.id}`).row()
      );
      kb.text(`➕ Add “${trim(q, 24)}” as new`, "newentity");
      await ctx.reply(
        results.length
          ? "I found these. Pick one, or add a new card:"
          : "No match found. Add it as a new card:",
        { reply_markup: kb }
      );
      return;
    }
    case "title": {
      const t = ctx.message.text?.trim();
      if (!t || t.length < 4) {
        await ctx.reply("Title is too short. Please send at least 4 characters.");
        return;
      }
      draft.title = t.slice(0, 160);
      draft.step = "body";
      await ctx.reply("Good. Now send the <b>details</b> of your review (min 20 characters).", {
        parse_mode: "HTML",
      });
      return;
    }
    case "body": {
      const b = ctx.message.text?.trim();
      if (!b || b.length < 20) {
        await ctx.reply("Please provide more detail (at least 20 characters).");
        return;
      }
      draft.body = b.slice(0, 6000);
      draft.step = "evidence";
      await ctx.reply(
        "📎 <b>Evidence required.</b>\n\nSend one or more <b>photos/screenshots</b> or <b>files</b> now. " +
          "You can also paste a <b>link</b> as text. When you're finished, tap Done.",
        {
          parse_mode: "HTML",
          reply_markup: new InlineKeyboard().text("✅ Done", "done"),
        }
      );
      return;
    }
    case "evidence": {
      // Photos
      if (ctx.message.photo?.length) {
        const best = ctx.message.photo[ctx.message.photo.length - 1];
        try {
          const url = await downloadTelegramFile(ctx.api, best.file_id, ".jpg");
          draft.evidence.push({ type: "IMAGE", url, caption: ctx.message.caption ?? null });
          await ctx.reply(`📷 Added (${draft.evidence.length}). Send more, or tap Done.`, {
            reply_markup: new InlineKeyboard().text("✅ Done", "done"),
          });
        } catch {
          await ctx.reply("Couldn't save that image, please try again.");
        }
        return;
      }
      // Documents
      if (ctx.message.document) {
        try {
          const url = await downloadTelegramFile(ctx.api, ctx.message.document.file_id, ".bin");
          draft.evidence.push({
            type: "DOCUMENT",
            url,
            caption: ctx.message.document.file_name ?? null,
          });
          await ctx.reply(`📄 Added (${draft.evidence.length}). Send more, or tap Done.`, {
            reply_markup: new InlineKeyboard().text("✅ Done", "done"),
          });
        } catch {
          await ctx.reply("Couldn't save that file, please try again.");
        }
        return;
      }
      // Text link
      const text = ctx.message.text?.trim();
      if (text && /^https?:\/\//i.test(text)) {
        draft.evidence.push({ type: "LINK", url: text, caption: null });
        await ctx.reply(`🔗 Link added (${draft.evidence.length}). Send more, or tap Done.`, {
          reply_markup: new InlineKeyboard().text("✅ Done", "done"),
        });
        return;
      }
      await ctx.reply("Send a photo, file, or a link (starting with http). Tap Done when finished.", {
        reply_markup: new InlineKeyboard().text("✅ Done", "done"),
      });
      return;
    }
    default:
      await ctx.reply("Use the buttons above, or /cancel to stop.");
  }
});

// ── Helpers ───────────────────────────────────────────────────
async function askRating(ctx: any) {
  const kb = new InlineKeyboard();
  for (let i = 1; i <= 5; i++) kb.text("⭐".repeat(i), `rate:${i}`).row();
  await ctx.reply("How would you rate them? (1 = worst, 5 = best)", { reply_markup: kb });
}

async function doSearch(ctx: any, q: string) {
  const results = await prisma.entity.findMany({
    where: {
      status: "APPROVED",
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { aliases: { contains: q, mode: "insensitive" } },
      ],
    },
    orderBy: [{ isBlacklisted: "desc" }, { ratingCount: "desc" }],
    take: 8,
    select: { name: true, slug: true, type: true, isBlacklisted: true, ratingAvg: true, ratingCount: true },
  });

  if (results.length === 0) {
    await ctx.reply(
      `No results for “${q}”.\n\nWant to add the first review? Use /add.`,
      { reply_markup: new InlineKeyboard().url("Add on the website", `${WEB}/submit`) }
    );
    return;
  }

  const kb = new InlineKeyboard();
  let text = `🔎 Results for “<b>${escape(q)}</b>”:\n\n`;
  for (const r of results) {
    text +=
      `${r.type === "COMPANY" ? "🏢" : "👤"} <b>${escape(r.name)}</b>` +
      `${r.isBlacklisted ? " 🚫" : ""} — ${r.ratingCount ? `${r.ratingAvg.toFixed(1)}★ (${r.ratingCount})` : "no ratings"}\n`;
    kb.text(`View ${trim(r.name, 24)}`, `view:${r.slug}`).row();
  }
  await ctx.reply(text, { parse_mode: "HTML", reply_markup: kb });
}

async function sendCard(ctx: any, slug: string) {
  const entity = await prisma.entity.findUnique({
    where: { slug },
    include: {
      reviews: {
        where: { status: "APPROVED" },
        orderBy: { createdAt: "desc" },
        take: 3,
        include: { author: { select: { firstName: true, username: true } } },
      },
      relationsFrom: { include: { toEntity: { select: { name: true } } } },
      news: { orderBy: { eventDate: "desc" }, take: 2 },
    },
  });
  if (!entity || entity.status !== "APPROVED") {
    await ctx.reply("Card not found.");
    return;
  }

  let text =
    `${entity.type === "COMPANY" ? "🏢" : "👤"} <b>${escape(entity.name)}</b>` +
    `${entity.isBlacklisted ? " 🚫 <b>BLACKLISTED</b>" : ""}\n`;
  if (entity.headline) text += `<i>${escape(entity.headline)}</i>\n`;
  text += `\n⭐ ${entity.ratingCount ? `${entity.ratingAvg.toFixed(1)} / 5 (${entity.ratingCount} reviews)` : "No ratings yet"}\n`;
  if (entity.isBlacklisted && entity.blacklistReason)
    text += `\n🚫 <b>Reason:</b> ${escape(entity.blacklistReason)}\n`;

  if (entity.relationsFrom.length) {
    text += `\n🔗 <b>Connected with:</b> ${entity.relationsFrom
      .map((r) => escape(r.toEntity.name))
      .join(", ")}\n`;
  }

  if (entity.news.length) {
    text += `\n📰 <b>Recent events:</b>\n`;
    for (const n of entity.news) text += `• ${escape(n.title)}\n`;
  }

  if (entity.reviews.length) {
    text += `\n💬 <b>Latest reviews:</b>\n`;
    for (const r of entity.reviews) {
      const who = r.author.firstName ?? (r.author.username ? `@${r.author.username}` : "User");
      text += `\n${stars(r.rating)} — <b>${escape(r.title)}</b>\n<i>${escape(trim(r.body, 160))}</i> — ${escape(who)}\n`;
    }
  } else {
    text += `\nNo reviews yet.`;
  }

  await ctx.reply(text, {
    parse_mode: "HTML",
    reply_markup: new InlineKeyboard()
      .url("🌐 Open full card", `${WEB}/entity/${entity.slug}`)
      .row()
      .url("➕ Add a review", `${WEB}/submit?entity=${entity.slug}`),
  });
}

async function finishDraft(ctx: any) {
  if (!ctx.from) return;
  const draft = drafts.get(ctx.from.id);
  if (!draft) return;

  if (draft.step !== "evidence") {
    await ctx.reply("Finish the previous steps first, or /cancel.");
    return;
  }
  if (!draft.rating || !draft.title || !draft.body) {
    await ctx.reply("Your review is incomplete. Please /cancel and start again.");
    return;
  }
  if (draft.evidence.length === 0) {
    await ctx.reply("⚠️ At least one piece of evidence is required. Send a photo, file or link.");
    return;
  }

  const user = await ensureBotUser(ctx.from);

  let entityId = draft.entityId;
  let createdEntity = false;
  if (!entityId) {
    const slug = await uniqueEntitySlug(draft.newName ?? "entity");
    const created = await prisma.entity.create({
      data: {
        type: draft.newType ?? "SPECIALIST",
        name: draft.newName ?? "Unknown",
        slug,
        status: "PENDING",
        createdById: user.id,
      },
    });
    entityId = created.id;
    createdEntity = true;
  }

  await prisma.review.create({
    data: {
      entityId,
      authorId: user.id,
      rating: draft.rating,
      title: draft.title,
      body: draft.body,
      status: "PENDING",
      createdEntity,
      evidence: { create: draft.evidence },
    },
  });

  drafts.delete(ctx.from.id);
  await ctx.reply(
    "✅ <b>Thank you!</b>\n\nYour review has been submitted and is now <b>pending admin review</b>. " +
      "Once approved, it will appear on the card.",
    { parse_mode: "HTML" }
  );
}

function escape(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function trim(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

// ── Boot ──────────────────────────────────────────────────────
bot.catch((err) => {
  console.error("Bot error:", err);
});

async function main() {
  await bot.api.setMyCommands([
    { command: "add", description: "Add a review (with evidence)" },
    { command: "blacklist", description: "See blacklisted entities" },
    { command: "help", description: "Show help" },
    { command: "cancel", description: "Cancel current action" },
  ]);
  console.log("🤖 One Trust Base bot starting (long polling)…");
  await bot.start();
}

main().catch((e) => {
  console.error("Failed to start bot:", e);
  process.exit(1);
});
