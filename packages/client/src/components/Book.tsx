import {
  MouseEvent,
  ReactNode,
  TouchEvent as ReactTouchEvent,
  lazy,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  Icon,
  IconButton,
  Menu,
  MenuItem,
  Theme,
} from '@mui/material';
import { Link, useLocation } from 'react-router-dom';

import createStyles from '@mui/styles/createStyles';
import makeStyles from '@mui/styles/makeStyles';

import { Book as BookType } from '@syuchan1005/book-reader-graphql';
import {
  useDeleteBooksMutation,
  useEditBookMutation,
} from '@syuchan1005/book-reader-graphql';

import DeleteDialog from '@client/components/dialogs/DeleteDialog';
import EditDialog from '@client/components/dialogs/EditDialog';
import { useBooleanState } from '@client/hooks/useBooleanState';
import { useLazyDialog } from '@client/hooks/useLazyDialog';
import { useLongTap } from '@client/hooks/useLongTap';
import { useMenuAnchor } from '@client/hooks/useMenuAnchor';
import { useVisible } from '@client/hooks/useVisible';
import BookPageImage, { pageAspectRatio } from './BookPageImage';
import { useConfirmDialog } from './dialogs/ConfirmDialog';
import SelectBookThumbnailDialog from './dialogs/SelectBookThumbnailDialog';

import db from '@client/indexedDb/Database';
import { useDownloadBookDialog } from './dialogs/DownloadBookDialog';

const DownloadZipDialog = lazy(
  () => import('@client/components/dialogs/DownloadZipBookDialog'),
);

interface BookProps
  extends Pick<BookType, 'id' | 'thumbnail' | 'number' | 'pages'> {
  infoId: string;
  thumbnailSize: number;
  thumbnailNoSave?: boolean;
  name: string;
  updatedAt?: string;
  reading?: boolean;
  onClick?: (event: MouseEvent, bookId: string) => void;
  onDeleted?: (bookId: string, pages: number) => void;
  onEdit?: () => void;
  onHistoryDeleted?: () => void;

  simple?: boolean;

  visibleMargin?: string;
  onVisible?: () => void;

  overlayClassName?: string;
  disableRipple?: boolean;
  onLongPress?: (event: MouseEvent | ReactTouchEvent, bookId: string) => void;

  children?: ReactNode;
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    card: {
      width: '100%',
      maxHeight: '100%',
      margin: 'auto',
      display: 'flex',
      justifyContent: 'flex-end',
    },
    cardContent: {
      position: 'absolute',
      bottom: '0',
      background: 'rgba(0, 0, 0, 0.7)',
      color: 'white',
      fontSize: '1rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: theme.spacing(1),
      borderTopRightRadius: theme.spacing(0.5),
    },
    labelContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      display: 'flex',
    },
    readLabel: {
      marginLeft: theme.spacing(1),
      background: theme.palette.secondary.main,
      color: theme.palette.secondary.contrastText,
      padding: theme.spacing(1),
      borderRadius: theme.spacing(1),
    },
    newLabel: {
      marginTop: theme.spacing(0.5),
      marginLeft: theme.spacing(0.5),
      color: 'white',
      textShadow: '1px 1px 2px black',
    },
    headerMenu: {
      position: 'absolute',
      zIndex: 1,
      padding: 0,
    },
    link: {
      width: '100%',
      color: 'unset',
      textDecoration: 'unset',
    },
  }),
);

const NEW_BOOK_EXPIRED = 24 * 60 * 60 * 1000; // 1 day

