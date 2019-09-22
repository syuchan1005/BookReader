# Book Reader
Comic Viewer for me.

[Docker Hub](https://hub.docker.com/r/syuchan1005/book_reader)

<img src="screenshots/top.png" alt="top" width="50%"/>

## how to use?
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
