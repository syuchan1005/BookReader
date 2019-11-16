#!/bin/sh

if [ $# != 0 ] ; then
  npm i "$*"
fi

npm run db:migrate -- --env production

/usr/bin/supervisord
