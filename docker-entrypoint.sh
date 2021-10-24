#!/bin/sh

if [ $# != 0 ] ; then
  npm i "$@"
fi

npm run prisma-migrate

/usr/bin/supervisord
