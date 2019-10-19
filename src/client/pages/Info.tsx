import * as React from 'react';
import { useQuery } from '@apollo/react-hooks';
import {
  makeStyles,
  createStyles,
  Fab,
  Icon,
  Theme,
  useTheme,
} from '@material-ui/core';
import { useParams, useHistory } from 'react-router-dom';

import { Book as BookType, BookInfo as BookInfoType } from '@common/GraphqlTypes';

import * as BookInfoQuery from '@client/graphqls/Pages_Info_bookInfo.gql';

import { commonTheme } from '@client/App';
import { useGlobalStore } from '@client/store/StoreProvider';

import db from '@client/Database';

import AddBookDialog from '@client/components/dialogs/AddBookDialog';
import Book from '@client/components/Book';

interface InfoProps {
  children?: React.ReactElement;
}

const useStyles = makeStyles((theme: Theme) => createStyles({
  info: {
    height: '100%',
  },
  infoGrid: {
    padding: theme.spacing(1),
    display: 'grid',
    justifyContent: 'center',
    gridTemplateColumns: 'repeat(auto-fill, 200px) [end]',
    columnGap: `${theme.spacing(2)}px`,
    rowGap: `${theme.spacing(2)}px`,
  },
  [theme.breakpoints.down('xs')]: {
    infoGrid: {
      gridTemplateColumns: 'repeat(auto-fill, 150px)',
    },
  },
  loading: {
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '2rem',
    whiteSpace: 'pre',
    textAlign: 'center',
  },
  fab: {
    position: 'fixed',
    bottom: `calc(${commonTheme.safeArea.bottom} + ${theme.spacing(2)}px)`,
    right: theme.spacing(2),
    zIndex: 2,
    fallbacks: {
      bottom: theme.spacing(2),
    },
  },
  addButton: {
    position: 'fixed',
    right: theme.spacing(2),
    bottom: `calc(${commonTheme.safeArea.bottom} + ${theme.spacing(11)}px)`,
    background: theme.palette.background.paper,
    color: theme.palette.secondary.main,
    zIndex: 2,
    fallbacks: {
      bottom: theme.spacing(11),
    },
  },
}));

const Info: React.FC = (props: InfoProps) => {
  const { state: store, dispatch } = useGlobalStore();
  const classes = useStyles(props);
  const theme = useTheme();
  const history = useHistory();
  const params = useParams<{ id: string }>();
  const [readId, setReadId] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const {
    refetch,
    loading,
    error,
    data,
  } = useQuery<{ bookInfo: BookInfoType }>(BookInfoQuery, {
    variables: {
      id: params.id,
    },
    onCompleted(d) {
      if (!d) return;
      dispatch({ barTitle: d.bookInfo.name });
    },
  });

  React.useEffect(() => {
    dispatch({
      barTitle: 'Book',
      backRoute: '/',
      showBackRouteArrow: true,
    });
    let unMounted = false;
    db.infoReads.get(params.id).then((read) => {
      if (read && !unMounted) {
        setReadId(read.bookId);
      }
    });
    return () => {
      unMounted = true;
    };
  }, []);

  const clickBook = React.useCallback((book) => {
    db.infoReads.put({
      infoId: params.id,
      bookId: book.id,
    }).catch(() => { /* ignored */
    });
    history.push(`/book/${book.id}`);
  }, [params, history]);

  const bookList = React.useMemo(() => (data ? data.bookInfo.books : []), [data]);

  const onDeletedBook = React.useCallback(({ id: bookId, pages }: BookType) => {
    // noinspection JSIgnoredPromiseFromCall
    refetch();
    // noinspection JSIgnoredPromiseFromCall
    db.bookReads.delete(bookId);
    if (store.wb) {
      store.wb.messageSW({
        type: 'BOOK_REMOVE',
        bookId,
        pages,
      });
    }
  }, [refetch, store]);

  return (
    <div className={classes.info}>
      {(loading || error) ? (
        <div className={classes.loading}>
          {loading && 'Loading'}
          {error && `${error.toString().replace(/:\s*/g, '\n')}`}
        </div>
      ) : (
        <>
          <div className={classes.infoGrid}>
            {// @ts-ignore
              (bookList && bookList.length > 0) && bookList.map(
                (book) => (
                  <Book
                    {...book}
                    name={data.bookInfo.name}
                    reading={readId === book.id}
                    key={book.id}
                    onClick={() => clickBook(book)}
                    onDeleted={() => onDeletedBook(book)}
                    onEdit={() => refetch()}
                    thumbnailSize={theme.breakpoints.down('xs') ? 150 : 200}
                  />
                ),
              )
            }
          </div>
          <Fab
            className={classes.addButton}
            onClick={() => setOpen(true)}
            aria-label="add"
          >
            <Icon>add</Icon>
          </Fab>
        </>
      )}
      <Fab
        color="secondary"
        className={classes.fab}
        onClick={() => refetch()}
        aria-label="refetch"
      >
        <Icon style={{ color: 'white' }}>refresh</Icon>
      </Fab>

      <AddBookDialog
        open={open}
        infoId={params.id}
        onAdded={refetch}
        onClose={() => setOpen(false)}
      />
    </div>
  );
};

// @ts-ignore
Info.whyDidYouRender = true;

export default Info;
