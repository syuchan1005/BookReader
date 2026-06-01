FROM oven/bun:1.3.14-slim AS base

LABEL maintainer="syuchan1005<syuchan.dev@gmail.com>"
LABEL name="BookReader"

ENV HUSKY="0"

FROM base AS build-client

ENV NODE_ENV="production"

WORKDIR /build

COPY package.json bun.lock ./
COPY packages/client/package.json packages/client/
COPY packages/common/package.json packages/common/
COPY packages/server/package.json packages/server/
RUN bun install --linker hoisted --frozen-lockfile

COPY packages/client packages/client
COPY packages/common packages/common
RUN bun run build:client && bun run build:storybook

# Result: /build/packages/client/dist

FROM base AS build-server

ENV NODE_ENV="production"

WORKDIR /build

COPY package.json bun.lock ./
COPY packages/client/package.json packages/client/
COPY packages/common/package.json packages/common/
COPY packages/server/package.json packages/server/
RUN bun install --linker hoisted --frozen-lockfile

COPY packages/server packages/server
COPY packages/common packages/common
RUN bun run build:server

# Result: /build/packages/server/dist/index.js
#         /build/packages/server/scripts
#         /build/packages/server/prisma

FROM base

EXPOSE 80

ENV DEBUG="" NODE_ENV="production" PORT=80 HUSKY="0"

RUN apt-get update \
 && apt-get install -y ca-certificates \
 && echo "deb https://deb.debian.org/debian sid main non-free non-free-firmware" > /etc/apt/sources.list \
 && apt-get update \
 && apt-get install -y 7zip 7zip-rar tini openssl \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /bookReader

COPY package.json bun.lock ./
COPY packages/server/package.json packages/server/
COPY packages/client/package.json packages/client/
COPY packages/common/package.json packages/common/
RUN bun install --linker hoisted --frozen-lockfile --production

COPY --from=build-client /build/packages/client/dist public
COPY --from=build-server /build/packages/server/dist/index.js ./
COPY --from=build-server /build/packages/server/scripts scripts
COPY --from=build-server /build/packages/server/prisma prisma
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# "/bookReader/production.sqlite" is file
VOLUME ["/bookReader/storage"]

ENTRYPOINT ["tini", "--", "/bookReader/docker-entrypoint.sh"]
