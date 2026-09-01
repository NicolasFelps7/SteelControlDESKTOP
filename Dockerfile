FROM node:22-bookworm-slim

ENV NODE_ENV=production \
    NPM_CONFIG_UPDATE_NOTIFIER=false

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates openssl \
    && rm -rf /var/lib/apt/lists/*

COPY --chown=node:node backend/package.json backend/package-lock.json ./backend/

RUN cd backend \
    && npm ci --include=dev --no-audit --no-fund

COPY --chown=node:node backend ./backend
COPY --chown=node:node frontend ./frontend

RUN cd backend \
    && npx prisma generate

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["sh", "-c", "cd backend && npx prisma migrate deploy && node src/server.js"]
