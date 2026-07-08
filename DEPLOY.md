# Deploying GetReport

This covers pushing to **GitHub** and deploying to **DigitalOcean**, via either a
**Droplet** (Docker Compose — recommended for this app) or **App Platform**.

---

## Prerequisites on your machine

You currently don't have `git` installed. Install one of:

- **Git for Windows**: <https://git-scm.com/download/win> (or `winget install Git.Git`)
- Optional: **GitHub CLI** `gh` (`winget install GitHub.cli`) — makes creating the repo one command.
- For App Platform / droplet automation: **doctl** (`winget install DigitalOcean.doctl`).

> ⚠️ Your `C:` drive is full (0 GB free). Free up space first, or install Git as
> **PortableGit** onto `E:` and add it to `PATH` — installers default to `C:`.

---

## 1. Push to GitHub

```powershell
cd E:\GetReport
git init
git add .
git commit -m "Initial commit: GetReport platform"
git branch -M main

# Option A — with GitHub CLI (creates the repo and pushes):
gh repo create getreport --private --source=. --remote=origin --push

# Option B — manually: create an empty repo on github.com first, then:
git remote add origin https://github.com/<YOUR_USER>/getreport.git
git push -u origin main
```

`.env` and `node_modules` are already git-ignored, so no secrets are committed.

---

## 2A. Deploy to a DigitalOcean Droplet (recommended)

The app stores uploaded evidence on disk; Docker Compose keeps it on a shared,
persistent volume — so this path needs **no code changes**.

1. Create an Ubuntu droplet (2 GB RAM is comfortable). Add your SSH key.
2. SSH in and install Docker:
   ```bash
   curl -fsSL https://get.docker.com | sh
   ```
3. Get the code and configure env:
   ```bash
   git clone https://github.com/<YOUR_USER>/getreport.git
   cd getreport
   cp .env.example .env
   nano .env   # set TELEGRAM_BOT_TOKEN, SESSION_SECRET, NEXT_PUBLIC_APP_URL, admin IDs
   ```
   Leave `DATABASE_URL` as-is — Compose provides the `db` service.
   Also set `POSTGRES_PASSWORD` in `.env` to something strong.
4. Launch:
   ```bash
   docker compose up -d --build
   docker compose exec web npm run db:seed   # optional demo data
   ```
5. Point your domain at the droplet and put **Nginx or Caddy** in front of
   port 3000 for HTTPS (required so Telegram login cookies work). Then set that
   HTTPS domain in BotFather via `/setdomain`.

Logs: `docker compose logs -f web bot`

---

## 2B. Deploy to DigitalOcean App Platform

Uses `.do/app.yaml` (managed Postgres + web service + bot worker + migrate job).

```bash
doctl apps create --spec .do/app.yaml
```

Then in the dashboard set the encrypted secrets `TELEGRAM_BOT_TOKEN` and
`SESSION_SECRET`, and edit `.do/app.yaml` to point at your GitHub repo and app
domain.

> **Important caveat:** App Platform filesystems are ephemeral and **not shared**
> between the web and worker components. Evidence files uploaded through the
> website would be lost on redeploy and invisible to the bot. Before using App
> Platform in production, switch `src/lib/uploads.ts` (and the bot's
> `src/bot/download.ts`) to upload to **DigitalOcean Spaces / S3** and store the
> resulting URL. Until then, prefer the Droplet path above.

---

## After deploy — checklist

- [ ] `NEXT_PUBLIC_APP_URL` matches your real HTTPS URL.
- [ ] BotFather `/setdomain` set to that domain (Telegram login).
- [ ] Your Telegram ID is in `BOOTSTRAP_ADMIN_TELEGRAM_IDS` so you become admin.
- [ ] Bot process is running (`docker compose logs bot` / App Platform worker logs).
- [ ] HTTPS is active (secure session cookies).
