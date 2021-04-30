import React from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
} from '@material-ui/core';
import JSZip from 'jszip';
import * as saveAs from 'jszip/vendor/FileSaver';

interface DownloadBookDialogProps {
  open: boolean;
  onClose?: () => any;
  number?: string;
  bookId?: string;
  pages?: number;
}

const DownloadBookDialog: React.FC<DownloadBookDialogProps> = (props: DownloadBookDialogProps) => {
  const {
    open,
    onClose,
    number,
    bookId,
    pages,
  } = props;

  const [downloadImages, setDownloadImages] = React.useState<boolean | number>(false);

  const onClickDownload = React.useCallback(() => {
    setDownloadImages(0);
    const zip = new JSZip();

    let num = 0;
    Promise.all([...Array(pages).keys()].map((i) => {
      const name = i.toString(10).padStart(pages.toString(10).length, '0');
      return fetch(`/book/${bookId}/${name}.jpg`)
        .then((res) => {
          num += 1;
          setDownloadImages(num);
          zip.file(`${name}.jpg`, res.blob());
        });
    })).then(() => {
      zip.generateAsync({ type: 'blob' }).then((content) => {
        saveAs(content, `book-${number}.zip`);
        setDownloadImages(false);
      });
    });
  }, []);

  return (
    <Dialog open={open} onClose={downloadImages !== false ? undefined : onClose}>
      <DialogTitle>Download Book</DialogTitle>
      <DialogContent>
        {(typeof downloadImages === 'boolean') ? (
          `Would you like to download No.${number}?`
        ) : (
          <>
            <LinearProgress
              variant="determinate"
              color="secondary"
              value={(downloadImages / pages) * 100}
            />
            <div style={{ textAlign: 'center' }}>{`${downloadImages} / ${pages}`}</div>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={downloadImages !== false}>Close</Button>
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
