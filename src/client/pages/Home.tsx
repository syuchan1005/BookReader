import * as React from 'react';
import {
  CircularProgress,
  createStyles,
  Fab,
  Icon,
  makeStyles,
  Theme, useTheme,
} from '@material-ui/core';
import { useHistory } from 'react-router-dom';
import { useQuery } from '@apollo/react-hooks';
import { Waypoint } from 'react-waypoint';

import * as BookInfosQuery from '@client/graphqls/Pages_Home_bookInfos.gql';

import { commonTheme } from '@client/App';
import AddBookInfoDialog from '@client/components/dialogs/AddBookInfoDialog';
import AddBookDialog from '@client/components/dialogs/AddBookDialog';
import { BookInfoList as BookInfoListType } from '@common/GraphqlTypes';
import useDebounceValue from '@client/hooks/useDebounceValue';
import useLoadMore from '@client/hooks/useLoadMore';
import { useGlobalStore } from '@client/store/StoreProvider';

import BookInfo from '../components/BookInfo';
import db from '../Database';


interface HomeProps {
  children?: React.ReactElement;
}

const useStyles = makeStyles((theme: Theme) => createStyles({
  home: {
    height: '100%',
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
  [theme.breakpoints.down('xs')]: {
    homeGrid: {
      gridTemplateColumns: 'repeat(auto-fill, 150px) [end]',
    },
  },
  loadMoreProgress: {
    gridColumn: '1 / end',
    display: 'flex',
    justifyContent: 'center',
  },
}));

const Home: React.FC = (props: HomeProps) => {
  const { state: store, dispatch } = useGlobalStore();
  const classes = useStyles(props);
  const theme = useTheme();
  const history = useHistory();

  const [open, setOpen] = React.useState(false);
  const [openAddBook, setOpenAddBook] = React.useState<string | undefined>(undefined);
  const debounceSearch = useDebounceValue(store.searchText, 800);

  React.useEffect(() => {
    dispatch({
      barTitle: '',
      showBackRouteArrow: false,
    });
  }, []);

  const {
    refetch,
    loading,
    error,
    data,
    fetchMore,
  } = useQuery<{ bookInfos: BookInfoListType }>(BookInfosQuery, {
    variables: {
      offset: 0,
      limit: 10,
      search: debounceSearch || '',
      order: store.sortOrder,
      history: store.history || !!debounceSearch,
    },
  });

  const [isLoadingMore, loadMore] = useLoadMore(fetchMore);

  const infos = React.useMemo(() => (data ? data.bookInfos.infos : []), [data]);
  const onDeletedBookInfo = React.useCallback((info, books) => {
    // noinspection JSIgnoredPromiseFromCall
    refetch({ offset: 0, limit: infos.length });
    // noinspection JSIgnoredPromiseFromCall
    db.infoReads.delete(info.id);
    // noinspection JSIgnoredPromiseFromCall
    db.bookReads.bulkDelete(books.map((b) => b.id));
    if (store.wb) {
      books.map(({ id: bookId, pages }) => store.wb.messageSW({
        type: 'BOOK_REMOVE',
        bookId,
        pages,
      }));
    }
  }, [refetch, store, infos]);

  const clickLoadMore = React.useCallback(() => {
    // @ts-ignore
    loadMore({
      variables: {
        offset: infos.length,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        return {
          bookInfos: {
            ...fetchMoreResult.bookInfos,
            infos: [...prev.bookInfos.infos, ...fetchMoreResult.bookInfos.infos],
          },
        };
      },
    });
  }, [loadMore, infos]);

  const refetchAll = React.useCallback(() => {
    // noinspection JSIgnoredPromiseFromCall
    refetch({ offset: 0, limit: infos.length || 10 });
  }, [refetch, infos]);

  return (
    <div className={classes.home}>
      {(loading || error) ? (
        <div className={classes.loading}>
          {loading && 'Loading'}
          {error && `${error.toString().replace(/:\s*/g, '\n')}`}
        </div>
      ) : (
        <>
          <div className={classes.homeGrid}>
            {infos.map((info) => (
              <BookInfo
                key={info.id}
                {...info}
                onClick={() => (info.history ? setOpenAddBook(info.id) : history.push(`/info/${info.id}`))}
                onDeleted={(books) => onDeletedBookInfo(info, books)}
                onEdit={refetchAll}
                thumbnailSize={theme.breakpoints.down('xs') ? 150 : 200}
              />
            ))}
            {(isLoadingMore) && (
              <div className={classes.loadMoreProgress}>
                <CircularProgress color="secondary" />
              </div>
            )}
            {(!isLoadingMore && infos.length < data.bookInfos.length) && (
              <Waypoint onEnter={clickLoadMore} />
            )}
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
        onClick={refetchAll}
        aria-label="refetch"
      >
        <Icon>refresh</Icon>
      </Fab>

      <AddBookInfoDialog
        open={open}
        onAdded={refetchAll}
        onClose={() => setOpen(false)}
      />

      <AddBookDialog
        open={!!openAddBook}
        infoId={openAddBook}
        onClose={() => setOpenAddBook(undefined)}
        onAdded={refetchAll}
      />
    </div>
  );
};

// @ts-ignore
Home.whyDidYouRender = true;

export default Home;
