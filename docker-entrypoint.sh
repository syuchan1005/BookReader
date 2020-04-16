#!/bin/sh

if [ $# != 0 ] ; then
  apk add --no-cache git
  npm i "$@"
fi

npm run script:db-migrate production

/usr/bin/supervisord
