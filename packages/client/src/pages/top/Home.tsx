import React from 'react';
import {
  CircularProgress,
  Fab,
  Icon,
  Theme,
  useTheme,
} from '@mui/material';
import createStyles from '@mui/styles/createStyles';
import makeStyles from '@mui/styles/makeStyles';
import { useQueryParam, StringParam } from 'use-query-params';
import { useRecoilState, useRecoilValue } from 'recoil';

import { useRelayBookInfosQuery } from '@syuchan1005/book-reader-graphql/generated/GQLQueries';

import { commonTheme } from '@client/App';
import AddBookInfoDialog from '@client/components/dialogs/AddBookInfoDialog';
import useDebounceValue from '@client/hooks/useDebounceValue';

import { defaultTitle } from '@syuchan1005/book-reader-common';
import SearchAndMenuHeader from '@client/components/SearchAndMenuHeader';
import HomeHeaderMenu from '@client/components/HomeHeaderMenu';
import BookInfo from '@client/components/BookInfo';
import { pageAspectRatio } from '@client/components/BookPageImage';
import useBooleanState from '@client/hooks/useBooleanState';
import useStateWithReset from '@client/hooks/useStateWithReset';
import useMediaQuery from '@client/hooks/useMediaQuery';
import { workbox } from '@client/registerServiceWorker';
import {
  genresState,
  sortOrderState,
  showBookInfoNameState, homeLastSeenBookPosition,
} from '@client/store/atoms';
import { EmptyScreen } from '@client/components/EmptyScreen';
import db from '@client/Database';

interface HomeProps {
  children?: React.ReactElement;
}

const bottomNavigationHeight = 7;

const useStyles = makeStyles((theme: Theme) => createStyles({
  home: {
    height: '100%',
    ...commonTheme.appbar(theme, 'paddingTop'),
  },
  homeGrid: {
    padding: theme.spacing(1),
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, 200px) [end]',
    gridTemplateRows: `repeat(auto-fit, ${pageAspectRatio(200)}px)`,
    justifyContent: 'center',
    columnGap: theme.spacing(2),
    rowGap: theme.spacing(2),
    [theme.breakpoints.down('sm')]: {
      gridTemplateColumns: 'repeat(auto-fill, 150px) [end]',
      gridTemplateRows: `repeat(auto-fit, ${pageAspectRatio(150)}px)`,
    },
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
    bottom: `calc(${commonTheme.safeArea.bottom} + ${theme.spacing(2 + bottomNavigationHeight)})`,
    right: theme.spacing(2),
    zIndex: 2,
    fallbacks: {
      bottom: theme.spacing(2 + bottomNavigationHeight),
    },
  },
  addButton: {
    position: 'fixed',
    right: theme.spacing(2),
    bottom: `calc(${commonTheme.safeArea.bottom} + ${theme.spacing(11 + bottomNavigationHeight)})`,
    background: theme.palette.background.paper,
    color: theme.palette.secondary.main,
    zIndex: 2,
    fallbacks: {
      bottom: theme.spacing(11 + bottomNavigationHeight),
    },
  },
  loadMoreProgress: {
    gridColumn: '1 / end',
    display: 'flex',
    justifyContent: 'center',
  },
}));

// INFO: This value must be at least half the number displayed on viewport.
const defaultLoadBookInfoCount = 20;

