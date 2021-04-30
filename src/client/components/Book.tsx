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
import { useMutation } from '@apollo/react-hooks';
import loadable from '@loadable/component';

import {
  Book as BookType,
  DeleteBookMutation as DeleteBookMutationType,
  DeleteBookMutationVariables,
  EditBookMutation as EditBookMutationType,
  EditBookMutationVariables,
} from '@syuchan1005/book-reader-graphql';
import DeleteBookMutation from '@client/graphqls/Book_deleteBook.gql';
import EditBookMutation from '@client/graphqls/Book_editBook.gql';

import DeleteDialog from '@client/components/dialogs/DeleteDialog';
import EditDialog from '@client/components/dialogs/EditDialog';
import Img from './Img';
import SelectBookThumbnailDialog from './dialogs/SelectBookThumbnailDialog';
import useDebounceValue from '../hooks/useDebounceValue';

const DownloadDialog = loadable(() => import(/* webpackChunkName: 'DownloadBookDialog' */ './dialogs/DownloadBookDialog'));

interface BookProps extends Pick<BookType, 'id' | 'thumbnail' | 'number' | 'pages'> {
  thumbnailSize?: number;
  thumbnailNoSave?: boolean;
  name: string;
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
  readLabel: {
    position: 'absolute',
    top: 0,
    left: theme.spacing(1),
    background: theme.palette.secondary.main,
    color: theme.palette.secondary.contrastText,
    padding: theme.spacing(1),
    borderRadius: theme.spacing(1),
  },
  headerMenu: {
    position: 'absolute',
    zIndex: 1,
    padding: 0,
  },
}));

const Book: React.FC<BookProps> = (props: BookProps) => {
  const classes = useStyles(props);
  const {
    thumbnailSize = 200,
    thumbnailNoSave,
    thumbnail,
    number,
    pages,
    reading,
    id: bookId,
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

  const [deleteBook, { loading: delLoading }] = useMutation<
    DeleteBookMutationType,
    DeleteBookMutationVariables
  >(DeleteBookMutation, {
    variables: {
      id: bookId,
    },
    onCompleted(d) {
      if (!d) return;
      setAskDelete(!d.del.success);
      if (d.del.success && onDeleted) onDeleted();
    },
  });

  const [editBook, { loading: editLoading }] = useMutation<
    EditBookMutationType,
    EditBookMutationVariables
  >(EditBookMutation, {
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
        <Img
          src={thumbnail ? `${thumbnail.replace('.jpg', `_${thumbnailSize * window.devicePixelRatio}x0.jpg`)}` : undefined}
          alt={number}
          className={classes.thumbnail}
          noSave={thumbnailNoSave}
        />
        <CardContent className={classes.cardContent}>
          <div>{simple ? `${number}` : `${number} (p.${pages})`}</div>
        </CardContent>
        {(reading && !simple) ? (
          <div className={classes.readLabel}>Reading</div>
        ) : null}
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
        onChange={(k, e) => setEditContent({ ...editContent, [k]: e })}
        onClose={() => setEditDialog(false)}
        onClickRestore={() => setEditContent({ ...editContent, number })}
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
};

export default Book;
