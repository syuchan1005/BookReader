# Book Reader

[![MIT License](http://img.shields.io/badge/license-MIT-blue.svg?style=flat)](LICENSE)

[![Maintainability](https://api.codeclimate.com/v1/badges/04ab4b9a433f4a70efae/maintainability)](https://codeclimate.com/github/syuchan1005/BookReader/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/04ab4b9a433f4a70efae/test_coverage)](https://codeclimate.com/github/syuchan1005/BookReader/test_coverage)

[![GitHub Actions](https://github.com/syuchan1005/BookReader/workflows/Docker%20Image%20CI/badge.svg)](https://github.com/syuchan1005/BookReader/actions)

[![Docker Hub Version](https://img.shields.io/badge/dynamic/json?color=0db7ed&label=Docker%20Hub&query=results.0.name&url=https%3A%2F%2Fregistry.hub.docker.com%2Fv2%2Frepositories%2Fsyuchan1005%2Fbook_reader%2Ftags%2F)](https://hub.docker.com/r/syuchan1005/book_reader)

[![dockeri.co](https://dockeri.co/image/syuchan1005/book_reader)](https://hub.docker.com/r/syuchan1005/book_reader)

<img src="https://github.com/syuchan1005/BookReader/raw/develop/screenshots/top.jpg" alt="top" width="80%"/>

## how to use?

> when you use v1.0.5, please run this 
> `$ node scripts/removeCacheInBefore.js`


```shell script
$ echo '' > {FOLDER_PATH}/production.sqlite
$ docker run \
  --name book_reader \
  -p 80 \
  -v {FOLDER_PATH}/storage:/bookReader/storage \
  -v {FOLDER_PATH}/downloads:/bookReader/downloads \
  -v {FOLDER_PATH}/production.sqlite:/bookReader/production.sqlite \
  syuchan1005/book_reader
```

### Environment

| key                              | type          | default                | note                                                                |
|:---------------------------------|:--------------|:-----------------------|:--------------------------------------------------------------------|
| `PORT`                           | `number`      | `8081`                 |                                                                     |
| `BOOKREADER_TRACE_SERVICE_NAME`  | `string`      | `book-reader`          |                                                                     |
| `BOOKREADER_TRACE_URL`           | `string`      | ``                     |                                                                     |
| `BOOKREADER_TRACE_CONSOLE`       | `boolean`     | ``                     |                                                                     |
| `BOOKREADER_SESSION_SECRET`      | `string`      | `book-reader`          | Must specify a value                                                |
| `BOOKREADER_SESSION_STORE`       | `json-string` | `{ "type": "memory" }` | `{ "type": "redis", "host": "", "port": 6379, "password": "XXXX" }` |
| `BOOKREADER_OIDC`                | `json-string` | ``                     | If not empty, authentication is activated.                          |
| `BOOKREADER_MEILISEARCH_HOST`    | `string`      | ``                     | `http://xxxxx:xxxx`                                                 |
| `BOOKREADER_MEILISEARCH_API_KEY` | `string`      | ``                     |                                                                     |
| `BOOKREADER_MEILISEARCH_INDEX`   | `string`      | `book-reader`          |                                                                     |
| `BOOKREADER_ELASTICSEARCH_NODE`  | `string`      | ``                     |                                                                     |
| `BOOKREADER_ELASTICSEARCH_INDEX` | `string`      | `book-reader`          |                                                                     |

## develop use
```shell script
$ npm install
$ npm run db:migrate
$ npm run serve
```


## Note
- stored default image file format: 
  - ~1.4.1: jpg
  - 1.4.2~: webp

- last version with Sequelize: 1.3.1-rc39
