import * as React from 'react';
import {
  Button,
  Checkbox,
  createStyles,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Icon,
  IconButton,
  InputAdornment,
  makeStyles,
  TextField, Theme,
} from '@material-ui/core';

interface EditDialogProps {
  open: boolean;
  loading: boolean;

  info?: boolean;

  fieldValue: any;
  finished?: boolean;
  invisible?: boolean;
  onChange?: (key: string, event: React.ChangeEvent<HTMLInputElement>) => void;

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

const EditDialog: React.FC<EditDialogProps> = (props: EditDialogProps) => {
  const {
    open,
    loading,
    info,
    fieldValue,
    onChange,
    finished,
    invisible,
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
          <>
            <FormControlLabel
              className={classes.checkbox}
              label="Finished"
              control={(
                <Checkbox
                  checked={finished}
                  onChange={(e) => (onChange && onChange('finished', e))}
                />
              )}
            />
            <FormControlLabel
              className={classes.checkbox}
              label="Invisible"
              control={(
                <Checkbox
                  checked={invisible}
                  onChange={(e) => (onChange && onChange('invisible', e))}
                />
              )}
            />
          </>
        )}
        <TextField
          color="secondary"
          autoFocus
          label={info ? 'Book info name' : 'Book number'}
          value={fieldValue}
          // @ts-ignore
          onChange={(event) => (onChange && onChange(info ? 'name' : 'number', event))}
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
