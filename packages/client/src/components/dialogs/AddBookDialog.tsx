import DropZone from '@client/components/DropZone';
import FileField from '@client/components/FileField';
import { useTitle } from '@client/hooks/useTitle';
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
  Radio,
  RadioGroup,
  TextField,
  type Theme,
} from '@mui/material';
import createStyles from '@mui/styles/createStyles';
import makeStyles from '@mui/styles/makeStyles';
import {
  type AddBooksProgressSubscription,
  type AddBooksSubscriptionType,
  type InputBook,
  useAddBooksMutation,
  useAddBooksProgressSubscription,
  useAddCompressBookMutation,
} from '@syuchan1005/book-reader-graphql';
import {
  Children,
  cloneElement,
  type ReactElement,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useBeforeUnload } from 'react-use';

type StrictAddBooksSubscriptionResult<
  EnumType = typeof AddBooksSubscriptionType,
  ResolversType extends Record<
    string,
    unknown
  > = AddBooksProgressSubscription['addBooks'],
  ResultTypeName extends keyof ResolversType = 'AddBooksSubscriptionResult',
> = {
  [K in keyof EnumType]: K extends string
    ? ResultTypeName extends string
      ? {
          type: EnumType[K];
        } & (ResolversType extends infer U
          ? U extends { __typename?: `${K}${ResultTypeName}` }
            ? { type: EnumType[K] } & U
            : never
          : never)
      : never
    : never;
}[keyof EnumType];

interface AddBookDialogProps {
  open: boolean;
  infoId: string;
  onAdded?: () => void;
  onClose?: () => void;

  children?: ReactNode;
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
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
  }),
);

