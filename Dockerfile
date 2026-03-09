FROM node:22-alpine AS base

# --- Dependencies ---
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# --- Build ---
FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV DATABASE_URL="file:./prisma/dev.db"
# If you are behind a corporate proxy that intercepts TLS, uncomment the line below.
# A more secure alternative is to COPY your corporate CA cert and RUN update-ca-certificates before this stage (see DOCKER.md).
# ENV NODE_TLS_REJECT_UNAUTHORIZED=0
RUN npx prisma generate
RUN npx prisma migrate deploy
RUN npm run build

# --- Runtime ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV DATABASE_URL="file:/app/data/data.db"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone build
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static

# Copy Prisma schema, migrations, config, and node_modules for runtime migrate deploy
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY --from=build /app/seed.mjs ./seed.mjs

# Copy source code and config for the MCP server
COPY --from=build /app/src ./src
COPY --from=build /app/tsconfig.json ./tsconfig.json
COPY --from=build /app/package.json ./package.json

# Create directory for SQLite data and set ownership
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data /app/prisma

USER nextjs

EXPOSE 3003

ENV PORT=3003
ENV HOSTNAME="0.0.0.0"

CMD ["sh", "-c", "node ./node_modules/prisma/build/index.js migrate deploy && node seed.mjs && node server.js"]
