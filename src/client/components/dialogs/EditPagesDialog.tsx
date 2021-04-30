import React from 'react';
import {
  Button,
  createStyles,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  FormLabel,
  makeStyles,
  Radio,
  RadioGroup,
  TextField,
} from '@material-ui/core';
import loadable from '@loadable/component';

import {
  DeletePagesMutation as DeletePagesMutationType,
  DeletePagesMutationVariables,
  EditPageMutation as EditPageMutationType,
  EditPageMutationVariables,
  PutPageMutation as PutPageMutationType,
  PutPageMutationVariables,
  SplitPagesMutation as SplitPagesMutationType,
  SplitPagesMutationVariables,
  SplitType,
} from '@syuchan1005/book-reader-graphql';
import EditPageMutation from '@client/graphqls/EditPagesDialog_edit.gql';
import SplitMutation from '@client/graphqls/EditPagesDialog_split.gql';
import DeleteMutation from '@client/graphqls/EditPagesDialog_delete.gql';
import PutPageMutation from '@client/graphqls/EditPagesDialog_put.gql';
import { useMutation } from '@apollo/react-hooks';
import DeleteDialog from './DeleteDialog';

const FilerobotImageEditor = loadable(() => import(/* webpackChunkName: 'ImageEditor' */ 'filerobot-image-editor'));

type IntRange = [number | [number, number]]

interface EditPagesDialogProps {
  open: boolean;
  onClose?: () => any,
  openPage: number;
  maxPage: number;
  bookId: string;
  theme: 'light' | 'dark';
  wb?: any;
  persistor?: any;
}

const parsePagesStr = (pages: string, maxPage: number): (number | [number, number])[] | string => {
  const pageList = pages
    .split(/,\s*/)
    .map((s) => {
      const m = s.match(/(\d+)(-(\d+))?$/);
      if (!m) return undefined;
      if (m[3]) {
        const arr = [Number(m[1]), Number(m[3])];
        return [Math.min(...arr) - 1, Math.max(...arr) - 1] as [number, number];
      }
      return Number(m[1]) - 1;
    });
  if (!pageList.every((s) => s !== undefined)) return 'Format error';
  if (!pageList.every((s) => {
    if (Array.isArray(s)) {
      return s[0] >= 0 && s[0] < maxPage && s[1] >= 0 && s[1] < maxPage;
    }
    return s >= 0 && s < maxPage;
  })) {
    return 'Range error';
  }
  return pageList;
};

const useStyles = makeStyles(() => createStyles({
  splitButtonWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splitButton: {
    display: 'grid',
    gridTemplateColumns: '150px',
    gridTemplateRows: '100px auto',
  },
}));

