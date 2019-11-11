# Book Reader

[![MIT License](http://img.shields.io/badge/license-MIT-blue.svg?style=flat)](LICENSE)
[![Maintainability](https://api.codeclimate.com/v1/badges/04ab4b9a433f4a70efae/maintainability)](https://codeclimate.com/github/syuchan1005/BookReader/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/04ab4b9a433f4a70efae/test_coverage)](https://codeclimate.com/github/syuchan1005/BookReader/test_coverage)

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
  -v {FOLDER_PATH}/production.sqlite:/bookReader/production.sqlite \
  syuchan1005/book_reader
```

## develop use
```shell script
$ npm install
$ npm run serve
```
