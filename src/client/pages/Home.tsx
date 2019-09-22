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
import AddBookInfoDialog, { ChildProps } from '../components/AddBookInfoDialog';
import db from '../Database';
import DashedOutlineButton from '../components/DashedOutlineButton';
import useDebounceValue from '../hooks/useDebounceValue';

interface HomeProps {
  store: any;
  children?: React.ReactElement;
}

const useStyles = makeStyles((theme: Theme) => createStyles({
  home: {
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
  [theme.breakpoints.down('xs')]: {
    home: {
      gridTemplateColumns: 'repeat(auto-fill, 150px) [end]',
    },
  },
}));

const Home: React.FC = (props: HomeProps) => {
  // eslint-disable-next-line
  props.store.barTitle = 'Book Info';
  const classes = useStyles(props);
  const { history } = useReactRouter();
  const { t } = useTranslation();

  const [search, setSearch] = React.useState(null);
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

  const AddButton: React.FC<Partial<ChildProps>> = ({ setOpen }: ChildProps) => (
    <DashedOutlineButton onClick={() => setOpen(true)}>
      <Icon fontSize="large">add</Icon>
      add BookInfo
    </DashedOutlineButton>
  );

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
      {infos.map((info) => (
        <BookInfo
          key={info.id}
          {...info}
          onClick={() => history.push(`/info/${info.id}`)}
          onDeleted={(books) => onDeletedBookInfo(info, books)}
          onEdit={() => refetch({ offset: 0, limit })}
        />
      ))}
      <AddBookInfoDialog onAdded={() => refetch({ offset: 0, limit })}>
        <AddButton />
      </AddBookInfoDialog>
      <Button fullWidth style={{ gridColumn: '1 / end' }} onClick={clickLoadMore}>
        {t('loadMore')}
      </Button>
      <Fab
        color="secondary"
        className={classes.fab}
        onClick={() => refetch({ offset: 0, limit })}
      >
        <Icon style={{ color: 'white' }}>refresh</Icon>
      </Fab>
    </div>
  );
};

export default Home;
