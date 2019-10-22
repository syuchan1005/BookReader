import * as React from 'react';
import {
  Button, Checkbox, CircularProgress,
  createStyles,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle, FormControlLabel,
  Icon,
  IconButton, LinearProgress,
  makeStyles,
  TextField, Theme,
} from '@material-ui/core';
import { useMutation, useSubscription } from '@apollo/react-hooks';

import * as AddCompressBookMutation from '@client/graphqls/AddBookDialog_addCompressBook.gql';
import * as AddBooksMutation from '@client/graphqls/AddBookDialog_addBooks.gql';
import * as AddBooksSubscription from '@client/graphqls/AddBookDialog_addBooks_Subscription.gql';

import FileField from '@client/components/FileField';
import DropZone from '@client/components/DropZone';
import { Result, ResultWithBookResults } from '@common/GraphqlTypes';

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

  const [isCompressed, setCompressed] = React.useState(false);

  const [addBook, { loading: addBookLoading }] = useMutation<{ adds: Result[] }>(AddBooksMutation, {
    variables: {
      id: infoId,
      books: addBooks,
    },
    onCompleted(d) {
      if (!d) return;
      setAddBooks([]);
      setAddBookProgress(undefined);
      setAddBookAbort(undefined);
      setSubscriptionId(undefined);
      const success = d.adds.every((a) => a.success);
      if (onClose && success) onClose();
      if (success && onAdded) onAdded();
    },
    onError() {
      setAddBookProgress(undefined);
      setAddBookAbort(undefined);
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

  const [addCompressBook, {
    loading: addCompressBookLoading,
  }] = useMutation<{ add: ResultWithBookResults }>(
    AddCompressBookMutation,
    {
      variables: {
        id: infoId,
        file: (addBooks[0] || {}).file,
      },
      onCompleted(d) {
        if (!d) return;
        setAddBooks([]);
        setAddBookProgress(undefined);
        setAddBookAbort(undefined);
        if (onClose && d.add.success) onClose();
        if (d.add.success && onAdded) onAdded();
      },
      onError() {
        setAddBookProgress(undefined);
        setAddBookAbort(undefined);
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
    },
  );

  const loading = React.useMemo(
    () => addBookLoading || addCompressBookLoading,
    [addBookLoading, addCompressBookLoading],
  );

  const { data: subscriptionData } = useSubscription(AddBooksSubscription, {
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
        let nums = f.name.match(/\d+/g);
        if (nums) {
          nums = Number(nums[nums.length - 1]).toString(10);
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
          && (!addBookProgress
            || (addBookProgress.loaded / addBookProgress.total) < 97)) {
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
            <FormControlLabel
              control={(
                <Checkbox
                  checked={isCompressed}
                  onChange={(e) => setCompressed(e.target.checked)}
                />
              )}
              label="Compressed"
            />
            <div>
              {(isCompressed
                ? [addBooks[0]].filter((a) => a)
                : addBooks
              ).map(({ file, number }, i) => (
                <div key={`${file.name} ${number}`} className={classes.listItem}>
                  <FileField
                    file={file}
                    onChange={(f) => changeAddBook(i, { file: f })}
                    style={isCompressed ? { gridColumn: '1 / span 2' } : undefined}
                  />
                  {(!isCompressed) && (
                    <TextField
                      color="secondary"
                      label="Number"
                      value={number}
                      // @ts-ignore
                      onChange={(event) => changeAddBook(i, { number: event.target.value })}
                      margin="none"
                      autoFocus
                    />
                  )}
                  <IconButton onClick={() => setAddBooks(addBooks.filter((f, k) => k !== i))}>
                    <Icon>clear</Icon>
                  </IconButton>
                </div>
              ))}
            </div>
            {((isCompressed && addBooks.length === 0) || !isCompressed) && (
              <DropZone onChange={dropFiles} />
            )}
          </DialogContent>
        );
      })()}
      <DialogActions>
        <Button onClick={closeDialog} disabled={loading}>
          close
        </Button>
        <Button
          onClick={() => {
            if (isCompressed) {
              // noinspection JSIgnoredPromiseFromCall
              addCompressBook();
            } else {
              // noinspection JSIgnoredPromiseFromCall
              addBook();
              setSubscriptionId(infoId);
            }
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
