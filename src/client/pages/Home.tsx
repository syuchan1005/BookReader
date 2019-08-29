import * as React from 'react';
import {
  makeStyles,
  Theme,
  Fab,
  Icon,
} from '@material-ui/core';
import { gql } from 'apollo-boost';
import { useQuery } from '@apollo/react-hooks';

import useReactRouter from 'use-react-router';

import { BookInfo as BookInfoType } from '../../common/GraphqlTypes';
import BookInfo from '../components/BookInfo';

const useStyles = makeStyles((theme: Theme) => ({
  home: {
    padding: theme.spacing(1),
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, 250px)',
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
}));

export default (props) => {
  const classes = useStyles(props);
  const { history } = useReactRouter();

  const { loading, error, data: { bookInfos } } = useQuery(gql`
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
        { loading && 'Loading' }
        { error && `Error: ${error}`}
      </div>
    );
  }

  const infos: [BookInfoType] = bookInfos;

  return (
    <div className={classes.home}>
      { infos && infos.length > 0 ? (
        infos.map((info) => <BookInfo key={info.infoId} {...info} onClick={() => history.push(`/info/${info.infoId}`)} />)
      ) : (
        <div>Empty</div>
      )}
      <Fab color="secondary" className={classes.fab}>
        <Icon style={{ color: 'white' }}>add</Icon>
      </Fab>
    </div>
  );
};
