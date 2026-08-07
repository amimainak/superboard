# ============================================================
# Superboard — Multi-Stage Production Dockerfile
# ============================================================
# SECURITY: Non-root user, pinned image, minimal attack surface.
# Usage: docker build -t superboard . && docker run -p 443:443 -p 80:80 --env-file .env superboard
# ============================================================

# ---- Stage 1: Dependencies ----
FROM node:24-slim AS deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json bun.lock* package-lock.json* ./
COPY prisma ./prisma/

# Install dependencies
RUN \
  if [ -f bun.lock ]; then \
    npm install -g bun && bun install --frozen-lockfile --production; \
  elif [ -f package-lock.json ]; then \
    npm ci --omit=dev; \
  else \
    npm install --omit=dev; \
  fi

# Generate Prisma client
RUN npx prisma generate

# ---- Stage 2: Build ----
FROM node:24-slim AS builder
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Next.js standalone output
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# ---- Stage 3: Production Runtime ----
FROM node:24-slim AS runner

# SECURITY: Create non-root user
RUN groupadd --gid 1001 appuser && \
    useradd --uid 1001 --gid appuser --shell /bin/sh --create-home appuser

# SECURITY: Set working directory owned by non-root user
WORKDIR /app

# Copy standalone output (contains server.js, node_modules, public)
COPY --from=builder --chown=appuser:appuser /app/.next/standalone ./
COPY --from=builder --chown=appuser:appuser /app/.next/static ./.next/static/
COPY --from=builder --chown=appuser:appuser /app/public ./public/
COPY --from=builder --chown=appuser:appuser /app/prisma ./prisma/

# Copy Caddy config
COPY --from=builder --chown=appuser:appuser /app/Caddyfile ./Caddyfile

# SECURITY: Drop to non-root user
USER appuser

# SECURITY: Bind to unprivileged ports (Caddy needs 443/80 — granted via --cap-add NET_BIND_SERVICE at runtime)
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

EXPOSE 3000 443 80 3001

# HEALTHCHECK: Verify Next.js is responding
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Default: Start Next.js (Caddy should be started separately or via entrypoint)
CMD ["node", "server.js"]
