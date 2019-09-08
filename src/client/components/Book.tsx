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
  Button,
} from '@material-ui/core';
import { useMutation } from '@apollo/react-hooks';

import gql from 'graphql-tag';
import { Book as QLBook } from '../../common/GraphqlTypes';

interface BookProps extends QLBook {
  name: string;
  reading?: boolean;
  onClick?: Function;
  onDeleted?: Function;
}

const useStyles = makeStyles((theme: Theme) => createStyles({
  thumbnail: {
    minWidth: '100%',
    height: '250px',
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
    width: '100%',
    background: 'rgba(0, 0, 0, 0.7)',
    color: 'white',
    fontSize: '1rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
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
    name,
    reading,
    bookId,
    onClick,
    onDeleted,
  } = props;

  const [menuAnchor, setMenuAnchor] = React.useState(null);
  const [askDelete, setAskDelete] = React.useState(false);

  const [deleteBook, { loading }] = useMutation(gql`
      mutation delete($id: ID!) {
          del: deleteBook(bookId: $id) {
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

  const clickDeleteBook = () => {
    setMenuAnchor(null);
    setAskDelete(true);
  };

  return (
    <Card className={classes.card}>
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
          <MenuItem onClick={clickDeleteBook}>Delete</MenuItem>
        </Menu>
      </CardActions>
      <CardActionArea onClick={(e) => onClick && onClick(e)}>
        <img
          src={thumbnail || `http://placehold.jp/99ccff/003366/100x150.jpg?text=${name}\n${number}`}
          alt="thumbnail"
          className={classes.thumbnail}
        />
        <CardContent className={classes.cardContent}>
          <div>
            {number}
            巻
          </div>
          <div>
            {pages}
            ページ
          </div>
        </CardContent>
        {reading && (
          <div className={classes.readLabel}>Reading</div>
        )}
      </CardActionArea>
      <Dialog open={askDelete} onClose={() => loading && setAskDelete(false)}>
        <DialogTitle>Delete book</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {`Do you want to delete \`${number}\`巻?`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setAskDelete(false)}
            disabled={loading}
          >
            close
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => deleteBook()}
            disabled={loading}
          >
            delete
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default Book;
