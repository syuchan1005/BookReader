import * as React from 'react';
import {
  Card,
  CardActionArea,
  CardContent,
  makeStyles,
  createStyles,
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

import { BookInfo as QLBookInfo } from '../../common/GraphqlTypes';

interface BookInfoProps extends QLBookInfo {
  onClick?: Function;
  onDeleted?: Function;
}

const useStyles = makeStyles(() => createStyles({
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
  headerMenu: {
    position: 'absolute',
    zIndex: 1,
    padding: 0,
  },
}));

const BookInfo: React.FC<BookInfoProps> = (props: BookInfoProps) => {
  const classes = useStyles(props);
  const {
    infoId,
    thumbnail,
    name,
    count,
    onClick,
    onDeleted,
  } = props;

  const [menuAnchor, setMenuAnchor] = React.useState(null);
  const [askDelete, setAskDelete] = React.useState(false);

  const [deleteBookInfo, { loading }] = useMutation(gql`
      mutation delete($id: ID!) {
          del: deleteBookInfo(infoId: $id) {
              success
              code
          }
      }
  `, {
    variables: {
      id: infoId,
    },
    onCompleted({ del }) {
      setAskDelete(!del.success);
      if (del.success && onDeleted) onDeleted();
    },
  });

  const clickDeleteBookInfo = () => {
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
          <MenuItem onClick={clickDeleteBookInfo}>Delete</MenuItem>
        </Menu>
      </CardActions>
      <CardActionArea onClick={(e) => onClick && onClick(e)}>
        <img
          src={thumbnail || `http://placehold.jp/99ccff/003366/100x150.jpg?text=${name}`}
          alt="thumbnail"
          className={classes.thumbnail}
        />
        <CardContent className={classes.cardContent}>
          <div>{name}</div>
          <div>
            {count}
            巻まで
          </div>
        </CardContent>
      </CardActionArea>
      <Dialog open={askDelete} onClose={() => loading && setAskDelete(false)}>
        <DialogTitle>Delete book info</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {`Do you want to delete \`${name}\`?`}
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
            onClick={() => deleteBookInfo()}
            disabled={loading}
          >
            delete
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default BookInfo;
