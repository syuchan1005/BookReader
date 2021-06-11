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
import loadable from '@loadable/component';

import { Book as BookType } from '@syuchan1005/book-reader-graphql';
import { useDeleteBookMutation, useEditBookMutation } from '@syuchan1005/book-reader-graphql/generated/GQLQueries';

import DeleteDialog from '@client/components/dialogs/DeleteDialog';
import EditDialog from '@client/components/dialogs/EditDialog';
import BookPageImage from './BookPageImage';
import SelectBookThumbnailDialog from './dialogs/SelectBookThumbnailDialog';
import useDebounceValue from '../hooks/useDebounceValue';

const DownloadDialog = loadable(() => import('./dialogs/DownloadBookDialog'));

interface BookProps extends Pick<BookType, 'id' | 'thumbnail' | 'number' | 'pages'> {
  thumbnailSize?: number;
  thumbnailNoSave?: boolean;
  name: string;
  updatedAt?: string;
  reading?: boolean;
  onClick?: Function;
  onDeleted?: Function;
  onEdit?: () => {};

  simple?: boolean;

  children?: ReactNode;
}

const useStyles = makeStyles((theme: Theme) => createStyles({
  thumbnail: {
    width: '100%',
    minHeight: '100%',
    objectFit: 'contain',
  },
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

const Book: React.FC<BookProps> = React.memo((props: BookProps) => {
  const classes = useStyles(props);
  const {
    thumbnailSize = 200,
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

  const [menuAnchor, setMenuAnchor] = React.useState(null);
  const [askDelete, setAskDelete] = React.useState(false);
  const [editDialog, setEditDialog] = React.useState(false);
  const [editContent, setEditContent] = React.useState({
    number,
  });
  const [selectDialog, setSelectDialog] = React.useState<string | undefined>(undefined);
  const [openDownloadDialog, setOpenDownloadDialog] = React.useState(false);
  const debounceOpenDownloadDialog = useDebounceValue(openDownloadDialog, 400);

  const [deleteBook, { loading: delLoading }] = useDeleteBookMutation({
      variables: {
        id: bookId,
      },
      onCompleted(d) {
        if (!d) return;
        setAskDelete(!d.del.success);
        if (d.del.success && onDeleted) onDeleted();
      },
    });

  const [editBook, { loading: editLoading }] = useEditBookMutation({
      variables: {
        id: bookId,
        ...editContent,
      },
      onCompleted(d) {
        if (!d) return;
        setEditDialog(!d.edit.success);
        if (d.edit.success && onEdit) onEdit();
      },
    });

  const clickEditBook = React.useCallback(() => {
    setMenuAnchor(null);
    setEditDialog(true);
  }, []);

  const clickDeleteBook = React.useCallback(() => {
    setMenuAnchor(null);
    setAskDelete(true);
  }, []);

  const clickSelectThumbnailBook = React.useCallback(() => {
    setMenuAnchor(null);
    setSelectDialog(bookId);
  }, [bookId]);

  const clickDownloadBook = React.useCallback(() => {
    setMenuAnchor(null);
    setOpenDownloadDialog(true);
  }, []);

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
            onClick={(event) => setMenuAnchor(event.currentTarget)}
            aria-label="menu"
          >
            <Icon>more_vert</Icon>
          </IconButton>
          <Menu
            getContentAnchorEl={null}
            anchorOrigin={{
              horizontal: 'center',
              vertical: 'bottom',
            }}
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={() => setMenuAnchor(null)}
          >
            <MenuItem onClick={clickSelectThumbnailBook}>Select Thumbnail</MenuItem>
            <MenuItem onClick={clickEditBook}>Edit</MenuItem>
            <MenuItem onClick={clickDeleteBook}>Delete</MenuItem>
            <MenuItem onClick={clickDownloadBook}>Download</MenuItem>
          </Menu>
        </CardActions>
      )}
      <CardActionArea onClick={(e) => onClick && onClick(e)}>
        <BookPageImage
          bookId={bookId}
          pageIndex={thumbnail}
          bookPageCount={pages}
          width={thumbnailSize * window.devicePixelRatio}
          className={classes.thumbnail}
          noSave={thumbnailNoSave}
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
        open={askDelete}
        loading={delLoading}
        book={number}
        onClose={() => setAskDelete(false)}
        onClickDelete={() => deleteBook()}
      />

      <EditDialog
        open={editDialog}
        loading={editLoading}
        fieldValue={editContent.number}
        onChange={(k, e) => setEditContent({
          ...editContent,
          [k]: e,
        })}
        onClose={() => setEditDialog(false)}
        onClickRestore={() => setEditContent({
          ...editContent,
          number,
        })}
        onClickEdit={() => editBook()}
      />

      <SelectBookThumbnailDialog
        open={!!selectDialog}
        bookId={selectDialog}
        onClose={() => setSelectDialog(undefined)}
        onEdit={onEdit}
      />

      {(openDownloadDialog || debounceOpenDownloadDialog) && (
        <DownloadDialog
          open={openDownloadDialog}
          onClose={() => setOpenDownloadDialog(false)}
          number={number}
          pages={pages}
          bookId={bookId}
        />
      )}
    </Card>
  );
});

export default Book;
