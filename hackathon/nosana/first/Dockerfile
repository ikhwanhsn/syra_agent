# syntax=docker/dockerfile:1
# Linux image suitable for Nosana nodes (matches official challenge pattern).

FROM node:23-slim AS base

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    git \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV ELIZAOS_TELEMETRY_DISABLED=true
ENV DO_NOT_TRACK=1

WORKDIR /app

RUN npm install -g pnpm@9

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile || pnpm install

COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN pnpm run build

COPY nos_job_def ./nos_job_def

RUN mkdir -p /app/data

EXPOSE 3000
ENV NODE_ENV=production
ENV SERVER_PORT=3000

CMD ["pnpm", "run", "start"]
