# One Trust Base — single image used for BOTH the web app and the bot worker.
# The web service runs `npm start`; the bot worker overrides the command
# with `npm run bot:start` (see docker-compose.yml / .do/app.yaml).

FROM node:22-bookworm-slim AS base
WORKDIR /app
# Prisma needs OpenSSL at build & runtime.
RUN apt-get update -y && apt-get install -y openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# ── Dependencies ──────────────────────────────────────────────
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci

# ── Build ─────────────────────────────────────────────────────
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
# A DATABASE_URL is not needed at build time (all data pages are dynamic).
RUN npm run build

# ── Runner ────────────────────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy everything needed to run the app, the bot, and prisma migrate.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.mjs ./next.config.mjs
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/src ./src

# Evidence uploads live here; mount a volume in production to persist them.
RUN mkdir -p public/uploads

EXPOSE 3000

# Default command = web app. Applies pending DB migrations first.
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
