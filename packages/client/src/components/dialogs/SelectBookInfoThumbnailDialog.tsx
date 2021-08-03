import React from 'react';
import {
  Button,
  createStyles,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  makeStyles,
  Theme, useMediaQuery, useTheme,
} from '@material-ui/core';

import { useBookInfoQuery, useEditBookInfoThumbnailMutation } from '@syuchan1005/book-reader-graphql/generated/GQLQueries';
import Book from '@client/components/Book';

interface SelectThumbnailDialogProps {
  open: boolean;
  infoId: string;
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

const SelectBookInfoThumbnailDialog = (
  props: SelectThumbnailDialogProps,
) => {
  const classes = useStyles(props);
  const {
    open,
    infoId,
    onEdit,
    onClose,
  } = props;

  const {
    loading: infoLoading,
    error,
    data,
  } = useBookInfoQuery({
    skip: !open,
    variables: {
      id: infoId,
    },
  });

  const [
    changeThumbnail,
    { loading: changeLoading },
  ] = useEditBookInfoThumbnailMutation({
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
  const visibleMargin = React
    .useMemo(() => `0px 0px ${theme.spacing(3)}px 0px`, [theme]);

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
            {data.bookInfo.books.map((book) => (
              // @ts-ignore
              <Book
                key={book.id}
                simple
                name={data.bookInfo.name}
                {...book}
                infoId={book.info.id}
                onClick={() => {
                  changeThumbnail({
                    variables: {
                      thumbnail: book.id,
                      id: infoId,
                    },
                  });
                }}
                thumbnailNoSave
                thumbnailSize={125}
                visibleMargin={visibleMargin}
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

export default React.memo(SelectBookInfoThumbnailDialog);