const EditPagesDialog: React.FC<EditPagesDialogProps> = (props: EditPagesDialogProps) => {
  const classes = useStyles(props);
  const {
    open,
    onClose: propsOnClose,
    openPage,
    maxPage,
    bookId,
    theme,
    wb,
    persistor,
  } = props;

  const [editType, setEditType] = React.useState('delete');
  const [editPages, setEditPages] = React.useState('');
  const [editPage, setEditPage] = React.useState(1);
  const [openCropDialog, setOpenCropDialog] = React.useState(false);
  const [openSplitDialog, setOpenSplitDialog] = React.useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = React.useState(false);
  const [openPutDialog, setOpenPutDialog] = React.useState(false);

  const openEditor = React.useMemo(
    () => openCropDialog || openPutDialog,
    [openCropDialog, openPutDialog],
  );

  const purgeCache = React.useCallback(() => {
    (persistor ? persistor.purge() : Promise.resolve())
      .then(() => {
        if (wb) {
          navigator.serviceWorker.addEventListener('message', () => {
            window.location.reload(true);
          });
          wb.messageSW({
            type: 'PURGE_CACHE',
          });
          setTimeout(() => {
            window.location.reload(true);
          }, 10 * 1000);
        } else {
          window.location.reload(true);
        }
      });
  }, [wb, persistor]);

  const [editPageMutation, {
    loading: editLoading,
  }] = useMutation<EditPageMutationType, EditPageMutationVariables>(EditPageMutation, {
    onCompleted() {
      purgeCache();
    },
  });

  const [splitPage, {
    loading: splitLoading,
  }] = useMutation<SplitPagesMutationType, SplitPagesMutationVariables>(SplitMutation, {
    onCompleted() {
      purgeCache();
    },
  });

  const [deletePage, {
    loading: deleteLoading,
  }] = useMutation<DeletePagesMutationType, DeletePagesMutationVariables>(DeleteMutation, {
    onCompleted() {
      purgeCache();
    },
  });

  const [putPageMutation, {
    loading: putLoading,
  }] = useMutation<PutPageMutationType, PutPageMutationVariables>(PutPageMutation, {
    // @ts-ignore
    variables: {
      id: bookId,
    },
    onCompleted() {
      purgeCache();
    },
  });

  React.useEffect(() => {
    setEditPage(openPage + 1);
    setEditPages(`${openPage + 1}`);
  }, [openPage]);

  const onClose = React.useCallback(() => {
    if (editLoading || putLoading) return;
    propsOnClose();
  }, [propsOnClose, editLoading]);

  const editImgSrc = React.useMemo(() => {
    const pad = maxPage.toString(10).length;
    return `/book/${bookId}/${(editPage - 1).toString(10).padStart(pad, '0')}.jpg`;
  }, [maxPage, editPage, bookId]);

  const imageEditorConfig = React.useMemo(() => ({
    tools: ['adjust', 'rotate', 'crop', 'resize'],
    translations: { en: { 'toolbar.download': 'Upload' } },
    colorScheme: theme,
  }), [theme]);

  const onClickEdit = React.useCallback(() => {
    if (editType === 'crop') setOpenCropDialog(true);
    else if (editType === 'delete') setOpenDeleteDialog(true);
    else if (editType === 'split') setOpenSplitDialog(true);
    else if (editType === 'put') setOpenPutDialog(true);
  }, [editType]);

  const inputValidate = React.useMemo(() => {
    if (editType === 'crop') {
      return (editPage > 0 && editPage <= maxPage) ? false : 'Range error';
    }
    const p = parsePagesStr(editPages, maxPage);
    if (typeof p === 'string') return p;
    return false;
  }, [editType, editPage, editPages, maxPage]);

  return (
    <Dialog open={open} onClose={onClose}>
      {(openEditor) && (
        <FilerobotImageEditor
          show={openEditor}
          src={editImgSrc}
          config={imageEditorConfig}
          onClose={() => { setOpenCropDialog(false); setOpenPutDialog(false); }}
          onBeforeComplete={() => false}
          onComplete={({ canvas }) => {
            canvas.toBlob((image) => {
              if (image) {
                if (openCropDialog) {
                  // noinspection JSIgnoredPromiseFromCall
                  editPageMutation({
                    variables: {
                      id: bookId,
                      image,
                      page: (editPage - 1),
                    },
                  });
                } else {
                  // noinspection JSIgnoredPromiseFromCall
                  putPageMutation({
                    variables: {
                      id: bookId,
                      image,
                      beforePage: (editPage - 2),
                    },
                  });
                }
              }
            }, 'image/jpeg', 0.9);
          }}
        />
      )}

      <Dialog
        open={openSplitDialog}
        onClose={() => !splitLoading && setOpenSplitDialog(false)}
      >
        <DialogTitle>Split page</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Do you want to split page?
          </DialogContentText>

          <div className={classes.splitButtonWrapper}>
            <Button
              disabled={splitLoading}
              classes={{ label: classes.splitButton }}
              onClick={() => {
                const pages = parsePagesStr(editPages, maxPage);
                if (typeof pages === 'string') return;
                splitPage({ variables: { id: bookId, pages, type: SplitType.Vertical } });
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 100">
                <polygon
                  points="10,10 140,10 140,80 10,80"
                  style={{ fill: 'rgba(0, 0, 0, 0)', stroke: `rgba(0, 0, 0, ${splitLoading ? 0.26 : 1})`, strokeWidth: 3 }}
                />
                <line x1="75" y1="0" x2="75" y2="100" strokeWidth="5" style={{ stroke: `rgba(255, 0, 0, ${splitLoading ? 0.26 : 1})` }} />
              </svg>
              Vertical
            </Button>

            <Button
              disabled={splitLoading}
              classes={{ label: classes.splitButton }}
              onClick={() => {
                const pages = parsePagesStr(editPages, maxPage);
                if (typeof pages === 'string') return;
                splitPage({ variables: { id: bookId, pages, type: SplitType.Horizontal } });
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 100">
                <polygon
                  points="10,10 140,10 140,80 10,80"
                  style={{ fill: 'rgba(0, 0, 0, 0)', stroke: `rgba(0, 0, 0, ${splitLoading ? 0.26 : 1})`, strokeWidth: 3 }}
                />
                <line x1="0" y1="45" x2="150" y2="45" strokeWidth="5" style={{ stroke: `rgba(0, 0, 255, ${splitLoading ? 0.26 : 1})` }} />
              </svg>
              Horizontal
            </Button>
          </div>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenSplitDialog(false)} disabled={splitLoading}>
            close
          </Button>
        </DialogActions>
      </Dialog>

      <DeleteDialog
        open={openDeleteDialog}
        loading={deleteLoading}
        onClickDelete={() => {
          const pages = parsePagesStr(editPages, maxPage);
          if (typeof pages === 'string') return;
          deletePage({ variables: { id: bookId, pages } });
        }}
        onClose={() => setOpenDeleteDialog(false)}
        page={editPages}
      />

      <DialogContent>
        <FormLabel>Edit Type</FormLabel>
        <RadioGroup value={editType} onChange={(e) => setEditType(e.target.value)}>
          <FormControlLabel label="CropAndResize" value="crop" control={<Radio />} />
          <FormControlLabel label="Split" value="split" control={<Radio />} />
          <FormControlLabel label="Delete" value="delete" control={<Radio />} />
          <FormControlLabel label="Edit and Put Before Page" value="put" control={<Radio />} />
        </RadioGroup>

        {(editType === 'crop' || editType === 'put') ? (
          <TextField
            error={!!inputValidate}
            helperText={inputValidate}
            type="number"
            label={`page(max: ${maxPage})`}
            color="secondary"
            value={editPage}
            onChange={(e) => setEditPage(Number(e.target.value))}
          />
        ) : (
          <TextField
            error={!!inputValidate}
            helperText={inputValidate}
            label={`pages(max: ${maxPage})`}
            placeholder="ex. 1, 2, 3-5"
            color="secondary"
            value={editPages}
            onChange={(e) => setEditPages(e.target.value)}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          Close
        </Button>
        <Button color="secondary" variant="outlined" onClick={onClickEdit}>
          {editType}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditPagesDialog;
