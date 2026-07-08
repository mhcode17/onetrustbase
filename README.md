# GetReport

A community-sourced, admin-moderated platform for reviews on **companies** and **specialists (people)** — with a website, an admin panel, and a Telegram bot, all sharing one database.

- 🔎 Search companies & specialists, view their **card** (rating, verified reviews, evidence, connections, published events).
- 🔗 See **who is connected to whom** (e.g. a specialist who worked at a company).
- 🧾 Submit reviews **with evidence** (screenshots, documents, links) — for existing cards or brand-new ones.
- 🛡️ Every submission is **moderated by an admin** before it goes live.
- 🚫 Dedicated **blacklist** page.
- 📰 Admins can publish **news/events** on any card (e.g. media coverage of a scam).
- 🔐 **Telegram-only sign in** — no passwords, no email.
- 🤖 A **Telegram bot** to search, read and submit reviews from inside Telegram.
- 🌍 Fully in **English**.

Built with **Next.js (App Router) + TypeScript**, **PostgreSQL + Prisma**, **Tailwind CSS**, and **grammY** (Telegram bot).

---

## 1. Prerequisites

- **Node.js 18.18+** (tested on Node 22)
- **PostgreSQL 13+** running locally or in the cloud
- A **Telegram bot** (created via [@BotFather](https://t.me/BotFather)) — needed for login **and** the bot

---

## 2. Install

```bash
npm install
```

> **Note (Windows / low disk space):** if `npm install` fails with `ENOSPC` because your `C:` drive is full, point the npm cache at a drive with free space:
> ```powershell
> npm config set cache "E:\GetReport\.npm-cache"
> ```

---

## 3. Create a Telegram bot

1. Open [@BotFather](https://t.me/BotFather) → `/newbot` → follow the prompts.
2. Copy the **bot token** (looks like `123456789:AA...`).
3. Note the **bot username** (e.g. `GetReportBot`).
4. **Enable Login Widget for your domain** so website sign-in works:
   - In BotFather: `/setdomain` → choose your bot → send your site's domain.
   - For local development send `localhost` (Telegram accepts `http://localhost` for testing). For production send your real domain (e.g. `getreport.example.com`).

---

## 4. Configure environment

Copy the example and fill it in:

```bash
copy .env.example .env   # Windows
# cp .env.example .env    # macOS/Linux
```

| Variable | What it is |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string. |
| `TELEGRAM_BOT_TOKEN` | Bot token from BotFather (login verification + bot). |
| `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` | Bot username **without** the `@`. |
| `SESSION_SECRET` | Long random string used to sign session cookies. Generate with:<br>`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `NEXT_PUBLIC_APP_URL` | Public base URL of the site (no trailing slash). |
| `BOOTSTRAP_ADMIN_TELEGRAM_IDS` | Comma-separated Telegram numeric IDs that become **admins** on first login. Get yours from [@userinfobot](https://t.me/userinfobot). |

---

## 5. Set up the database

Create the database, then apply the schema:

```bash
# create the DB (example using psql)
createdb getreport            # or: CREATE DATABASE getreport; in psql

# apply Prisma schema (creates tables + migration)
npm run db:migrate            # first time: name the migration e.g. "init"

# (optional) load demo data — sample cards, reviews, a blacklist entry, and
# a pending review so you can try the moderation queue
npm run db:seed
```

Other DB commands:

- `npm run db:generate` — regenerate the Prisma client after schema changes
- `npm run db:push` — push schema without a migration (quick prototyping)
- `npm run db:studio` — open Prisma Studio to browse data

---

## 6. Run

Open **two terminals**:

```bash
# Terminal 1 — website + admin + API
npm run dev
# → http://localhost:3000

# Terminal 2 — Telegram bot (long polling)
npm run bot
```

Then:

1. Go to `http://localhost:3000`.
2. Click **Sign in** and authorize with Telegram.
3. To become an admin, put **your** Telegram ID in `BOOTSTRAP_ADMIN_TELEGRAM_IDS` in `.env` and sign in — you'll be promoted automatically. (You can also promote other users from **Admin → Users**.)

---

## 7. How it fits together

```
Website (users)      Admin panel            Telegram bot
   /                    /admin                 grammY (src/bot)
   /search              /admin/entities        search / view / /add
   /entity/[slug]       /admin/relations       submit with photo evidence
   /blacklist           /admin/users
   /submit              (moderation queue)
      \                     |                       /
       \                    |                      /
        └──────────  PostgreSQL (Prisma)  ────────┘
```

- **Auth** — Telegram Login Widget on the web; the signature is verified server-side with your bot token (`src/lib/telegram.ts`). Sessions are signed JWT cookies (`src/lib/session.ts`). The bot uses the Telegram identity directly.
- **Moderation** — user reviews are created with status `PENDING`. Approving a review in the admin queue publishes it (and publishes any brand-new card it proposed). See `src/lib/actions/`.
- **Evidence** — uploaded files are stored under `public/uploads/`. For production, swap `src/lib/uploads.ts` for object storage (S3, etc.).

---

## 8. Key paths

| Path | Purpose |
| --- | --- |
| `prisma/schema.prisma` | Data model (users, entities, relations, reviews, evidence, news, blacklist). |
| `prisma/seed.ts` | Demo data. |
| `src/app` | Website + admin pages + API routes. |
| `src/components` | UI components (design system, cards, forms). |
| `src/lib` | DB client, auth, sessions, Telegram verify, validation, queries. |
| `src/lib/actions` | Server actions (submit review, moderation, admin ops). |
| `src/bot` | Telegram bot (grammY). |

---

## 9. Deploying to production

1. Host PostgreSQL (e.g. Neon, Supabase, RDS) and set `DATABASE_URL`.
2. Run `npm run build` then `npm start` (or deploy to a Node host / Vercel).
3. Run the bot as a separate always-on process: `npm run bot:start`.
4. Set `NEXT_PUBLIC_APP_URL` to your real URL and register that domain in BotFather (`/setdomain`).
5. Move evidence uploads to object storage and put the app behind HTTPS (required for secure cookies).

---

## Notes & safeguards

- Reviews require at least one piece of evidence.
- Admins can blacklist entities (with a public reason), publish events/news, manage connections, and ban abusive users.
- All admin actions are recorded in an `AdminAuditLog` table.
