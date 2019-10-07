import * as React from 'react';
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
import { useMutation, useQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { BookInfo as BookInfoType, Result } from '@common/GraphqlTypes';
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
  loadMoreButton: {
    gridColumn: '1 / end',
  },
}));

const SelectBookInfoThumbnailDialog: React.FC<SelectThumbnailDialogProps> = (
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
  } = useQuery<{ bookInfo: BookInfoType }>(gql`
      query ($id: ID!){
          bookInfo(id: $id) {
              id
              name
              books {
                  id
                  number
                  pages
                  thumbnail

                  info {
                      id
                  }
              }
          }
      }
  `, {
    skip: !open,
    variables: {
      id: infoId,
    },
  });

  const [changeThumbnail, { loading: changeLoading }] = useMutation<{ edit: Result }>(gql`
    mutation ($id: ID! $th: String){
        edit: editBookInfo(id: $id thumbnail: $th) {
            success
            code
        }
    }
  `, {
    variables: {
      id: infoId,
    },
    onCompleted({ edit: { success } }) {
      if (success && onClose) onClose();
      if (success && onEdit) onEdit();
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
            {data.bookInfo.books.slice(0, count).map((book) => (
              <Book
                key={book.id}
                simple
                name={data.bookInfo.name}
                {...book}
                onClick={() => changeThumbnail({ variables: { th: book.thumbnail } })}
              />
            ))}
            {(count < data.bookInfo.books.length) && (
              <Button
                fullWidth
                className={classes.loadMoreButton}
                onClick={() => setCount(Math.min(count + 5, data.bookInfo.books.length))}
              >
                Load More
              </Button>
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

export default SelectBookInfoThumbnailDialog;
