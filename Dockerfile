FROM node:12.7-alpine as build

COPY . /build

WORKDIR /build

RUN npm ci && npm run build \
    && mkdir /bookReader \
    && mkdir /bookReader/src \
    && mv dist/ /bookReader/ \
    && mv src/server/ /bookReader/src/server/ \
    && mv .sequelizerc /bookReader/ \
    && mv package.json /bookReader/ \
    && mv package-lock.json /bookReader/

FROM node:12.7-alpine

LABEL maintainer="syuchan1005<syuchan.dev@gmail.com>"
LABEL name="BookReader"

COPY --from=build /bookReader /bookReader

WORKDIR /bookReader

RUN npm ci

CMD npm run db:migrate -- --env production; npm run start
