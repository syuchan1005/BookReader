import chunk from 'lodash.chunk';
import db from './Database';

export const startMigration = async (
  getBooks: (
    bookIds: string[],
  ) => Promise<Array<{ bookId: string, infoId: string, updatedAt: Date }>>,
  dryRun: boolean = true,
  chunkCount: number = 1000,
  logger: (...args: unknown[]) => void = () => {},
) => {
  logger('startMigration');
  const bookReadExist = db.bookReads.existStore();
  const infoReadExist = db.infoReads.existStore();
  if (!bookReadExist || !infoReadExist) {
    return;
  }
  logger('A');
  const infoReads = await db.infoReads.getAll(Number.MAX_SAFE_INTEGER);
  const bookReads = await db.bookReads.getAll(Number.MAX_SAFE_INTEGER);
  if (infoReads.length === 0 && bookReads.length === 0) {
    return;
  }
  logger('B');

  const readBookIds = (await db.read.getAll(Number.MAX_SAFE_INTEGER)).map(({ bookId }) => bookId);
  const infoReadsMap: { [bookId: string]: typeof infoReads[number] } = infoReads
    .reduce((map, infoRead) => {
      if (readBookIds.includes(infoRead.bookId)) {
        return map;
      }
      // eslint-disable-next-line no-param-reassign
      map[infoRead.bookId] = map[infoRead.bookId] ?? infoRead;
      return map;
    }, {});
  // @ts-ignore
  const bookReadsMap: {
    infoExistMap: { [bookId: string]: typeof bookReads[number] },
    infoNotExistMap: { [bookId: string]: typeof bookReads[number] },
  } = bookReads
    .reduce((parentMap, bookRead) => {
      if (readBookIds.includes(bookRead.bookId)) {
        return parentMap;
      }
      const map = infoReadsMap[bookRead.bookId]
        ? parentMap.infoExistMap
        : parentMap.infoNotExistMap;
      // eslint-disable-next-line no-param-reassign
      map[bookRead.bookId] = map[bookRead.bookId] ?? bookRead;
      return parentMap;
    }, {
      infoExistMap: {},
      infoNotExistMap: {},
    });
  if (Object.keys(infoReadsMap).length === 0
    && Object.keys(bookReadsMap.infoExistMap).length === 0
    && Object.keys(bookReadsMap.infoNotExistMap).length === 0) {
    if (!dryRun) {
      await db.infoReads.clear();
      await db.bookReads.clear();
    }
    return;
  }
  logger('C');
  const bookNotExistInfoReadBookIds = Object.entries(infoReadsMap)
    .filter(([bookId]) => !bookReadsMap.infoExistMap[bookId]);
  const noUpdatedAtDataBookReads: Array<typeof bookReads[number]> = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const [bookId, bookRead] of Object.entries(bookReadsMap.infoExistMap)) {
    if (!bookRead.updatedAt) {
      noUpdatedAtDataBookReads.push(bookRead);
    } else {
      const infoRead = infoReadsMap[bookId];
      // eslint-disable-next-line no-await-in-loop
      await Promise.all([
        db.read.put({
          infoId: infoRead.infoId,
          bookId,
          page: bookRead.page,
          updatedAt: bookRead.updatedAt,
        }, { replace: false }).catch(() => {}),
        dryRun ? Promise.resolve() : db.infoReads.delete(infoRead.infoId).catch(() => {}),
        dryRun ? Promise.resolve() : db.bookReads.delete(bookId).catch(() => {}),
      ]);
    }
  }
  logger('D');
  const infoNotExistsBookIds = [...(new Set([
    ...Object.keys(bookReadsMap.infoNotExistMap),
    ...bookNotExistInfoReadBookIds.map(([bookId]) => bookId),
    ...noUpdatedAtDataBookReads.map(({ bookId }) => bookId),
  ]))];
  logger('E', infoNotExistsBookIds);
  // eslint-disable-next-line no-restricted-syntax
  for (const chunked of chunk(infoNotExistsBookIds, chunkCount)) {
    logger('-F', chunked);
    // eslint-disable-next-line no-await-in-loop
    const fetchedBooks = await getBooks(chunked);
    logger('-G', fetchedBooks);
    const booksMap: { [bookId: string]: typeof fetchedBooks[number] } = fetchedBooks.reduce(
      (books, book) => {
        // eslint-disable-next-line no-param-reassign
        books[book.bookId] = book;
        return books;
      },
      {},
    );
    const targetBookReadMap: typeof bookReadsMap.infoNotExistMap = {
      ...bookReadsMap.infoNotExistMap,
      ...(noUpdatedAtDataBookReads.reduce(
        (map, bookRead) => {
          // eslint-disable-next-line no-param-reassign
          map[bookRead.bookId] = bookRead;
          return map;
        },
        {},
      )),
    };
    logger('-H');
    // eslint-disable-next-line no-restricted-syntax
    for (const [bookId, bookRead] of Object.entries(targetBookReadMap)) {
      const book = booksMap[bookId];
      const promises = [];
      if (book) {
        promises.push(
          db.read.put({
            infoId: book.infoId,
            bookId,
            page: bookRead.page,
            updatedAt: bookRead.updatedAt || book.updatedAt,
          }, { replace: false })
            .catch(() => {
            }),
        );
      }
      if (!dryRun) {
        promises.push(db.bookReads.delete(bookId)
          .catch(() => {
          }));
      }
      // eslint-disable-next-line no-await-in-loop
      await Promise.all(promises);
    }
    logger('-I');
    // eslint-disable-next-line no-restricted-syntax
    for (const [bookId, infoRead] of bookNotExistInfoReadBookIds) {
      const book = booksMap[bookId];
      const promises = [];
      if (book) {
        promises.push(
          db.read.put({
            infoId: book.infoId,
            bookId,
            page: 0,
            updatedAt: book.updatedAt,
          }, { replace: false })
            .catch(() => {
            }),
        );
      }
      if (!dryRun) {
        promises.push(db.infoReads.delete(infoRead.infoId)
          .catch(() => {
          }));
      }
      // eslint-disable-next-line no-await-in-loop
      await Promise.all(promises);
    }
    logger('-J');
  }

  if (!dryRun) {
    await db.infoReads.clear();
    await db.bookReads.clear();
  }
  logger('K');
};
