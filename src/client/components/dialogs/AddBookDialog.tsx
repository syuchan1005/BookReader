import * as React from 'react';
import {
  Button, CircularProgress,
  createStyles,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Icon,
  IconButton, LinearProgress,
  makeStyles,
  TextField, Theme,
} from '@material-ui/core';
import gql from 'graphql-tag';
import { useMutation, useSubscription } from '@apollo/react-hooks';
import FileField from '@client/components/FileField';
import DropZone from '@client/components/DropZone';
import { Result } from '@common/GraphqlTypes';

interface AddBookDialogProps {
  open: boolean;
  infoId: string;
  onAdded?: Function;
  onClose?: Function;
}

const useStyles = makeStyles((theme: Theme) => createStyles({
  dialog: {
    width: '100%',
    height: '100%',
  },
  dialogContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  listItem: {
    width: '100%',
    display: 'grid',
    gridTemplateColumns: '1fr 50px 48px',
    marginBottom: theme.spacing(0.5),
  },
  addBookSubscription: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  progressMessage: {
    marginTop: theme.spacing(2),
  },
  addBookProgress: {
    display: 'grid',
    alignItems: 'center',
    gridTemplateColumns: '1fr 64px',
    columnGap: theme.spacing(1),
    width: 300,
  },
}));

const AddBookDialog: React.FC<AddBookDialogProps> = (props: AddBookDialogProps) => {
  const classes = useStyles(props);
  const {
    open,
    infoId,
    onAdded,
    onClose,
  } = props;

  const [addBooks, setAddBooks] = React.useState([]);
  const [subscriptionId, setSubscriptionId] = React.useState<string | undefined>(undefined);

  const [addBookProgress, setAddBookProgress] = React
    .useState<ProgressEvent | undefined>(undefined);
  const [addBookAbort, setAddBookAbort] = React
    .useState<() => void | undefined>(undefined);
  const [addBook, { loading }] = useMutation<{ adds: Result[] }>(gql`
      mutation add($id: ID!, $books: [InputBook!]!) {
          adds: addBooks(id: $id books: $books) {
              success
              code
          }
      }
  `, {
    variables: {
      id: infoId,
      books: addBooks,
    },
    onCompleted({ adds }) {
      setAddBookProgress(undefined);
      setAddBookAbort(undefined);
      setSubscriptionId(undefined);
      const success = adds.every((a) => a.success);
      if (onClose && success) onClose();
      if (success && onAdded) onAdded();
    },
    onError() {
      setSubscriptionId(undefined);
    },
    context: {
      fetchOptions: {
        useUpload: true,
        onProgress: (ev: ProgressEvent) => {
          setAddBookProgress(ev);
        },
        onAbortPossible: (abortFunc) => {
          setAddBookAbort(() => abortFunc);
        },
      },
    },
  });

  const { data: subscriptionData } = useSubscription(gql`
      subscription ($id: ID!){
          addBooks(id: $id)
      }
  `, {
    skip: !subscriptionId,
    variables: {
      id: subscriptionId,
    },
  });

  const closeDialog = () => {
    if (!loading) {
      if (onClose) onClose();
      setAddBooks([]);
      setSubscriptionId(undefined);
      setAddBookProgress(undefined);
      setAddBookAbort(undefined);
    }
  };

  const dropFiles = React.useCallback((files) => {
    setAddBooks([
      ...addBooks,
      ...files.map((f, i) => {
        let nums = f.name.match(/\d+/);
        if (nums) {
          nums = nums[nums.length - 1];
        } else {
          nums = `${addBooks.length + i + 1}`;
        }
        return {
          file: f,
          number: nums,
        };
      }),
    ]);
  }, [addBooks]);

  const changeAddBook = React.useCallback((i, obj) => {
    const books = [
      ...addBooks,
    ];
    books[i] = {
      ...books[i],
      ...obj,
    };
    setAddBooks(books);
  }, [addBooks]);

  return (
    <Dialog open={open} onClose={closeDialog}>
      <DialogTitle>Add book</DialogTitle>
      {(() => {
        if (subscriptionData
          && (!addBookProgress || addBookProgress.loaded === addBookProgress.total)) {
          return (
            <DialogContent className={classes.addBookSubscription}>
              <CircularProgress color="secondary" />
              <div className={classes.progressMessage}>{subscriptionData.addBooks}</div>
            </DialogContent>
          );
        }
        if (addBookProgress || addBookAbort) {
          return (
            <DialogContent className={classes.addBookProgress}>
              {addBookProgress && (
                <LinearProgress
                  variant="determinate"
                  value={(addBookProgress.loaded / addBookProgress.total) * 100}
                />
              )}
              {addBookAbort && (
                <Button onClick={addBookAbort}>Abort</Button>
              )}
            </DialogContent>
          );
        }
        return (
          <DialogContent className={classes.dialogContent}>
            <div>
              {addBooks.map(({ file, number }, i) => (
                <div key={`${file.name} ${number}`} className={classes.listItem}>
                  <FileField file={file} onChange={(f) => changeAddBook(i, { file: f })} />
                  <TextField
                    color="secondary"
                    label="Number"
                    value={number}
                    // @ts-ignore
                    onChange={(event) => changeAddBook(i, { number: event.target.value })}
                    margin="none"
                    autoFocus
                  />
                  <IconButton onClick={() => setAddBooks(addBooks.filter((f, k) => k !== i))}>
                    <Icon>clear</Icon>
                  </IconButton>
                </div>
              ))}
            </div>
            <DropZone onChange={dropFiles} />
          </DialogContent>
        );
      })()}
      <DialogActions>
        <Button onClick={closeDialog} disabled={loading}>
          close
        </Button>
        <Button
          onClick={() => {
            // noinspection JSIgnoredPromiseFromCall
            addBook();
            setSubscriptionId(infoId);
          }}
          disabled={loading}
          variant="contained"
          color="secondary"
        >
          add
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// @ts-ignore
AddBookDialog.whyDidYouRender = true;

export default AddBookDialog;
