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
import { Book as BookType } from '../../common/GraphqlTypes';
import Book from '../components/Book';
import AddBookDialog, { ChildProps } from '../components/AddBookDialog';

interface InfoProps {
  store: any;
  children?: React.ReactElement;
}

const useStyles = makeStyles((theme) => createStyles({
  info: {
    padding: theme.spacing(1),
    display: 'grid',
    justifyContent: 'center',
    gridTemplateColumns: 'repeat(auto-fill, 250px) [end]',
    columnGap: theme.spacing(2),
    rowGap: `${theme.spacing(2)}px`,
  },
  fab: {
    position: 'fixed',
    bottom: theme.spacing(2),
    right: theme.spacing(2),
  },
  addBookButton: {
    width: '100%',
    height: '100%',
    minHeight: theme.spacing(8),
    border: '2px dashed lightgray',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
}));

const Info: React.FC = (props: InfoProps) => {
  const classes = useStyles(props);
  const { match, history } = useReactRouter();
  const {
    refetch,
    loading,
    error,
    data,
  } = useQuery(gql`
      query ($id: ID!){
          bookInfo(infoId: $id) {
              name
              books {
                  bookId
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

  if (loading || error || !data.bookInfo) {
    return (
      <div>
        { loading && 'Loading' }
        { error && `Error: ${error}`}
        { !data.bookInfo && 'Empty'}
      </div>
    );
  }

  // eslint-disable-next-line
  props.store.barTitle = data.bookInfo.name;

  const AddBtn: React.FC<Partial<ChildProps>> = ({ setOpen }: ChildProps) => (
    // eslint-disable-next-line
    <div onClick={() => setOpen(true)} className={classes.addBookButton}>
      <Icon fontSize="large">add</Icon>
      add book
    </div>
  );

  const bookList: [BookType] = data.bookInfo.books;

  return (
    <div className={classes.info}>
      {// @ts-ignore
        (bookList && bookList.length > 0) && bookList.map(
          (book) => (<Book {...book} name={data.bookInfo.name} key={book.bookId} onClick={() => history.push(`/book/${book.bookId}`)} />),
        )
      }
      <AddBookDialog infoId={match.params.id} onAdded={refetch}>
        <AddBtn />
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
