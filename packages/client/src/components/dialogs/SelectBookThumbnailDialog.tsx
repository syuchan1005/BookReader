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

import { useBookPagesQuery, useEditBookThumbnailMutation } from '@syuchan1005/book-reader-graphql/generated/GQLQueries';

import BookPageImage, { pageAspectRatio } from '@client/components/BookPageImage';
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
}));

const SelectBookThumbnailDialog = (props: SelectThumbnailDialogProps) => {
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
  } = useBookPagesQuery({
    skip: !open,
    variables: {
      id: bookId,
    },
  });

  const [changeThumbnail, { loading: changeLoading }] = useEditBookThumbnailMutation({
    onCompleted(d) {
      if (!d) return;
      if (d.edit.success && onClose) onClose();
      if (d.edit.success && onEdit) onEdit();
    },
  });

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
              .map((i) => (
                <Card key={`${bookId}_${i}`}>
                  <CardActionArea
                    onClick={() => changeThumbnail({
                      variables: {
                        id: bookId,
                        th: i,
                      },
                    })}
                  >
                    <BookPageImage
                      bookId={bookId}
                      pageIndex={i}
                      bookPageCount={data.book.pages}
                      width={125}
                      height={pageAspectRatio(125)}
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

export default React.memo(SelectBookThumbnailDialog);
