# ── Сборка фронтенда ─────────────────────────────────────
FROM node:22-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
ENV VITE_API_URL=/api
RUN npm run build

# ── Продакшен-образ ──────────────────────────────────────
FROM node:22-alpine AS production
WORKDIR /app

COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev
COPY backend/ ./
COPY --from=frontend-build /app/frontend/dist ./public

ENV NODE_ENV=production \
    PORT=8080 \
    HOST=0.0.0.0 \
    CORS_ORIGIN=* \
    MIN_BOOKING_HOURS=1 \
    LOG_LEVEL=info

EXPOSE 8080

CMD ["node", "src/index.js"]
