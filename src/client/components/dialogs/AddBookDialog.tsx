import * as React from 'react';
import {
  Button, CircularProgress,
  createStyles,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Icon,
  IconButton,
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
  addBookProgress: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  progressMessage: {
    marginTop: theme.spacing(2),
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
          // eslint-disable-next-line no-console
          console.log(`${(ev.loaded / ev.total) * 100}%`);
        },
        onAbortPossible: () => {
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
    }
  };

  const dropFiles = React.useCallback((files) => {
    setAddBooks([
      ...addBooks,
      ...files.map((f, i) => ({
        file: f,
        number: `${addBooks.length + i + 1}`,
      })),
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
      {(!subscriptionData) ? (
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
      ) : (
        <DialogContent className={classes.addBookProgress}>
          <CircularProgress color="secondary" />
          <div className={classes.progressMessage}>{subscriptionData.addBooks}</div>
        </DialogContent>
      )}
      <DialogActions>
        <Button onClick={closeDialog} disabled={loading}>
          close
        </Button>
        <Button
          onClick={() => {
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

export default AddBookDialog;
