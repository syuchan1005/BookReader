import React from 'react';
import {
  AppBar,
  Button, CircularProgress,
  createStyles, Dialog, DialogActions, DialogContent, DialogTitle,
  Icon,
  IconButton,
  makeStyles, MuiThemeProvider, TextField,
  Theme,
  Toolbar, Typography,
} from '@material-ui/core';
import { grey } from '@material-ui/core/colors';
import { createTheme } from '@material-ui/core/styles';

import { commonTheme } from '@client/App';

import { useDeleteBooksMutation, useMoveBooksMutation } from '@syuchan1005/book-reader-graphql/generated/GQLQueries';

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
  title: {
    flexGrow: 1,
  },
}));

const ContextualActionBarTheme = createTheme({
  palette: {
    primary: {
      main: grey['900'],
    },
  },
});

const SelectBookHeader = (props: SelectBookHeaderProps) => {
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

  const [doMoveBooks, { loading: moveBooksLoading }] = useMoveBooksMutation({
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

  const [doDeleteBooks, { loading: deleteBooksLoading }] = useDeleteBooksMutation({
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
      <MuiThemeProvider theme={ContextualActionBarTheme}>
        <AppBar className={classes.appBar}>
          <Toolbar>
            <IconButton
              className={classes.iconButton}
              onClick={() => (onClose && onClose())}
            >
              <Icon>clear</Icon>
            </IconButton>
            <Typography variant="h6" className={classes.title}>
              {`${selectIds.length} selected`}
            </Typography>
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
          </Toolbar>
        </AppBar>
      </MuiThemeProvider>

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

export default React.memo(SelectBookHeader);
