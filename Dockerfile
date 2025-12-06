FROM node:25.2.1-slim AS base

LABEL maintainer="syuchan1005<syuchan.dev@gmail.com>"
LABEL name="BookReader"

FROM base AS build-client

ENV NODE_ENV="production"

WORKDIR /build

COPY package*.json ./
COPY packages/client/package*.json packages/client/
COPY packages/common/package*.json packages/common/
RUN npm ci --include=dev

COPY packages/client packages/client
COPY packages/common packages/common
RUN npm run build:client && npm run build:storybook

# Result: /build/packages/client/dist

FROM base AS build-server

ENV NODE_ENV="production"

WORKDIR /build

COPY package*.json ./
COPY packages/server/package*.json packages/server/
COPY packages/common/package*.json packages/common/
RUN npm ci --include=dev

COPY packages/server packages/server
COPY packages/common packages/common
RUN npm run build:server

# Result: /build/packages/server/dist/index.js
#         /build/packages/server/scripts
#         /build/packages/server/prisma

FROM oven/bun:1.3.1-slim AS bun

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

COPY packages/server/package.json packages/server/
COPY packages/client/package.json packages/client/
COPY packages/common/package.json packages/common/
COPY package.json ./
RUN bun install --linker hoisted --frozen-lockfile
RUN rm package*.json && cp packages/server/package.json . && \
    cp -a packages/server/node_modules/* node_modules/ && \
    rm -rf packages

COPY --from=build-client /build/packages/client/dist public
COPY --from=build-server /build/packages/server/dist/index.js ./
COPY --from=build-server /build/packages/server/scripts scripts
COPY --from=build-server /build/packages/server/prisma prisma
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# "/bookReader/production.sqlite" is file
VOLUME ["/bookReader/storage"]

ENTRYPOINT ["tini", "--", "/bookReader/docker-entrypoint.sh"]

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

COPY packages/server/package.json packages/server/
COPY package*.json ./
RUN npm ci
RUN cp -a packages/server/node_modules/* node_modules/ && \
    rm package*.json && cp packages/server/package.json . && rm -rf packages

COPY --from=build-client /build/packages/client/dist public
COPY --from=build-server /build/packages/server/dist/index.js ./
COPY --from=build-server /build/packages/server/scripts scripts
COPY --from=build-server /build/packages/server/prisma prisma
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# "/bookReader/production.sqlite" is file
VOLUME ["/bookReader/storage"]

ENTRYPOINT ["tini", "--", "/bookReader/docker-entrypoint.sh"]
