import React from 'react';
import {
  Button, Dialog, DialogActions, DialogContent, DialogTitle,
} from '@material-ui/core';
import { Cropper } from 'react-cropper';
import 'cropperjs/dist/cropper.css';

interface CropImageDialogProps {
    open: boolean;
    src: string;
    onClose?: () => void;
    onCropped?: (blob: Blob) => void;
}

const CropImageDialog: React.VFC<CropImageDialogProps> = (props: CropImageDialogProps) => {
  const {
    open,
    src,
    onCropped,
    onClose,
  } = props;
  const cropperRef = React.useRef<HTMLImageElement>(null);

  const onFinishClicked = React.useCallback(() => {
    // @ts-ignore
    const cropper = cropperRef?.current?.cropper;
    if (!cropper) return;
    const canvasElem: HTMLCanvasElement = cropper.getCroppedCanvas();
    canvasElem.toBlob(onCropped, 'image/jpeg');
  }, [onCropped]);

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Crop image</DialogTitle>
      <DialogContent>
        <Cropper
          src={src}
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
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" color="secondary" onClick={onFinishClicked}>Finish</Button>
      </DialogActions>
    </Dialog>
  );
};

export default React.memo(CropImageDialog);
