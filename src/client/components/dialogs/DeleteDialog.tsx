import React from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@material-ui/core';

interface DeleteDialogProps {
  open: boolean;
  loading: boolean;

  book?: string;
  bookInfo?: string;
  page?: string;

  onClose?: () => void;
  onClickDelete?: () => void;
}

const DeleteDialog: React.FC<DeleteDialogProps> = (props: DeleteDialogProps) => {
  const {
    open,
    loading,
    book,
    bookInfo,
    page,
    onClose,
    onClickDelete,
  } = props;

  return (
    <Dialog open={open} onClose={() => !loading && onClose && onClose()}>
      <DialogTitle>
        {bookInfo && 'Delete book info'}
        {book && 'Delete book'}
        {page && 'Delete page'}
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          {`Do you want to delete \`${bookInfo || book || page}\`?`}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          disabled={loading}
        >
          close
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={onClickDelete}
          disabled={loading}
        >
          delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteDialog;