const AddBookDialog = (props: AddBookDialogProps) => {
  const classes = useStyles(props);
  const { open, infoId, onAdded, onClose, children } = props;

  const [addBooks, setAddBooks] = useState<InputBook[]>([]);
  const [subscriptionId, setSubscriptionId] = useState<string | undefined>(
    undefined,
  );

  const [addType, setAddType] = useState('file');
  const [nameType, setNameType] = useState<'number' | 'filename'>('number');
  const [editContent, setEditContent] = useState({});
  // biome-ignore lint/correctness/useExhaustiveDependencies: editContent, addType
  useEffect(() => {
    if (Object.keys(editContent).length > 0) {
      setEditContent({});
    }
  }, [addType]);

  const [isBlockUnload, setBlockUnload] = useState(false);
  useBeforeUnload(isBlockUnload, 'In Process. Changes may not be saved.');

  const [uploadingFileBytes, setUploadingFileBytes] = useState(0);

  const mutateCloseDialog = useCallback(
    (success) => {
      if (onClose && success) onClose();
      if (success && onAdded) onAdded();
      setAddBooks([]);
      setSubscriptionId(undefined);
      setAddType('file');
      setEditContent({});
      setBlockUnload(false);
    },
    [onClose, onAdded],
  );

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
      setSubscriptionId(undefined);
    },
  });

  const [addCompressBook, { loading: addCompressBookLoading }] =
    useAddCompressBookMutation({
      variables: {
        id: infoId,
        file: addBooks[0]?.file,
        path: addBooks[0]?.path,
      },
      onCompleted(d) {
        if (!d) return;
        mutateCloseDialog(d.add.success);
      },
      onError() {
        setSubscriptionId(undefined);
      },
    });

  const loading = useMemo(
    () => addBookLoading || addCompressBookLoading,
    [addBookLoading, addCompressBookLoading],
  );

  const { data: subscriptionData, loading: subscriptionLoading } =
    useAddBooksProgressSubscription({
      skip: !subscriptionId,
      variables: {
        id: subscriptionId,
      },
    });
  const subscriptionDataText = useMemo(() => {
    const addBooksSubscriptionResult =
      subscriptionData?.addBooks as StrictAddBooksSubscriptionResult;
    if (!addBooksSubscriptionResult) {
      return '';
    }
    let bookNumber = '';
    if (addBooksSubscriptionResult?.bookNumber) {
      bookNumber = ` (${addBooksSubscriptionResult?.bookNumber})`;
    }
    switch (addBooksSubscriptionResult?.type) {
      case 'Moving': {
        const progressText =
          addBooksSubscriptionResult.totalPageCount > 0
            ? ` ${addBooksSubscriptionResult.movedPageCount}/${addBooksSubscriptionResult.totalPageCount}`
            : '';
        return `Move Book${bookNumber}${progressText}`;
      }
      case 'Extracting': {
        const progressText =
          addBooksSubscriptionResult.progressPercent > 0
            ? ` ${addBooksSubscriptionResult.progressPercent}%`
            : '';
        return `Extract Book${bookNumber}${progressText}`;
      }
      case 'Uploading': {
        const progress =
          addBooksSubscriptionResult.downloadedBytes / uploadingFileBytes;
        const progressText =
          addBooksSubscriptionResult.downloadedBytes > 0
            ? ` ${Math.floor(progress * 100)}%`
            : '';
        return `Extract Book${bookNumber}${progressText}`;
      }
      default:
        return 'Uploading';
    }
  }, [subscriptionData, uploadingFileBytes]);

  useTitle(subscriptionDataText, {
    restoreOnUnmount: true,
    inheritTitle: true,
  });

  const closeDialog = () => {
    if (!loading) {
      if (onClose) onClose();
      mutateCloseDialog(false);
    }
  };

  const dropFiles = useCallback(
    (files) => {
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
    },
    [addBooks, addType, nameType],
  );

  const changeAddBook = useCallback(
    (i, obj) => {
      const books = [...addBooks];
      books[i] = {
        ...books[i],
        ...obj,
      };
      setAddBooks(books);
    },
    [addBooks],
  );

  const clickAddButton = useCallback(async () => {
    setSubscriptionId(infoId);
    let count = 1;
    while (!subscriptionLoading && count <= 2) {
      await new Promise((r) => setTimeout(r, 100 * count));
      count += 1;
    }
    const uploadTargetFiles: (InputBook | undefined)[] = [];
    if (addType === 'file_compressed') {
      addCompressBook();
      uploadTargetFiles.push(addBooks[0]);
    } else {
      addBook();
      uploadTargetFiles.push(...addBooks);
    }
    const totalUploadBytes = uploadTargetFiles.reduce(
      (total, f) => total + (f?.file?.size || 0),
      0,
    );
    setUploadingFileBytes(totalUploadBytes);
    setBlockUnload(true);
  }, [
    infoId,
    subscriptionLoading,
    addType,
    addCompressBook,
    addBook,
    addBooks,
  ]);

  return (
    <Dialog open={open} onClose={closeDialog}>
      <DialogTitle style={{ paddingBottom: 0 }}>Add book</DialogTitle>
      {(() => {
        if (loading) {
          return (
            <DialogContent className={classes.addBookSubscription}>
              <CircularProgress color="secondary" />
              <div className={classes.progressMessage}>
                {subscriptionDataText}
              </div>
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
              {(addType === 'file_compressed'
                ? [addBooks[0]].filter((a) => a)
                : addBooks
              ).map(({ number, file, path }, i) => (
                <div
                  key={`${path !== undefined ? i : file.name}`}
                  className={classes.listItem}
                >
                  {path !== undefined ? (
                    <TextField
                      color="secondary"
                      label="FilePath"
                      value={path}
                      onChange={(e) =>
                        changeAddBook(i, { path: e.target.value })
                      }
                    />
                  ) : (
                    <FileField
                      file={file}
                      onChange={(f) => changeAddBook(i, { file: f })}
                      style={
                        addType === 'file_compressed'
                          ? { gridColumn: '1 / span 2' }
                          : undefined
                      }
                    />
                  )}
                  {addType !== 'file_compressed' && (
                    <TextField
                      color="secondary"
                      label="Number"
                      value={number}
                      // @ts-expect-error
                      onChange={(event) =>
                        changeAddBook(i, { number: event.target.value })
                      }
                      margin="none"
                      autoFocus
                    />
                  )}
                  <IconButton
                    onClick={() =>
                      setAddBooks(addBooks.filter((_f, k) => k !== i))
                    }
                    size="large"
                  >
                    <Icon>clear</Icon>
                  </IconButton>
                </div>
              ))}
            </div>
            {addType === 'file' && (
              <ButtonGroup
                style={{ marginLeft: 'auto' }}
                size="small"
                color="secondary"
              >
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
            {((addType === 'file_compressed' && addBooks.length === 0) ||
              addType !== 'file_compressed') && (
              <>
                <DropZone onChange={dropFiles} />
                <Button
                  startIcon={<Icon>add</Icon>}
                  onClick={() =>
                    setAddBooks([
                      ...addBooks,
                      {
                        number: '',
                        path: '',
                        file: undefined,
                      },
                    ])
                  }
                >
                  Add local
                </Button>
              </>
            )}
          </DialogContent>
        );
      })()}
      <DialogActions>
        {children &&
          Children.map<{ loading: boolean }, ReactElement>(
            // @ts-expect-error
            children,
            (child) => cloneElement(child, { loading }),
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
