FROM node:18.8.0-alpine as base

LABEL maintainer="syuchan1005<syuchan.dev@gmail.com>"
LABEL name="BookReader"

FROM base as build-client

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

FROM base as build-server

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

FROM base

EXPOSE 80

ENV DEBUG="" NODE_ENV="production" PORT=80

RUN apk add --no-cache p7zip tini

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

ENTRYPOINT ["/sbin/tini", "--", "/bookReader/docker-entrypoint.sh"]
