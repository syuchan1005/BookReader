import {
  useBooksQuery,
} from '@syuchan1005/book-reader-graphql/generated/GQLQueries';

import React from 'react';
import db, { BookRead } from '@client/Database';
import makeStyles from '@mui/styles/makeStyles';
import { Theme, useTheme } from '@mui/material';
import createStyles from '@mui/styles/createStyles';
import { pageAspectRatio } from '@client/components/BookPageImage';
import Book from '@client/components/Book';
import useMediaQuery from '@client/hooks/useMediaQuery';
import { useTitle } from '@client/hooks/useTitle';

const useStyles = makeStyles((theme: Theme) => createStyles({
  grid: {
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
  const classes = useStyles();
  const theme = useTheme();

  const downSm = useMediaQuery(theme.breakpoints.down('sm'));

  const [historyBooks, setHistoryBooks] = React.useState<BookRead[]>([]);
  const [historyBookLoading, setHistoryBookLoading] = React.useState(false);
  const getHistoryBooks = React.useCallback(() => {
    let after;
    if (historyBooks.length !== 0) {
      after = historyBooks[historyBooks.length - 1].updatedAt;
    }
    setHistoryBookLoading(true);
    db.bookReads.getAll(
      defaultLoadBooksCount,
      { key: 'updatedAt', direction: 'prev' },
      after,
    ).then((list) => {
      const historyList = list.filter((item) => !!item.updatedAt);
      if (historyList.length > 0) {
        setHistoryBooks((p) => [...p, ...historyList]);
      }
    }).catch(() => {
      setHistoryBookLoading(false);
    });
  }, [historyBooks]);
  React.useEffect(() => {
    getHistoryBooks();
    // eslint-disable-next-line
  }, []);
  const { loading, data } = useBooksQuery({
    skip: historyBooks.length === 0,
    variables: {
      ids: historyBooks.map((book) => book.bookId),
    },
    onCompleted() {
      setHistoryBookLoading(false);
    },
    onError() {
      setHistoryBookLoading(false);
    },
  });

  return (
    <div className={classes.grid}>
      {(data?.books ?? []).map((book, index, arr) => (book ? (
        <Book
          key={book.id}
          infoId={book.info.id}
          simple
          {...book}
          name={book.info.name}
          thumbnailSize={downSm ? 150 : 200}
          thumbnailNoSave={false}
          onVisible={() => {
            if (arr.length - 1 === index && !loading && !historyBookLoading) {
              getHistoryBooks();
            }
          }}
        />
      ) : (
        <div>{`Failed: ${JSON.stringify(historyBooks[index])}`}</div>
      )))}
    </div>
  );
};

export default History;
