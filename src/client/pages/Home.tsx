import * as React from 'react';
import {
  Button,
  createStyles,
  Fab,
  Icon,
  makeStyles,
  Theme,
} from '@material-ui/core';
import gql from 'graphql-tag';
import { useQuery } from '@apollo/react-hooks';
import { useObserver } from 'mobx-react';

import useReactRouter from 'use-react-router';
import { useTranslation } from 'react-i18next';

import { BookInfo as BookInfoType } from '../../common/GraphqlTypes';
import BookInfo from '../components/BookInfo';
import AddBookInfoDialog from '../components/AddBookInfoDialog';
import db from '../Database';
import useDebounceValue from '../hooks/useDebounceValue';

interface HomeProps {
  store: any;
  children?: React.ReactElement;
}

const useStyles = makeStyles((theme: Theme) => createStyles({
  home: {
    height: '100%',
    // marginBottom: `calc(env(safe-area-inset-bottom, 0) + ${theme.spacing(10)}px)`,
  },
  homeGrid: {
    padding: theme.spacing(1),
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, 200px) [end]',
    justifyContent: 'center',
    columnGap: `${theme.spacing(2)}px`,
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
    position: 'fixed',
    bottom: `calc(env(safe-area-inset-bottom, 0) + ${theme.spacing(2)}px)`,
    right: theme.spacing(2),
  },
  [theme.breakpoints.down('xs')]: {
    homeGrid: {
      gridTemplateColumns: 'repeat(auto-fill, 150px) [end]',
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
  readMoreButton: {
    gridColumn: '1 / end',
  },
}));

const Home: React.FC = (props: HomeProps) => {
  // eslint-disable-next-line
  props.store.barTitle = 'Book Info';
  const classes = useStyles(props);
  const { history } = useReactRouter();
  const { t } = useTranslation();

  const [search, setSearch] = React.useState(null);
  const [open, setOpen] = React.useState(false);
  const debounceSearch = useDebounceValue(search, 800);
  const {
    refetch,
    loading,
    error,
    data,
    fetchMore,
  } = useQuery<{ bookInfos: BookInfoType[] }>(gql`
      query ($limit: Int! $offset: Int! $search: String $order: Order){
          bookInfos(limit: $limit offset: $offset search: $search order: $order) {
              id
              name
              count
              thumbnail
          }
      }
  `, {
    variables: {
      offset: 0,
      limit: 10,
      search: debounceSearch,
      // eslint-disable-next-line react/destructuring-assignment
      order: props.store.sortOrder,
    },
  });

  useObserver(() => {
    if (search !== props.store.searchText) {
      setSearch(props.store.searchText);
    }
  });

  if (loading || error) {
    return (
      <div className={classes.loading}>
        {loading && 'Loading'}
        {error && `Error: ${error}`}
      </div>
    );
  }

  const infos = (data.bookInfos || []);
  const limit = Math.ceil(infos.length / 10) * 10 + (infos.length % 10 === 0 ? 10 : 0);
  const onDeletedBookInfo = (info, books) => {
    refetch({ offset: 0, limit });
    db.infoReads.delete(info.id);
    db.bookReads.bulkDelete(books.map((b) => b.id));
    books.map(({ id: bookId, pages }) => props.store.wb.messageSW({
      type: 'BOOK_REMOVE',
      bookId,
      pages,
    }));
  };

  const clickLoadMore = () => {
    fetchMore({
      variables: {
        offset: infos.length,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        return { bookInfos: [...prev.bookInfos, ...fetchMoreResult.bookInfos] };
      },
    });
  };

  return (
    <div className={classes.home}>
      <div className={classes.homeGrid}>
        {infos.map((info) => (
          <BookInfo
            key={info.id}
            {...info}
            onClick={() => history.push(`/info/${info.id}`)}
            onDeleted={(books) => onDeletedBookInfo(info, books)}
            onEdit={() => refetch({ offset: 0, limit })}
          />
        ))}
        <Button
          fullWidth
          className={classes.readMoreButton}
          onClick={clickLoadMore}
        >
          {t('loadMore')}
        </Button>
      </div>
      <Button
        variant="contained"
        color="secondary"
        className={classes.addButton}
        onClick={() => setOpen(true)}
      >
        <Icon fontSize="large">add</Icon>
        Add BookInfo
      </Button>
      <Fab
        color="secondary"
        className={classes.fab}
        onClick={() => refetch({ offset: 0, limit })}
      >
        <Icon style={{ color: 'white' }}>refresh</Icon>
      </Fab>

      <AddBookInfoDialog
        open={open}
        onAdded={() => refetch({ offset: 0, limit })}
        onClose={() => setOpen(false)}
      />
    </div>
  );
};

export default Home;
