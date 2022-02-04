FROM node:17.1.0-alpine as build

ENV NODE_ENV="production"

WORKDIR /build

RUN apk add --no-cache \
      build-base \
      g++ \
      cairo-dev \
      jpeg-dev \
      pango-dev \
      giflib-dev

COPY package*.json ./
COPY packages/client/package*.json packages/client/
COPY packages/common/package*.json packages/common/
COPY packages/graphql/package*.json packages/graphql/
COPY packages/server/package*.json packages/server/
COPY packages/server/package*.json /bookReader/
RUN npm ci --include=dev && \
    cd /bookReader && npm install

COPY packages packages
RUN npm run build

RUN cp -r packages/client/dist /bookReader/public \
    && cp packages/server/dist/index.js /bookReader/ \
    && mv packages/server/scripts /bookReader/ \
    && mv packages/server/prisma /bookReader/ \
    && mv packages/server/assets /bookReader/ \
    && mkdir /bookReader/src \
    && mv packages/server/src/FeatureFlag.js /bookReader/src/

FROM node:17.1.0-alpine

LABEL maintainer="syuchan1005<syuchan.dev@gmail.com>"
LABEL name="BookReader"

EXPOSE 80

ENV DEBUG="" NODE_ENV="production"

RUN apk add --no-cache supervisor nginx git p7zip \
# node-canvas deps
    cairo-dev jpeg-dev pango-dev giflib-dev

WORKDIR /bookReader

COPY nginx.conf /etc/nginx/
COPY supervisord.conf /etc/
COPY docker-entrypoint.sh ./

RUN chmod +x docker-entrypoint.sh

COPY --from=build /bookReader ./

# "/bookReader/production.sqlite" is file
VOLUME ["/bookReader/storage"]

ENTRYPOINT ["/bookReader/docker-entrypoint.sh"]
