import React from 'react';
import {
  Button, CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
} from '@mui/material';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

import { BookInfo } from '@syuchan1005/book-reader-graphql';
import { useDownloadBookInfosQuery } from '@syuchan1005/book-reader-graphql';
import { createBookPageUrl } from '@client/components/BookPageImage';

interface DownloadBookInfoDialogProps extends Pick<BookInfo, 'id'> {
  open: boolean;
  onClose?: () => any;
}

const DownloadBookInfoDialog = (props: DownloadBookInfoDialogProps) => {
  const {
    open,
    onClose,
    id,
  } = props;

  const [downloadBooks, setDownloadBooks] = React.useState<number>(undefined);
  const [downloadImages, setDownloadImages] = React.useState<number>(undefined);
  const [compressPercent, setCompressPercent] = React.useState<number | undefined>(undefined);

  const {
    data,
    loading: booksLoading,
  } = useDownloadBookInfosQuery({
    variables: {
      id,
    },
  });

  const loading = React.useMemo(
    () => booksLoading || (downloadImages !== undefined && downloadBooks !== undefined),
    [downloadImages, downloadBooks, booksLoading],
  );

  const onClickDownload = React.useCallback(async () => {
    setDownloadBooks(0);
    setDownloadImages(0);
    const zip = new JSZip();

    const bookLen = data.bookInfo.books.length;
    for (let i = 0; i < bookLen; i += 1) {
      const book = data.bookInfo.books[i];
      setDownloadBooks(i + 1);
      const bookFolder = zip.folder(book.number);
      let num = 0;
      // eslint-disable-next-line no-await-in-loop
      await Promise.all([...Array(book.pages).keys()].map((index) => {
        const url = createBookPageUrl(book.id, index, book.pages);
        const nameA = index.toString(10).padStart(book.pages.toString(10).length, '0');
        return fetch(url)
          .then((res) => {
            num += 1;
            setDownloadImages(num);
            bookFolder.file(`${nameA}.jpg`, res.blob());
          });
      }));
    }
    zip.generateAsync({ type: 'blob' }, ({ percent }) => setCompressPercent(percent)).then((content) => {
      saveAs(content, `book-${data.bookInfo.name}.zip`);
      setDownloadImages(undefined);
      setDownloadBooks(undefined);
      setCompressPercent(undefined);
    });
  }, [data]);

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose}>
      <DialogTitle>Download Book</DialogTitle>
      <DialogContent>
        {(booksLoading) && (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <CircularProgress
              color="secondary"
            />
          </div>
        )}
        {(!booksLoading && !loading) && (
          <div>{`Would you like to download ${data.bookInfo.name}(${data.bookInfo.count})?`}</div>
        )}
        {(!booksLoading && loading) && (
          <>
            <LinearProgress
              variant="determinate"
              color="secondary"
              value={(downloadImages / data.bookInfo.books[downloadBooks].pages) * 100}
            />
            <div style={{ textAlign: 'center' }}>{`${downloadImages} / ${data.bookInfo.books[downloadBooks].pages}`}</div>
            <LinearProgress
              variant="determinate"
              color="secondary"
              value={(downloadBooks / data.bookInfo.books.length) * 100}
            />
            <div style={{ textAlign: 'center' }}>{`${downloadBooks} / ${data.bookInfo.books.length}`}</div>
            {(compressPercent) && (
              <div style={{ textAlign: 'center' }}>{`Compressing: ${Math.round(compressPercent)}%`}</div>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Close</Button>
        <Button
          onClick={onClickDownload}
          color="secondary"
          variant="contained"
          disabled={!id || loading}
        >
          Download
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default React.memo(DownloadBookInfoDialog);
