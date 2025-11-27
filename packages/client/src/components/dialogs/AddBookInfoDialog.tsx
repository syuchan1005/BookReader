import { useMutation } from '@apollo/client/react';
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material';
import {
  AddBookInfoDocument,
  type HomeBookInfoFragment,
} from '@syuchan1005/book-reader-graphql';
import { useCallback, useEffect, useState } from 'react';
import GenresSelect from '../GenresSelect';

interface AddBookInfoDialogProps {
  open: boolean;
  name?: string;
  onAdded?: (homeBookInfo: HomeBookInfoFragment) => void;
  onClose?: () => void;
}

const AddBookInfoDialog = (props: AddBookInfoDialogProps) => {
  const { onAdded, onClose, open, name: argName } = props;
  const [name, setName] = useState('');
  const [selectGenres, setSelectGenres] = useState<string[]>([]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: argName
  useEffect(() => {
    if (open && argName) {
      setName(argName);
    }
  }, [open]);
  const closeDialog = useCallback(() => {
    if (onClose) onClose();
    if (name !== '') {
      setName('');
    }
    if (selectGenres.length !== 0) {
      setSelectGenres([]);
    }
  }, [name, onClose, selectGenres]);

  const [addBookInfo, { loading }] = useMutation(AddBookInfoDocument, {
    variables: {
      name,
      genres: selectGenres,
    },
    onCompleted(d) {
      if (!d) return;
      closeDialog();
      if (d.add.success && onAdded) onAdded(d.add.bookInfo);
    },
  });

  return (
    <Dialog open={open} onClose={() => !loading && closeDialog()}>
      <DialogTitle>Add book info</DialogTitle>
      {loading ? (
        <DialogContent
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <CircularProgress color="secondary" />
        </DialogContent>
      ) : (
        <DialogContent style={{ display: 'flex', flexDirection: 'column' }}>
          <GenresSelect
            showAdd
            value={selectGenres}
            onChange={setSelectGenres}
          />
          <TextField
            color="secondary"
            autoFocus
            label="Book info name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </DialogContent>
      )}
      <DialogActions>
        <div style={{ flex: 1 }} />

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
  );
};

export default AddBookInfoDialog;
