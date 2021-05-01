import React from 'react';
import { hot } from 'react-hot-loader/root';
import {
  Button, CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
} from '@material-ui/core';
import {
  BookInfo,
  DownloadBookInfosQuery as DownloadBookInfosQueryType,
  DownloadBookInfosQueryVariables as DownloadBookInfosQueryVariablesType,
} from '@syuchan1005/book-reader-graphql';
import JSZip from 'jszip';
import * as saveAs from 'jszip/vendor/FileSaver';
import { useQuery } from '@apollo/react-hooks';

import BookInfoQuery from '@syuchan1005/book-reader-graphql/queries/DownloadBookInfoDialog_bookInfo.gql';

interface DownloadBookInfoDialogProps extends Pick<BookInfo, 'id'> {
  open: boolean;
  onClose?: () => any;
}

const DownloadBookInfoDialog: React.FC<DownloadBookInfoDialogProps> = (
  props: DownloadBookInfoDialogProps,
) => {
  const {
    open,
    onClose,
    id,
  } = props;

  const [downloadBooks, setDownloadBooks] = React.useState<number>(undefined);
  const [downloadImages, setDownloadImages] = React.useState<number>(undefined);

  const {
    data,
    loading: booksLoading,
  } = useQuery<DownloadBookInfosQueryType,
  DownloadBookInfosQueryVariablesType>(BookInfoQuery, {
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
      setDownloadBooks(i);
      const bookFolder = zip.folder(book.number);
      let num = 0;
      // eslint-disable-next-line no-await-in-loop
      await Promise.all([...Array(book.pages).keys()].map((index) => {
        const nameA = index.toString(10).padStart(book.pages.toString(10).length, '0');
        return fetch(`/book/${book.id}/${nameA}.jpg`)
          .then((res) => {
            num += 1;
            setDownloadImages(num);
            bookFolder.file(`${nameA}.jpg`, res.blob());
          });
      }));
      setDownloadImages(0);
    }
    zip.generateAsync({ type: 'blob' }).then((content) => {
      saveAs(content, `book-${data.bookInfo.name}.zip`);
      setDownloadImages(undefined);
      setDownloadBooks(undefined);
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

export default hot(DownloadBookInfoDialog);