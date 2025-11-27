import { useMutation } from '@apollo/client/react';
import { commonTheme } from '@client/App';
import {
  AppBar,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Icon,
  IconButton,
  StyledEngineProvider,
  TextField,
  ThemeProvider,
  Toolbar,
  Typography,
} from '@mui/material';
import { grey } from '@mui/material/colors';
import { createTheme, styled } from '@mui/material/styles';
import {
  DeleteBooksDocument,
  MoveBooksDocument,
} from '@syuchan1005/book-reader-graphql';
import { useState } from 'react';

const PREFIX = 'SelectBookHeader';

const classes = {
  iconButton: `${PREFIX}-iconButton`,
  title: `${PREFIX}-title`,
};

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  '&': {
    paddingTop: commonTheme.safeArea.top,
  },

  [`& .${classes.iconButton}`]: {
    color: theme.palette.common.white,
  },

  [`& .${classes.title}`]: {
    userSelect: 'none',
    flexGrow: 1,
  },
}));

interface SelectBookHeaderProps {
  infoId: string;
  selectIds: string[];
  onClose?: () => void;
  onDeleteBooks?: () => void;
  onMoveBooks?: () => void;
}

const ContextualActionBarTheme = createTheme({
  palette: {
    primary: {
      main: grey['900'],
    },
  },
});

const SelectBookHeader = (props: SelectBookHeaderProps) => {
  const { infoId, selectIds, onClose, onDeleteBooks, onMoveBooks } = props;

  const [openMoveDialog, setOpenMoveDialog] = useState(false);
  const [moveInfoId, setMoveInfoId] = useState(infoId);

  const [doMoveBooks, { loading: moveBooksLoading }] = useMutation(
    MoveBooksDocument,
    {
      variables: {
        infoId: moveInfoId,
        ids: selectIds,
      },
      onCompleted() {
        setOpenMoveDialog(false);
        if (onMoveBooks) onMoveBooks();
      },
    },
  );

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  const [doDeleteBooks, { loading: deleteBooksLoading }] = useMutation(
    DeleteBooksDocument,
    {
      variables: {
        infoId,
        ids: selectIds,
      },
      onCompleted() {
        setOpenDeleteDialog(false);
        if (onDeleteBooks) onDeleteBooks();
      },
    },
  );

  return (
    <>
      <StyledEngineProvider injectFirst>
        <ThemeProvider theme={ContextualActionBarTheme}>
          <StyledAppBar>
            <Toolbar>
              <IconButton
                className={classes.iconButton}
                onClick={() => onClose?.()}
                size="large"
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
                size="large"
              >
                <Icon>delete_outline</Icon>
              </IconButton>
            </Toolbar>
          </StyledAppBar>
        </ThemeProvider>
      </StyledEngineProvider>
      <Dialog
        open={openMoveDialog}
        onClose={() => !moveBooksLoading && setOpenMoveDialog(false)}
      >
        <DialogTitle>Move Books</DialogTitle>
        {moveBooksLoading ? (
          <DialogContent style={{ display: 'flex', justifyContent: 'center' }}>
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
        onClose={() => !deleteBooksLoading && setOpenDeleteDialog(false)}
      >
        <DialogTitle>Delete Books</DialogTitle>
        <DialogContent style={{ display: 'flex', justifyContent: 'center' }}>
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
