import React from 'react';
import {
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  createStyles,
  Icon,
  IconButton,
  makeStyles,
  Menu,
  MenuItem,
  Theme,
} from '@material-ui/core';
import { orange as color } from '@material-ui/core/colors';
import { useMutation } from '@apollo/react-hooks';
import loadable from '@loadable/component';

import {
  BookInfo as QLBookInfo,
  DeleteBookInfoMutation as DeleteBookInfoMutationType,
  DeleteBookInfoMutationVariables,
  EditBookInfoMutation as EditBookInfoMutationType,
  EditBookInfoMutationVariables,
} from '@syuchan1005/book-reader-graphql';
import DeleteBookInfoMutation from '@syuchan1005/book-reader-graphql/queries/BookInfo_deleteBookInfo.gql';
import EditBookInfoMutation from '@syuchan1005/book-reader-graphql/queries/BookInfo_editBookInfo.gql';

import DeleteDialog from '@client/components/dialogs/DeleteDialog';
import EditDialog from '@client/components/dialogs/EditDialog';
import BookPageImage from './BookPageImage';
import SelectBookInfoThumbnailDialog from './dialogs/SelectBookInfoThumbnailDialog';
import useDebounceValue from '../hooks/useDebounceValue';

const DownloadDialog = loadable(() => import(/* webpackChunkName: 'DownloadBookInfoDialog' */ './dialogs/DownloadBookInfoDialog'));

interface BookInfoProps extends Pick<QLBookInfo, 'id' | 'name' | 'thumbnail' | 'history' | 'count' | 'genres'> {
  style?: React.CSSProperties;
  thumbnailSize?: number;
  showName?: boolean;

  onClick?: Function;
  onDeleted?: Function;
  onEdit?: () => void;
}

