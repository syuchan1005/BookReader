import * as React from 'react';
import {
  Button,
  CircularProgress,
  createStyles,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Icon,
  IconButton,
  LinearProgress,
  makeStyles,
  Theme,
} from '@material-ui/core';
import { useMutation, useSubscription } from '@apollo/react-hooks';

import * as AddMutation from '@client/graphqls/AddCompressBookBatchDialog_addCompressBookBatch.gql';
import * as AddSubscription from '@client/graphqls/AddCompressBookBatchDialog_addCompressBookBatch_Subscription.gql';

import DropZone from '../DropZone';
import FileField from '../FileField';

interface AddCompressBookBatchDialogProps {
  open: boolean;
  infoId: string;
  onClose?: () => void;
  onAdded?: () => void;
}

const useStyles = makeStyles((theme: Theme) => createStyles({
  fileItem: {
    width: '100%',
    display: 'grid',
    gridTemplateColumns: '1fr 48px',
    marginBottom: theme.spacing(0.5),
  },
  addBookSubscription: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  addBookProgress: {
    display: 'grid',
    alignItems: 'center',
    gridTemplateColumns: '1fr 64px',
    columnGap: theme.spacing(1),
    width: 300,
  },
  progressMessage: {
    marginTop: theme.spacing(2),
  },
}));

const AddCompressBookBatchDialog: React.FC<AddCompressBookBatchDialogProps> = (
  props: AddCompressBookBatchDialogProps,
) => {
  const {
    open,
    infoId,
    onClose,
    onAdded,
  } = props;
  const classes = useStyles(props);

  const [batchFile, setBatchFile] = React.useState(undefined);
  const [batchId, setBatchId] = React.useState(undefined);
  const [batchLoading, setBatchLoading] = React.useState(false);
  const [bookProgress, setAddBookProgress] = React.useState<ProgressEvent>(undefined);
  const [bookAbort, setAddBookAbort] = React.useState<() => {}>(undefined);

  const [addCompressBatch, { loading: mLoading }] = useMutation<{ add: string }>(AddMutation, {
    variables: {
      id: infoId,
      file: batchFile,
    },
    onCompleted({ add: id }) {
      setAddBookProgress(undefined);
      setAddBookAbort(undefined);

      setBatchId(id);
      setBatchLoading(true);
    },
    context: {
      fetchOptions: {
        useUpload: true,
        onProgress: (ev: ProgressEvent) => {
          setAddBookProgress(ev);
        },
        onAbortPossible: (abortFunc) => {
          const abort = () => {
            abortFunc();
            setAddBookProgress(undefined);
            setAddBookAbort(undefined);
          };
          setAddBookAbort(() => abort);
        },
      },
    },
  });

  const { data: sData } = useSubscription<{
    add: { finished: boolean, message: string, error: string }
  }>(AddSubscription, {
    skip: !batchId,
    variables: {
      id: batchId,
    },
    onSubscriptionData({ subscriptionData: { data } }) {
      if (data && data.add.finished) {
        setBatchLoading(false);
        setBatchFile(undefined);
        if (onAdded && !data.add.error) onAdded();
        if (onClose) onClose();
      }
    },
    onSubscriptionComplete() {
      setBatchLoading(false);
    },
  });

  const loading = React.useMemo(() => batchLoading || mLoading, [batchLoading, mLoading]);

  const closeDialog = React.useCallback(() => {
    if (loading) return;
    setBatchFile(undefined);
    if (onClose) onClose();
  }, [onClose]);

  return (
    <Dialog open={open} onClose={closeDialog}>
      <DialogTitle>Add Compress book (batch)</DialogTitle>

      {(!loading) ? (
        <DialogContent>
          {(batchFile) ? (
            <div className={classes.fileItem}>
              <FileField
                file={batchFile}
                onChange={(f) => setBatchFile(f)}
              />
              <IconButton onClick={() => setBatchFile(undefined)}>
                <Icon>clear</Icon>
              </IconButton>
            </div>
          ) : (
            <DropZone onChange={(files) => setBatchFile(files[0])} />
          )}
        </DialogContent>
      ) : (
        <DialogContent
          className={!(bookProgress || bookAbort)
            ? classes.addBookSubscription
            : classes.addBookProgress}
        >
          {(bookProgress || bookAbort) ? (
            <>
              {bookProgress && (
                <LinearProgress
                  variant="determinate"
                  value={(bookProgress.loaded / bookProgress.total) * 100}
                />
              )}
              {bookAbort && (
                <Button onClick={bookAbort}>Abort</Button>
              )}
            </>
          ) : (
            <>
              <CircularProgress color="secondary" />
              {(sData) && (
                <div className={classes.progressMessage}>{sData.add.message}</div>
              )}
            </>
          )}
        </DialogContent>
      )}

      <DialogActions>
        <Button onClick={closeDialog} disabled={loading}>
          close
        </Button>
        <Button
          disabled={loading}
          variant="contained"
          color="secondary"
          onClick={() => addCompressBatch()}
        >
          add
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddCompressBookBatchDialog;
