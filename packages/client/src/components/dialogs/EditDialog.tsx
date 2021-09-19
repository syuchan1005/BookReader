import React from 'react';
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
  Theme,
} from '@mui/material';
import createStyles from '@mui/styles/createStyles';
import makeStyles from '@mui/styles/makeStyles';
import GenresSelect from '../GenresSelect';

interface EditDialogProps {
  open: boolean;
  loading: boolean;

  info?: boolean;

  fieldValue: any;
  genres?: string[];
  onChange?: (key: string, value: string | string[]) => void;

  onClickRestore?: () => void;
  onClickEdit?: () => void;
  onClose?: () => void;
}

const useStyles = makeStyles((theme: Theme) => createStyles({
  content: {
    display: 'flex',
    flexDirection: 'column',
  },
  checkbox: {
    marginBottom: theme.spacing(1),
  },
}));

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
  const classes = useStyles(props);

  const handleChangeGenres = React.useCallback((g) => {
    if (onChange) {
      onChange('genres', g);
    }
  }, [onChange]);

  const handleTextChange = React.useCallback((event) => {
    if (onChange) {
      onChange(info ? 'name' : 'number', event.target.value);
    }
  }, [info, onChange]);

  return (
    <Dialog open={open} onClose={() => !loading && onClose && onClose()}>
      <DialogTitle>{`Edit ${info ? 'book info' : 'book'}`}</DialogTitle>
      <DialogContent className={classes.content}>
        {(info) && (
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

export default React.memo(EditDialog);
