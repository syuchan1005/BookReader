import * as React from 'react';
import useReactRouter from 'use-react-router';
import { useQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import {
  makeStyles,
  createStyles,
  Fab,
  Icon,
} from '@material-ui/core';

import { Book as BookType, BookInfo as BookInfoType } from '../../common/GraphqlTypes';
import Book from '../components/Book';
import AddBookDialog, { ChildProps } from '../components/AddBookDialog';
import db from '../Database';
import DashedOutlineButton from '../components/DashedOutlineButton';

interface InfoProps {
  store: any;
  children?: React.ReactElement;
}

const useStyles = makeStyles((theme) => createStyles({
  info: {
    padding: theme.spacing(1),
    display: 'grid',
    justifyContent: 'center',
    gridTemplateColumns: 'repeat(auto-fill, 200px) [end]',
    columnGap: `${theme.spacing(2)}px`,
    rowGap: `${theme.spacing(2)}px`,
  },
  fab: {
    position: 'fixed',
    bottom: theme.spacing(2),
    right: theme.spacing(2),
  },
  [theme.breakpoints.down('xs')]: {
    info: {
      gridTemplateColumns: 'repeat(auto-fill, 150px)',
    },
  },
}));

const Info: React.FC = (props: InfoProps) => {
  const classes = useStyles(props);
  const { match, history } = useReactRouter();
  const [readId, setReadId] = React.useState('');
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

  const AddButton: React.FC<Partial<ChildProps>> = ({ setOpen }: ChildProps) => (
    <DashedOutlineButton onClick={() => setOpen(true)}>
      <Icon fontSize="large">add</Icon>
      add book
    </DashedOutlineButton>
  );

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
      <AddBookDialog infoId={match.params.id} onAdded={refetch}>
        <AddButton />
      </AddBookDialog>
      <Fab
        color="secondary"
        className={classes.fab}
        onClick={() => refetch()}
      >
        <Icon style={{ color: 'white' }}>refresh</Icon>
      </Fab>
    </div>
  );
};

export default Info;
