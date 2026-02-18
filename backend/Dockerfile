# Build stage (Debian-based for Prisma compatibility)
FROM node:20-bookworm-slim AS builder

RUN apt-get update \
  && apt-get install -y openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files + prisma first for better caching
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build


# Production stage
FROM node:20-bookworm-slim AS production

RUN apt-get update \
  && apt-get install -y openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files + prisma
COPY package*.json ./
COPY prisma ./prisma/

# Install production dependencies only
RUN npm ci --omit=dev

# Generate Prisma client (in prod image too)
RUN npx prisma generate

# Copy built files from builder
COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production

# Railway provides PORT; keep default for local
ENV PORT=3001
EXPOSE 3001

# Run migrations and start
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]

