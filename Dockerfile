FROM node:22-bookworm-slim

ENV NODE_ENV=production \
    NPM_CONFIG_UPDATE_NOTIFIER=false

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates openssl \
    && rm -rf /var/lib/apt/lists/*

COPY backend/package.json backend/package-lock.json ./backend/

RUN cd backend \
    && npm ci --include=dev --no-audit --no-fund

COPY backend ./backend
COPY frontend ./frontend
COPY tools ./tools

RUN cd backend \
    && npx prisma generate

EXPOSE 3000

CMD ["sh", "-c", "cd backend && npx prisma migrate deploy && node src/server.js"]
