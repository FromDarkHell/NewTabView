# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts
RUN npm ci

FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# NEXT_PUBLIC_* values are baked in at build time; pass via --build-arg
# (or docker-compose's `build.args`) if the Trello integration is used.
ARG NEXT_PUBLIC_TRELLO_API_KEY=""
ENV NEXT_PUBLIC_TRELLO_API_KEY=${NEXT_PUBLIC_TRELLO_API_KEY}
RUN npx prisma generate
RUN npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Embedded Postgres + Redis, used only when DATABASE_URL / REDIS_URL are not
# supplied at runtime (see docker/entrypoint.sh).
RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql \
    openssl \
    redis-server \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

VOLUME ["/data"]
EXPOSE 3000

ENTRYPOINT ["entrypoint.sh"]
CMD ["npm", "start"]
