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

import AddBookDialog from '@client/components/dialogs/AddBookDialog';
import Book from '@client/components/Book';
import TitleAndBackHeader from '@client/components/TitleAndBackHeader';
import SelectBookHeader from '@client/components/SelectBookHeader';
import { workbox } from '@client/registerServiceWorker';
import useMediaQuery from '@client/hooks/useMediaQuery';
import useMenuAnchor from '@client/hooks/useMenuAnchor';
import useBooleanState from '@client/hooks/useBooleanState';
import { sortBookOrderState } from '@client/store/atoms';

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
    columnGap: `${theme.spacing(2)}px`,
    rowGap: `${theme.spacing(2)}px`,
  },
  [theme.breakpoints.down('xs')]: {
    infoGrid: {
      gridTemplateColumns: 'repeat(auto-fill, 150px)',
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
  const params = useParams<{ id: string }>();

  const [readId, setReadId] = React.useState('');
  const [isShownAddDialog, showAddDialog, hideAddDialog] = useBooleanState(false);
  const [mode, setMode] = React.useState<ScreenMode>(ScreenMode.NORMAL);
  const [selectIds, setSelectIds] = React.useState([]);

  const [title, setTitle] = React.useState(document.title);
  React.useEffect(() => {
    document.title = title;
  }, [title]);

  const {
    refetch,
    loading,
    error,
    data,
  } = useBookInfoQuery({
    variables: {
      id: params.id,
      order: sortBookOrder,
    },
    onCompleted: (d) => {
      const bookName = d?.bookInfo?.name;
      setTitle((t) => `${bookName} - ${t}`);
    },
  });

  React.useEffect(() => {
    let unMounted = false;
    db.infoReads.get(params.id)
      .then((read) => {
        if (read && !unMounted) {
          setReadId(read.bookId);
        }
      });
    return () => {
      unMounted = true;
    };
  }, [params.id]);

  const { enqueueSnackbar } = useSnackbar();

  const clickBook = React.useCallback((bookId) => {
    db.infoReads.put({
      infoId: params.id,
      bookId,
    })
      .catch((e) => enqueueSnackbar(e, { variant: 'error' }));
    history.push(`/book/${bookId}`);
  }, [params.id, history, enqueueSnackbar]);

  const bookList: typeof data.bookInfo.books = React.useMemo(
    () => (data ? data.bookInfo.books : []),
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
          title={data && data.bookInfo.name}
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
          infoId={params.id}
          selectIds={selectIds}
          onClose={handleHeaderClose}
          onDeleteBooks={handleDeleteBooks}
        />
      )}
      <main className={classes.info}>
        {(loading || error) ? (
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
                      simple={mode === 1}
                      {...book}
                      name={data.bookInfo.name}
                      reading={readId === book.id}
                      key={book.id}
                      onClick={handleBookClick}
                      onDeleted={onDeletedBook}
                      onEdit={refetch}
                      thumbnailSize={downXs ? 150 : 200}
                      thumbnailNoSave={false}
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

        <AddBookDialog
          open={isShownAddDialog}
          infoId={params.id}
          onAdded={refetch}
          onClose={hideAddDialog}
        />
      </main>
    </>
  );
};

export default React.memo(Info);
