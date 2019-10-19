import * as React from 'react';
import {
  Button,
  CircularProgress,
  createStyles,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Icon,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  makeStyles,
  Switch,
  TextField,
  Theme,
} from '@material-ui/core';
import { useMutation, useSubscription } from '@apollo/react-hooks';

import * as AddBookInfoMutation from '@client/graphqls/AddBookInfoDialog_addBookInfo.gql';
import * as AddBookInfoSubscription from '@client/graphqls/AddBookInfoDialog_addBookInfo_Subscription.gql';
import * as AddBookInfoHistoriesMutation from '@client/graphqls/AddBookInfoDialog_addBookInfoHistories.gql';

import FileField from '@client/components/FileField';
import DropZone from '@client/components/DropZone';
import { Result } from '@common/GraphqlTypes';

interface AddBookInfoDialogProps {
  open: boolean;
  onAdded?: Function;
  onClose?: Function;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const useStyles = makeStyles((theme: Theme) => createStyles({
  dialog: {
    width: '100%',
    height: '100%',
  },
  listItem: {
    width: '100%',
    display: 'grid',
    gridTemplateColumns: '1fr 50px 48px',
    marginBottom: theme.spacing(0.5),
  },
  historyListItem: {
    width: '100%',
    display: 'grid',
    gridColumnGap: theme.spacing(1),
    gridTemplateColumns: '1fr 55px 30px',
  },
  addBookInfoSubscription: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  addBookInfoProgress: {
    display: 'grid',
    alignItems: 'center',
    gridTemplateColumns: '1fr 64px [end]',
    columnGap: theme.spacing(1),
    width: 300,
  },
  progressMessage: {
    marginTop: theme.spacing(2),
    gridColumn: '1 / end',
    textAlign: 'center',
  },
}));

const AddBookInfoDialog: React.FC<AddBookInfoDialogProps> = (props: AddBookInfoDialogProps) => {
  const classes = useStyles(props);
  const { onAdded, onClose, open } = props;
  const [name, setName] = React.useState('');
  const [addBooks, setAddBooks] = React.useState([]);
  const [isCompress, setIsCompress] = React.useState(false);
  const [showAddHistory, setShowAddHistory] = React.useState(false);
  const [addHistories, setAddHistories] = React.useState([]);
  const historyBulkRef = React.useRef(null);
  const [subscriptionName, setSubscriptionName] = React.useState<string | undefined>(undefined);
  const [addBookInfoProgress, setAddBookInfoProgress] = React
    .useState<ProgressEvent | undefined>(undefined);
  const [addBookInfoAbort, setAddBookInfoAbort] = React
    .useState<() => void | undefined>(undefined);

  const changeAddHistories = (index, field, value) => {
    const a = [...addHistories];
    a[index][field] = value;
    setAddHistories(a);
  };

  const closeDialog = () => {
    if (onClose) onClose();
    setName('');
    setAddBooks([]);
    setShowAddHistory(false);
    setAddHistories([]);
    setSubscriptionName(undefined);
    setAddBookInfoProgress(undefined);
    setAddBookInfoAbort(undefined);
  };

  const [addBookInfo, { loading: addLoading }] = useMutation<{ add: Result }>(AddBookInfoMutation, {
    variables: {
      name,
      books: (isCompress ? null : addBooks),
      compress: (isCompress ? (addBooks[0] || {}).file : null),
    },
    onCompleted({ add }) {
      setAddBookInfoProgress(undefined);
      setAddBookInfoAbort(undefined);
      setSubscriptionName(undefined);
      closeDialog();
      if (add.success && onAdded) onAdded();
    },
    onError() {
      setSubscriptionName(undefined);
    },
    context: {
      fetchOptions: {
        useUpload: true,
        onProgress: (ev: ProgressEvent) => {
          setAddBookInfoProgress(ev);
        },
        onAbortPossible: (abortFunc) => {
          setAddBookInfoAbort(() => abortFunc);
        },
      },
    },
  });

  const [addBookInfoHistories, { loading: histLoading }] = useMutation<{ add: Result }>(
    AddBookInfoHistoriesMutation,
    {
      onCompleted({ add: { success } }) {
        closeDialog();
        if (success && onAdded) onAdded();
      },
      variables: {
        histories: addHistories.map((h) => ({ name: h.name, count: Number(h.count) })),
      },
    },
  );

  const { data: subscriptionData } = useSubscription(AddBookInfoSubscription, {
    skip: !subscriptionName,
    variables: {
      name: subscriptionName,
    },
  });

  const loading = React.useMemo(() => addLoading || histLoading, [addLoading, histLoading]);

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

  const showBooks = React.useMemo(() => {
    if (!isCompress) return addBooks;
    if (addBooks.length <= 0) return [];
    return [addBooks[0]];
  }, [isCompress, addBooks]);

  const addHistoriesEntity = () => {
    const a = [...(addHistories.filter((h) => h.name))];
    a.push({ name: '', count: 0 });
    setAddHistories(a);
  };

  const onFilePicked = (event) => {
    const { files } = event.target;
    if (files[0] === undefined) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target.result !== 'string') return;
      const obj = e.target.result
        .split('\n')
        .filter((s) => s && s.length >= 1)
        .map((s) => s.match(/^(.+) (\d+)(-(\d+))?/))
        .map((m) => ({ name: m[1], count: Number(m[4] || m[2]) }));
      setAddHistories([...addHistories, ...obj].filter((h) => h.name));
    };
    reader.readAsText(files[0]);
  };

  return (
    <Dialog open={open} onClose={() => !loading && closeDialog()}>
      <DialogTitle>{`Add book info${showAddHistory ? ' history' : ''}`}</DialogTitle>

      {(() => {
        if (showAddHistory) {
          return (
            <DialogContent>
              <List>
                {addHistories.map((h, i) => (
                  <ListItem className={classes.historyListItem} key={`${h.name} ${h.count}`}>
                    <TextField
                      placeholder="name"
                      value={h.name}
                      onChange={(e) => changeAddHistories(i, 'name', e.target.value)}
                    />
                    <TextField
                      type="number"
                      placeholder="count"
                      value={h.count}
                      onChange={(e) => changeAddHistories(i, 'count', e.target.value)}
                    />
                    <IconButton size="small" onClick={() => setAddHistories(addHistories.filter((f, k) => k !== i))}>
                      <Icon>clear</Icon>
                    </IconButton>
                  </ListItem>
                ))}
                <ListItem>
                  <Button fullWidth onClick={addHistoriesEntity}>
                    <Icon>add</Icon>
                    Add
                  </Button>
                </ListItem>
                <ListItem>
                  <Button fullWidth onClick={() => historyBulkRef.current.click()}>
                    <Icon>add</Icon>
                    bulk Add
                  </Button>
                  <input
                    type="file"
                    hidden
                    ref={historyBulkRef}
                    onChange={onFilePicked}
                  />
                </ListItem>
              </List>
            </DialogContent>
          );
        }
        if (subscriptionData || addBookInfoProgress || addBookInfoAbort || loading) {
          return (
            <DialogContent
              className={
                (addBookInfoProgress
                  && (addBookInfoProgress.loaded / addBookInfoProgress.total < 97))
                  ? classes.addBookInfoProgress
                  : classes.addBookInfoSubscription
              }
            >
              {(addBookInfoProgress
                && ((addBookInfoProgress.loaded / addBookInfoProgress.total) < 97))
                ? (
                  <>
                    {addBookInfoProgress && (
                      <LinearProgress
                        variant="determinate"
                        value={(addBookInfoProgress.loaded / addBookInfoProgress.total) * 100}
                      />
                    )}
                    {addBookInfoAbort && (
                      <Button onClick={addBookInfoAbort}>Abort</Button>
                    )}
                  </>
                )
                : (
                  <CircularProgress color="secondary" />
                )}
              {(subscriptionData) && (
                <div className={classes.progressMessage}>{subscriptionData.addBookInfo}</div>
              )}
            </DialogContent>
          );
        }
        return (
          <DialogContent>
            <TextField
              color="secondary"
              autoFocus
              label="Book info name"
              value={name}
              // @ts-ignore
              onChange={(event) => setName(event.target.value)}
            />
            <Grid container alignItems="center" spacing={1}>
              <Grid item>Books</Grid>
              <Grid item>
                <Switch checked={isCompress} onChange={(e) => setIsCompress(e.target.checked)} />
              </Grid>
              <Grid item>Compress Books</Grid>
            </Grid>
            <div>
              {showBooks.map(({ file, number }, i) => (
                <div key={`${file.name} ${number}`} className={classes.listItem}>
                  <FileField file={file} onChange={(f) => changeAddBook(i, { file: f })} />
                  {isCompress ? null : (
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
            {(isCompress && addBooks.length >= 1) ? null : (
              <DropZone onChange={dropFiles} />
            )}
          </DialogContent>
        );
      })()}

      <DialogActions>
        <Button onClick={() => setShowAddHistory(!showAddHistory)} disabled={loading}>
          {`Add ${showAddHistory ? 'books' : 'history'}`}
        </Button>

        <div style={{ flex: 1 }} />

        <Button onClick={() => !loading && closeDialog()} disabled={loading}>
          close
        </Button>
        <Button
          onClick={() => {
            if (showAddHistory) {
              // noinspection JSIgnoredPromiseFromCall
              addBookInfoHistories();
            } else {
              // noinspection JSIgnoredPromiseFromCall
              addBookInfo();
              setSubscriptionName(name);
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
AddBookInfoDialog.whyDidYouRender = true;

export default AddBookInfoDialog;
