#!/bin/sh

if [ $# != 0 ] ; then
  npm i "$@"
fi

npm run script:db-migrate production migrate

/usr/bin/supervisord
