#!/bin/sh

if [ $# != 0 ] ; then
  npm i "$@"
fi

npm run db-migrate production

/usr/bin/supervisord
