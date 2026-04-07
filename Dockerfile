FROM node:20-bookworm-slim AS base

ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runtime
ENV NODE_ENV=production
ENV PORT=3000

RUN useradd --system --uid 1001 --create-home nextjs

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/.next ./.next
COPY next.config.mjs ./
COPY scripts ./scripts
COPY src ./src
COPY tsconfig.json ./tsconfig.json

RUN chown -R nextjs:nextjs /app

USER nextjs

EXPOSE 3000

CMD ["npm", "run", "start"]
