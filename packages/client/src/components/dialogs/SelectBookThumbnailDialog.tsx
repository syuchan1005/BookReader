import React, { useRef } from 'react';
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
import useVisible from '@client/hooks/useVisible';

const pageStyle = { width: 125, height: pageAspectRatio(125) };
const BookPageCard = ({
  onClick,
  bookId,
  page,
  maxPage,
}: { onClick: () => void, bookId: string, page: number, maxPage: number }) => {
  const theme = useTheme();
  const visibleMargin = React
    .useMemo(() => `0px 0px ${theme.spacing(3)}px 0px`, [theme]);
  const ref = useRef();
  const isVisible = useVisible(ref, true, visibleMargin);
  return (
    <div style={pageStyle} ref={ref}>
      {(isVisible) && (
        <Card>
          <CardActionArea
            onClick={onClick}
          >
            <BookPageImage
              bookId={bookId}
              pageIndex={page}
              bookPageCount={maxPage}
              width={pageStyle.width}
              height={pageStyle.height}
            />
          </CardActionArea>
        </Card>
      )}
    </div>
  );
};

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

  return (
    <Dialog open={open} onClose={closeDialog} fullScreen={fullscreen}>
      <DialogTitle>Select BookInfo Thumbnail</DialogTitle>

      <DialogContent>
        {(loading) ? (
          <div>Loading</div>
        ) : null}
        {(error && !data) ? (
          <div>{error}</div>
        ) : null}
        {(!loading && data) ? (
          <div className={classes.selectGrid}>
            {[...Array(data.book.pages).keys()]
              .map((i) => (
                <BookPageCard
                  key={`${bookId}_${i}`}
                  onClick={() => changeThumbnail({
                    variables: {
                      id: bookId,
                      th: i,
                    },
                  })}
                  bookId={bookId}
                  page={i}
                  maxPage={data.book.pages}
                />
              ))}
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
