import { useQuery } from '@apollo/client/react';
import { commonTheme } from '@client/App';
import BookInfo from '@client/components/BookInfo';
import { pageAspectRatio } from '@client/components/BookPageImage';
import AddBookInfoDialog from '@client/components/dialogs/AddBookInfoDialog';
import { EmptyScreen } from '@client/components/EmptyScreen';
import HomeHeaderMenu from '@client/components/HomeHeaderMenu';
import SearchAndMenuHeader from '@client/components/SearchAndMenuHeader';
import { useBooleanState } from '@client/hooks/useBooleanState';
import { useDebounceValue } from '@client/hooks/useDebounceValue';
import { useMediaQuery } from '@client/hooks/useMediaQuery';
import { useStateWithReset } from '@client/hooks/useStateWithReset';
import { useTitle } from '@client/hooks/useTitle';
import db from '@client/indexedDb/Database';
import { workbox } from '@client/registerServiceWorker';
import {
  genresState,
  homeLastSeenBookPosition,
  searchModeState,
  showBookInfoNameState,
  sortOrderState,
} from '@client/store/atoms';
import {
  CircularProgress,
  Fab,
  Icon,
  type Theme,
  useTheme,
} from '@mui/material';
import createStyles from '@mui/styles/createStyles';
import makeStyles from '@mui/styles/makeStyles';
import {
  type HomeBookInfoFragment,
  RelayBookInfosDocument,
  type SearchMode,
} from '@syuchan1005/book-reader-graphql';
import { useAtom, useAtomValue } from 'jotai';
import {
  type ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

interface HomeProps {
  children?: ReactElement;
}

const bottomNavigationHeight = 7;

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
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
      bottom: `calc(${commonTheme.safeArea.bottom} + ${theme.spacing(
        2 + bottomNavigationHeight,
      )})`,
      right: theme.spacing(2),
      zIndex: 2,
      fallbacks: {
        bottom: theme.spacing(2 + bottomNavigationHeight),
      },
    },
    addButton: {
      position: 'fixed',
      right: theme.spacing(2),
      bottom: `calc(${commonTheme.safeArea.bottom} + ${theme.spacing(
        11 + bottomNavigationHeight,
      )})`,
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
  }),
);

const defaultLoadBookInfoCount = 60;
const loadMoreThreshold = 15;

