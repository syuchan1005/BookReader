import React from 'react';
import {
  Button,
  Card, CardActionArea,
  createStyles,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  makeStyles,
  Theme, useMediaQuery, useTheme,
} from '@material-ui/core';
import { useMutation, useQuery } from '@apollo/react-hooks';

import {
  BookPagesQuery as BookPagesQueryType,
  BookPagesQueryVariables,
  EditBookThumbnailMutation as EditBookThumbnailMutationType,
  EditBookThumbnailMutationVariables,
} from '@syuchan1005/book-reader-graphql';
import BookQuery from '@syuchan1005/book-reader-graphql/queries/SelectBookThumbnailDialog_book.gql';
import EditBookMutation from '@syuchan1005/book-reader-graphql/queries/SelectBookThumbnailDialog_editBook.gql';

import Img from '@client/components/Img';
import { Waypoint } from 'react-waypoint';

interface SelectThumbnailDialogProps {
  open: boolean;
  bookId: string;
  onClose?: () => void;
  onEdit?: () => void;
}

const useStyles = makeStyles((theme: Theme) => createStyles({
  selectGrid: {
    minWidth: '250px',
    width: '100%',
    padding: theme.spacing(1),
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, 125px) [end]',
    justifyContent: 'center',
    columnGap: `${theme.spacing(2)}px`,
    rowGap: `${theme.spacing(2)}px`,
  },
  thumbnail: {
    width: '100%',
    minHeight: '100%',
    objectFit: 'contain',
  },
}));

const SelectBookThumbnailDialog: React.FC<SelectThumbnailDialogProps> = (
  props: SelectThumbnailDialogProps,
) => {
  const classes = useStyles(props);
  const {
    open,
    bookId,
    onEdit,
    onClose,
  } = props;

  const {
    loading: infoLoading,
    error,
    data,
  } = useQuery<BookPagesQueryType, BookPagesQueryVariables>(BookQuery, {
    skip: !open,
    variables: {
      id: bookId,
    },
  });

  const [changeThumbnail, { loading: changeLoading }] = useMutation<
    EditBookThumbnailMutationType,
    EditBookThumbnailMutationVariables
  >(
    EditBookMutation,
    {
      onCompleted(d) {
        if (!d) return;
        if (d.edit.success && onClose) onClose();
        if (d.edit.success && onEdit) onEdit();
      },
    },
  );

  const loading = React.useMemo(() => infoLoading || changeLoading, [infoLoading, changeLoading]);

  const closeDialog = () => {
    if (loading) return;
    if (onClose) onClose();
  };

  const theme = useTheme();
  const fullscreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [count, setCount] = React.useState(5);

  return (
    <Dialog open={open} onClose={closeDialog} fullScreen={fullscreen}>
      <DialogTitle>Select BookInfo Thumbnail</DialogTitle>

      <DialogContent>
        {(loading) ? (
          <div>Loading</div>
        ) : null}
        {(error) ? (
          <div>{error}</div>
        ) : null}
        {(!loading && !error && data) ? (
          <div className={classes.selectGrid}>
            {[...Array(count).keys()]
              .map((i) => i.toString(10).padStart(data.book.pages.toString(10).length, '0'))
              .map((n, i) => (
                <Card key={`/book/${bookId}/${n}_125x0.jpg`}>
                  <CardActionArea
                    onClick={() => changeThumbnail({
                      variables: {
                        id: bookId,
                        th: `/book/${bookId}/${n}.jpg`,
                      },
                    })}
                  >
                    <Img
                      className={classes.thumbnail}
                      src={`/book/${bookId}/${n}_${125 * window.devicePixelRatio}x0.jpg`}
                      alt={(i + 1).toString(10)}
                      minWidth={125}
                      minHeight={150}
                    />
                  </CardActionArea>
                </Card>
              ))}
            {(count < data.book.pages) && (
              <Waypoint
                onEnter={() => setCount(Math.min(count + 5, data.book.pages))}
              />
            )}
          </div>
        ) : null}
      </DialogContent>

      <DialogActions>
        <Button onClick={closeDialog} disabled={loading}>
          close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SelectBookThumbnailDialog;
