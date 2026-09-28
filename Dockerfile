# Multi-stage Dockerfile for VoxCanvas (Frontend + Socket.IO Relay)
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set dummy key for build phase to prevent build errors
ENV GEMINI_API_KEY=build_placeholder
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV SYNC_PORT=4001

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/src/server ./src/server
COPY --from=builder /app/src/types ./src/types

USER nextjs

EXPOSE 3000 4001

# Entrypoint script running both Next.js and Socket.IO sync server concurrently
CMD ["sh", "-c", "npx tsx src/server/syncServer.ts & npx next start -p 3000"]
