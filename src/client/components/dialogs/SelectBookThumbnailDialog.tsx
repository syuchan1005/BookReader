import * as React from 'react';
import {
  Button,
  Card, CardActionArea,
  createStyles,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  makeStyles,
  Theme,
} from '@material-ui/core';
import { useMutation, useQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { Book as BookType, Result } from '@common/GraphqlTypes';
import Img from '@client/components/Img';

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
  } = useQuery<{ book: BookType }>(gql`
      query ($id: ID!){
          book(id: $id) {
              id
              pages
          }
      }
  `, {
    skip: !open,
    variables: {
      id: bookId,
    },
  });

  const [changeThumbnail, { loading: changeLoading }] = useMutation<{ edit: Result }>(gql`
    mutation ($id: ID! $th: String){
        edit: editBook(id: $id thumbnail: $th) {
            success
            code
        }
    }
  `, {
    variables: {
      id: bookId,
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

  return (
    <Dialog open={open} onClose={closeDialog}>
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
            {[...Array(data.book.pages).keys()]
              .map((i) => i.toString(10).padStart(data.book.pages.toString(10).length, '0'))
              .map((n) => `/book/${bookId}/${n}_125x.jpg`)
              .map((th, i) => (
                <Card key={th}>
                  <CardActionArea
                    onClick={() => changeThumbnail({
                      variables: { th },
                    })}
                  >
                    <Img
                      className={classes.thumbnail}
                      src={th}
                      alt={(i + 1).toString(10)}
                      minWidth={125}
                      minHeight={150}
                    />
                  </CardActionArea>
                </Card>
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

export default SelectBookThumbnailDialog;
