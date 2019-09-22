import * as React from 'react';
import {
  Button,
  createStyles,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Icon,
  IconButton,
  makeStyles,
  TextField,
} from '@material-ui/core';
import gql from 'graphql-tag';
import { useMutation } from '@apollo/react-hooks';
import FileField from './FileField';
import DropZone from './DropZone';
import { Result } from '../../common/GraphqlTypes';

interface AddBookDialogProps {
  open: boolean;
  infoId: string;
  onAdded?: Function;
  onClose?: Function;
}

const useStyles = makeStyles((theme) => createStyles({
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
      const success = adds.every((a) => a.success);
      if (onClose && success) onClose();
      if (success && onAdded) onAdded();
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

  const closeDialog = () => {
    if (!loading) {
      if (onClose) onClose();
      setAddBooks([]);
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
      <DialogActions>
        <Button onClick={closeDialog} disabled={loading}>
          close
        </Button>
        <Button
          onClick={() => addBook()}
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
