import React from 'react';
import {
  Checkbox,
  createStyles,
  Fab,
  Icon,
  IconButton,
  makeStyles,
  Menu,
  MenuItem,
  Theme,
  useTheme,
} from '@material-ui/core';
import { common } from '@material-ui/core/colors';
import { useHistory, useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useRecoilState } from 'recoil';

import { BookOrder, useBookInfoQuery } from '@syuchan1005/book-reader-graphql/generated/GQLQueries';

import { commonTheme } from '@client/App';

import db from '@client/Database';

import Book from '@client/components/Book';
import TitleAndBackHeader from '@client/components/TitleAndBackHeader';
import SelectBookHeader from '@client/components/SelectBookHeader';
import { workbox } from '@client/registerServiceWorker';
import useMediaQuery from '@client/hooks/useMediaQuery';
import useMenuAnchor from '@client/hooks/useMenuAnchor';
import { sortBookOrderState } from '@client/store/atoms';
import { pageAspectRatio } from '@client/components/BookPageImage';
import useLazyDialog from '@client/hooks/useLazyDialog';
import { defaultTitle } from '../../../common';

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
    columnGap: `${theme.spacing(2)}px`,
    rowGap: `${theme.spacing(2)}px`,
    [theme.breakpoints.down('xs')]: {
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
}));

enum ScreenMode {
  NORMAL,
  SELECT,
}

const Info = (props: InfoProps) => {
  const [sortBookOrder, setSortBookOrder] = useRecoilState(sortBookOrderState);
  const classes = useStyles(props);
  const theme = useTheme();
  const history = useHistory();
  const { id: infoId } = useParams<{ id: string }>();

  const visibleMargin = React
    .useMemo(() => `0px 0px ${theme.spacing(3)}px 0px`, [theme]);
  const [readId, setReadId] = React.useState('');
  const [isShownAddDialog, canMountAddDialog, showAddDialog, hideAddDialog] = useLazyDialog(false);
  const [mode, setMode] = React.useState<ScreenMode>(ScreenMode.NORMAL);
  const [selectIds, setSelectIds] = React.useState([]);

  const setTitle = React.useCallback((title) => {
    document.title = typeof title === 'function' ? title(defaultTitle) : title;
  }, []);

  const [isSkipQuery, setSkipQuery] = React.useState(true);
  React.useEffect(() => {
    setSkipQuery(false);
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
  React.useEffect(() => {
    setTitle((t) => `${bookName} - ${t}`);
  }, [bookName, setTitle]);

  React.useEffect(() => {
    let unMounted = false;
    db.infoReads.get(infoId)
      .then((read) => {
        if (read && !unMounted) {
          setReadId(read.bookId);
        }
      });
    return () => {
      unMounted = true;
    };
  }, [infoId]);

  const { enqueueSnackbar } = useSnackbar();

  const clickBook = React.useCallback((bookId) => {
    db.infoReads.put({
      infoId,
      bookId,
    })
      .catch((e) => enqueueSnackbar(e, { variant: 'error' }));
    history.push(`/book/${bookId}`);
  }, [infoId, history, enqueueSnackbar]);

  const bookList: typeof data.bookInfo.books = React.useMemo(
    () => (data?.bookInfo?.books ?? []),
    [data],
  );

  const onDeletedBook = React.useCallback((bookId: string, pages: number) => {
    // noinspection JSIgnoredPromiseFromCall
    refetch();
    // noinspection JSIgnoredPromiseFromCall
    db.bookReads.delete(bookId);
    workbox?.messageSW({
      type: 'BOOK_REMOVE',
      bookId,
      pages,
    });
  }, [refetch]);

  const downXs = useMediaQuery(theme.breakpoints.down('xs'));

  const toggleSelect = React.useCallback((id: string) => {
    if (selectIds.includes(id)) {
      setSelectIds(selectIds.filter((i) => i !== id));
    } else {
      setSelectIds([...selectIds, id]);
    }
  }, [selectIds]);

  const [sortEl, setSortEl, resetSortEl] = useMenuAnchor();

  const handleBookClick = React.useCallback((bookId: string) => {
    if (mode === ScreenMode.NORMAL) {
      clickBook(bookId);
    } else {
      toggleSelect(bookId);
    }
  }, [clickBook, mode, toggleSelect]);

  const setSelectScreenMode = React.useCallback(() => {
    setMode(ScreenMode.SELECT);
  }, []);

  const handleHeaderClose = React.useCallback(() => {
    setMode(ScreenMode.NORMAL);
    if (selectIds.length > 0) {
      setSelectIds([]);
    }
  }, [selectIds]);

  const handleDeleteBooks = React.useCallback(() => {
    setMode(ScreenMode.NORMAL);
    refetch();
  }, [refetch]);

  return (
    <>
      {(mode === 0) ? (
        <TitleAndBackHeader
          backRoute="/"
          title={bookName}
        >
          <IconButton
            style={{ color: common.white }}
            onClick={setSelectScreenMode}
          >
            <Icon>check_box</Icon>
          </IconButton>
          <IconButton
            style={{ color: common.white }}
            onClick={setSortEl}
          >
            <Icon>sort</Icon>
          </IconButton>
          <Menu
            getContentAnchorEl={null}
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
          onDeleteBooks={handleDeleteBooks}
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
            <div className={classes.infoGrid}>
              {// @ts-ignore
                (bookList && bookList.length > 0) && bookList.map(
                  (book) => (
                    <Book
                      infoId={infoId}
                      simple={mode === 1}
                      {...book}
                      name={bookName}
                      reading={readId === book.id}
                      key={book.id}
                      onClick={handleBookClick}
                      onDeleted={onDeletedBook}
                      onEdit={refetch}
                      thumbnailSize={downXs ? 150 : 200}
                      thumbnailNoSave={false}
                      visibleMargin={visibleMargin}
                    >
                      <Checkbox
                        style={{ color: 'white' }}
                        checked={selectIds.includes(book.id)}
                        onChange={() => toggleSelect(book.id)}
                      />
                    </Book>
                  ),
                )
              }
            </div>
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
