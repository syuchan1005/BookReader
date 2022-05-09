import React from 'react';
import {
  Fab, Icon, IconButton, Menu, MenuItem, Theme, useTheme,
} from '@mui/material';
import createStyles from '@mui/styles/createStyles';
import makeStyles from '@mui/styles/makeStyles';
import { common } from '@mui/material/colors';
import { useLocation, useParams, useSearchParams } from 'react-router-dom';
import { useRecoilState } from 'recoil';

import { BookOrder, useBookInfoQuery } from '@syuchan1005/book-reader-graphql/generated/GQLQueries';

import { commonTheme } from '@client/App';

import db, { Read } from '@client/indexedDb/Database';

import Book from '@client/components/Book';
import TitleAndBackHeader from '@client/components/TitleAndBackHeader';
import SelectBookHeader from '@client/components/SelectBookHeader';
import { workbox } from '@client/registerServiceWorker';
import useMediaQuery from '@client/hooks/useMediaQuery';
import useMenuAnchor from '@client/hooks/useMenuAnchor';
import { sortBookOrderState } from '@client/store/atoms';
import { pageAspectRatio } from '@client/components/BookPageImage';
import useLazyDialog from '@client/hooks/useLazyDialog';
import { EmptyScreen } from '@client/components/EmptyScreen';
import { useTitle } from '@client/hooks/useTitle';

const AddBookDialog = React.lazy(() => import('@client/components/dialogs/AddBookDialog'));

interface InfoProps {
  children?: React.ReactElement;
}

const useStyles = makeStyles((theme: Theme) => createStyles({
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
      content: '\'\'',
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
}));

const ScreenMode = {
  NORMAL: 'NORMAL',
  SELECT: 'SELECT',
} as const;
type ScreenModeType = typeof ScreenMode[keyof typeof ScreenMode];

const Info = (props: InfoProps) => {
  const [sortBookOrder, setSortBookOrder] = useRecoilState(sortBookOrderState);
  const classes = useStyles(props);
  const theme = useTheme();
  const { id: infoId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  const visibleMargin = React
    .useMemo(() => `0px 0px ${theme.spacing(3)} 0px`, [theme]);
  const [isShownAddDialog, canMountAddDialog, showAddDialog, hideAddDialog] = useLazyDialog(false);
  const [mode, setMode] = React.useState<ScreenModeType>(ScreenMode.NORMAL);
  const [selectIds, setSelectIds] = React.useState([]);

  const [isSkipQuery, setSkipQuery] = React.useState(true);
  React.useEffect(() => {
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
    // eslint-disable-next-line
  }, []);

  const {
    refetch,
    loading,
    error,
    data,
  } = useBookInfoQuery({
    skip: isSkipQuery,
    variables: {
      id: infoId,
      order: sortBookOrder,
    },
  });

  const bookName = React.useMemo(() => data?.bookInfo?.name ?? '', [data]);
  useTitle(bookName || undefined);

  const bookList = React.useMemo(
    () => (data?.bookInfo?.books ?? []),
    [data],
  );

  const [sortedReadBooks, setSortedReadBooks] = React.useState<Read[]>([]);
  React.useEffect(() => {
    let cancelled = false;
    db.read.getAll(Number.MAX_SAFE_INTEGER, { key: 'infoId', direction: 'prev' }, infoId)
      .then((reads) => {
        if (cancelled) {
          return;
        }

        setSortedReadBooks(
          reads.sort(
            (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
          ),
        );
      });
    return () => { cancelled = true; };
  }, [infoId]);

  const readId: string = React.useMemo(() => {
    if (sortedReadBooks.length === 0) {
      return '';
    }
    if (bookList.length === 0) {
      return sortedReadBooks[0].bookId;
    }
    const existBookIds = bookList.map((book) => book.id);
    return sortedReadBooks
      .find((read) => existBookIds.includes(read.bookId))
      .bookId || '';
  }, [bookList, sortedReadBooks]);

  const onDeletedBook = React.useCallback((bookId: string, pages: number) => {
    // noinspection JSIgnoredPromiseFromCall
    refetch();
    // noinspection JSIgnoredPromiseFromCall
    db.read.delete(bookId);
    workbox?.messageSW({
      type: 'BOOK_REMOVE',
      bookId,
      pages,
    });
  }, [refetch]);

  const downXs = useMediaQuery(theme.breakpoints.down('sm'));

  const toggleSelect = React.useCallback((id: string) => {
    if (selectIds.includes(id)) {
      setSelectIds(selectIds.filter((i) => i !== id));
    } else {
      setSelectIds([...selectIds, id]);
    }
  }, [selectIds]);

  const [sortEl, setSortEl, resetSortEl] = useMenuAnchor();

  const handleBookClick = React.useCallback((event: React.MouseEvent, bookId: string) => {
    if (mode === ScreenMode.SELECT) {
      event.preventDefault();
      toggleSelect(bookId);
    }
  }, [mode, toggleSelect]);

  const handleBookLongClick = React.useCallback((event, bookId: string) => {
    event.preventDefault();
    setMode(ScreenMode.SELECT);
    toggleSelect(bookId);
  }, [toggleSelect]);

  const handleHeaderClose = React.useCallback(() => {
    setMode(ScreenMode.NORMAL);
    if (selectIds.length > 0) {
      setSelectIds([]);
    }
  }, [selectIds]);

  const handleSelectBookMutated = React.useCallback(() => {
    setMode(ScreenMode.NORMAL);
    refetch();
    if (selectIds.length > 0) {
      setSelectIds([]);
    }
  }, [refetch, selectIds]);

  return (
    <>
      {(mode === ScreenMode.NORMAL) ? (
        <TitleAndBackHeader
          backRoute="/"
          title={bookName}
        >
          <IconButton style={{ color: common.white }} onClick={setSortEl} size="large">
            <Icon>sort</Icon>
          </IconButton>
          <Menu
            anchorEl={sortEl}
            open={!!sortEl}
            onClose={resetSortEl}
          >
            {Object.keys(BookOrder)
              .map((order: BookOrder) => (
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
        {(loading || (error && !data)) ? (
          <div className={classes.loading}>
            {loading && 'Loading'}
            {error && `${error.toString()
              .replace(/:\s*/g, '\n')}`}
          </div>
        ) : (
          <>
            {(loading || bookList?.length > 0) && (
              <div className={classes.infoGrid}>
                {// @ts-ignore
                  (bookList && bookList.length > 0) && bookList.map(
                    (book) => (
                      <Book
                        key={book.id}
                        infoId={infoId}
                        simple={mode === ScreenMode.SELECT}
                        {...book}
                        name={bookName}
                        reading={readId === book.id}
                        onClick={handleBookClick}
                        onDeleted={onDeletedBook}
                        onEdit={refetch}
                        thumbnailSize={downXs ? 150 : 200}
                        thumbnailNoSave={false}
                        visibleMargin={visibleMargin}
                        overlayClassName={selectIds.includes(book.id)
                          ? classes.selectedBookOverlay
                          : undefined}
                        disableRipple={mode === ScreenMode.SELECT}
                        onLongPress={mode === ScreenMode.NORMAL ? handleBookLongClick : undefined}
                      >
                        {(selectIds.includes(book.id)) && (
                          <Icon className={classes.selectedBookCheckIcon}>check_circle</Icon>
                        )}
                      </Book>
                    ),
                  )
                }
              </div>
            )}
            {(!loading && bookList.length === 0) && (<EmptyScreen />)}
            <Fab
              className={classes.addButton}
              onClick={showAddDialog}
              aria-label="add"
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

        {(canMountAddDialog) && (
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

export default React.memo(Info);
