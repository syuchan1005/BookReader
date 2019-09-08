import * as React from 'react';
import {
  makeStyles,
  createStyles,
  Theme,
  Fab,
  Icon,
} from '@material-ui/core';
import gql from 'graphql-tag';
import { useQuery } from '@apollo/react-hooks';

import useReactRouter from 'use-react-router';

import { BookInfo as BookInfoType } from '../../common/GraphqlTypes';
import BookInfo from '../components/BookInfo';
import AddBookInfoDialog, { ChildProps } from '../components/AddBookInfoDialog';

interface HomeProps {
  store: any;
  children?: React.ReactElement;
}

const useStyles = makeStyles((theme: Theme) => createStyles({
  home: {
    padding: theme.spacing(1),
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, 250px)',
    justifyContent: 'center',
    columnGap: theme.spacing(2),
    rowGap: `${theme.spacing(2)}px`,
  },
  loading: {
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '2rem',
  },
  fab: {
    position: 'absolute',
    bottom: theme.spacing(2),
    right: theme.spacing(2),
  },
  addBookInfoButton: {
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

const Home: React.FC = (props: HomeProps) => {
  // eslint-disable-next-line
  props.store.barTitle = 'Book Info';
  const classes = useStyles(props);
  const { history } = useReactRouter();

  const {
    refetch,
    loading,
    error,
    data,
  } = useQuery(gql`
      {
          bookInfos {
              infoId
              name
              count
              thumbnail
          }
      }
  `);

  if (loading || error) {
    return (
      <div className={classes.loading}>
        {loading && 'Loading'}
        {error && `Error: ${error}`}
      </div>
    );
  }

  const AddBtn: React.FC<Partial<ChildProps>> = ({ setOpen }: ChildProps) => (
    // eslint-disable-next-line
    <div onClick={() => setOpen(true)} className={classes.addBookInfoButton}>
      <Icon fontSize="large">add</Icon>
      Add BookInfo
    </div>
  );

  const infos: [BookInfoType] = data.bookInfos;
  return (
    <div className={classes.home}>
      {(infos && infos.length > 0) && (
        infos.map((info) => (
          <BookInfo
            key={info.infoId}
            {...info}
            onClick={() => history.push(`/info/${info.infoId}`)}
            onDeleted={refetch}
          />
        ))
      )}
      <AddBookInfoDialog onAdded={refetch}>
        <AddBtn />
      </AddBookInfoDialog>
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

export default Home;
