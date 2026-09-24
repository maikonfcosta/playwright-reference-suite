FROM oven/bun:1.3-debian

RUN apt-get update \
 && apt-get install -y --no-install-recommends git ca-certificates \
 && rm -rf /var/lib/apt/lists/*

ARG API_REPO=https://github.com/realworld-apps/nitro-prisma-zod-realworld-example-app.git
ARG API_REF=c8c66858a436a6e07f445fffe2253a65ff6dcb58

WORKDIR /app
RUN git init -q . \
 && git remote add origin "$API_REPO" \
 && git fetch -q --depth 1 origin "$API_REF" \
 && git checkout -q FETCH_HEAD

RUN bun install --frozen-lockfile \
 && bun run prepare \
 && bun run db:generate \
 && bun run build

ENV DATABASE_URL=file:/data/conduit.db \
    PORT=3000
EXPOSE 3000

# Schema is pushed on start so every container begins with an empty database.
CMD ["sh", "-c", "mkdir -p /data && bun x prisma db push && bun .output/server/index.mjs"]
