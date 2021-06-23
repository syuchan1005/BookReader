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
  Theme,
} from '@material-ui/core';
import { useApolloClient } from '@apollo/react-hooks';

import {
  useCropPagesMutation, useDeletePagesMutation, useEditPageMutation,
  usePutPageMutation, useSplitPagesMutation,
} from '@syuchan1005/book-reader-graphql/generated/GQLQueries';
import { SplitType } from '@syuchan1005/book-reader-graphql';
import { workbox } from '@client/registerServiceWorker';
import DeleteDialog from './DeleteDialog';
import CalcImagePaddingDialog from './CalcImagePaddingDialog';
import CropImageDialog from './CropImageDialog';

interface ObsolateEditPagesDialogProps {
  open: boolean;
  onClose?: () => any,
  openPage: number;
  maxPage: number;
  bookId: string;
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

const useStyles = makeStyles((theme: Theme) => createStyles({
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
  inputs: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
  },
}));

const ObsolateEditPagesDialog = (props: ObsolateEditPagesDialogProps) => {
  const classes = useStyles(props);
  const {
    open,
    onClose: propsOnClose,
    openPage,
    maxPage,
    bookId,
  } = props;
  const apolloClient = useApolloClient();

  const [editType, setEditType] = React.useState('delete');
  const [editPages, setEditPages] = React.useState('');
  const [editPage, setEditPage] = React.useState(1);
  const [openCropDialog, setOpenCropDialog] = React.useState(false);
  const [openCalcPaddingDialog, setOpenCalcPaddingDialog] = React.useState(false);
  const [openRemovePaddingDialog, setOpenRemovePaddingDialog] = React.useState(false);
  const [paddingSize, setPaddingSize] = React.useState([0, 0]);
  const [openSplitDialog, setOpenSplitDialog] = React.useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = React.useState(false);
  const [openPutDialog, setOpenPutDialog] = React.useState(false);

  const openEditor = React.useMemo(
    () => openCropDialog || openPutDialog,
    [openCropDialog, openPutDialog],
  );

  const purgeCache = React.useCallback(() => {
    apolloClient.resetStore()
      .then(() => (workbox ? workbox.messageSW({ type: 'PURGE_CACHE' }) : Promise.resolve()))
      .finally(() => window.location.reload());
  }, [apolloClient]);

  const [editPageMutation, { loading: editLoading }] = useEditPageMutation({
    onCompleted() {
      purgeCache();
    },
  });

  const [splitPage, { loading: splitLoading }] = useSplitPagesMutation({
    onCompleted() {
      purgeCache();
    },
  });

  const [deletePage, { loading: deleteLoading }] = useDeletePagesMutation({
    onCompleted() {
      purgeCache();
    },
  });

  const [putPageMutation, { loading: putLoading }] = usePutPageMutation({
    onCompleted() {
      purgeCache();
    },
  });

  const [cropPagesMutation, { loading: cropLoading }] = useCropPagesMutation({
    onCompleted() {
      purgeCache();
    },
  });

  React.useEffect(() => {
    setEditPage(openPage + 1);
    setEditPages(`${openPage + 1}`);
  }, [openPage]);

  const onClose = React.useCallback(() => {
    if (editLoading || putLoading || cropLoading) return;
    propsOnClose();
  }, [propsOnClose, editLoading]);

  const editImgSrc = React.useMemo(() => {
    const pad = maxPage.toString(10).length;
    return `/book/${bookId}/${(editPage - 1).toString(10).padStart(pad, '0')}.jpg`;
  }, [maxPage, editPage, bookId]);

  const onClickEdit = React.useCallback(() => {
    if (editType === 'crop') setOpenCropDialog(true);
    else if (editType === 'removePadding') setOpenRemovePaddingDialog(true);
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
      <CropImageDialog
        open={openEditor}
        src={editImgSrc}
        onClose={() => { setOpenCropDialog(false); setOpenPutDialog(false); }}
        onCropped={(image) => {
          if (openCropDialog) {
            // noinspection JSIgnoredPromiseFromCall
            editPageMutation({
              variables: {
                id: bookId,
                // @ts-ignore
                image,
                page: (editPage - 1),
              },
            });
          } else {
            // noinspection JSIgnoredPromiseFromCall
            putPageMutation({
              variables: {
                id: bookId,
                // @ts-ignore
                image,
                beforePage: (editPage - 2),
              },
            });
          }
        }}
      />

      <Dialog
        open={openRemovePaddingDialog}
        onClose={() => setOpenRemovePaddingDialog(false)}
      >
        <DialogTitle>Remove page paddings</DialogTitle>
        <DialogContent>
          <div>{`Crop: ${paddingSize[0]}x${paddingSize[1]}`}</div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRemovePaddingDialog(false)} disabled={cropLoading}>
            close
          </Button>
          <Button
            variant="contained"
            color="secondary"
            disabled={cropLoading}
            onClick={() => {
              const pages = parsePagesStr(editPages, maxPage);
              if (typeof pages === 'string') return;
              cropPagesMutation({
                variables: {
                  id: bookId,
                  pages,
                  left: Math.min(paddingSize[0]),
                  width: Math.abs(paddingSize[0] - paddingSize[1]),
                },
              });
            }}
          >
            Crop
          </Button>
        </DialogActions>
      </Dialog>

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
          <FormControlLabel label="Crop" value="crop" control={<Radio />} />
          <FormControlLabel label="RemovePadding" value="removePadding" control={<Radio />} />
          <FormControlLabel label="Split" value="split" control={<Radio />} />
          <FormControlLabel label="Delete" value="delete" control={<Radio />} />
          <FormControlLabel label="Crop and Put Before Page" value="put" control={<Radio />} />
        </RadioGroup>

        <div className={classes.inputs}>
          {(editType === 'removePadding') && (
            <>
              <TextField color="secondary" label="Left" type="number" value={paddingSize[0]} onChange={(e) => setPaddingSize([Number(e.target.value), paddingSize[1]])} />
              <TextField color="secondary" label="Right" type="number" value={paddingSize[1]} onChange={(e) => setPaddingSize([paddingSize[0], Number(e.target.value)])} />
              <Button onClick={() => setOpenCalcPaddingDialog(true)}>Detect</Button>
              <CalcImagePaddingDialog
                open={openCalcPaddingDialog}
                bookId={bookId}
                left={paddingSize[0]}
                right={paddingSize[1]}
                maxPage={maxPage}
                onClose={() => setOpenCalcPaddingDialog(false)}
                onSizeChange={(l, r) => setPaddingSize([l, r])}
              />
            </>
          )}

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
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          Close
        </Button>
        <Button color="secondary" variant="outlined" onClick={onClickEdit}>
          {editType.replace(/([A-Z])/g, ' $1')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default React.memo(ObsolateEditPagesDialog);
