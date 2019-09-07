import * as React from 'react';
import {
  Button, createStyles,
  Dialog, DialogActions,
  DialogContent, DialogContentText,
  DialogTitle, makeStyles, TextField,
} from '@material-ui/core';
import gql from 'graphql-tag';
import { useMutation } from '@apollo/react-hooks';
import FileField from './FileField';

interface AddBookDialogProps {
  infoId: string;
  onAdded?: Function;
  children?: React.ReactElement;
}

export interface ChildProps {
  open: boolean;
  setOpen: Function;
}

const useStyles = makeStyles(() => createStyles({
  dialog: {
    width: '100%',
    height: '100%',
  },
  dialogContent: {
    display: 'flex',
    flexDirection: 'column',
  },
}));

const AddBookDialog: React.FC<AddBookDialogProps> = (props: AddBookDialogProps) => {
  const classes = useStyles();
  const { children, infoId, onAdded } = props;
  const [open, setOpen] = React.useState(false);
  const [num, setNum] = React.useState('1');
  const [file, setFile] = React.useState(undefined);
  const [addBookInfo, { loading }] = useMutation(gql`
    mutation add($id: ID!, $file: Upload!, $num: String!) {
        add: addBook(infoId: $id file: $file number: $num) {
            success
            code
        }
    }
  `, {
    variables: {
      id: infoId,
      file,
      num,
    },
    onCompleted({ add }) {
      setOpen(!add.success);
      if (add.success && onAdded) onAdded();
    },
    context: {
      fetchOptions: {
        useUpload: true,
        onProgress: (ev: ProgressEvent) => {
          // eslint-disable-next-line no-console
          console.log(`${(ev.loaded / ev.total) * 100}%`);
        },
        onAbortPossible: () => {},
      },
    },
  });

  const closeDialog = () => {
    if (!loading) {
      setOpen(false);
    }
  };

  return (
    <div className={classes.dialog}>
      {React.cloneElement(children, { open, setOpen })}
      <Dialog open={open} onClose={closeDialog}>
        <DialogTitle>Add book</DialogTitle>
        <DialogContent className={classes.dialogContent}>
          <DialogContentText>
            Add book to server.
          </DialogContentText>
          <TextField
            color="secondary"
            label="Number"
            value={num}
            // @ts-ignore
            onChange={(event) => setNum(event.target.value)}
            margin="normal"
          />
          <FileField file={file} onChange={setFile} />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} disabled={loading}>
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

export default AddBookDialog;
