import React from 'react';
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  TextField,
  Typography,
} from '@mui/material';
import { createBookPageUrl } from '../BookPageImage';

interface CalcImagePaddingDialogProps {
  open: boolean;
  bookId: string;
  left: number;
  right: number;
  maxPage: number;
  onSizeChange?: (left: number, right: number) => void;
  onClose?: () => void;
}

export const urlToImageData = (
  url: string,
): Promise<ImageData> => new Promise((resolve, reject) => {
  if (url == null) {
    reject();
    return;
  }
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  const image = new Image();
  image.addEventListener('load', () => {
    canvas.width = image.width;
    canvas.height = image.height;
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    resolve(context.getImageData(0, 0, canvas.width, canvas.height));
  }, false);
  image.src = url;
});

export const calcPadding = (
  imageData: ImageData,
  threshold: number,
  verticalOffset: number,
  horizontalOffset: number,
  useCompareWithWhite: boolean,
): { left: number, right: number } => {
  const isWhite = (width: number, height: number) => {
    const pixelIndex = width + height * imageData.width;
    const dataIndex = pixelIndex * 4;
    /* isWhite (R G B (A)) */
    return (255 - imageData.data[dataIndex]) <= threshold
      && (255 - imageData.data[dataIndex + 1]) <= threshold
      && (255 - imageData.data[dataIndex + 2]) <= threshold;
  };

  const isSameColor = (w1: number, y1: number, w2: number, y2: number) => {
    const pixelIndex1 = (w1 + y1 * imageData.width) * 4;
    const pixelIndex2 = (w2 + y2 * imageData.width) * 4;
    return Math.abs(imageData.data[pixelIndex1] - imageData.data[pixelIndex2]) <= threshold
      && Math.abs(imageData.data[pixelIndex1] - imageData.data[pixelIndex2 + 1]) <= threshold
      && Math.abs(imageData.data[pixelIndex1] - imageData.data[pixelIndex2 + 2]) <= threshold;
  };

  /* eslint-disable no-labels,no-restricted-syntax */
  let left = 0;
  const compareLeft = useCompareWithWhite
    ? isWhite
    : (w: number, h: number) => isSameColor(horizontalOffset - 1, verticalOffset - 1, w, h);
  leftWidth: for (let w = horizontalOffset; w < (imageData.width - horizontalOffset); w += 1) {
    for (let h = verticalOffset; h < (imageData.height - verticalOffset); h += 1) {
      if (!compareLeft(w, h)) {
        left = w;
        break leftWidth;
      }
    }
  }
  let right = 0;
  const compareRight = useCompareWithWhite
    ? isWhite
    : (w: number, h: number) => isSameColor(
      imageData.width - horizontalOffset - 1,
      verticalOffset - 1,
      w,
      h,
    );
  rightWidth: for (let w = imageData.width - 1 - horizontalOffset; w >= horizontalOffset; w -= 1) {
    for (let h = verticalOffset; h < (imageData.height - verticalOffset); h += 1) {
      if (!compareRight(w, h)) {
        right = w;
        break rightWidth;
      }
    }
  }
  /* eslint-enable no-labels,no-restricted-syntax */

  return {
    left,
    right,
  };
};

const CalcImagePaddingDialog = (props: CalcImagePaddingDialogProps) => {
  const {
    open,
    bookId,
    maxPage,
    onClose,
    left,
    right,
    onSizeChange,
  } = props;
  const [pageIndex, setPageIndex] = React.useState(1);
  const [threshold, setThreshold] = React.useState(50);
  const [verticalOffset, setVerticalOffset] = React.useState(200);
  const [horizontalOffset, setHorizontalOffset] = React.useState(10);
  const [useCompareWithWhite, setCompareWithWhite] = React.useState(false);
  const [imageData, setImageData] = React.useState<ImageData | undefined>(undefined);
  const canvasRef = React.useRef<HTMLCanvasElement>();
  const canvasContainerRef = React.useRef<HTMLDivElement>();

  const onDetectClick = React.useCallback(async () => {
    if (!onSizeChange) return;
    const url = createBookPageUrl(bookId, pageIndex - 1, maxPage);
    const rawImageData = await urlToImageData(url);
    const {
      left: l,
      right: r,
    } = calcPadding(rawImageData, threshold, verticalOffset, horizontalOffset, useCompareWithWhite);
    onSizeChange(l, r);
    setImageData(rawImageData);
  }, [
    onSizeChange,
    bookId,
    pageIndex,
    maxPage,
    threshold,
    verticalOffset,
    horizontalOffset,
    useCompareWithWhite,
  ]);

  React.useEffect(() => {
    if (!imageData || !canvasRef.current) return;
    const width = right - left;
    const { height } = imageData;
    const canvas = canvasRef.current;
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d')
      .putImageData(imageData, left * -1, 0);
    const container = canvasContainerRef.current;
    if (container) {
      container.style.paddingTop = `${(height / width) * 100}%`;
    }
  }, [left, right, imageData, canvasRef]);

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Preview Crop Pages</DialogTitle>
      <DialogContent
        sx={{
          '& .MuiTextField-root': { m: 1 },
          '& .MuiButton-root': { m: 1 },
          '& .MuiFormControlLabel-root': { m: 1 },
        }}
      >
        <Typography variant="subtitle2">Padding Size</Typography>
        <TextField
          color="secondary"
          label="Left"
          type="number"
          value={left}
          onChange={(e) => onSizeChange(Number(e.target.value), right)}
        />
        <TextField
          color="secondary"
          label={`Right${imageData ? `(diff=${imageData.width - right})` : ''}`}
          type="number"
          value={right}
          onChange={(e) => onSizeChange(left, Number(e.target.value))}
        />

        <Typography variant="subtitle2">Options</Typography>
        <TextField
          color="secondary"
          label={`Detect page(max: ${maxPage})`}
          type="number"
          value={pageIndex}
          onChange={(e) => setPageIndex(Number(e.target.value))}
        />
        <TextField
          color="secondary"
          label="Color threshold(0-255)"
          type="number"
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
        />
        <TextField
          color="secondary"
          label="Vertical offset"
          type="number"
          value={verticalOffset}
          onChange={(e) => setVerticalOffset(Number(e.target.value))}
        />
        <TextField
          color="secondary"
          label="Horizontal offset"
          type="number"
          value={horizontalOffset}
          onChange={(e) => setHorizontalOffset(Number(e.target.value))}
        />
        <FormControlLabel
          control={(
            <Checkbox
              checked={useCompareWithWhite}
              onChange={(e) => setCompareWithWhite(e.target.checked)}
            />
          )}
          label="Compare with white"
        />
        <Button fullWidth onClick={onDetectClick}>Detect & Preview</Button>
        <div
          ref={canvasContainerRef}
          style={{
            position: 'relative',
            height: 0,
            overflow: 'hidden',
            border: 'solid lightgray 2px',
          }}
        >
          <canvas
            ref={canvasRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
            }}
          />
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>OK</Button>
      </DialogActions>
    </Dialog>
  );
};

export default React.memo(CalcImagePaddingDialog);
