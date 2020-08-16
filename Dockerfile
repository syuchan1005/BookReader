FROM node:12.16.1-alpine3.11 as build

COPY . /build

WORKDIR /build

RUN npm ci \
    && npm run build && npm run script:db-migrate production compile \
    && mkdir /bookReader \
    && mkdir /bookReader/src \
    && mv dist/ /bookReader/ \
    && cp -r /bookReader/dist/client /bookReader/public/ \
    && mv src/server/ /bookReader/src/server/ \
    && mv .sequelizerc /bookReader/ \
    && mv build-migrations /bookReader \
    && mv scripts/ /bookReader/scripts \
    && mv package.json /bookReader/ \
    && mv package-lock.json /bookReader/

FROM node:12.16.1-alpine3.11

LABEL maintainer="syuchan1005<syuchan.dev@gmail.com>"
LABEL name="BookReader"

EXPOSE 80

ENV DEBUG=""

RUN apk add --no-cache supervisor nginx graphicsmagick libwebp-tools git \
    && mkdir /bookReader

COPY --from=build ["/bookReader/package.json", "/bookReader/package-lock.json", "/bookReader/"]

WORKDIR /bookReader

RUN npm ci

COPY nginx.conf /etc/nginx/
COPY supervisord.conf /etc/

COPY --from=build /bookReader /bookReader

COPY docker-entrypoint.sh /bookReader/

RUN chmod +x docker-entrypoint.sh

# "/bookReader/production.sqlite" is file
VOLUME ["/bookReader/storage"]

ENTRYPOINT ["/bookReader/docker-entrypoint.sh"]
