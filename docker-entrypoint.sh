#!/bin/sh

if [ $# -gt 1 ]; then
  npm i "$*"
fi

npm run db:migrate -- --env production

/usr/bin/supervisord
