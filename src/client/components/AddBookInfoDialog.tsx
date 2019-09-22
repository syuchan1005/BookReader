import * as React from 'react';
import {
  Button, createStyles,
  Dialog, DialogActions,
  DialogContent,
  DialogTitle, Grid, Icon, IconButton, makeStyles, Switch, TextField,
} from '@material-ui/core';
import gql from 'graphql-tag';
import { useMutation } from '@apollo/react-hooks';
import FileField from './FileField';
import DropZone from './DropZone';
import { Result } from '../../common/GraphqlTypes';

interface AddBookInfoDialogProps {
  onAdded?: Function;
  children?: React.ReactElement;
}

export interface ChildProps {
  open: boolean;
  setOpen: Function;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const useStyles = makeStyles((theme) => createStyles({
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
}));

const AddBookInfoDialog: React.FC<AddBookInfoDialogProps> = (props: AddBookInfoDialogProps) => {
  const classes = useStyles(props);
  const { onAdded, children } = props;
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState('');
  const [addBooks, setAddBooks] = React.useState([]);
  const [isCompress, setIsCompress] = React.useState(false);

  const closeDialog = () => {
    setOpen(false);
    setName('');
    setAddBooks([]);
  };

  const [addBookInfo, { loading }] = useMutation<{ add: Result }>(gql`
    mutation add($name: String! $books: [InputBook!] $compress: Upload) {
        add: addBookInfo(name: $name books: $books, compressBooks: $compress) {
            success
            code
        }
    }
  `, {
    onCompleted({ add }) {
      closeDialog();
      if (add.success && onAdded) onAdded();
    },
    variables: {
      name,
      books: (isCompress ? null : addBooks),
      compress: (isCompress ? (addBooks[0] || {}).file : null),
    },
  });

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

  const showBooks = React.useMemo(() => {
    if (!isCompress) return addBooks;
    if (addBooks.length <= 0) return [];
    return [addBooks[0]];
  }, [isCompress, addBooks]);

  return (
    <div className={classes.dialog}>
      {React.cloneElement(children, { open, setOpen })}
      <Dialog open={open} onClose={() => !loading && closeDialog()}>
        <DialogTitle>Add book info</DialogTitle>
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
        <DialogActions>
          <Button onClick={() => !loading && closeDialog()} disabled={loading}>
            close
          </Button>
          <Button
            onClick={() => addBookInfo()}
            disabled={loading}
            variant="contained"
            color="secondary"
          >
            add
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default AddBookInfoDialog;
