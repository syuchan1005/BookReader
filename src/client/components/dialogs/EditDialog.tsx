import * as React from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Icon,
  IconButton,
  InputAdornment,
  TextField,
} from '@material-ui/core';

interface EditDialogProps {
  open: boolean;
  loading: boolean;

  info?: boolean;

  fieldValue: any;
  onChange?: (value: string) => void;

  onClickRestore?: () => void;
  onClickEdit?: () => void;
  onClose?: () => void;
}

const EditDialog: React.FC<EditDialogProps> = (props: EditDialogProps) => {
  const {
    open,
    loading,
    info,
    fieldValue,
    onChange,
    onClickRestore,
    onClickEdit,
    onClose,
  } = props;

  return (
    <Dialog open={open} onClose={() => !loading && onClose && onClose()}>
      <DialogTitle>{`Edit ${info ? 'book info' : 'book'}`}</DialogTitle>
      <DialogContent>
        <TextField
          color="secondary"
          autoFocus
          label={info ? 'Book info name' : 'Book number'}
          value={fieldValue}
          // @ts-ignore
          onChange={(event) => (onChange && onChange(event.target.value))}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={onClickRestore}>
                  <Icon>restore</Icon>
                </IconButton>
              </InputAdornment>
            ),
          }}
          disabled={loading}
        />
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
          onClick={onClickEdit}
          disabled={loading}
        >
          edit
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// @ts-ignore
EditDialog.whyDidYouRender = true;

export default EditDialog;
