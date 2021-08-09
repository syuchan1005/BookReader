FROM node:16.6.1-alpine3.14 as build

ENV NODE_ENV="production"

COPY . /build
WORKDIR /build

RUN npm ci --include=dev

#RUN npm run build
RUN mkdir /bookReader \
    && mv packages/client/dist /bookReader/public/ \
    && mv packages/server/dist/index.js /bookReader/ \
    && mv packages/server/prisma/ /bookReader/ \
    && mv packages/server/scripts/ /bookReader/ \
    && mv packages/server/package.json /bookReader/

FROM node:16.6.1-alpine3.14

LABEL maintainer="syuchan1005<syuchan.dev@gmail.com>"
LABEL name="BookReader"

EXPOSE 80

ENV DEBUG="" NODE_ENV="production"

RUN apk add --no-cache supervisor nginx git p7zip

COPY --from=build /bookReader /bookReader

WORKDIR /bookReader

RUN npm install --production && npm run prisma -- generate

COPY nginx.conf /etc/nginx/
COPY supervisord.conf /etc/

COPY docker-entrypoint.sh /bookReader/

RUN chmod +x docker-entrypoint.sh

# "/bookReader/production.sqlite" is file
VOLUME ["/bookReader/storage"]

ENTRYPOINT ["/bookReader/docker-entrypoint.sh"]
