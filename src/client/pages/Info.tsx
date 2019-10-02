import * as React from 'react';
import useReactRouter from 'use-react-router';
import { useQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import {
  makeStyles,
  createStyles,
  Fab,
  Icon,
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
  fab: {
    position: 'fixed',
    bottom: `calc(env(safe-area-inset-bottom, 0) + ${theme.spacing(2)}px)`,
    right: theme.spacing(2),
    zIndex: 2,
  },
  addButton: {
    position: 'fixed',
    right: theme.spacing(2),
    bottom: theme.spacing(11),
    background: theme.palette.background.paper,
    color: theme.palette.secondary.main,
    zIndex: 2,
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
                  
                  info {
                      id
                  }
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
              />
            ),
          )
        }
      </div>
      <Fab
        className={classes.addButton}
        onClick={() => setOpen(true)}
      >
        <Icon>add</Icon>
      </Fab>
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