const Home = (props: HomeProps) => {
  useTitle('');
  const genres = useAtomValue(genresState);
  const sortOrder = useAtomValue(sortOrderState);
  const showBookInfoName = useAtomValue(showBookInfoNameState);
  const classes = useStyles(props);
  const theme = useTheme();

  const [lastSeenPosition, setLastSeenPosition] = useAtom(
    homeLastSeenBookPosition,
  );
  const [isLastSeenPositionLoaded, setLastSeenPositionLoaded] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: lastSeenPosition
  const lastSeenPositionIndex = useMemo(() => lastSeenPosition?.index ?? 0, []);

  const gridRef = useRef<HTMLDivElement>();
  const visibleMargin = useMemo(
    () => `0px 0px ${theme.spacing(3)} 0px`,
    [theme],
  );
  const [menuAnchorEl, setMenuAnchor, closeMenuAnchor] =
    useStateWithReset(null);
  const [open, setOpen, setClose] = useBooleanState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchText = useMemo(() => searchParams.get('search'), [searchParams]);
  const setSearchText = useCallback(
    (text?: string, type: 'push' | 'replace' = 'replace') => {
      const urlSearchParams = new URLSearchParams(searchParams);
      if (text) {
        urlSearchParams.set('search', text);
      } else {
        urlSearchParams.delete('search');
      }
      setSearchParams(urlSearchParams, {
        replace: type === 'replace',
        state: location.state,
      });
    },
    [searchParams, setSearchParams, location],
  );
  const debounceSearch = useDebounceValue(searchText, 800);
  const [searchMode, setSearchMode] = useAtom(searchModeState);
  const handleSearchText = useCallback(
    (text: string, mode: SearchMode) => {
      if (!text) {
        setSearchText(undefined);
      } else if (searchText === undefined) {
        setSearchText(text, 'push');
      } else {
        setSearchText(text, 'replace');
      }
      setSearchMode(mode);
    },
    [searchText, setSearchText, setSearchMode],
  );

  const [isSkipQuery, setSkipQuery] = useState(true);
  useEffect(() => {
    setSkipQuery(false);
  }, []);

  const [infos, setInfos] = useState<HomeBookInfoFragment[]>([]);
  const { refetch, loading, error, data, fetchMore } = useQuery(
    RelayBookInfosDocument,
    {
      skip: isSkipQuery,
      variables: {
        first: lastSeenPositionIndex + defaultLoadBookInfoCount,
        option: {
          search: debounceSearch || undefined,
          searchMode,
          genres,
          order: sortOrder,
        },
      },
    },
  );
  useEffect(() => {
    if (data) {
      setInfos(data.bookInfos.edges.map((e) => e.node));
    }
  }, [data]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: infos
  useEffect(() => {
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
      // @ts-expect-error
      elem.scrollIntoView({ block: lastSeenPosition.block });
      setLastSeenPositionLoaded(true);
    } else {
      gridElement.scrollIntoView({ block: 'end' });
    }
  }, [loading, lastSeenPosition, isLastSeenPositionLoaded, infos]);

  const handleDeletedBookInfo = useCallback((infoId: string, books) => {
    setInfos((currentInfos) => currentInfos.filter((i) => i.id !== infoId));
    // noinspection JSIgnoredPromiseFromCall
    db.read.bulkDelete(books.map((b) => b.id));
    if (workbox) {
      books.map(({ id: bookId, pages }) =>
        workbox.messageSW({
          type: 'BOOK_REMOVE',
          bookId,
          pages,
        }),
      );
    }
  }, []);

  const handleEditBookInfo = useCallback(
    (homeBookInfo: HomeBookInfoFragment) => {
      setInfos((currentInfos) => [
        homeBookInfo,
        ...currentInfos.filter((i) => i.id !== homeBookInfo.id),
      ]);
    },
    [],
  );

  const handleLoadMore = useCallback(
    () =>
      fetchMore({
        variables: {
          after: data.bookInfos.edges[data.bookInfos.edges.length - 1].cursor,
        },
      }),
    [data, fetchMore],
  );

  const refetchAll = useCallback(
    () =>
      refetch({
        first: infos.length || defaultLoadBookInfoCount,
      }),
    [refetch, infos],
  );

  const downXs = useMediaQuery(theme.breakpoints.down('sm'));

  const handleVisible = useCallback(
    (i: number, isVisible: boolean, isFirstVisible: boolean) => {
      if (!isVisible) {
        return;
      }

      if (isFirstVisible) {
        const isOverLoadMoreThreshold =
          infos.length - i - 1 < loadMoreThreshold;
        if (
          isOverLoadMoreThreshold &&
          !loading &&
          data &&
          data.bookInfos.pageInfo.hasNextPage
        ) {
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
    [
      data,
      handleLoadMore,
      infos.length,
      isLastSeenPositionLoaded,
      loading,
      setLastSeenPosition,
    ],
  );

  const openInfoPage = useCallback(
    ({ id }: HomeBookInfoFragment) =>
      navigate(`/info/${id}?add`, {
        state: {
          referrer: location.pathname,
        },
      }),
    [navigate, location.pathname],
  );

  const [updateReadingInfo, setUpdateReadingInfo] = useState(0);
  const [readingInfoId, setReadingInfoId] = useState('');
  // biome-ignore lint/correctness/useExhaustiveDependencies: updateReadingInfo
  useEffect(() => {
    let cancelled = false;
    db.read
      .getAll(1, {
        key: 'updatedAt',
        direction: 'prev',
      })
      .then((reads) => {
        if (cancelled) {
          return;
        }

        setReadingInfoId(reads[0]?.infoId ?? '');
      });
    return () => {
      cancelled = true;
    };
  }, [updateReadingInfo]);

  return (
    <>
      <SearchAndMenuHeader
        searchText={searchText || ''}
        searchMode={searchMode}
        onChangeSearchText={handleSearchText}
        onClickMenuIcon={setMenuAnchor}
      />
      <HomeHeaderMenu anchorEl={menuAnchorEl} onClose={closeMenuAnchor} />
      <main className={classes.home}>
        {error && !data ? (
          <div className={classes.loading}>
            {`${error.toString().replace(/:\s*/g, '\n')}`}
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
                    onEdit={handleEditBookInfo}
                    onHistoryDeleted={() => setUpdateReadingInfo((i) => i + 1)}
                    thumbnailSize={downXs ? 150 : 200}
                    showName={showBookInfoName}
                    visibleMargin={visibleMargin}
                    index={i}
                    onVisible={handleVisible}
                    isReading={info.id === readingInfoId}
                  />
                ))}
                {loading && infos.length === 0 && (
                  <div className={classes.loadMoreProgress}>
                    <CircularProgress color="secondary" />
                  </div>
                )}
              </div>
            )}
            {!loading && infos.length === 0 && <EmptyScreen />}

            <Fab
              className={classes.addButton}
              onClick={setOpen}
              aria-label="add"
              accessKey="a"
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
          onAdded={openInfoPage}
          onClose={setClose}
        />
      </main>
    </>
  );
};

export default Home;
