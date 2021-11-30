import React, { TouchEvent as ReactTouchEvent } from 'react';

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
} from '@syuchan1005/book-reader-graphql/generated/GQLQueries';

import DeleteDialog from '@client/components/dialogs/DeleteDialog';
import EditDialog from '@client/components/dialogs/EditDialog';
import useBooleanState from '@client/hooks/useBooleanState';
import useMenuAnchor from '@client/hooks/useMenuAnchor';
import useVisible from '@client/hooks/useVisible';
import useLazyDialog from '@client/hooks/useLazyDialog';
import { useLongTap } from '@client/hooks/useLongTap';
import BookPageImage, { pageAspectRatio } from './BookPageImage';
import SelectBookThumbnailDialog from './dialogs/SelectBookThumbnailDialog';

const DownloadDialog = React.lazy(() => import('@client/components/dialogs/DownloadBookDialog'));

interface BookProps extends Pick<BookType, 'id' | 'thumbnail' | 'number' | 'pages'> {
  infoId: string;
  thumbnailSize: number;
  thumbnailNoSave?: boolean;
  name: string;
  updatedAt?: string;
  reading?: boolean;
  onClick?: (event: React.MouseEvent, bookId: string) => void;
  onDeleted?: (bookId: string, pages: number) => void;
  onEdit?: () => void;

  simple?: boolean;

  visibleMargin?: string;
  onVisible?: () => void;

  overlayClassName?: string;
  disableRipple?: boolean;
  onLongPress?: (event: React.MouseEvent | ReactTouchEvent, bookId: string) => void;

  children?: React.ReactNode;
}

const useStyles = makeStyles((theme: Theme) => createStyles({
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
}));

const NEW_BOOK_EXPIRED = 24 * 60 * 60 * 1000; // 1 day

const Book = (props: BookProps) => {
  const classes = useStyles(props);
  const location = useLocation();
  const ref = React.useRef();
  const {
    infoId,
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
    simple,
    children,
    visibleMargin,
    onVisible,
    overlayClassName,
    disableRipple,
    onLongPress,
  } = props;
  const isVisible = useVisible(ref, true, visibleMargin);
  React.useEffect(() => {
    if (isVisible && onVisible) {
      onVisible();
    }
  }, [onVisible, isVisible]);

  const [menuAnchor, setMenuAnchor, resetMenuAnchor] = useMenuAnchor();
  const [isShownDeleteDialog, showDeleteDialog,
    hideDeleteDialog, , setShowDeleteDialog] = useBooleanState(false);
  const [isShownEditDialog, showEditDialog,
    hideEditDialog, , setShowEditDialog] = useBooleanState(false);
  const [editContent, setEditContent] = React.useState({
    number,
  });
  const [selectDialog, setSelectDialog] = React.useState<string | undefined>(undefined);
  const hideSelectDialog = React.useCallback(() => {
    setSelectDialog(undefined);
  }, []);
  const [isShownDownloadDialog, canMountDownloadDialog, showDownloadDialog,
    hideDownloadDialog] = useLazyDialog(false);

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

  const clickEditBook = React.useCallback(() => {
    resetMenuAnchor();
    showEditDialog();
  }, [resetMenuAnchor, showEditDialog]);

  const clickDeleteBook = React.useCallback(() => {
    resetMenuAnchor();
    showDeleteDialog();
  }, [resetMenuAnchor, showDeleteDialog]);

  const clickSelectThumbnailBook = React.useCallback(() => {
    resetMenuAnchor();
    setSelectDialog(bookId);
  }, [bookId, resetMenuAnchor]);

  const clickDownloadBook = React.useCallback(() => {
    resetMenuAnchor();
    showDownloadDialog();
  }, [resetMenuAnchor, showDownloadDialog]);

  const handleEditContentChange = React.useCallback((k, e) => setEditContent((c) => ({
    ...c,
    [k]: e,
  })), []);

  const resetEditContentNumber = React.useCallback(() => setEditContent((c) => ({
    ...c,
    number,
  })), [number]);

  const handleBookClicked = React.useCallback((event: React.MouseEvent) => {
    if (event.shiftKey && onLongPress) {
      onLongPress(event, bookId);
    } else if (onClick) {
      onClick(event, bookId);
    }
  }, [onLongPress, onClick, bookId]);

  const handleLongPressed = React.useCallback((event: ReactTouchEvent) => {
    if (onLongPress) {
      onLongPress(event, bookId);
    }
  }, [onLongPress, bookId]);

  const longTapEvents = useLongTap(handleLongPressed);

  return (
    <div
      ref={ref}
      style={{
        width: thumbnailSize,
        height: pageAspectRatio(thumbnailSize),
      }}
    >
      {isVisible && (
        <Card className={`${classes.card} ${overlayClassName || ''}`}>
          {/* eslint-disable-next-line no-nested-ternary */}
          {(simple) ? (
            (children) ? (
              <CardActions className={classes.headerMenu}>
                {children}
              </CardActions>
            ) : undefined
          ) : (
            <CardActions className={classes.headerMenu}>
              <IconButton onClick={setMenuAnchor} aria-label="menu" size="large">
                <Icon>more_vert</Icon>
              </IconButton>
              <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={resetMenuAnchor}
              >
                <MenuItem onClick={clickSelectThumbnailBook}>Select Thumbnail</MenuItem>
                <MenuItem onClick={clickEditBook}>Edit</MenuItem>
                <MenuItem onClick={clickDeleteBook}>Delete</MenuItem>
                <MenuItem onClick={clickDownloadBook}>Download</MenuItem>
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
            >

              <BookPageImage
                bookId={bookId}
                pageIndex={thumbnail}
                bookPageCount={pages}
                width={thumbnailSize}
                height={pageAspectRatio(thumbnailSize)}
                noSave={thumbnailNoSave}
                forceUsePropSize
              />
              <CardContent className={classes.cardContent}>
                <div>{simple ? `${number}` : `${number} (p.${pages})`}</div>
              </CardContent>
              <div className={classes.labelContainer}>
                {(reading && !simple) ? (
                  <div className={classes.readLabel}>Reading</div>
                ) : null}
                {((Date.now() - Number(updatedAt)) < NEW_BOOK_EXPIRED) && (
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

          {(canMountDownloadDialog) && (
            <DownloadDialog
              open={isShownDownloadDialog}
              onClose={hideDownloadDialog}
              number={number}
              pages={pages}
              bookId={bookId}
            />
          )}
        </Card>
      )}
    </div>
  );
};

export default React.memo(Book);
