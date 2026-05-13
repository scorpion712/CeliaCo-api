# Production Dockerfile - Simplificado para Render.com
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install production deps ignoring native scripts
RUN npm install --ignore-scripts --legacy-peer-deps --omit=dev

# Copy source
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript
RUN npx tsc

# Security: run as non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app
USER nodejs

# Environment
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Start production server
CMD ["node", "dist/index.js"]