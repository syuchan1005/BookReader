import * as React from 'react';
import useReactRouter from 'use-react-router';
import { useQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import {
  makeStyles,
  createStyles,
  Fab,
  Icon,
  Button,
  Theme,
} from '@material-ui/core';

import { Book as BookType, BookInfo as BookInfoType } from '../../common/GraphqlTypes';
import Book from '../components/Book';
import AddBookDialog from '../components/AddBookDialog';
import db from '../Database';

interface InfoProps {
  store: any;
  children?: React.ReactElement;
}

const useStyles = makeStyles((theme: Theme) => createStyles({
  info: {
    height: '100%',
    marginBottom: `calc(env(safe-area-inset-bottom, 0) + ${theme.spacing(10)}px)`,
  },
  grid: {
    padding: theme.spacing(1),
    display: 'grid',
    justifyContent: 'center',
    gridTemplateColumns: 'repeat(auto-fill, 200px) [end]',
    columnGap: `${theme.spacing(2)}px`,
    rowGap: `${theme.spacing(2)}px`,
  },
  fab: {
    position: 'fixed',
    bottom: `calc(env(safe-area-inset-bottom, 0) + ${theme.spacing(2)}px)`,
    right: theme.spacing(2),
  },
  [theme.breakpoints.down('xs')]: {
    info: {
      gridTemplateColumns: 'repeat(auto-fill, 150px)',
    },
  },
  addButton: {
    position: 'fixed',
    left: 0,
    bottom: 0,
    borderRadius: 0,
    borderTopRightRadius: `calc(${theme.shape.borderRadius}px * 2)`,
    paddingTop: theme.spacing(2),
    fontSize: '0.9rem',
    paddingBottom: `calc(env(safe-area-inset-bottom, 0) + ${theme.spacing(2)}px)`,
  },
}));

const Info: React.FC = (props: InfoProps) => {
  const classes = useStyles(props);
  const { match, history } = useReactRouter();
  const [readId, setReadId] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const {
    refetch,
    loading,
    error,
    data,
  } = useQuery<{ bookInfo: BookInfoType }>(gql`
      query ($id: ID!){
          bookInfo(id: $id) {
              id
              name
              books {
                  id
                  number
                  pages
                  thumbnail
              }
          }
      }
  `, {
    variables: {
      id: match.params.id,
    },
  });

  // eslint-disable-next-line
  props.store.barTitle = 'Book';

  // eslint-disable-next-line
  props.store.backRoute = '/';

  React.useEffect(() => {
    let unMounted = false;
    db.infoReads.get(match.params.id).then((read) => {
      if (read && !unMounted) {
        setReadId(read.bookId);
      }
    });
    return () => {
      unMounted = true;
    };
  });

  if (loading || error || !data || !data.bookInfo) {
    return (
      <div>
        {loading && 'Loading'}
        {error && `Error: ${error}`}
        {(!data || !data.bookInfo) && 'Empty'}
      </div>
    );
  }

  // eslint-disable-next-line
  props.store.barTitle = data.bookInfo.name;

  const clickBook = (book) => {
    db.infoReads.put({
      infoId: match.params.id,
      bookId: book.id,
    }).catch(() => { /* ignored */
    });
    history.push(`/book/${book.id}`);
  };

  const bookList = data.bookInfo.books;

  const onDeletedBook = ({ id: bookId, pages }: BookType) => {
    refetch();
    db.bookReads.delete(bookId);
    props.store.wb.messageSW({
      type: 'BOOK_REMOVE',
      bookId,
      pages,
    });
  };

  return (
    <div className={classes.info}>
      <div className={classes.grid}>
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
                wb={props.store.wb}
              />
            ),
          )
        }
      </div>
      <Button
        variant="contained"
        color="secondary"
        className={classes.addButton}
        onClick={() => setOpen(true)}
      >
        <Icon fontSize="large">add</Icon>
        Add Book
      </Button>
      <Fab
        color="secondary"
        className={classes.fab}
        onClick={() => refetch()}
      >
        <Icon style={{ color: 'white' }}>refresh</Icon>
      </Fab>

      <AddBookDialog
        open={open}
        infoId={match.params.id}
        onAdded={refetch}
        onClose={() => setOpen(false)}
      />
    </div>
  );
};

export default Info;
