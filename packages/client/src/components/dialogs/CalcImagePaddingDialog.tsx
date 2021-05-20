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

const urlToImageData = (url: string): Promise<ImageData> => new Promise((resolve, reject) => {
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

const calcPadding = (imageData: ImageData): { left: number, right: number } => {
    var left;
    for (let w = 0; w < imageData.width; w += 1) {
        /* isWhite (R G B (A))*/
        if (imageData.data[w * 4] === 255 && imageData.data[w * 4 + 1] === 255 && imageData.data[w * 4 + 2] === 255) continue;
        left = w;
        break;
    }

    var right;
    for (let w = imageData.width; w >= 0; w -= 1) {
        /* isWhite (R G B (A))*/
        if (imageData.data[w * 4] === 255 && imageData.data[w * 4 + 1] === 255 && imageData.data[w * 4 + 2] === 255) continue;
        right = w;
        break;
    }

    return { left, right };
};

const CalcImagePaddingDialog: React.VFC<CalcImagePaddingDialogProps> = React.memo((props: CalcImagePaddingDialogProps) => {
    const { open, bookId, maxPage, onClose, left, right, onSizeChange } = props;
    const [pageIndex, setPageIndex] = React.useState(1);
    const [imageData, setImageData] = React.useState<ImageData | undefined>(undefined);
    const canvasRef = React.useRef<HTMLCanvasElement>();
    const canvasContainerRef = React.useRef<HTMLDivElement>();

    const onDetectClick = React.useCallback(async () => {
        if (!onSizeChange) return;
        const url = createBookPageUrl(bookId, pageIndex - 1, maxPage);
        const imageData = await urlToImageData(url);
        const { left: l, right: r } = calcPadding(imageData);
        onSizeChange(l, r);
        setImageData(imageData);
    }, [bookId, pageIndex, onSizeChange]);

    React.useEffect(() => {
        if (!imageData || !canvasRef.current) return;
        createImageBitmap(imageData, left, 0, right - left, imageData.height)
            .then((bitmap) => {
                const canvas = canvasRef.current;
                canvas.width = bitmap.width;
                canvas.height = bitmap.height;
                canvas.getContext('2d').drawImage(bitmap, 0, 0);
                const container = canvasContainerRef.current;
                if (container) {
                    container.style.paddingTop = `${bitmap.height / bitmap.width * 100}%`;
                }
            });
    }, [left, right, imageData, canvasRef]);

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Preview Crop Pages</DialogTitle>
            <DialogContent>
                <TextField color="secondary" label={`page(max: ${maxPage})`} value={pageIndex} onChange={(e) => setPageIndex(Number(e.target.value))} />
                <TextField color="secondary" label="Left" type="number" value={left} onChange={(e) => onSizeChange(Number(e.target.value), right)} />
                <TextField color="secondary" label="Right" type="number" value={right} onChange={(e) => onSizeChange(left, Number(e.target.value))} />
                <Button onClick={onDetectClick}>Detect & Preview</Button>
                <div ref={canvasContainerRef} style={{position: 'relative', height: 0, overflow: 'hidden'}}>
                    <canvas ref={canvasRef} style={{position: 'absolute', top:0, left: 0, width:'100%', height: '100%'}} />
                </div>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>OK</Button>
            </DialogActions>
        </Dialog>
    );
});

export default CalcImagePaddingDialog;
