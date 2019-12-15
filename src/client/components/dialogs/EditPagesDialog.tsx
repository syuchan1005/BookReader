import * as React from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  Button,
  TextField,
  RadioGroup,
  Radio,
  FormControlLabel, FormLabel, DialogTitle, DialogContentText, makeStyles, createStyles,
} from '@material-ui/core';
import loadable from '@loadable/component';

import * as EditPageMutation from '@client/graphqls/EditPagesDialog_edit.gql';
import * as SplitMutation from '@client/graphqls/EditPagesDialog_split.gql';
import * as DeleteMutation from '@client/graphqls/EditPagesDialog_delete.gql';
import { useMutation } from '@apollo/react-hooks';
import { Result } from '@common/GraphqlTypes';
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
}

const parsePagesStr = (pages, maxPage): string | IntRange => {
  const pageList = pages
    .split(/,\s*/)
    .map((s) => {
      const m = s.match(/(\d+)(-(\d+))?$/);
      if (!m) return undefined;
      if (m[3]) {
        const arr = [Number(m[1]), Number(m[3])];
        return [Math.min(...arr) - 1, Math.max(...arr) - 1];
      }
      return Number(m[1]) - 1;
    });
  if (!pageList.every((s) => s !== undefined)) return 'Format error';
  if (!pageList.every((s) => {
    if (Array.isArray(s)) {
      return s[0] >= 0 && s[0] < maxPage && s[1] >= 0 && s[1] < maxPage;
    }
    return s >= 0 && s < maxPage;
  })) return 'Range error';
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
  } = props;

  const [editType, setEditType] = React.useState('delete');
  const [editPages, setEditPages] = React.useState('');
  const [cropPage, setCropPage] = React.useState(1);
  const [openCropDialog, setOpenCropDialog] = React.useState(false);
  const [openSplitDialog, setOpenSplitDialog] = React.useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = React.useState(false);

  const [editPageMutation, {
    loading: editLoading,
  }] = useMutation<{ edit: Result }>(EditPageMutation, {
    variables: {
      id: bookId,
    },
    onCompleted() {
      window.location.reload();
    },
  });

  const [splitPage, {
    loading: splitLoading,
  }] = useMutation<{ split: Result }>(SplitMutation, {
    variables: {
      id: bookId,
    },
    onCompleted() {
      window.location.reload();
    },
  });

  const [deletePage, {
    loading: deleteLoading,
  }] = useMutation<{ del: Result }>(DeleteMutation, {
    variables: {
      id: bookId,
    },
    onCompleted() {
      window.location.reload();
    },
  });

  React.useEffect(() => {
    setCropPage(openPage + 1);
    setEditPages(`${openPage + 1}`);
  }, [openPage]);

  const onClose = React.useCallback(() => {
    if (editLoading) return;
    propsOnClose();
  }, [propsOnClose, editLoading]);

  const cropImgSrc = React.useMemo(() => {
    const pad = maxPage.toString(10).length;
    return `/book/${bookId}/${(cropPage - 1).toString(10).padStart(pad, '0')}.jpg`;
  }, [maxPage, cropPage, bookId]);

  const imageEditorConfig = React.useMemo(() => ({
    tools: ['adjust', 'rotate', 'crop', 'resize'],
    translations: { en: { 'toolbar.download': 'Upload' } },
    colorScheme: theme,
  }), [theme]);

  const onClickEdit = React.useCallback(() => {
    if (editType === 'crop') setOpenCropDialog(true);
    else if (editType === 'delete') setOpenDeleteDialog(true);
    else if (editType === 'split') setOpenSplitDialog(true);
  }, [editType]);

  const inputValidate = React.useMemo(() => {
    if (editType === 'crop') {
      return (cropPage > 0 && cropPage <= maxPage) ? false : 'Range error';
    }
    const p = parsePagesStr(editPages, maxPage);
    if (typeof p === 'string') return p;
    return false;
  }, [editType, cropPage, editPages, maxPage]);

  return (
    <Dialog open={open} onClose={onClose}>
      {(openCropDialog) && (
        <FilerobotImageEditor
          show={openCropDialog}
          src={cropImgSrc}
          config={imageEditorConfig}
          onClose={() => setOpenCropDialog(false)}
          onBeforeComplete={() => false}
          onComplete={({ canvas }) => {
            canvas.toBlob((image) => {
              if (image) {
                editPageMutation({
                  variables: {
                    image,
                    page: (cropPage - 1),
                  },
                });
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
              onClick={() => splitPage({ variables: { pages: parsePagesStr(editPages, maxPage), type: 'VERTICAL' } })}
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
              onClick={() => splitPage({ variables: { pages: parsePagesStr(editPages, maxPage), type: 'HORIZONTAL' } })}
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
        onClickDelete={() => deletePage({
          variables: {
            pages: parsePagesStr(editPages, maxPage),
          },
        })}
        onClose={() => setOpenDeleteDialog(false)}
        page={editPages}
      />

      <DialogContent>
        <FormLabel>Edit Type</FormLabel>
        <RadioGroup value={editType} onChange={(e) => setEditType(e.target.value)}>
          <FormControlLabel label="CropAndResize" value="crop" control={<Radio />} />
          <FormControlLabel label="Split" value="split" control={<Radio />} />
          <FormControlLabel label="Delete" value="delete" control={<Radio />} />
        </RadioGroup>

        {(editType === 'crop') ? (
          <TextField
            error={!!inputValidate}
            helperText={inputValidate}
            type="number"
            label={`page(max: ${maxPage})`}
            color="secondary"
            value={cropPage}
            onChange={(e) => setCropPage(Number(e.target.value))}
          />
        ) : (
          <TextField
            error={!!inputValidate}
            helperText={inputValidate}
            label={`pages(max: ${maxPage})`}
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
