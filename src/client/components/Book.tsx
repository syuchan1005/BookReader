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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button, TextField, InputAdornment,
} from '@material-ui/core';
import { useMutation } from '@apollo/react-hooks';

import gql from 'graphql-tag';
import { Book as QLBook, Result } from '../../common/GraphqlTypes';
import Img from './Img';
import SelectBookThumbnailDialog from './SelectBookThumbnailDialog';

interface BookProps extends QLBook {
  name: string;
  reading?: boolean;
  onClick?: Function;
  onDeleted?: Function;
  onEdit?: () => {};
  wb?: any;

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
    thumbnail,
    number,
    pages,
    reading,
    id: bookId,
    onClick,
    onDeleted,
    onEdit,
    wb,
    simple,
  } = props;

  const [menuAnchor, setMenuAnchor] = React.useState(null);
  const [askDelete, setAskDelete] = React.useState(false);
  const [editDialog, setEditDialog] = React.useState(false);
  const [cacheDialog, setCacheDialog] = React.useState([false, false]); // showDialog, loading
  const [editContent, setEditContent] = React.useState({
    number,
  });
  const [selectDialog, setSelectDialog] = React.useState<string | undefined>(undefined);

  const [deleteBook, { loading: delLoading }] = useMutation<{ del: Result }>(gql`
      mutation delete($id: ID!) {
          del: deleteBook(id: $id) {
              success
              code
          }
      }
  `, {
    variables: {
      id: bookId,
    },
    onCompleted({ del }) {
      setAskDelete(!del.success);
      if (del.success && onDeleted) onDeleted();
    },
  });

  const [editBook, { loading: editLoading }] = useMutation<{ edit: Result }>(gql`
      mutation edit($id: ID! $number: String $thumbnail: String) {
          edit: editBook(id: $id number: $number thumbnail: $thumbnail) {
              success
              code
          }
      }
  `, {
    variables: {
      id: bookId,
      ...editContent,
    },
    onCompleted({ edit }) {
      setEditDialog(!edit.success);
      if (edit.success && onEdit) onEdit();
    },
  });

  const cacheBook = () => {
    setCacheDialog([true, true]);
    const onFinish = (event) => {
      if (event.data && event.data.type === 'BOOK_CACHE' && event.data.state === 'Finish') {
        setCacheDialog([false, false]);
        navigator.serviceWorker.removeEventListener('message', onFinish);
      }
    };
    navigator.serviceWorker.addEventListener('message', onFinish);
    wb.messageSW({
      type: 'BOOK_CACHE',
      pages,
      bookId,
    });
  };

  const clickEditBook = () => {
    setMenuAnchor(null);
    setEditDialog(true);
  };

  const clickDeleteBook = () => {
    setMenuAnchor(null);
    setAskDelete(true);
  };

  const clickCacheBook = () => {
    setMenuAnchor(null);
    setCacheDialog([true, false]);
  };

  const clickSelectThumbnailBook = () => {
    setMenuAnchor(null);
    setSelectDialog(bookId);
  };

  return (
    <Card className={classes.card}>
      {(simple) ? null : (
        <CardActions className={classes.headerMenu}>
          <IconButton onClick={(event) => setMenuAnchor(event.currentTarget)}>
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
            {wb ? (<MenuItem onClick={clickCacheBook}>Cache</MenuItem>) : null}
            <MenuItem onClick={clickSelectThumbnailBook}>Select Thumbnail</MenuItem>
            <MenuItem onClick={clickEditBook}>Edit</MenuItem>
            <MenuItem onClick={clickDeleteBook}>Delete</MenuItem>
          </Menu>
        </CardActions>
      )}
      <CardActionArea onClick={(e) => onClick && onClick(e)}>
        <Img
          src={thumbnail ? thumbnail.replace('.jpg', '_200x.jpg') : undefined}
          alt={number}
          className={classes.thumbnail}
        />
        <CardContent className={classes.cardContent}>
          <div>{simple ? `${number}` : `${number} (p.${pages})`}</div>
        </CardContent>
        {(reading && !simple) ? (
          <div className={classes.readLabel}>Reading</div>
        ) : null}
      </CardActionArea>

      <Dialog open={askDelete} onClose={() => !delLoading && setAskDelete(false)}>
        <DialogTitle>Delete book</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {`Do you want to delete \`${number}\`巻?`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setAskDelete(false)}
            disabled={delLoading}
          >
            close
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => deleteBook()}
            disabled={delLoading}
          >
            delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editDialog} onClose={() => !editLoading && setEditDialog(false)}>
        <DialogTitle>Edit book</DialogTitle>
        <DialogContent>
          <TextField
            color="secondary"
            autoFocus
            label="Book number"
            value={editContent.number}
            // @ts-ignore
            onChange={(event) => setEditContent({ ...editContent, number: event.target.value })}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setEditContent({ ...editContent, number })}>
                    <Icon>restore</Icon>
                  </IconButton>
                </InputAdornment>
              ),
            }}
            disabled={editLoading}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setEditDialog(false)}
            disabled={editLoading}
          >
            close
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => editBook()}
            disabled={editLoading}
          >
            edit
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={cacheDialog[0]}
        onClose={() => !cacheDialog[1] && setCacheDialog([false, false])}
      >
        <DialogTitle>Cache book</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {`Do you want to cache \`${number}\`巻?`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setCacheDialog([false, false])}
            disabled={cacheDialog[1]}
          >
            close
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => cacheBook()}
            disabled={cacheDialog[1]}
          >
            cache
          </Button>
        </DialogActions>
      </Dialog>

      <SelectBookThumbnailDialog
        open={!!selectDialog}
        bookId={selectDialog}
        onClose={() => setSelectDialog(undefined)}
        onEdit={onEdit}
      />
    </Card>
  );
};

export default Book;
