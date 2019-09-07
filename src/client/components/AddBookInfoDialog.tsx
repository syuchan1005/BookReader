import * as React from 'react';
import {
  Button, createStyles,
  Dialog, DialogActions,
  DialogContent, DialogContentText,
  DialogTitle, makeStyles, TextField,
} from '@material-ui/core';
import gql from 'graphql-tag';
import { useMutation } from '@apollo/react-hooks';

interface AddBookInfoDialogProps {
  onAdded?: Function;
  children?: React.ReactElement;
}

export interface ChildProps {
  open: boolean;
  setOpen: Function;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const useStyles = makeStyles(() => createStyles({
  dialog: {
    width: '100%',
    height: '100%',
  },
}));

const AddBookInfoDialog: React.FC<AddBookInfoDialogProps> = (props: AddBookInfoDialogProps) => {
  const classes = useStyles();
  const { onAdded, children } = props;
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState('');
  const [addBookInfo, { loading }] = useMutation(gql`
    mutation add($name: String!) {
        add: addBookInfo(name: $name) {
            success
            code
        }
    }
  `, {
    onCompleted({ add }) {
      setOpen(!add.success);
      if (add.success && onAdded) onAdded();
    },
    variables: {
      name,
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
        <DialogTitle>Add book info</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Add book info to server.
          </DialogContentText>
          <TextField
            color="secondary"
            autoFocus
            label="Book info name"
            value={name}
            // @ts-ignore
            onChange={(event) => setName(event.target.value)}
          />
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

export default AddBookInfoDialog;
