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
  onChange?: (value: string) => void;

  fieldCheck?: boolean;
  onChangeCheck?: (value: boolean) => void;

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
    fieldCheck,
    onChangeCheck,
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
          <FormControlLabel
            className={classes.checkbox}
            label="Finished"
            control={(
              <Checkbox
                checked={fieldCheck}
                onChange={(e) => (onChangeCheck && onChangeCheck(e.target.checked))}
              />
            )}
          />
        )}
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