const Book = (props: BookProps) => {
  const classes = useStyles(props);
  const location = useLocation();
  const ref = useRef();
  const {
    infoId,
    name,
    thumbnailSize,
    thumbnailNoSave,
    thumbnail,
    number,
    pages,
    reading,
    id: bookId,
    updatedAt,
    onClick,
    onDeleted,
    onEdit,
    onHistoryDeleted,
    simple,
    children,
    visibleMargin,
    onVisible,
    overlayClassName,
    disableRipple,
    onLongPress,
  } = props;
  const isVisible = useVisible(ref, true, visibleMargin);
  useEffect(() => {
    if (isVisible && onVisible) {
      onVisible();
    }
  }, [onVisible, isVisible]);

  const [isDownloaded, setIsDownloaded] = useState(false);
  useEffect(() => {
    db.downloadedBook.get(bookId).then((book) => setIsDownloaded(!!book));
  }, [bookId]);

  const [menuAnchor, setMenuAnchor, resetMenuAnchor] = useMenuAnchor();
  const [
    isShownDeleteDialog,
    showDeleteDialog,
    hideDeleteDialog,
    ,
    setShowDeleteDialog,
  ] = useBooleanState(false);
  const [
    isShownEditDialog,
    showEditDialog,
    hideEditDialog,
    ,
    setShowEditDialog,
  ] = useBooleanState(false);
  const [editContent, setEditContent] = useState({
    number,
  });
  const [selectDialog, setSelectDialog] = useState<string | undefined>(
    undefined,
  );
  const hideSelectDialog = useCallback(() => {
    setSelectDialog(undefined);
  }, []);
  const [
    isShownDownloadDialog,
    canMountDownloadDialog,
    showDownloadDialog,
    hideDownloadDialog,
  ] = useLazyDialog(false);

  const [deleteBook, { loading: delLoading }] = useDeleteBooksMutation({
    variables: {
      infoId,
      ids: [bookId],
    },
    onCompleted(d) {
      if (!d) return;
      setShowDeleteDialog(!d.deleteBooks.success);
      if (d.deleteBooks.success && onDeleted) onDeleted(bookId, pages);
    },
  });

  const [editBook, { loading: editLoading }] = useEditBookMutation({
    variables: {
      id: bookId,
      ...editContent,
    },
    onCompleted(d) {
      if (!d) return;
      setShowEditDialog(!d.edit.success);
      if (d.edit.success && onEdit) onEdit();
    },
  });

  const clickEditBook = useCallback(() => {
    resetMenuAnchor();
    showEditDialog();
  }, [resetMenuAnchor, showEditDialog]);

  const clickDeleteBook = useCallback(() => {
    resetMenuAnchor();
    showDeleteDialog();
  }, [resetMenuAnchor, showDeleteDialog]);

  const clickSelectThumbnailBook = useCallback(() => {
    resetMenuAnchor();
    setSelectDialog(bookId);
  }, [bookId, resetMenuAnchor]);

  const clickDownloadBook = useCallback(() => {
    resetMenuAnchor();
    showDownloadDialog();
  }, [resetMenuAnchor, showDownloadDialog]);

  const handleEditContentChange = useCallback(
    (k, e) =>
      setEditContent((c) => ({
        ...c,
        [k]: e,
      })),
    [],
  );

  const resetEditContentNumber = useCallback(
    () =>
      setEditContent((c) => ({
        ...c,
        number,
      })),
    [number],
  );

  const handleBookClicked = useCallback(
    (event: MouseEvent) => {
      if (event.shiftKey && onLongPress) {
        onLongPress(event, bookId);
      } else if (onClick) {
        onClick(event, bookId);
      }
    },
    [onLongPress, onClick, bookId],
  );

  const handleLongPressed = useCallback(
    (event: ReactTouchEvent) => {
      if (onLongPress) {
        onLongPress(event, bookId);
      }
    },
    [onLongPress, bookId],
  );

  const longTapEvents = useLongTap(handleLongPressed);

  const {
    open: _openRemoveReadingHistoryDialog,
    close: closeRemoveReadingHistoryDialog,
    disable: disableRemoveReadingHistoryDialog,
    dialogElement: removeReadingHistoryDialog,
  } = useConfirmDialog({
    title: 'Remove Reading History',
    content: 'Are you sure you want to remove the reading history?',
    closeText: 'Cancel',
    confirmText: 'Remove',
    onClickConfirm: () => {
      disableRemoveReadingHistoryDialog();
      db.read.delete(bookId).finally(() => {
        if (onHistoryDeleted) onHistoryDeleted();
        closeRemoveReadingHistoryDialog();
      });
    },
  });

  const openRemoveReadingHistoryDialog = () => {
    resetMenuAnchor();
    _openRemoveReadingHistoryDialog();
  };

  const {
    open: openDownloadDownloadDialog,
    dialogElement: downloadDownloadDialog,
  } = useDownloadBookDialog({
    infoId,
    bookId,
    infoName: name,
    bookName: number,
    thumbnailPageIndex: thumbnail,
    totalPageCount: pages,
    serverUpdatedAt: new Date(Number(updatedAt)),
    onClose: () => {
      db.downloadedBook.get(bookId).then((book) => {
        setIsDownloaded(!!book);
      });
    },
  });

  return (
    <div
      ref={ref}
      style={{
        width: thumbnailSize,
        height: pageAspectRatio(thumbnailSize),
      }}
    >
      {isVisible && (
        <Card
          className={`${classes.card} ${overlayClassName || ''}`}
          sx={{ height: '100%' }}
        >
          {simple ? (
            children ? (
              <CardActions className={classes.headerMenu}>
                {children}
              </CardActions>
            ) : undefined
          ) : (
            <CardActions className={classes.headerMenu}>
              <IconButton
                onClick={setMenuAnchor}
                aria-label="menu"
                size="large"
              >
                <Icon>more_vert</Icon>
              </IconButton>
              <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={resetMenuAnchor}
              >
                <MenuItem onClick={openRemoveReadingHistoryDialog}>
                  Remove Reading History
                </MenuItem>
                <MenuItem onClick={clickSelectThumbnailBook}>
                  Select Thumbnail
                </MenuItem>
                <MenuItem onClick={clickEditBook}>Edit</MenuItem>
                <MenuItem onClick={clickDeleteBook}>Delete</MenuItem>
                <MenuItem
                  onClick={() => {
                    resetMenuAnchor();
                    if (isDownloaded) {
                      db.downloadedBook.delete(bookId).then(() => {
                        setIsDownloaded(false);
                      });
                    } else {
                      openDownloadDownloadDialog();
                    }
                  }}
                >
                  {isDownloaded
                    ? 'Remove book (for offline)'
                    : 'Download Book (for offline)'}
                </MenuItem>
                <MenuItem onClick={clickDownloadBook}>Download Zip</MenuItem>
              </Menu>
            </CardActions>
          )}
          <Link
            className={classes.link}
            state={{ referrer: location.pathname }}
            to={`/book/${bookId}`}
          >
            <CardActionArea
              {...longTapEvents}
              onClick={handleBookClicked}
              disableRipple={disableRipple}
              sx={{ height: '100%' }}
            >
              <BookPageImage
                bookId={bookId}
                pageIndex={thumbnail}
                bookPageCount={pages}
                width={thumbnailSize}
                height={pageAspectRatio(thumbnailSize)}
                noSave={thumbnailNoSave}
              />
              <CardContent className={classes.cardContent}>
                <div>{simple ? `${number}` : `${number} (p.${pages})`}</div>
              </CardContent>
              <div className={classes.labelContainer}>
                {reading && !simple ? (
                  <div className={classes.readLabel}>Reading</div>
                ) : null}
                {Date.now() - Number(updatedAt) < NEW_BOOK_EXPIRED && (
                  <Icon className={classes.newLabel}>tips_and_updates</Icon>
                )}
              </div>
            </CardActionArea>
          </Link>

          <DeleteDialog
            open={isShownDeleteDialog}
            loading={delLoading}
            book={number}
            onClose={hideDeleteDialog}
            onClickDelete={deleteBook}
          />

          <EditDialog
            open={isShownEditDialog}
            loading={editLoading}
            fieldValue={editContent.number}
            onChange={handleEditContentChange}
            onClose={hideEditDialog}
            onClickRestore={resetEditContentNumber}
            onClickEdit={editBook}
          />

          <SelectBookThumbnailDialog
            open={!!selectDialog}
            bookId={selectDialog}
            onClose={hideSelectDialog}
            onEdit={onEdit}
          />

          {canMountDownloadDialog && (
            <DownloadZipDialog
              open={isShownDownloadDialog}
              onClose={hideDownloadDialog}
              number={number}
              pages={pages}
              bookId={bookId}
            />
          )}

          {removeReadingHistoryDialog}

          {downloadDownloadDialog}
        </Card>
      )}
    </div>
  );
};

export default Book;
