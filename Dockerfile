FROM node:16-alpine as build

COPY . /build

WORKDIR /build

ENV NODE_ENV="production"

RUN npm ci --include=dev

RUN npm run build && npm run script:db-migrate production compile
RUN mkdir /bookReader \
    && cp -r packages/client/dist /bookReader/public \
    && cp packages/server/dist/index.js /bookReader/ \
    && mv packages/server/.sequelizerc /bookReader/ \
    && mv packages/server/sequelize.config.js /bookReader/ \
    && mv packages/server/build-migrations /bookReader/ \
    && mv packages/server/scripts/ /bookReader/ \
    && mv packages/server/package.json /bookReader/

RUN cd /bookReader && npm install --force

FROM node:16-alpine

LABEL maintainer="syuchan1005<syuchan.dev@gmail.com>"
LABEL name="BookReader"

EXPOSE 80

ENV DEBUG="" NODE_ENV="production"

RUN apk add --no-cache supervisor nginx git p7zip \
    && mkdir /bookReader

COPY --from=build /bookReader /bookReader

WORKDIR /bookReader

COPY nginx.conf /etc/nginx/
COPY supervisord.conf /etc/

COPY docker-entrypoint.sh /bookReader/

RUN chmod +x docker-entrypoint.sh

# "/bookReader/production.sqlite" is file
VOLUME ["/bookReader/storage"]

ENTRYPOINT ["/bookReader/docker-entrypoint.sh"]
