#!/bin/sh

if [ $# != 0 ] ; then
  npm i "$@"
fi

npm run db-migrate production migrate

/usr/bin/supervisord