const Home = (props: HomeProps) => {
  const genres = useRecoilValue(genresState);
  const sortOrder = useRecoilValue(sortOrderState);
  const showBookInfoName = useRecoilValue(showBookInfoNameState);
  const classes = useStyles(props);
  const theme = useTheme();

  const [lastSeenPosition, setLastSeenPosition] = useRecoilState(homeLastSeenBookPosition);
  const [isLastSeenPositionLoaded, setLastSeenPositionLoaded] = React.useState(false);

  // eslint-disable-next-line
  const lastSeenPositionIndex = React.useMemo(() => (lastSeenPosition?.index ?? 0), []);

  const gridRef = React.useRef<HTMLDivElement>();
  const visibleMargin = React
    .useMemo(() => `0px 0px ${theme.spacing(3)} 0px`, [theme]);
  const [menuAnchorEl, setMenuAnchor, closeMenuAnchor] = useStateWithReset(null);
  const [open, setOpen, setClose] = useBooleanState(false);
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

  const [isSkipQuery, setSkipQuery] = React.useState(true);
  React.useEffect(() => {
    document.title = defaultTitle;
    setSkipQuery(false);
  }, []);

  const {
    refetch,
    loading,
    error,
    data,
    fetchMore,
  } = useRelayBookInfosQuery({
    skip: isSkipQuery,
    fetchPolicy: 'cache-and-network',
    variables: {
      first: lastSeenPositionIndex + defaultLoadBookInfoCount,
      option: {
        search: debounceSearch || undefined,
        genres,
        order: sortOrder,
      },
    },
  });

  const infos = React.useMemo(
    () => (data ? data.bookInfos.edges.map((e) => e.node) : []),
    [data],
  );

  React.useEffect(() => {
    if (!lastSeenPosition) {
      setLastSeenPositionLoaded(true);
      return;
    }
    if (loading || !gridRef.current || isLastSeenPositionLoaded) {
      return;
    }
    const gridElement = gridRef.current;
    if (gridElement.children.length > lastSeenPosition.index) {
      const elem = gridElement.children[lastSeenPosition.index];
      // @ts-ignore
      elem.scrollIntoView({ block: lastSeenPosition.block });
      setLastSeenPositionLoaded(true);
    } else {
      gridElement.scrollIntoView({ block: 'end' });
    }
  }, [loading, lastSeenPosition, isLastSeenPositionLoaded, infos]);

  const handleDeletedBookInfo = React.useCallback((infoId: string, books) => {
    // noinspection JSIgnoredPromiseFromCall
    refetch({ first: infos.length });
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

  const handleLoadMore = React.useCallback(
    () => fetchMore({
      variables: {
        after: data.bookInfos.edges[data.bookInfos.edges.length - 1].cursor,
      },
    }),
    [data, fetchMore],
  );

  const refetchAll = React.useCallback(() => refetch({
    first: infos.length || defaultLoadBookInfoCount,
  }), [refetch, infos]);

  const downXs = useMediaQuery(theme.breakpoints.down('sm'));

  const handleVisible = React.useCallback(
    (i: number, isVisible: boolean, isFirstVisible: boolean) => {
      if (!isVisible) {
        return;
      }

      if (isFirstVisible) {
        const isLast = i === infos.length - 1;
        if (isLast && !loading && data && data.bookInfos.pageInfo.hasNextPage) {
          handleLoadMore();
        }
      }
      if (isLastSeenPositionLoaded) {
        setLastSeenPosition((current) => {
          if (current?.index > i) {
            return {
              index: i,
              block: 'start',
            };
          }
          return {
            index: i,
            block: 'end',
          };
        });
      }
    },
    [data, handleLoadMore, infos.length, isLastSeenPositionLoaded, loading, setLastSeenPosition],
  );

  return (
    <>
      <SearchAndMenuHeader
        searchText={searchText || ''}
        onChangeSearchText={handleSearchText}
        onClickMenuIcon={setMenuAnchor}
      />
      <HomeHeaderMenu anchorEl={menuAnchorEl} onClose={closeMenuAnchor} />
      <main className={classes.home}>
        {(loading || (error && !data)) ? (
          <div className={classes.loading}>
            {loading && 'Loading'}
            {error && `${error.toString()
              .replace(/:\s*/g, '\n')}`}
          </div>
        ) : (
          <>
            {(loading || infos.length > 0) && (
              <div className={classes.homeGrid} ref={gridRef}>
                {infos.map((info, i) => (
                  <BookInfo
                    key={info.id}
                    {...info}
                    onDeleted={handleDeletedBookInfo}
                    onEdit={refetchAll}
                    thumbnailSize={downXs ? 150 : 200}
                    showName={showBookInfoName}
                    visibleMargin={visibleMargin}
                    index={i}
                    onVisible={handleVisible}
                  />
                ))}
                {(loading) && (
                  <div className={classes.loadMoreProgress}>
                    <CircularProgress color="secondary" />
                  </div>
                )}
              </div>
            )}
            {(!loading && infos.length === 0) && (<EmptyScreen />)}
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
          name={infos.length === 0 ? searchText : undefined}
          onAdded={refetchAll}
          onClose={setClose}
        />
      </main>
    </>
  );
};

export default React.memo(Home);
