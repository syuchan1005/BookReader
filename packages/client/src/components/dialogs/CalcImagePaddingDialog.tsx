import React from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@material-ui/core';
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

export const urlToImageData = (url: string): Promise<ImageData> => new Promise((resolve, reject) => {
    if (url == null) return reject();
    var canvas = document.createElement('canvas'),
        context = canvas.getContext('2d'),
        image = new Image();
    image.addEventListener('load', function () {
        canvas.width = image.width;
        canvas.height = image.height;
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(context.getImageData(0, 0, canvas.width, canvas.height));
    }, false);
    image.src = url;
});

export const calcPadding = (imageData: ImageData, threshold: number): { left: number, right: number } => {
    const isWhite = (width: number, height: number) => {
        const pixelIndex = width + height * imageData.width;
        const dataIndex = pixelIndex * 4;
        /* isWhite (R G B (A))*/
        return (255 - imageData.data[dataIndex]) <= threshold &&
            (255 - imageData.data[dataIndex + 1]) <= threshold &&
            (255 - imageData.data[dataIndex + 2]) <= threshold;
    };

    let left = 0;
    leftWidth: for (let w = 0; w < imageData.width; w += 1) {
        for (let h = 0; h < imageData.height; h += 1) {
            if (isWhite(w, h)) continue;
            left = w;
            break leftWidth;
        }
    }
    let right = 0;
    rightWidth: for (let w = imageData.width - 1; w >= 0; w -= 1) {
        for (let h = 0; h < imageData.height; h += 1) {
            if (isWhite(w, h)) continue;
            right = w;
            break rightWidth;
        }
    }
    return { left, right };
};

const CalcImagePaddingDialog: React.VFC<CalcImagePaddingDialogProps> = React.memo((props: CalcImagePaddingDialogProps) => {
    const { open, bookId, maxPage, onClose, left, right, onSizeChange } = props;
    const [pageIndex, setPageIndex] = React.useState(1);
    const [threshold, setThreshold] = React.useState(10);
    const [imageData, setImageData] = React.useState<ImageData | undefined>(undefined);
    const canvasRef = React.useRef<HTMLCanvasElement>();
    const canvasContainerRef = React.useRef<HTMLDivElement>();

    const onDetectClick = React.useCallback(async () => {
        if (!onSizeChange) return;
        const url = createBookPageUrl(bookId, pageIndex - 1, maxPage);
        const imageData = await urlToImageData(url);
        const { left: l, right: r } = calcPadding(imageData, threshold);
        onSizeChange(l, r);
        setImageData(imageData);
    }, [bookId, pageIndex, onSizeChange]);

    React.useEffect(() => {
        if (!imageData || !canvasRef.current) return;
        const width = right - left;
        const height = imageData.height;
        const canvas = canvasRef.current;
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').putImageData(imageData, left * -1, 0);
        const container = canvasContainerRef.current;
        if (container) {
            container.style.paddingTop = `${height / width * 100}%`;
        }
    }, [left, right, imageData, canvasRef]);

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Preview Crop Pages</DialogTitle>
            <DialogContent>
                <TextField color="secondary" label={`page(max: ${maxPage})`} type="number" value={pageIndex} onChange={(e) => setPageIndex(Number(e.target.value))} />
                <TextField color="secondary" label="threshold" type="number" value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} />
                <TextField color="secondary" label="Left" type="number" value={left} onChange={(e) => onSizeChange(Number(e.target.value), right)} />
                <TextField color="secondary" label="Right" type="number" value={right} onChange={(e) => onSizeChange(left, Number(e.target.value))} />
                <Button onClick={onDetectClick}>Detect & Preview</Button>
                <div ref={canvasContainerRef} style={{ position: 'relative', height: 0, overflow: 'hidden', border: 'solid lightgray 2px' }}>
                    <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
                </div>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>OK</Button>
            </DialogActions>
        </Dialog>
    );
});

export default CalcImagePaddingDialog;
