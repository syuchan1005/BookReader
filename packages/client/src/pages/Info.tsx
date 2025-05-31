import {
  Fab,
  Icon,
  IconButton,
  Menu,
  MenuItem,
  Theme,
  useTheme,
} from '@mui/material';
import { common } from '@mui/material/colors';
import createStyles from '@mui/styles/createStyles';
import makeStyles from '@mui/styles/makeStyles';
import { useLocation, useParams, useSearchParams } from 'react-router-dom';
import { useRecoilState } from 'recoil';

import { BookOrder, useBookInfoQuery } from '@syuchan1005/book-reader-graphql';

import { commonTheme } from '@client/App';

import db, { Read } from '@client/indexedDb/Database';

import Book from '@client/components/Book';
import { pageAspectRatio } from '@client/components/BookPageImage';
import { EmptyScreen } from '@client/components/EmptyScreen';
import SelectBookHeader from '@client/components/SelectBookHeader';
import TitleAndBackHeader from '@client/components/TitleAndBackHeader';
import { useLazyDialog } from '@client/hooks/useLazyDialog';
import { useMediaQuery } from '@client/hooks/useMediaQuery';
import { useMenuAnchor } from '@client/hooks/useMenuAnchor';
import { useTitle } from '@client/hooks/useTitle';
import { workbox } from '@client/registerServiceWorker';
import { sortBookOrderState } from '@client/store/atoms';
import {
  MouseEvent,
  ReactElement,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

const AddBookDialog = lazy(
  () => import('@client/components/dialogs/AddBookDialog'),
);

interface InfoProps {
  children?: ReactElement;
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    info: {
      height: '100%',
      ...commonTheme.appbar(theme, 'paddingTop'),
    },
    infoGrid: {
      padding: theme.spacing(1),
      display: 'grid',
      justifyContent: 'center',
      gridTemplateColumns: 'repeat(auto-fill, 200px) [end]',
      gridTemplateRows: `repeat(auto-fit, ${pageAspectRatio(200)}px)`,
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
      bottom: `calc(${commonTheme.safeArea.bottom} + ${theme.spacing(2)})`,
      right: theme.spacing(2),
      zIndex: 2,
      fallbacks: {
        bottom: theme.spacing(2),
      },
    },
    addButton: {
      position: 'fixed',
      right: theme.spacing(2),
      bottom: `calc(${commonTheme.safeArea.bottom} + ${theme.spacing(11)})`,
      background: theme.palette.background.paper,
      color: theme.palette.secondary.main,
      zIndex: 2,
      fallbacks: {
        bottom: theme.spacing(11),
      },
    },
    selectedBookOverlay: {
      position: 'relative',
      '&::after': {
        pointerEvents: 'none',
        backgroundColor: theme.palette.primary.main,
        opacity: '0.45',
        content: "''",
        position: 'absolute',
        top: 0,
        right: 0,
        left: 0,
        bottom: 0,
        borderRadius: theme.shape.borderRadius,
      },
    },
    selectedBookCheckIcon: {
      color: theme.palette.common.white,
      marginRight: theme.spacing(1),
      marginTop: theme.spacing(1),
    },
  }),
);

const ScreenMode = {
  NORMAL: 'NORMAL',
  SELECT: 'SELECT',
} as const;
type ScreenModeType = (typeof ScreenMode)[keyof typeof ScreenMode];

