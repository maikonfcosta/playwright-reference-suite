FROM oven/bun:1.3-debian AS build

RUN apt-get update \
 && apt-get install -y --no-install-recommends git ca-certificates \
 && rm -rf /var/lib/apt/lists/*

ARG WEB_REPO=https://github.com/realworld-apps/angular-realworld-example-app.git
ARG WEB_REF=dd99ed2cf39c805d719f943c5d7061a5683d98a8

WORKDIR /app
RUN git init -q . \
 && git remote add origin "$WEB_REPO" \
 && git fetch -q --depth 1 origin "$WEB_REF" \
 && git checkout -q FETCH_HEAD \
 && git submodule update -q --init --depth 1

# Upstream calls the public API directly. Point it to /api so nginx can proxy to our container.
RUN sed -i 's#https://api.realworld.show/api#/api#' src/app/core/interceptors/api.interceptor.ts \
 && grep -q '`/api${req.url}`' src/app/core/interceptors/api.interceptor.ts

RUN bun install --frozen-lockfile && bun run build

FROM nginx:1.27-alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/angular-conduit/browser /usr/share/nginx/html
