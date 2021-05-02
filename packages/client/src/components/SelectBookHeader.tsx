import React from 'react';
import {
  AppBar,
  Button, CircularProgress,
  createStyles, Dialog, DialogActions, DialogContent, DialogTitle,
  Icon,
  IconButton,
  makeStyles, TextField,
  Theme,
  Toolbar,
} from '@material-ui/core';
import { useMutation } from '@apollo/react-hooks';

import { commonTheme } from '@client/App';

import {
  DeleteBooksMutation as DeleteBooksMutationData,
  DeleteBooksMutationVariables,
  MoveBooksMutation as MoveBooksMutationData,
  MoveBooksMutationVariables,
} from '@syuchan1005/book-reader-graphql';

import DeleteBooksMutation from '@syuchan1005/book-reader-graphql/queries/SelectBookHeader_deleteBooks.gql';
import MoveBooksMutation from '@syuchan1005/book-reader-graphql/queries/SelectBookHeader_moveBooks.gql';

interface SelectBookHeaderProps {
  infoId: string;
  selectIds: string[];
  onClose?: () => void;
  onDeleteBooks?: () => void;
  onMoveBooks?: () => void;
}

const useStyles = makeStyles((theme: Theme) => createStyles({
  appBar: {
    paddingTop: commonTheme.safeArea.top,
  },
  iconButton: {
    color: theme.palette.common.white,
  },
  loadingContent: {
    display: 'flex',
    justifyContent: 'center',
  },
}));

const SelectBookHeader: React.FC<SelectBookHeaderProps> = (props: SelectBookHeaderProps) => {
  const classes = useStyles(props);
  const {
    infoId,
    selectIds,
    onClose,
    onDeleteBooks,
    onMoveBooks,
  } = props;

  const [openMoveDialog, setOpenMoveDialog] = React.useState(false);
  const [moveInfoId, setMoveInfoId] = React.useState(infoId);
  const [doMoveBooks, { loading: moveBooksLoading }] = useMutation<
    MoveBooksMutationData,
    MoveBooksMutationVariables
    >(MoveBooksMutation, {
      variables: {
        infoId: moveInfoId,
        ids: selectIds,
      },
      onCompleted() {
        setOpenMoveDialog(false);
        if (onMoveBooks) onMoveBooks();
      },
    });

  const [openDeleteDialog, setOpenDeleteDialog] = React.useState(false);
  const [doDeleteBooks, { loading: deleteBooksLoading }] = useMutation<
    DeleteBooksMutationData,
    DeleteBooksMutationVariables
  >(DeleteBooksMutation, {
    variables: {
      infoId,
      ids: selectIds,
    },
    onCompleted() {
      setOpenDeleteDialog(false);
      if (onDeleteBooks) onDeleteBooks();
    },
  });

  return (
    <>
      <AppBar className={classes.appBar}>
        <Toolbar>
          <IconButton
            className={classes.iconButton}
            onClick={() => (onClose && onClose())}
          >
            <Icon>clear</Icon>
          </IconButton>
          <div style={{ flexGrow: 1 }} />
          <Button
            className={classes.iconButton}
            disabled={selectIds.length === 0}
            startIcon={<Icon>move_to_inbox</Icon>}
            onClick={() => setOpenMoveDialog(true)}
          >
            Move
          </Button>
          <IconButton
            className={classes.iconButton}
            disabled={selectIds.length === 0}
            onClick={() => setOpenDeleteDialog(true)}
          >
            <Icon>delete_outline</Icon>
          </IconButton>
          {/*
        <IconButton
          className={classes.iconButton}
          disabled={selectIds.length === 0}
        >
          <Icon>cloud_download</Icon>
        </IconButton>
        */}
        </Toolbar>
      </AppBar>

      <Dialog
        open={openMoveDialog}
        onClose={() => (!moveBooksLoading && setOpenMoveDialog(false))}
      >
        <DialogTitle>Move Books</DialogTitle>
        {(moveBooksLoading) ? (
          <DialogContent className={classes.loadingContent}>
            <CircularProgress color="secondary" />
          </DialogContent>
        ) : (
          <DialogContent>
            <TextField
              label="Move InfoId"
              value={moveInfoId}
              onChange={(e) => setMoveInfoId(e.target.value)}
            />
          </DialogContent>
        )}
        <DialogActions>
          <Button
            disabled={moveBooksLoading}
            onClick={() => setOpenMoveDialog(false)}
          >
            Close
          </Button>
          <Button
            disabled={moveBooksLoading}
            onClick={() => doMoveBooks()}
            color="secondary"
            variant="contained"
          >
            Move
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openDeleteDialog}
        onClose={() => (!deleteBooksLoading && setOpenDeleteDialog(false))}
      >
        <DialogTitle>Delete Books</DialogTitle>
        <DialogContent className={classes.loadingContent}>
          {deleteBooksLoading && <CircularProgress color="secondary" />}
        </DialogContent>
        <DialogActions>
          <Button
            disabled={deleteBooksLoading}
            onClick={() => setOpenDeleteDialog(false)}
          >
            Close
          </Button>
          <Button
            disabled={deleteBooksLoading}
            onClick={() => doDeleteBooks()}
            color="secondary"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SelectBookHeader;
