# syntax=docker/dockerfile:1
# Tek imaj, üç komut: API (varsayılan), worker, migration. Ayrıntı: docs/dağıtım.md, docs/adr/0018.

FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Arayüz + API paketi (npm run build), ardından worker ve migration CLI'ı ayrı ESM paketleri olarak derlenir
# (üretim imajında tsx/devDependencies yok).
RUN npm run build \
 && npx esbuild server/jobs/worker.ts --bundle --platform=node --format=esm --packages=external \
      --sourcemap --outfile=dist/worker.mjs \
 && npx esbuild server/db/cli.ts --bundle --platform=node --format=esm --packages=external \
      --sourcemap --outfile=dist/db-cli.mjs \
 && cp -r server/db/migrations dist/migrations

FROM node:22-slim AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:22-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
# node imajındaki root olmayan "node" kullanıcısı
USER node
EXPOSE 3000
# API; worker için: node dist/worker.mjs — migration için: node dist/db-cli.mjs migrate
CMD ["node", "dist/server.cjs"]
