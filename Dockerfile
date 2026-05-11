# ============================================================
# Dockerfile — debuga-llm-gateway
# ============================================================
# Build:
#   docker build -t debuga-llm-gateway .
#
# Run:
#   docker run -p 3100:3100 --env-file .env debuga-llm-gateway
# ============================================================

FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

COPY tsconfig.json ./
COPY src/ ./src/

RUN npm run build

# ---- Production stage ----
FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --ignore-scripts

COPY --from=builder /app/dist ./dist

EXPOSE 3100

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD wget -qO- http://localhost:3100/health || exit 1

CMD ["node", "dist/index.js"]
