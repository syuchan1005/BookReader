import React from 'react';
import {
  Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField,
} from '@mui/material';
import { Cropper } from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import { createBookPageUrl } from '@client/components/BookPageImage';

interface CropImageDialogProps {
  open: boolean;
  bookId: string;
  maxPage: number;
  onClose?: (blob?: Blob) => void;
}

const CropImageDialog = (props: CropImageDialogProps) => {
  const {
    open,
    bookId,
    maxPage,
    onClose,
  } = props;
  const [pageIndex, setPageIndex] = React.useState(1);
  const url = React.useMemo(
    () => createBookPageUrl(bookId, pageIndex - 1, maxPage),
    [bookId, pageIndex, maxPage],
  );
  const cropperRef = React.useRef<HTMLImageElement>(null);

  const onFinishClicked = React.useCallback(() => {
    // @ts-ignore
    const cropper = cropperRef?.current?.cropper;
    if (!cropper) return;
    const canvasElem: HTMLCanvasElement = cropper.getCroppedCanvas();
    canvasElem.toBlob(onClose, 'image/jpeg');
  }, [onClose]);

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Crop image</DialogTitle>
      <DialogContent>
        <TextField
          margin="normal"
          color="secondary"
          label={`Detect page(max: ${maxPage})`}
          type="number"
          value={pageIndex}
          onChange={(e) => setPageIndex(Number(e.target.value))}
        />
        <Cropper
          src={url}
          dragMode="none"
          viewMode={1}
          guides={false}
          movable={false}
          scalable={false}
          zoomable={false}
          ref={cropperRef}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose(undefined)}>Close</Button>
        <Button variant="outlined" color="secondary" onClick={onFinishClicked}>Finish</Button>
      </DialogActions>
    </Dialog>
  );
};

export default React.memo(CropImageDialog);
