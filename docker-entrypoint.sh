#!/bin/sh

if [ $# != 0 ] ; then
  apk add --no-cache git
  npm i "$*"
fi

npm run db:migrate -- --env production

/usr/bin/supervisord
