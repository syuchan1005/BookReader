FROM node:16.7.0-alpine as build

ENV NODE_ENV="production"

WORKDIR /build

COPY package*.json ./
COPY packages/client/package*.json packages/client/
COPY packages/common/package*.json packages/common/
COPY packages/graphql/package*.json packages/graphql/
COPY packages/server/package*.json packages/server/
RUN npm ci --include=dev

COPY packages/server/package*.json /bookReader/
RUN cd /bookReader && npm install

COPY . .
RUN npm run build

RUN cp -r packages/client/dist /bookReader/public \
    && cp packages/server/dist/index.js /bookReader/ \
    && mv packages/server/scripts/ /bookReader/ \
    && mv packages/server/prisma /bookReader/ \
    && mkdir /bookReader/src \
    && mv packages/server/src/FeatureFlag.js /bookReader/src/

FROM node:16.7.0-alpine

LABEL maintainer="syuchan1005<syuchan.dev@gmail.com>"
LABEL name="BookReader"

EXPOSE 80

ENV DEBUG="" NODE_ENV="production"

RUN apk add --no-cache supervisor nginx git p7zip

WORKDIR /bookReader

COPY nginx.conf /etc/nginx/
COPY supervisord.conf /etc/
COPY docker-entrypoint.sh ./

RUN chmod +x docker-entrypoint.sh

COPY --from=build /bookReader ./

# "/bookReader/production.sqlite" is file
VOLUME ["/bookReader/storage"]

ENTRYPOINT ["/bookReader/docker-entrypoint.sh"]
