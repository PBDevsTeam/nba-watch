# syntax=docker/dockerfile:1
# NBA Watch na Coolify: Next.js 16 w trybie standalone, bez bazy danych.

# ─── zależności ───────────────────────────────────────────────────────────────
FROM node:24-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ─── build ────────────────────────────────────────────────────────────────────
FROM node:24-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1

# Adres strony trafia do metadanych, sitemap i robots już przy budowaniu.
ARG NEXT_PUBLIC_SITE_URL="https://nba-watch.pbdevs.com"
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL

# Build nie odpytuje ESPN: strony z danymi renderują się przy żądaniu.
RUN npm run build

# ─── uruchomienie ─────────────────────────────────────────────────────────────
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -g 1001 -S nodejs && adduser -u 1001 -S nextjs -G nodejs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --chown=nextjs:nodejs scripts/rozgrzej.mjs ./rozgrzej.mjs

# Tu Next trzyma cache danych (oceny meczów). W Coolify podpinamy pod ten katalog
# trwały wolumen, żeby oceny przetrwały kolejne wdrożenia.
RUN mkdir -p .next/cache && chown -R nextjs:nodejs .next/cache

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/offline > /dev/null || exit 1

CMD ["node", "server.js"]
