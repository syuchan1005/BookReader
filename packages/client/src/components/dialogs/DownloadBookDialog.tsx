import { createBookPageUrl } from '@client/components/BookPageImage';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
} from '@mui/material';
import { defaultStoredImageExtension } from '@syuchan1005/book-reader-common';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { useCallback, useState } from 'react';

interface DownloadBookDialogProps {
  open: boolean;
  onClose?: () => void;
  number?: string;
  bookId?: string;
  pages?: number;
}

const DownloadBookDialog = (props: DownloadBookDialogProps) => {
  const { open, onClose, number, bookId, pages } = props;

  const [downloadImages, setDownloadImages] = useState<boolean | number>(false);
  const [compressPercent, setCompressPercent] = useState<number | undefined>(
    undefined,
  );

  const onClickDownload = useCallback(() => {
    setDownloadImages(0);
    const zip = new JSZip();

    let num = 0;
    Promise.all(
      [...Array(pages).keys()].map((i) => {
        const url = createBookPageUrl(bookId, i, pages);
        const name = i.toString(10).padStart(pages.toString(10).length, '0');
        return fetch(url).then((res) => {
          num += 1;
          setDownloadImages(num);
          zip.file(`${name}.${defaultStoredImageExtension}`, res.blob());
        });
      }),
    )
      .then(() =>
        zip.generateAsync({ type: 'blob' }, ({ percent }) =>
          setCompressPercent(percent),
        ),
      )
      .then((content) => {
        saveAs(content, `book-${number}.zip`);
        setCompressPercent(undefined);
        setDownloadImages(false);
      });
  }, [bookId, number, pages]);

  return (
    <Dialog
      open={open}
      onClose={downloadImages !== false ? undefined : onClose}
    >
      <DialogTitle>Download Book</DialogTitle>
      <DialogContent>
        {typeof downloadImages === 'boolean' ? (
          `Would you like to download No.${number}?`
        ) : (
          <>
            <LinearProgress
              variant="determinate"
              color="secondary"
              value={(downloadImages / pages) * 100}
            />
            <div
              style={{ textAlign: 'center' }}
            >{`${downloadImages} / ${pages}`}</div>
            {compressPercent && (
              <div style={{ textAlign: 'center' }}>
                {`Compressing: ${Math.round(compressPercent)}%`}
              </div>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={downloadImages !== false}>
          Close
        </Button>
        <Button
          onClick={onClickDownload}
          color="secondary"
          variant="contained"
          disabled={!bookId || !pages || downloadImages !== false}
        >
          Download
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DownloadBookDialog;
