import React from 'react';
import {
  CircularProgress,
  createStyles,
  Fab,
  Icon,
  makeStyles,
  Theme,
  useTheme,
} from '@material-ui/core';
import { useHistory } from 'react-router-dom';
import { Waypoint } from 'react-waypoint';
import { useQueryParam, StringParam } from 'use-query-params';

import { useBookInfosQuery } from '@syuchan1005/book-reader-graphql/generated/GQLQueries';

import { commonTheme } from '@client/App';
import AddBookInfoDialog from '@client/components/dialogs/AddBookInfoDialog';
import AddBookDialog from '@client/components/dialogs/AddBookDialog';
import useDebounceValue from '@client/hooks/useDebounceValue';
import useLoadMore from '@client/hooks/useLoadMore';
import { useGlobalStore } from '@client/store/StoreProvider';

import { defaultTitle } from '@syuchan1005/book-reader-common';
import SearchAndMenuHeader from '@client/components/SearchAndMenuHeader';
import HomeHeaderMenu from '@client/components/HomeHeaderMenu';
import BookInfo from '@client/components/BookInfo';
import useBooleanState from '@client/hooks/useBooleanState';
import useStateWithReset from '@client/hooks/useStateWithReset';
import useMediaQuery from '@client/hooks/useMediaQuery';
import { workbox } from '@client/registerServiceWorker';
import db from '../Database';

interface HomeProps {
  children?: React.ReactElement;
}

const useStyles = makeStyles((theme: Theme) => createStyles({
  home: {
    height: '100%',
    ...commonTheme.appbar(theme, 'paddingTop'),
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
    whiteSpace: 'pre-line',
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

const defaultLoadBookInfoCount = 20;

const Home = (props: HomeProps) => {
  const { state: store } = useGlobalStore();
  const classes = useStyles(props);
  const theme = useTheme();
  const history = useHistory();

  const [menuAnchorEl, setMenuAnchor, closeMenuAnchor] = useStateWithReset(null);
  const [open, setOpen, setClose] = useBooleanState(false);
  const [openAddBook, setOpenAddBook,
    resetOpenAddBook] = useStateWithReset<string | undefined>(undefined);
  const [searchText, setSearchText] = useQueryParam('search', StringParam);
  const debounceSearch = useDebounceValue(searchText, 800);
  const handleSearchText = React.useCallback((text?: string) => {
    if (!text) {
      setSearchText(undefined);
    } else if (searchText === undefined) {
      setSearchText(text, 'push');
    } else {
      setSearchText(text, 'replace');
    }
  }, [searchText, setSearchText]);

  React.useEffect(() => {
    document.title = defaultTitle;
  }, []);

  const {
    refetch,
    loading,
    error,
    data,
    fetchMore,
  } = useBookInfosQuery({
    variables: {
      offset: 0,
      limit: defaultLoadBookInfoCount,
      search: debounceSearch || '',
      order: store.sortOrder,
      history: {
        SHOW: true,
        HIDE: false,
        ALL: undefined,
      }[store.history],
      genres: store.genres,
    },
  });

  const [isLoadingMore, loadMore] = useLoadMore(fetchMore);

  const infos = React.useMemo(() => (data ? data.bookInfos.infos : []), [data]);
  const handleDeletedBookInfo = React.useCallback((infoId: string, books) => {
    // noinspection JSIgnoredPromiseFromCall
    refetch({
      offset: 0,
      limit: infos.length,
    });
    // noinspection JSIgnoredPromiseFromCall
    db.infoReads.delete(infoId);
    // noinspection JSIgnoredPromiseFromCall
    db.bookReads.bulkDelete(books.map((b) => b.id));
    if (workbox) {
      books.map(({
        id: bookId,
        pages,
      }) => workbox.messageSW({
        type: 'BOOK_REMOVE',
        bookId,
        pages,
      }));
    }
  }, [refetch, infos]);

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
    refetch({
      offset: 0,
      limit: infos.length || defaultLoadBookInfoCount,
    });
  }, [refetch, infos]);

  const downXs = useMediaQuery(theme.breakpoints.down('xs'));

  const handleBookInfoClick = React.useCallback((infoId, isHistory) => {
    if (isHistory) {
      setOpenAddBook(infoId);
    } else {
      history.push(`/info/${infoId}`);
    }
  }, [history, setOpenAddBook]);

  return (
    <>
      <SearchAndMenuHeader
        searchText={searchText || ''}
        onChangeSearchText={handleSearchText}
        onClickMenuIcon={setMenuAnchor}
      />
      <HomeHeaderMenu anchorEl={menuAnchorEl} onClose={closeMenuAnchor} />
      <main className={classes.home}>
        {(loading || error) ? (
          <div className={classes.loading}>
            {loading && 'Loading'}
            {error && `${error.toString()
              .replace(/:\s*/g, '\n')}`}
          </div>
        ) : (
          <>
            <div className={classes.homeGrid}>
              {infos.map((info) => (
                <BookInfo
                  key={info.id}
                  {...info}
                  onClick={handleBookInfoClick}
                  onDeleted={handleDeletedBookInfo}
                  onEdit={refetchAll}
                  thumbnailSize={downXs ? 150 : 200}
                  showName={store.showBookInfoName}
                />
              ))}
              {(isLoadingMore) && (
                <div className={classes.loadMoreProgress}>
                  <CircularProgress color="secondary" />
                </div>
              )}
              {(!isLoadingMore && data.bookInfos.hasNext) && (
                <Waypoint onEnter={clickLoadMore} />
              )}
            </div>
            <Fab
              className={classes.addButton}
              onClick={setOpen}
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
          onClose={setClose}
        />

        <AddBookDialog
          open={!!openAddBook}
          infoId={openAddBook}
          onClose={resetOpenAddBook}
          onAdded={refetchAll}
        />
      </main>
    </>
  );
};

export default React.memo(Home);