const useStyles = makeStyles((theme: Theme) => createStyles({
  thumbnail: {
    width: '100%',
    minHeight: '100%',
    objectFit: 'contain',
  },
  card: {
    width: '100%',
    margin: 'auto',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  countLabel: {
    position: 'absolute',
    bottom: '0',
    right: '0',
    background: 'rgba(0, 0, 0, 0.7)',
    color: 'white',
    fontSize: '1rem',
    width: '2rem',
    height: '2rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(1),
    margin: theme.spacing(1),
    borderRadius: '50%',
  },
  headerMenu: {
    position: 'absolute',
    zIndex: 1,
    padding: 0,
  },
  historyLabel: {
    position: 'absolute',
    top: 0,
    left: theme.spacing(1),
    background: color['800'],
    color: theme.palette.common.white,
    padding: theme.spacing(1),
    borderRadius: theme.spacing(1),
  },
  completedLabel: {
    position: 'absolute',
    bottom: theme.spacing(2),
    left: theme.spacing(-4),
    background: 'rgba(0, 0, 0, 0.7)',
    color: 'white',
    fontSize: '1rem',
    height: '2rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(1, 3),
    transform: 'rotate(45deg)',
  },
  invisibleLabel: {
    position: 'absolute',
    right: theme.spacing(1.5),
    bottom: `calc(2rem + ${theme.spacing(1)}px)`,
    color: 'white',
    textShadow: '1px 1px 1px black',
  },
  cardContent: {
    position: 'absolute',
    bottom: '0',
    background: 'rgba(0, 0, 0, 0.7)',
    color: 'white',
    fontSize: '1rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: theme.spacing(1),
    borderTopRightRadius: theme.spacing(0.5),
  },
}));

const BookInfo: React.FC<BookInfoProps> = (props: BookInfoProps) => {
  const classes = useStyles(props);
  const {
    style,
    thumbnailSize = 200,
    id: infoId,
    thumbnail,
    name,
    count,
    history,
    genres,
    showName,
    onClick,
    onDeleted,
    onEdit,
  } = props;

  const [menuAnchor, setMenuAnchor] = React.useState(null);
  const [askDelete, setAskDelete] = React.useState(false);
  const [editDialog, setEditDialog] = React.useState(false);
  const [editContent, setEditContent] = React.useState({
    name,
    genres: genres.map((g) => g.name),
  });
  const [selectDialog, setSelectDialog] = React.useState<string | undefined>(undefined);
  const [openDownloadDialog, setOpenDownloadDialog] = React.useState(false);
  const debounceOpenDownloadDialog = useDebounceValue(openDownloadDialog, 400);

  const [deleteBookInfo, { loading: delLoading }] = useMutation<
    DeleteBookInfoMutationType,
    DeleteBookInfoMutationVariables
  >(
    DeleteBookInfoMutation,
    {
      variables: {
        id: infoId,
      },
      onCompleted(d) {
        if (!d) return;
        setAskDelete(!d.del.success);
        if (d.del.success && onDeleted) onDeleted(d.del.books);
      },
    },
  );

  const [editBookInfo, { loading: editLoading }] = useMutation<
    EditBookInfoMutationType,
    EditBookInfoMutationVariables
  >(
    EditBookInfoMutation,
    {
      variables: {
        id: infoId,
        name: editContent.name,
        genres: editContent.genres,
      },
      onCompleted(d) {
        if (!d) return;
        setEditDialog(!d.edit.success);
        if (d.edit.success && onEdit) onEdit();
      },
    },
  );

  const clickEditBookInfo = React.useCallback(() => {
    setMenuAnchor(null);
    setEditDialog(true);
  }, []);

  const clickDeleteBookInfo = React.useCallback(() => {
    setMenuAnchor(null);
    setAskDelete(true);
  }, []);

  const clickSelectThumbnailBookInfo = React.useCallback(() => {
    setMenuAnchor(null);
    setSelectDialog(infoId);
  }, [infoId]);

  const clickDownloadBook = React.useCallback(() => {
    setMenuAnchor(null);
    setOpenDownloadDialog(true);
  }, []);

  const onChangeEvent = (k, e) => {
    setEditContent({ ...editContent, [k]: e });
  };

  return (
    <Card className={classes.card} style={style}>
      <CardActions className={classes.headerMenu}>
        <IconButton
          onClick={(event) => setMenuAnchor(event.currentTarget)}
          aria-label="menu"
        >
          <Icon>more_vert</Icon>
        </IconButton>
        <Menu
          getContentAnchorEl={null}
          anchorOrigin={{
            horizontal: 'center',
            vertical: 'bottom',
          }}
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={() => setMenuAnchor(null)}
        >
          <MenuItem onClick={clickSelectThumbnailBookInfo}>Select Thumbnail</MenuItem>
          <MenuItem onClick={clickEditBookInfo}>Edit</MenuItem>
          <MenuItem onClick={clickDeleteBookInfo}>Delete</MenuItem>
          {(!history) && (<MenuItem onClick={clickDownloadBook}>Download</MenuItem>)}
        </Menu>
      </CardActions>
      <CardActionArea onClick={(e) => onClick && onClick(e)}>
        <BookPageImage.Thumbnail
          thumbnail={thumbnail}
          width={thumbnailSize * window.devicePixelRatio}
          className={classes.thumbnail}
          noSave={false}
        />
        {showName ? (
          <CardContent className={classes.cardContent}>
            <div>{`${name} (${count}${genres.some((g) => g.name === 'Completed') ? ', Completed' : ''})`}</div>
          </CardContent>
        ) : (
          <CardContent className={classes.countLabel}>
            <div>{count}</div>
          </CardContent>
        )}
        {(history) ? (
          <div className={classes.historyLabel}>History</div>
        ) : null}
        {(genres.some((g) => g.name === 'Completed') && !showName) ? (
          <div className={classes.completedLabel}>Completed</div>
        ) : null}
        {(genres.some((g) => g.invisible)) ? (
          <Icon className={classes.invisibleLabel}>visibility_off</Icon>
        ) : null}
      </CardActionArea>

      <DeleteDialog
        open={askDelete}
        loading={delLoading}
        bookInfo={name}
        onClose={() => setAskDelete(false)}
        onClickDelete={() => deleteBookInfo()}
      />

      <EditDialog
        info
        open={editDialog}
        loading={editLoading}
        fieldValue={editContent.name}
        genres={editContent.genres}
        onChange={onChangeEvent}
        onClose={() => setEditDialog(false)}
        onClickRestore={() => setEditContent({ ...editContent, name })}
        onClickEdit={() => editBookInfo()}
      />

      <SelectBookInfoThumbnailDialog
        open={!!selectDialog}
        infoId={selectDialog}
        onClose={() => setSelectDialog(undefined)}
        onEdit={onEdit}
      />

      {(openDownloadDialog || debounceOpenDownloadDialog) && (
        <DownloadDialog
          open={openDownloadDialog}
          onClose={() => setOpenDownloadDialog(false)}
          id={infoId}
          name={name}
          count={count}
        />
      )}
    </Card>
  );
};

export default BookInfo;
