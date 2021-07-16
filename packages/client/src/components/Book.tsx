import React, { ReactNode } from 'react';

import {
  Card,
  CardActionArea,
  CardContent,
  makeStyles,
  createStyles,
  Theme,
  Icon,
  IconButton,
  CardActions,
  Menu,
  MenuItem,
} from '@material-ui/core';

import { Book as BookType } from '@syuchan1005/book-reader-graphql';
import { useDeleteBookMutation, useEditBookMutation } from '@syuchan1005/book-reader-graphql/generated/GQLQueries';

import DeleteDialog from '@client/components/dialogs/DeleteDialog';
import EditDialog from '@client/components/dialogs/EditDialog';
import DownloadDialog from '@client/components/dialogs/DownloadBookDialog';
import useBooleanState from '@client/hooks/useBooleanState';
import useMenuAnchor from '@client/hooks/useMenuAnchor';
import BookPageImage, { pageAspectRatio } from './BookPageImage';
import SelectBookThumbnailDialog from './dialogs/SelectBookThumbnailDialog';
import useDebounceValue from '../hooks/useDebounceValue';

interface BookProps extends Pick<BookType, 'id' | 'thumbnail' | 'number' | 'pages'> {
  thumbnailSize: number;
  thumbnailNoSave?: boolean;
  name: string;
  updatedAt?: string;
  reading?: boolean;
  onClick?: (bookId: string) => void;
  onDeleted?: (bookId: string, pages: number) => void;
  onEdit?: () => void;

  simple?: boolean;

  children?: ReactNode;
}

const useStyles = makeStyles((theme: Theme) => createStyles({
  card: {
    width: '100%',
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
}));

const NEW_BOOK_EXPIRED = 24 * 60 * 60 * 1000; // 1 day

const Book = (props: BookProps) => {
  const classes = useStyles(props);
  const {
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
  } = props;

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
  const [isShownDownloadDialog, showDownloadDialog,
    hideDownloadDialog] = useBooleanState(false);
  const debounceIsShownDownloadDialog = useDebounceValue(isShownDownloadDialog, 400);

  const [deleteBook, { loading: delLoading }] = useDeleteBookMutation({
    variables: {
      id: bookId,
    },
    onCompleted(d) {
      if (!d) return;
      setShowDeleteDialog(!d.del.success);
      if (d.del.success && onDeleted) onDeleted(bookId, pages);
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

  const handleBookClicked = React.useCallback(() => {
    if (onClick) {
      onClick(bookId);
    }
  }, [onClick, bookId]);

  return (
    <Card className={classes.card}>
      {/* eslint-disable-next-line no-nested-ternary */}
      {(simple) ? (
        (children) ? (
          <CardActions className={classes.headerMenu}>
            {children}
          </CardActions>
        ) : undefined
      ) : (
        <CardActions className={classes.headerMenu}>
          <IconButton
            onClick={setMenuAnchor}
            aria-label="menu"
          >
            <Icon>more_vert</Icon>
          </IconButton>
          <Menu
            getContentAnchorEl={null}
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
      <CardActionArea onClick={handleBookClicked}>
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

      {(isShownDownloadDialog || debounceIsShownDownloadDialog) && (
        <DownloadDialog
          open={isShownDownloadDialog}
          onClose={hideDownloadDialog}
          number={number}
          pages={pages}
          bookId={bookId}
        />
      )}
    </Card>
  );
};

export default React.memo(Book);
