import React from 'react';
import {
  Button,
  createStyles,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Icon,
  IconButton,
  InputAdornment,
  makeStyles,
  TextField, Theme,
} from '@material-ui/core';
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

  return (
    <Dialog open={open} onClose={() => !loading && onClose && onClose()}>
      <DialogTitle>{`Edit ${info ? 'book info' : 'book'}`}</DialogTitle>
      <DialogContent className={classes.content}>
        {(info) && (
          <GenresSelect
            value={genres ?? []}
            onChange={(g) => (onChange && onChange('genres', g))}
          />
        )}
        <TextField
          color="secondary"
          autoFocus
          label={info ? 'Book info name' : 'Book number'}
          value={fieldValue}
          // @ts-ignore
          onChange={(event) => (onChange && onChange(info ? 'name' : 'number', event.target.value))}
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

export default React.memo(EditDialog);
