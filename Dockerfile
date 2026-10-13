# =============================================================================
# FG DRIVO MOBILITY PLATFORM — PRODUCTION DOCKERFILE
# =============================================================================
# Multi-stage container for single-port unified deployment
# Compatible with Google Cloud Run, AWS ECS/Lightsail, Railway, Render, Fly.io
# =============================================================================

FROM node:20-alpine AS runner

WORKDIR /app

# 1. Install production dependencies
COPY package*.json ./
RUN npm ci --include=dev

# 2. Copy source code
COPY . .

# 3. Compile optimized production frontend bundle (Vite)
RUN npm run build

# 4. Set runtime environment
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=5000

EXPOSE 5000

# 5. Launch unified server
CMD ["npm", "start"]
