import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { useState } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  enabled: boolean;
  title?: string;
  content?: string;

  closeText?: string;
  onClose?: () => void;
  confirmText?: string;
  onClickConfirm?: () => void;
}

export const useConfirmDialog = (
  props: Pick<
    ConfirmDialogProps,
    'title' | 'content' | 'closeText' | 'confirmText' | 'onClickConfirm'
  >,
) => {
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(true);

  const dialogElement = (
    <ConfirmDialog
      {...props}
      open={open}
      enabled={enabled}
      onClose={() => setOpen(false)}
      onClickConfirm={() => {
        setEnabled(false);
        if (props.onClickConfirm) props.onClickConfirm();
      }}
    />
  );

  return {
    open: () => {
      setEnabled(true);
      setOpen(true);
    },
    disable: () => setEnabled(false),
    close: () => setOpen(false),
    dialogElement,
  };
};

export const ConfirmDialog = (props: ConfirmDialogProps) => {
  const {
    open,
    enabled,
    title,
    content,
    closeText = 'close',
    onClose,
    confirmText = 'confirm',
    onClickConfirm,
  } = props;

  return (
    <Dialog open={open} onClose={() => enabled && onClose && onClose()}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{content}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={!enabled}>
          {closeText}
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={onClickConfirm}
          disabled={!enabled}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
