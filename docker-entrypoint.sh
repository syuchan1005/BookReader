#!/bin/sh

if [ $# != 0 ] ; then
  npm i "$@"
fi

npm run db-migrate production migrate

cp production.sqlite "production${BOOK_READER_PRISMA_SUFFIX:--p}.sqlite"
npm run prisma-migrate

/usr/bin/supervisord
