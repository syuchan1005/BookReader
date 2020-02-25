import * as React from 'react';
import {
  Button, ButtonGroup,
  CircularProgress,
  createStyles,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Icon,
  IconButton,
  LinearProgress,
  makeStyles,
  Radio,
  RadioGroup,
  TextField,
  Theme,
} from '@material-ui/core';
import { useMutation, useQuery, useSubscription } from '@apollo/react-hooks';
import gql from 'graphql-tag';

import {
  AddCompressBookMutation as AddCompressBookMutationType,
  AddCompressBookMutationVariables,
  AddBooksMutation as AddBooksMutationType,
  AddBooksMutationVariables,
  AddBooksProgressSubscription,
  AddBooksProgressSubscriptionVariables,
  PluginsQuery as PluginsQueryType,
  PluginsQueryVariables,
  Result,
} from '@common/GQLTypes';
import AddCompressBookMutation from '@client/graphqls/AddBookDialog_addCompressBook.gql';
import AddBooksMutation from '@client/graphqls/AddBookDialog_addBooks.gql';
import AddBooksSubscription from '@client/graphqls/AddBookDialog_addBooks_Subscription.gql';
import PluginsQuery from '@client/graphqls/AddBookDialog_plugins.gql';

import FileField from '@client/components/FileField';
import DropZone from '@client/components/DropZone';

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

const AddBookDialog: React.FC<AddBookDialogProps> = (props: AddBookDialogProps) => {
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
  React.useEffect(() => setEditContent({}), [addType]);

  const {
    data,
  } = useQuery<PluginsQueryType, PluginsQueryVariables>(PluginsQuery);

  const selectedPlugin = React.useMemo(() => {
    if (!data || addType === 'file' || addType === 'file_compressed') return undefined;
    return data.plugins.filter(({ info: { name } }) => name === addType)[0];
  }, [addType, data]);

  const pluginMutationArgs = React.useMemo(() => {
    if (!selectedPlugin) return [];
    return [
      selectedPlugin.queries.add.name,
      `(${selectedPlugin.queries.add.args.map((s) => (s === 'id' ? '$id: ID!' : `$${s}: String!`))})`,
      `(${selectedPlugin.queries.add.args.map((s) => `${s}: $${s}`)})`,
    ];
  }, [selectedPlugin]);

  const mutateCloseDialog = React.useCallback((success) => {
    if (onClose && success) onClose();
    if (success && onAdded) onAdded();
    setAddBooks([]);
    setAddBookProgress(undefined);
    setAddBookAbort(undefined);
    setSubscriptionId(undefined);
    setAddType('file');
    setEditContent({});
  }, [onClose, onAdded]);

  const [addPlugin, { loading: addPluginLoading }] = useMutation<{ plugin: Pick<Result, 'success'> }>(
    gql(`
      mutation ${pluginMutationArgs[1] || ''}{
        plugin: ${pluginMutationArgs[0]}${pluginMutationArgs[2] || ''}{
            success
            code
        }
      }
    `),
    {
      onCompleted(d) {
        if (!d) return;
        mutateCloseDialog(d.plugin.success);
      },
    },
  );

  const [addBook, { loading: addBookLoading }] = useMutation<
    AddBooksMutationType,
    AddBooksMutationVariables
  >(AddBooksMutation, {
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
  }] = useMutation<AddCompressBookMutationType, AddCompressBookMutationVariables>(
    AddCompressBookMutation,
    {
      variables: {
        id: infoId,
        file: (addBooks[0] || {}).file,
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
    () => addBookLoading || addCompressBookLoading || addPluginLoading,
    [addBookLoading, addCompressBookLoading, addPluginLoading],
  );

  const { data: subscriptionData } = useSubscription<
    AddBooksProgressSubscription,
    AddBooksProgressSubscriptionVariables
  >(AddBooksSubscription, {
    skip: !subscriptionId,
    variables: {
      id: subscriptionId,
    },
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

  const clickAddButton = React.useCallback(() => {
    if (!selectedPlugin) {
      setSubscriptionId(infoId);
      if (addType === 'file_compressed') {
        // noinspection JSIgnoredPromiseFromCall
        addCompressBook();
      } else {
        // noinspection JSIgnoredPromiseFromCall
        addBook();
      }
    } else {
      if (selectedPlugin.queries.add.subscription) {
        setSubscriptionId(infoId);
      }
      // noinspection JSIgnoredPromiseFromCall
      addPlugin({
        variables: {
          ...editContent,
          ...(selectedPlugin.queries.add.args.includes('id') ? {
            id: infoId,
          } : {}),
        },
      });
    }
  }, [editContent, selectedPlugin, infoId, addType]);

  return (
    <Dialog open={open} onClose={closeDialog}>
      <DialogTitle style={{ paddingBottom: 0 }}>Add book</DialogTitle>
      {(() => {
        if (
          (subscriptionData && (!addBookProgress
          || (addBookProgress.loaded / addBookProgress.total) < 97)
          ) || (selectedPlugin && addPluginLoading)) {
          return (
            <DialogContent className={classes.addBookSubscription}>
              <CircularProgress color="secondary" />
              {(subscriptionData) && (
                <div className={classes.progressMessage}>{subscriptionData.addBooks}</div>
              )}
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
            <RadioGroup
              aria-label="add-type"
              value={addType}
              onChange={(e) => setAddType(e.target.value)}
            >
              <FormControlLabel disabled={loading} control={<Radio classes={{ root: classes.addTypeRadioRoot }} />} label="File" value="file" />
              <FormControlLabel disabled={loading} control={<Radio classes={{ root: classes.addTypeRadioRoot }} />} label="Compress File" value="file_compressed" />
              {data && data.plugins.map((plugin) => (
                <FormControlLabel
                  key={plugin.info.name}
                  disabled={loading}
                  control={<Radio classes={{ root: classes.addTypeRadioRoot }} />}
                  label={plugin.info.name}
                  value={plugin.info.name}
                />
              ))}
            </RadioGroup>

            {(addType === 'file' || addType === 'file_compressed') ? (
              <>
                <div>
                  {(addType === 'file_compressed'
                    ? [addBooks[0]].filter((a) => a)
                    : addBooks
                  ).map(({ file, number }, i) => (
                    <div key={`${file.name}`} className={classes.listItem}>
                      <FileField
                        file={file}
                        onChange={(f) => changeAddBook(i, { file: f })}
                        style={addType === 'file_compressed' ? { gridColumn: '1 / span 2' } : undefined}
                      />
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
                      <IconButton onClick={() => setAddBooks(addBooks.filter((f, k) => k !== i))}>
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
                  <DropZone onChange={dropFiles} />
                )}
              </>
            ) : (
              <div className={classes.pluginFields}>
                {selectedPlugin.queries.add.args
                  .filter((s) => s !== 'id')
                  .map((label) => (
                    <TextField
                      key={label}
                      color="secondary"
                      disabled={loading}
                      label={label}
                      value={editContent[label] || ''}
                      onChange={(e) => setEditContent({ ...editContent, [label]: e.target.value })}
                    />
                  ))}
              </div>
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

export default AddBookDialog;
