# Book Reader

[![dockeri.co](https://dockeri.co/image/syuchan1005/book_reader)](https://hub.docker.com/r/syuchan1005/book_reader)

<img src="screenshots/top.png" alt="top" width="50%"/>

## how to use?

> when you use v1.0.5, please run command ↓
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
