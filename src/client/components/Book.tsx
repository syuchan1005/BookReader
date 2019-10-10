import * as React from 'react';

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
import * as DeleteBookMutation from '@client/graphqls/Book_deleteBook.gql';
import * as EditBookMutation from '@client/graphqls/Book_editBook.gql';

import DeleteDialog from '@client/components/dialogs/DeleteDialog';
import EditDialog from '@client/components/dialogs/EditDialog';
import { Book as QLBook, Result } from '@common/GraphqlTypes';
import Img from './Img';
import SelectBookThumbnailDialog from './dialogs/SelectBookThumbnailDialog';

interface BookProps extends QLBook {
  thumbnailSize?: number;
  thumbnailNoSave?: boolean;
  name: string;
  reading?: boolean;
  onClick?: Function;
  onDeleted?: Function;
  onEdit?: () => {};

  simple?: boolean;
}

const useStyles = makeStyles((theme: Theme) => createStyles({
  thumbnail: {
    width: '100%',
    minHeight: '100%',
    objectFit: 'contain',
  },
  card: {
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
  } = props;

  const [menuAnchor, setMenuAnchor] = React.useState(null);
  const [askDelete, setAskDelete] = React.useState(false);
  const [editDialog, setEditDialog] = React.useState(false);
  const [editContent, setEditContent] = React.useState({
    number,
  });
  const [selectDialog, setSelectDialog] = React.useState<string | undefined>(undefined);

  const [deleteBook, { loading: delLoading }] = useMutation<{ del: Result }>(DeleteBookMutation, {
    variables: {
      id: bookId,
    },
    onCompleted({ del }) {
      setAskDelete(!del.success);
      if (del.success && onDeleted) onDeleted();
    },
  });

  const [editBook, { loading: editLoading }] = useMutation<{ edit: Result }>(EditBookMutation, {
    variables: {
      id: bookId,
      ...editContent,
    },
    onCompleted({ edit }) {
      setEditDialog(!edit.success);
      if (edit.success && onEdit) onEdit();
    },
  });

  const clickEditBook = () => {
    setMenuAnchor(null);
    setEditDialog(true);
  };

  const clickDeleteBook = () => {
    setMenuAnchor(null);
    setAskDelete(true);
  };

  const clickSelectThumbnailBook = () => {
    setMenuAnchor(null);
    setSelectDialog(bookId);
  };

  return (
    <Card className={classes.card}>
      {(simple) ? null : (
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
            keepMounted
            open={Boolean(menuAnchor)}
            onClose={() => setMenuAnchor(null)}
          >
            <MenuItem onClick={clickSelectThumbnailBook}>Select Thumbnail</MenuItem>
            <MenuItem onClick={clickEditBook}>Edit</MenuItem>
            <MenuItem onClick={clickDeleteBook}>Delete</MenuItem>
          </Menu>
        </CardActions>
      )}
      <CardActionArea onClick={(e) => onClick && onClick(e)}>
        <Img
          src={thumbnail ? `${thumbnail.replace('.jpg', `_${thumbnailSize}x0.jpg`)}` : undefined}
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
        onChange={(n) => setEditContent({ ...editContent, number: n })}
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
    </Card>
  );
};

// @ts-ignore
Book.whyDidYouRender = true;

export default Book;