const Info = (props: InfoProps) => {
  const [sortBookOrder, setSortBookOrder] = useRecoilState(sortBookOrderState);
  const classes = useStyles(props);
  const theme = useTheme();
  const { id: infoId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  const visibleMargin = useMemo(
    () => `0px 0px ${theme.spacing(3)} 0px`,
    [theme],
  );
  const [isShownAddDialog, canMountAddDialog, showAddDialog, hideAddDialog] =
    useLazyDialog(false);
  const [mode, setMode] = useState<ScreenModeType>(ScreenMode.NORMAL);
  const [selectIds, setSelectIds] = useState([]);

  const [isSkipQuery, setSkipQuery] = useState(true);
  // biome-ignore lint/correctness/useExhaustiveDependencies: location, searchParams, showAddDialog
  useEffect(() => {
    setSkipQuery(false);

    if (searchParams.has('add')) {
      const newParam = new URLSearchParams(searchParams);
      newParam.delete('add');
      setSearchParams(newParam, {
        replace: true,
        state: location.state,
      });

      showAddDialog();
    }
  }, []);

  const { refetch, loading, error, data } = useBookInfoQuery({
    skip: isSkipQuery,
    variables: {
      id: infoId,
      order: sortBookOrder,
    },
  });

  const bookInfoName = useMemo(() => data?.bookInfo?.name ?? '', [data]);
  useTitle(bookInfoName || undefined);

  const bookList = useMemo(() => data?.bookInfo?.books ?? [], [data]);

  const [updateReadBooks, setUpdateReadBooks] = useState(0);
  const [sortedReadBooks, setSortedReadBooks] = useState<Read[]>([]);
  useEffect(() => {
    let cancelled = false;
    db.read
      .getAll(
        Number.MAX_SAFE_INTEGER,
        { key: 'infoId', direction: 'prev' },
        infoId,
      )
      .then((reads) => {
        if (cancelled) {
          return;
        }

        setSortedReadBooks(
          reads.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()),
        );
      });
    return () => {
      cancelled = true;
    };
  }, [infoId, updateReadBooks]);

  const readId: string = useMemo(() => {
    if (sortedReadBooks.length === 0) {
      return '';
    }
    if (bookList.length === 0) {
      return sortedReadBooks[0].bookId;
    }
    const existBookIds = bookList.map((book) => book.id);
    return (
      sortedReadBooks.find((read) => existBookIds.includes(read.bookId))
        ?.bookId || ''
    );
  }, [bookList, sortedReadBooks]);

  const onDeletedBook = useCallback(
    (bookId: string, pages: number) => {
      // noinspection JSIgnoredPromiseFromCall
      refetch();
      // noinspection JSIgnoredPromiseFromCall
      db.read.delete(bookId);
      workbox?.messageSW({
        type: 'BOOK_REMOVE',
        bookId,
        pages,
      });
    },
    [refetch],
  );

  const downXs = useMediaQuery(theme.breakpoints.down('sm'));

  const toggleSelect = useCallback(
    (id: string) => {
      if (selectIds.includes(id)) {
        setSelectIds(selectIds.filter((i) => i !== id));
      } else {
        setSelectIds([...selectIds, id]);
      }
    },
    [selectIds],
  );

  const [sortEl, setSortEl, resetSortEl] = useMenuAnchor();

  const handleBookClick = useCallback(
    (event: MouseEvent, bookId: string) => {
      if (mode === ScreenMode.SELECT) {
        event.preventDefault();
        toggleSelect(bookId);
      }
    },
    [mode, toggleSelect],
  );

  const handleBookLongClick = useCallback(
    (event, bookId: string) => {
      event.preventDefault();
      setMode(ScreenMode.SELECT);
      toggleSelect(bookId);
    },
    [toggleSelect],
  );

  const handleHeaderClose = useCallback(() => {
    setMode(ScreenMode.NORMAL);
    if (selectIds.length > 0) {
      setSelectIds([]);
    }
  }, [selectIds]);

  const handleSelectBookMutated = useCallback(() => {
    setMode(ScreenMode.NORMAL);
    refetch();
    if (selectIds.length > 0) {
      setSelectIds([]);
    }
  }, [refetch, selectIds]);

  return (
    <>
      {mode === ScreenMode.NORMAL ? (
        <TitleAndBackHeader backRoute="/" title={bookInfoName}>
          <IconButton
            style={{ color: common.white }}
            onClick={setSortEl}
            size="large"
          >
            <Icon>sort</Icon>
          </IconButton>
          <Menu anchorEl={sortEl} open={!!sortEl} onClose={resetSortEl}>
            {Object.keys(BookOrder).map((order: BookOrder) => (
              <MenuItem
                key={order}
                onClick={() => {
                  setSortBookOrder(BookOrder[order]);
                  resetSortEl();
                }}
              >
                {BookOrder[order]}
              </MenuItem>
            ))}
          </Menu>
        </TitleAndBackHeader>
      ) : (
        <SelectBookHeader
          infoId={infoId}
          selectIds={selectIds}
          onClose={handleHeaderClose}
          onDeleteBooks={handleSelectBookMutated}
          onMoveBooks={handleSelectBookMutated}
        />
      )}
      <main className={classes.info}>
        {loading || (error && !data) ? (
          <div className={classes.loading}>
            {loading && 'Loading'}
            {error && `${error.toString().replace(/:\s*/g, '\n')}`}
          </div>
        ) : (
          <>
            {(loading || bookList?.length > 0) && (
              <div className={classes.infoGrid}>
                {
                  // @ts-ignore
                  bookList &&
                    bookList.length > 0 &&
                    bookList.map((book) => (
                      <Book
                        key={book.id}
                        infoId={infoId}
                        simple={mode === ScreenMode.SELECT}
                        {...book}
                        name={bookInfoName}
                        reading={readId === book.id}
                        onClick={handleBookClick}
                        onDeleted={onDeletedBook}
                        onEdit={refetch}
                        onHistoryDeleted={() =>
                          setUpdateReadBooks((i) => i + 1)
                        }
                        thumbnailSize={downXs ? 150 : 200}
                        thumbnailNoSave={false}
                        visibleMargin={visibleMargin}
                        overlayClassName={
                          selectIds.includes(book.id)
                            ? classes.selectedBookOverlay
                            : undefined
                        }
                        disableRipple={mode === ScreenMode.SELECT}
                        onLongPress={
                          mode === ScreenMode.NORMAL
                            ? handleBookLongClick
                            : undefined
                        }
                      >
                        {selectIds.includes(book.id) && (
                          <Icon className={classes.selectedBookCheckIcon}>
                            check_circle
                          </Icon>
                        )}
                      </Book>
                    ))
                }
              </div>
            )}
            {!loading && bookList.length === 0 && <EmptyScreen />}

            <Fab
              className={classes.addButton}
              onClick={showAddDialog}
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
          onClick={() => refetch()}
          aria-label="refetch"
        >
          <Icon style={{ color: 'white' }}>refresh</Icon>
        </Fab>

        {canMountAddDialog && (
          <AddBookDialog
            open={isShownAddDialog}
            infoId={infoId}
            onAdded={refetch}
            onClose={hideAddDialog}
          />
        )}
      </main>
    </>
  );
};

export default Info;
