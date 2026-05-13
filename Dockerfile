# Development Dockerfile
FROM node:20

# Install build tools and dependencies for native modules
RUN apt-get update && apt-get install -y \
    build-essential \
    libcups2-dev \
    libudev-dev \
    pkg-config \
    python3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy only package.json first
COPY package.json ./

# Install with legacy-peer-deps to avoid dependency conflicts
RUN npm install --legacy-peer-deps

# Copy the rest
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
