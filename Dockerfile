FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

FROM base AS client-build
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile --ignore-scripts
COPY public ./public
COPY src ./src
COPY tailwind.config.js ./
RUN pnpm run client:build

FROM base AS server-deps
WORKDIR /app/server
COPY server/package.json server/pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
ENV PORT=4000
ENV DB_PATH=/data/blog.db
WORKDIR /app

COPY --from=server-deps /app/server/node_modules ./server/node_modules
COPY server/package.json ./server/
COPY server/src ./server/src
COPY Data ./Data
COPY --from=client-build /app/build ./build

RUN mkdir -p /data && chown -R node:node /data /app
USER node

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:4000/api/health || exit 1

CMD ["node", "server/src/index.js"]
