import React from 'react';
import {
  Button,
  ButtonGroup,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Icon,
  IconButton,
  LinearProgress,
  Radio,
  RadioGroup,
  TextField,
  Theme,
} from '@mui/material';
import createStyles from '@mui/styles/createStyles';
import makeStyles from '@mui/styles/makeStyles';
import { useBeforeUnload } from 'react-use';

import {
  useAddBooksMutation, useAddBooksProgressSubscription, useAddCompressBookMutation,
} from '@syuchan1005/book-reader-graphql';

import FileField from '@client/components/FileField';
import DropZone from '@client/components/DropZone';
import { useTitle } from '@client/hooks/useTitle';

interface AddBookDialogProps {
  open: boolean;
  infoId: string;
  onAdded?: Function;
  onClose?: Function;

  children?: React.ReactNode;
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
  addTypeRadioRoot: {
    padding: 0,
    margin: theme.spacing(0, 1),
  },
  pluginFields: {
    display: 'flex',
    flexDirection: 'column',
    padding: theme.spacing(1, 0),
    '& > * + *': {
      marginTop: theme.spacing(1),
    },
  },
}));

const AddBookDialog = (props: AddBookDialogProps) => {
  const classes = useStyles(props);
  const {
    open,
    infoId,
    onAdded,
    onClose,
    children,
  } = props;

  const [addBooks, setAddBooks] = React.useState([]);
  const [subscriptionId, setSubscriptionId] = React.useState<string | undefined>(undefined);

  const [addBookProgress, setAddBookProgress] = React
    .useState<ProgressEvent | undefined>(undefined);
  const [addBookAbort, setAddBookAbort] = React
    .useState<() => void | undefined>(undefined);
  const [addType, setAddType] = React.useState('file');
  const [nameType, setNameType] = React.useState<'number' | 'filename'>('number');
  const [editContent, setEditContent] = React.useState({});
  React.useEffect(() => {
    if (Object.keys(editContent).length > 0) {
      setEditContent({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addType]);

  const [isBlockUnload, setBlockUnload] = React.useState(false);
  useBeforeUnload(isBlockUnload, 'In Process. Changes may not be saved.');

  const mutateCloseDialog = React.useCallback((success) => {
    if (onClose && success) onClose();
    if (success && onAdded) onAdded();
    setAddBooks([]);
    setAddBookProgress(undefined);
    setAddBookAbort(undefined);
    setSubscriptionId(undefined);
    setAddType('file');
    setEditContent({});
    setBlockUnload(false);
  }, [onClose, onAdded]);

  const [addBook, { loading: addBookLoading }] = useAddBooksMutation({
    variables: {
      id: infoId,
      books: addBooks,
    },
    onCompleted(d) {
      if (!d) return;
      mutateCloseDialog(d.adds.every((a) => a.success));
    },
    onError() {
      setAddBookProgress(undefined);
      setAddBookAbort(undefined);
      setSubscriptionId(undefined);
    },
  });

  const [addCompressBook, {
    loading: addCompressBookLoading,
  }] = useAddCompressBookMutation({
    variables: {
      id: infoId,
      file: (addBooks[0] || {}).file,
      path: (addBooks[0] || {}).path,
    },
    onCompleted(d) {
      if (!d) return;
      mutateCloseDialog(d.add.success);
    },
    onError() {
      setAddBookProgress(undefined);
      setAddBookAbort(undefined);
      setSubscriptionId(undefined);
    },
  });

  const loading = React.useMemo(
    () => addBookLoading || addCompressBookLoading,
    [addBookLoading, addCompressBookLoading],
  );

  const {
    data: subscriptionData,
    loading: subscriptionLoading,
  } = useAddBooksProgressSubscription({
    skip: !subscriptionId,
    variables: {
      id: subscriptionId,
    },
  });

  const title = React.useMemo(() => {
    if (subscriptionData) {
      return `${subscriptionData.addBooks}`;
    }
    if (addBookProgress) {
      const percent = (addBookProgress.loaded / addBookProgress.total) * 100;
      return `Uploading ${percent.toFixed(2)}%`;
    }
    return '';
  }, [addBookProgress, subscriptionData]);
  useTitle(title, {
    restoreOnUnmount: true,
    inheritTitle: true,
  });

  const closeDialog = () => {
    if (!loading) {
      if (onClose) onClose();
      mutateCloseDialog(false);
    }
  };

  const dropFiles = React.useCallback((files) => {
    setAddBooks([
      ...addBooks,
      ...files.map((f, i) => {
        if (addType === 'file' && nameType === 'filename') {
          return {
            file: f,
            number: f.name.match(/^(.*)\.[^.]+$/)[1],
          };
        }
        let nums = f.name.match(/\d+/g);
        if (nums) {
          nums = Number(nums[nums.length - 1])
            .toString(10);
        } else {
          nums = `${addBooks.length + i + 1}`;
        }
        return {
          file: f,
          number: nums,
        };
      }),
    ]);
  }, [addBooks, addType, nameType]);

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

  const clickAddButton = React.useCallback(
    async () => {
      setSubscriptionId(infoId);
      let count = 1;
      while (!subscriptionLoading && count <= 2) {
        // eslint-disable-next-line no-await-in-loop,no-loop-func,no-promise-executor-return
        await new Promise((r) => setTimeout(r, 100 * count));
        count += 1;
      }
      if (addType === 'file_compressed') {
        addCompressBook({
          context: {
            fetchOptions: {
              useUpload: !!addBooks[0].file,
              onProgress: (ev: ProgressEvent) => {
                setAddBookProgress(ev);
              },
              onAbortPossible: (abortFunc) => {
                setAddBookAbort(() => () => {
                  abortFunc();
                  setBlockUnload(false);
                });
              },
            },
          },
        });
      } else {
        addBook({
          context: {
            fetchOptions: {
              useUpload: addBooks.filter((b) => b.file).length >= 1,
              onProgress: (ev: ProgressEvent) => {
                setAddBookProgress(ev);
              },
              onAbortPossible: (abortFunc) => {
                setAddBookAbort(() => () => {
                  abortFunc();
                  setBlockUnload(false);
                });
              },
            },
          },
        });
      }
      setBlockUnload(true);
    },
    [infoId, subscriptionLoading, addType, addCompressBook, addBooks, addBook],
  );

  return (
    <Dialog open={open} onClose={closeDialog}>
      <DialogTitle style={{ paddingBottom: 0 }}>Add book</DialogTitle>
      {(() => {
        if (addBookProgress && addBookProgress.loaded < addBookProgress.total) {
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
        if (
          (subscriptionData && (!addBookProgress
              || (addBookProgress.loaded / addBookProgress.total) < 97)
          )) {
          return (
            <DialogContent className={classes.addBookSubscription}>
              <CircularProgress color="secondary" />
              {(subscriptionData) && (
                <div className={classes.progressMessage}>{subscriptionData.addBooks}</div>
              )}
            </DialogContent>
          );
        }
        return (
          <DialogContent className={classes.dialogContent}>
            <RadioGroup
              aria-label="add-type"
              value={addType}
              onChange={(e) => setAddType(e.target.value)}
            >
              <FormControlLabel
                disabled={loading}
                control={<Radio classes={{ root: classes.addTypeRadioRoot }} />}
                label="File"
                value="file"
              />
              <FormControlLabel
                disabled={loading}
                control={<Radio classes={{ root: classes.addTypeRadioRoot }} />}
                label="Compress File"
                value="file_compressed"
              />
            </RadioGroup>

            <div>
              {(addType === 'file_compressed' ? [addBooks[0]].filter((a) => a) : addBooks)
                .map(({
                  number,
                  file,
                  path,
                }, i) => (
                  <div
                    key={`${path !== undefined ? i : file.name}`}
                    className={classes.listItem}
                  >
                    {path !== undefined ? (
                      <TextField
                        color="secondary"
                        label="FilePath"
                        value={path}
                        onChange={(e) => changeAddBook(i, { path: e.target.value })}
                      />
                    ) : (
                      <FileField
                        file={file}
                        onChange={(f) => changeAddBook(i, { file: f })}
                        style={addType === 'file_compressed' ? { gridColumn: '1 / span 2' } : undefined}
                      />
                    )}
                    {(addType !== 'file_compressed') && (
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
                    <IconButton
                      onClick={() => setAddBooks(addBooks.filter((f, k) => k !== i))}
                      size="large"
                    >
                      <Icon>clear</Icon>
                    </IconButton>
                  </div>
                ))}
            </div>
            {addType === 'file' && (
              <ButtonGroup style={{ marginLeft: 'auto' }} size="small" color="secondary">
                <Button
                  variant={nameType === 'number' ? 'contained' : 'outlined'}
                  onClick={() => setNameType('number')}
                >
                  Number
                </Button>
                <Button
                  variant={nameType === 'filename' ? 'contained' : 'outlined'}
                  onClick={() => setNameType('filename')}
                >
                  FileName
                </Button>
              </ButtonGroup>
            )}
            {((addType === 'file_compressed' && addBooks.length === 0) || addType !== 'file_compressed') && (
              <>
                <DropZone onChange={dropFiles} />
                <Button
                  startIcon={<Icon>add</Icon>}
                  onClick={() => setAddBooks([...addBooks, {
                    number: '',
                    path: '',
                    file: undefined,
                  }])}
                >
                  Add local
                </Button>
              </>
            )}
          </DialogContent>
        );
      })()}
      <DialogActions>
        {children && React.Children.map<{ loading: boolean }, React.ReactElement>(
          // @ts-ignore
          children,
          (child) => React.cloneElement(child, { loading }),
        )}
        <Button onClick={closeDialog} disabled={loading}>
          close
        </Button>
        <Button
          onClick={clickAddButton}
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

export default React.memo(AddBookDialog);
