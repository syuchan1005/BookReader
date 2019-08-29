import * as React from 'react';
import useReactRouter from 'use-react-router';
import { useQuery } from '@apollo/react-hooks';
import { gql } from 'apollo-boost';
import { makeStyles, Fab, Icon } from '@material-ui/core';
import { Book as BookType } from '../../common/GraphqlTypes';
import Book from '../components/Book';

const useStyles = makeStyles((theme) => ({
  info: {
    padding: theme.spacing(1),
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, 250px)',
    columnGap: theme.spacing(2),
    rowGap: `${theme.spacing(2)}px`,
  },
  fab: {
    position: 'absolute',
    bottom: theme.spacing(2),
    right: theme.spacing(2),
  },
}));

const Info: React.FC = (props) => {
  const classes = useStyles(props);
  const { match } = useReactRouter();
  const { loading, error, data } = useQuery(gql`
      query ($id: ID){
          books(infoId: $id) {
              bookId
              info {
                  infoId
                  name
                  thumbnail
              }
              number
              pages
              thumbnail
          }
      }
  `, {
    variables: {
      id: match.params.id,
    },
  });

  if (loading || error) {
    return (
      <div>
        { loading && 'Loading' }
        { error && `Error: ${error}`}
      </div>
    );
  }

  const bookList: [BookType] = data.books;

  return (
    <div className={classes.info}>
      {bookList && bookList.length > 0 ? (
        bookList.map((book) => <Book {...book} key={book.bookId} />)
      ) : (
        <div>Empty</div>
      )}
      <Fab color="secondary" className={classes.fab}>
        <Icon style={{ color: 'white' }}>add</Icon>
      </Fab>
    </div>
  );
};

export default Info;
