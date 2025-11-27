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
} from '@mui/material';
import { useCallback } from 'react';
import GenresSelect from '../GenresSelect';

interface EditDialogProps {
  open: boolean;
  loading: boolean;

  info?: boolean;

  fieldValue: unknown;
  genres?: string[];
  onChange?: (key: string, value: string | string[]) => void;

  onClickRestore?: () => void;
  onClickEdit?: () => void;
  onClose?: () => void;
}

const defaultGenres = [];

const EditDialog = (props: EditDialogProps) => {
  const {
    open,
    loading,
    info,
    fieldValue,
    onChange,
    genres,
    onClickRestore,
    onClickEdit,
    onClose,
  } = props;

  const handleChangeGenres = useCallback(
    (g) => {
      if (onChange) {
        onChange('genres', g);
      }
    },
    [onChange],
  );

  const handleTextChange = useCallback(
    (event) => {
      if (onChange) {
        onChange(info ? 'name' : 'number', event.target.value);
      }
    },
    [info, onChange],
  );

  return (
    <Dialog open={open} onClose={() => !loading && onClose && onClose()}>
      <DialogTitle>{`Edit ${info ? 'book info' : 'book'}`}</DialogTitle>
      <DialogContent style={{ display: 'flex', flexDirection: 'column' }}>
        {info && (
          <GenresSelect
            value={genres ?? defaultGenres}
            onChange={handleChangeGenres}
          />
        )}
        <TextField
          color="secondary"
          autoFocus
          label={info ? 'Book info name' : 'Book number'}
          value={fieldValue}
          onChange={handleTextChange}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={onClickRestore} size="large">
                  <Icon>restore</Icon>
                </IconButton>
              </InputAdornment>
            ),
          }}
          disabled={loading}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
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

export default EditDialog;
