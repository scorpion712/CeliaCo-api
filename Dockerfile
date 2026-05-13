# Production Dockerfile - Usando yarn y ts-node
FROM node:20-alpine

WORKDIR /app

# yarn already exists in node:20-alpine

# Copy package files
COPY package.json yarn.lock ./

# Install production deps ignoring native scripts
RUN yarn install --ignore-scripts --production

# Copy all source
COPY . .

# Security: run as non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app
USER nodejs

# Environment
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Start with ts-node directly (no build needed)
CMD ["npx", "ts-node", "src/index.ts"]