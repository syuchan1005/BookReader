import * as React from 'react';
import {
  Button,
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  createStyles,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Icon,
  IconButton,
  InputAdornment,
  makeStyles,
  Menu,
  MenuItem,
  TextField,
  Theme,
} from '@material-ui/core';
import { useMutation } from '@apollo/react-hooks';
import gql from 'graphql-tag';

import { BookInfo as QLBookInfo } from '../../common/GraphqlTypes';

interface BookInfoProps extends QLBookInfo {
  onClick?: Function;
  onDeleted?: Function;
  onEdit?: Function;
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
    right: '0',
    background: 'rgba(0, 0, 0, 0.7)',
    color: 'white',
    fontSize: '1rem',
    width: '2rem',
    height: '2rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(1),
    margin: theme.spacing(1),
    borderRadius: '50%',
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
    onEdit,
  } = props;

  const [menuAnchor, setMenuAnchor] = React.useState(null);
  const [askDelete, setAskDelete] = React.useState(false);
  const [editDialog, setEditDialog] = React.useState(false);
  const [editContent, setEditContent] = React.useState({
    name,
  });

  const [deleteBookInfo, { loading: delLoading }] = useMutation(gql`
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

  const [editBookInfo, { loading: editLoading }] = useMutation(gql`
    mutation edit($id: ID! $name: String $thumbnail: String) {
        edit: editBookInfo(infoId: $id name: $name thumbnail: $thumbnail) {
            success
            code
        }
    }
  `, {
    variables: {
      id: infoId,
      ...editContent,
    },
    onCompleted({ edit }) {
      setEditDialog(!edit.success);
      if (edit.success && onEdit) onEdit();
    },
  });

  const clickEditBookInfo = () => {
    setMenuAnchor(null);
    setEditDialog(true);
  };

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
          <MenuItem onClick={clickEditBookInfo}>Edit</MenuItem>
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
          <div>{count}</div>
        </CardContent>
      </CardActionArea>

      <Dialog open={askDelete} onClose={() => delLoading && setAskDelete(false)}>
        <DialogTitle>Delete book info</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {`Do you want to delete \`${name}\`?`}
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
            onClick={() => deleteBookInfo()}
            disabled={delLoading}
          >
            delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editDialog} onClose={() => editLoading && setEditDialog(false)}>
        <DialogTitle>Edit book info</DialogTitle>
        <DialogContent>
          <TextField
            color="secondary"
            autoFocus
            label="Book info name"
            value={editContent.name}
            // @ts-ignore
            onChange={(event) => setEditContent({ ...editContent, name: event.target.value })}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setEditContent({ ...editContent, name })}>
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
            onClick={() => editBookInfo()}
            disabled={editLoading}
          >
            edit
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default BookInfo;
