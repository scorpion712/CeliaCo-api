# Production Dockerfile - Optimizado para Render.com
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --only=production

# Copy source and build
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript
RUN npx tsc

# Final stage - Alpine para imagen más pequeña
FROM node:20-alpine

WORKDIR /app

# Copy only production files
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Copy built files
COPY --from=builder /app/dist ./dist

# Security: run as non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
USER nodejs

# Environment
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Start production server
CMD ["node", "dist/index.js"]