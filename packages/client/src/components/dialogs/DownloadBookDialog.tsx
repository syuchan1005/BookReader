import { createBookPageUrl } from '@client/components/BookPageImage';
import db from '@client/indexedDb/Database';
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
} from '@mui/material';
import { defaultStoredImageExtension } from '@syuchan1005/book-reader-common';
import { useState } from 'react';

export interface DownloadBookDialogProps {
  open: boolean;
  onClose: () => void;

  infoId: string;
  bookId: string;
  infoName: string;
  bookName: string;
  thumbnailPageIndex: number;
  totalPageCount: number;
  serverUpdatedAt: Date;
}

export const useDownloadBookDialog = (
  props: Omit<DownloadBookDialogProps, 'open' | 'onClose'>,
) => {
  const [open, setOpen] = useState(false);

  return {
    open: () => setOpen(true),
    dialogElement: (
      <DownloadBookDialog
        {...props}
        open={open}
        onClose={() => setOpen(false)}
      />
    ),
  };
};

export const DownloadBookDialog = (props: DownloadBookDialogProps) => {
  const {
    open,
    onClose,
    infoId,
    bookId,
    infoName,
    bookName,
    thumbnailPageIndex,
    serverUpdatedAt,
    totalPageCount,
  } = props;

  const [downloadStatus, setDownloadStatus] = useState<string | undefined>(
    undefined,
  );
  return (
    <Dialog
      open={open}
      onClose={downloadStatus === undefined ? onClose : undefined}
    >
      <DialogTitle>Download book</DialogTitle>
      <DialogContent>
        {downloadStatus === undefined && (
          <div>
            Would you like to download the book "{infoName}/{bookName}"?
          </div>
        )}
        {downloadStatus !== undefined && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '16px',
            }}
          >
            <CircularProgress color="secondary" />
          </div>
        )}
        {downloadStatus && (
          <div style={{ textAlign: 'center' }}>{downloadStatus}</div>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={downloadStatus !== undefined}>
          Close
        </Button>
        <Button
          color="secondary"
          variant="contained"
          disabled={downloadStatus !== undefined}
          onClick={() => {
            downloadBook(
              infoId,
              bookId,
              infoName,
              bookName,
              thumbnailPageIndex,
              totalPageCount,
              serverUpdatedAt,
              (text) => setDownloadStatus(text),
            )
              .then(() => {
                onClose();
              })
              .finally(() => {
                setDownloadStatus(null);
              });
          }}
        >
          Download
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const downloadBook = async (
  infoId: string,
  bookId: string,
  infoName: string,
  bookName: string,
  thumbnailPageIndex: number,
  totalPageCount: number,
  serverUpdatedAt: Date,
  onProgress: (text: string) => void,
) => {
  const JsZip = (await import('jszip')).default;

  let thumbnailBlob = undefined;
  const zip = new JsZip();
  let downloadedImageCount = 0;
  await Promise.all(
    [...Array(totalPageCount).keys()].map((pageIndex) => {
      const url = createBookPageUrl(bookId, pageIndex, totalPageCount);
      const name = pageIndex
        .toString(10)
        .padStart(totalPageCount.toString(10).length, '0');
      return fetch(url).then(async (res) => {
        downloadedImageCount += 1;
        onProgress(
          `Downloading images: ${downloadedImageCount} / ${totalPageCount}`,
        );
        const blob = await res.blob();
        if (pageIndex === thumbnailPageIndex) {
          thumbnailBlob = blob;
        }
        zip.file(`${name}.${defaultStoredImageExtension}`, blob);
      });
    }),
  );
  if (!thumbnailBlob) {
    throw new Error('Thumbnail page not found');
  }
  const zipBlob = await zip.generateAsync({ type: 'blob' }, ({ percent }) => {
    onProgress(`Compressing images: ${Math.round(percent)}%`);
  });
  onProgress('Saving book');
  await db.downloadedBook.put({
    infoId,
    bookId,
    infoName,
    bookName,
    totalPageCount,
    thumbnail: thumbnailBlob,
    bookZipArchive: zipBlob,
    createdAt: new Date(),
    serverUpdatedAt: serverUpdatedAt,
  });
  onProgress('downloaded successfully');
};
