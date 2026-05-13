# ============================================
# STAGE 1: Build — compilar TypeScript
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency files
COPY package.json yarn.lock ./

# Install ALL deps (ignorando scripts nativos — en Render no hay impresoras/USB)
RUN yarn install --ignore-scripts

# Copy source code
COPY . .

# Build: tsc → genera dist/
RUN yarn build

# ============================================
# STAGE 2: Production — solo lo necesario
# ============================================
FROM node:20-alpine

WORKDIR /app

# Copy compiled output
COPY --from=builder /app/dist ./dist

# Copy node_modules completo (sin native bindings, todo pure JS)
COPY --from=builder /app/node_modules ./node_modules

# Security: run as non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app
USER nodejs

# Environment
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Start the server
CMD ["node", "dist/index.js"]
