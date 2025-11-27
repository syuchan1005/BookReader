import { useLazyQuery } from '@apollo/client/react';
import Book from '@client/components/Book';
import { pageAspectRatio } from '@client/components/BookPageImage';
import { useMediaQuery } from '@client/hooks/useMediaQuery';
import { useTitle } from '@client/hooks/useTitle';
import db, { type BookRead } from '@client/indexedDb/Database';
import { useTheme } from '@mui/material';
import { styled } from '@mui/material/styles';
import { BooksDocument } from '@syuchan1005/book-reader-graphql';
import { useCallback, useEffect, useMemo, useState } from 'react';

const PREFIX = 'History';

const classes = {
  grid: `${PREFIX}-grid`,
};

const Root = styled('div')(({ theme }) => ({
  [`&.${classes.grid}`]: {
    padding: theme.spacing(1),
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, 200px) [end]',
    gridTemplateRows: `repeat(auto-fit, ${pageAspectRatio(200)}px)`,
    justifyContent: 'center',
    columnGap: theme.spacing(2),
    rowGap: theme.spacing(2),
    [theme.breakpoints.down('sm')]: {
      gridTemplateColumns: 'repeat(auto-fill, 150px) [end]',
      gridTemplateRows: `repeat(auto-fit, ${pageAspectRatio(150)}px)`,
    },
  },
}));

const defaultLoadBooksCount = 20;

const History = () => {
  useTitle('History');

  const theme = useTheme();
  const downSm = useMediaQuery(theme.breakpoints.down('sm'));

  const [historyBooks, setHistoryBooks] = useState<BookRead[]>([]);
  const [historyBookLoading, setHistoryBookLoading] = useState(false);

  const [getBooks, { loading, data, fetchMore }] = useLazyQuery(BooksDocument, {
    fetchPolicy: 'network-only',
  });
  const mappedBooks: { [bookId: string]: (typeof data.books)[number] } =
    useMemo(
      () =>
        (data?.books ?? []).reduce((map, book) => {
          map[book.id] = book;
          return map;
        }, {}),
      [data?.books],
    );

  const getHistoryBooks = useCallback(() => {
    let after: Date | undefined;
    if (historyBooks.length !== 0) {
      after = historyBooks[historyBooks.length - 1].updatedAt;
    }
    setHistoryBookLoading(true);
    db.read
      .getAll(defaultLoadBooksCount, {
        key: 'updatedAt',
        direction: 'prev',
        after,
      })
      .then((historyList) => {
        if (historyList.length <= 0) {
          return;
        }
        if (historyBooks.length === 0) {
          getBooks({
            variables: {
              ids: historyList.map((book) => book.bookId),
            },
          });
        } else {
          fetchMore({
            variables: {
              ids: historyList.map((book) => book.bookId),
            },
          });
        }
        setHistoryBooks((p) => [...p, ...historyList]);
        setHistoryBookLoading(false);
      });
  }, [fetchMore, getBooks, historyBooks]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: getHistoryBooks
  useEffect(() => {
    getHistoryBooks();
  }, []);

  return (
    <Root className={classes.grid}>
      {historyBooks.map((bookRead, index, arr) => {
        const book = mappedBooks[bookRead.bookId];
        if (book) {
          return (
            <Book
              key={book.id}
              infoId={book.info.id}
              simple
              {...book}
              name={book.info.name}
              thumbnailSize={downSm ? 150 : 200}
              thumbnailNoSave={false}
              onVisible={() => {
                if (
                  arr.length - 1 === index &&
                  !loading &&
                  !historyBookLoading
                ) {
                  getHistoryBooks();
                }
              }}
            />
          );
        }
        return (
          <div key={bookRead.bookId}>{`Failed: ${JSON.stringify(
            bookRead,
          )}`}</div>
        );
      })}
    </Root>
  );
};

export default History;
