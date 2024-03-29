import React, { useRef } from 'react';
import {
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  Icon,
  IconButton,
  Menu,
  MenuItem,
  Theme,
} from '@mui/material';
import createStyles from '@mui/styles/createStyles';
import makeStyles from '@mui/styles/makeStyles';
import { yellow } from '@mui/material/colors';
import { Link, useLocation } from 'react-router-dom';

import { BookInfo as QLBookInfo, HomeBookInfoFragment } from '@syuchan1005/book-reader-graphql';
import {
  useDeleteBookInfoMutation,
  useEditBookInfoMutation,
} from '@syuchan1005/book-reader-graphql';

import db from '@client/indexedDb/Database';

import DeleteDialog from '@client/components/dialogs/DeleteDialog';
import EditDialog from '@client/components/dialogs/EditDialog';
import useBooleanState from '@client/hooks/useBooleanState';
import useMenuAnchor from '@client/hooks/useMenuAnchor';
import useVisible from '@client/hooks/useVisible';
import useLazyDialog from '@client/hooks/useLazyDialog';
import BookPageImage, { pageAspectRatio } from './BookPageImage';
import SelectBookInfoThumbnailDialog from './dialogs/SelectBookInfoThumbnailDialog';

const DownloadDialog = React.lazy(() => import('@client/components/dialogs/DownloadBookInfoDialog'));

interface BookInfoProps extends Pick<QLBookInfo, 'id' | 'name' | 'thumbnail' | 'count' | 'genres'> {
  style?: React.CSSProperties;
  thumbnailSize: number;
  showName?: boolean;
  updatedAt?: string;
  simple?: boolean;
  isReading?: boolean;

  onDeleted?: (infoId: string, books: { id: string, pages: number }[]) => void;
  onEdit?: (homeBookInfo: HomeBookInfoFragment) => void;
  index: number;
  onVisible?: (index: number, isVisible: boolean, isFirstVisible: boolean) => void;
  visibleMargin?: string;
}

const useStyles = makeStyles((theme: Theme) => createStyles({
  card: {
    width: '100%',
    maxHeight: '100%',
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
    bottom: `calc(2rem + ${theme.spacing(1)})`,
    color: 'white',
    textShadow: '1px 1px 1px black',
  },
  newLabel: {
    position: 'absolute',
    top: theme.spacing(1.5),
    left: theme.spacing(1.5),
    color: 'white',
    textShadow: '1px 1px 2px black',
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
  link: {
    width: '100%',
    color: 'unset',
    textDecoration: 'unset',
  },
  labelContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    display: 'flex',
  },
  readLabel: {
    marginLeft: theme.spacing(1),
    background: theme.palette.secondary.main,
    color: theme.palette.secondary.contrastText,
    padding: theme.spacing(1),
    borderRadius: theme.spacing(1),
  },
}));

const useFavorite = (infoId: string): [value: boolean, toggle: () => Promise<unknown>] => {
  const [isFavorite, setFavorite] = React.useState(false);
  const toggleFavorite = React.useCallback(() => {
    let p: Promise<unknown>;
    if (isFavorite) {
      p = db.bookInfoFavorite.delete(infoId);
    } else {
      p = db.bookInfoFavorite.put({
        infoId,
        createdAt: new Date(),
      });
    }
    p.then(() => {
      setFavorite(!isFavorite);
    });
    return p;
  }, [infoId, isFavorite]);

  React.useEffect(() => {
    db.bookInfoFavorite.get(infoId)
      .then((r) => setFavorite(!!r))
      .catch(() => setFavorite(false));
  }, [infoId]);

  return [isFavorite, toggleFavorite];
};

const NEW_BOOK_INFO_EXPIRED = 24 * 60 * 60 * 1000; // 1 day

const BookInfo = (props: BookInfoProps) => {
  const classes = useStyles(props);
  const location = useLocation();
  const ref = useRef();
  const {
    style,
    thumbnailSize,
    id: infoId,
    thumbnail,
    name,
    count,
    genres,
    updatedAt,
    showName,
    onDeleted,
    onEdit,
    index,
    onVisible,
    visibleMargin,
    simple,
    isReading,
  } = props;
  const isVisible = useVisible(ref, false, visibleMargin);
  const [keepVisible, setKeepVisible] = React.useState(false);

  const [menuAnchor, setMenuAnchor, resetMenuAnchor] = useMenuAnchor();
  const [isShownDeleteDialog, showDeleteDialog,
    hideDeleteDialog, , setShowDeleteDialog] = useBooleanState(false);
  const [isShownEditDialog, showEditDialog,
    hideEditDialog, , setShowEditDialog] = useBooleanState(false);
  const [editContent, setEditContent] = React.useState({
    name,
    genres: genres.map((g) => g.name),
  });
  const [selectDialog, setSelectDialog] = React.useState<string | undefined>(undefined);
  const hideSelectDialog = React.useCallback(() => {
    setSelectDialog(undefined);
  }, []);
  const [isShownDownloadDialog, canMountDownloadDialog, showDownloadDialog,
    hideDownloadDialog] = useLazyDialog(false);

  React.useEffect(() => {
    onVisible(index, isVisible, isVisible && !keepVisible);
    if (isVisible) {
      setKeepVisible(true);
    }
    // eslint-disable-next-line
  }, [isVisible]);

  const [deleteBookInfo, { loading: delLoading }] = useDeleteBookInfoMutation({
    variables: {
      id: infoId,
    },
    onCompleted(d) {
      if (!d) return;
      setShowDeleteDialog(!d.del.success);
      if (d.del.success && onDeleted) {
        onDeleted(infoId, d.del.books);
      }
    },
  });

  const [editBookInfo, { loading: editLoading }] = useEditBookInfoMutation({
    variables: {
      id: infoId,
      name: editContent.name,
      genres: editContent.genres,
    },
    onCompleted(d) {
      if (!d) return;
      setShowEditDialog(!d.edit.success);
      if (d.edit.success && onEdit) onEdit(d.edit.bookInfo);
    },
  });

  const clickEditBookInfo = React.useCallback(() => {
    resetMenuAnchor();
    showEditDialog();
  }, [showEditDialog, resetMenuAnchor]);

  const clickDeleteBookInfo = React.useCallback(() => {
    resetMenuAnchor();
    showDeleteDialog();
  }, [showDeleteDialog, resetMenuAnchor]);

  const clickSelectThumbnailBookInfo = React.useCallback(() => {
    resetMenuAnchor();
    setSelectDialog(infoId);
  }, [infoId, resetMenuAnchor]);

  const clickDownloadBook = React.useCallback(() => {
    resetMenuAnchor();
    showDownloadDialog();
  }, [resetMenuAnchor, showDownloadDialog]);

  const onChangeEvent = React.useCallback((k, e) => {
    setEditContent((c) => ({
      ...c,
      [k]: e,
    }));
  }, []);

  const resetEditContentName = React.useCallback(() => {
    setEditContent((c) => ({
      ...c,
      name,
    }));
  }, [name]);

  const hasInvisibleGenre = React.useMemo(() => genres.some((g) => g.invisible), [genres]);
  const [isFavorite, toggleFavorite] = useFavorite(infoId);
  const handleFavoriteClick = React.useCallback(() => {
    resetMenuAnchor();
    toggleFavorite();
  }, [resetMenuAnchor, toggleFavorite]);

  return (
    <div
      ref={ref}
      style={{
        width: thumbnailSize,
        height: pageAspectRatio(thumbnailSize),
      }}
    >
      {keepVisible && (
        <Card className={classes.card} style={style} sx={{ height: '100%' }}>
          {(!simple) && (
            <CardActions className={classes.headerMenu}>
              <IconButton onClick={setMenuAnchor} aria-label="menu" size="large">
                <Icon>more_vert</Icon>
              </IconButton>
              <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={resetMenuAnchor}
              >
                <MenuItem onClick={handleFavoriteClick}>
                  {(isFavorite ? 'Remove from favorite' : 'Favorite')}
                </MenuItem>
                <MenuItem onClick={clickSelectThumbnailBookInfo}>Select Thumbnail</MenuItem>
                <MenuItem onClick={clickEditBookInfo}>Edit</MenuItem>
                <MenuItem onClick={clickDeleteBookInfo}>Delete</MenuItem>
                <MenuItem onClick={clickDownloadBook}>Download</MenuItem>
              </Menu>
            </CardActions>
          )}
          <Link
            className={classes.link}
            state={{ referrer: location.pathname }}
            to={`/info/${infoId}`}
          >
            <CardActionArea sx={{ height: '100%' }}>
              <BookPageImage
                bookId={thumbnail?.bookId}
                pageIndex={thumbnail?.pageIndex}
                bookPageCount={thumbnail?.bookPageCount}
                alt={name}
                width={thumbnailSize}
                height={pageAspectRatio(thumbnailSize)}
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
              {(genres.some((g) => g.name === 'Completed') && !showName) ? (
                <div className={classes.completedLabel}>Completed</div>
              ) : null}
              {(isFavorite) && (
                <Icon
                  sx={{
                    position: 'absolute',
                    right: (t) => t.spacing(1.5),
                    bottom: (t) => `calc(2rem + ${t.spacing(hasInvisibleGenre ? 4 : 1)})`,
                    color: yellow[700],
                  }}
                >
                  star
                </Icon>
              )}
              {(hasInvisibleGenre) && (
                <Icon className={classes.invisibleLabel}>visibility_off</Icon>
              )}
              {((Date.now() - Number(updatedAt)) < NEW_BOOK_INFO_EXPIRED) && (
                <Icon className={classes.newLabel}>tips_and_updates</Icon>
              )}
              {(isReading && !simple) ? (
                <div className={`${classes.labelContainer} ${classes.readLabel}`}>Reading</div>
              ) : null}
            </CardActionArea>
          </Link>

          <DeleteDialog
            open={isShownDeleteDialog}
            loading={delLoading}
            bookInfo={name}
            onClose={hideDeleteDialog}
            onClickDelete={deleteBookInfo}
          />

          <EditDialog
            info
            open={isShownEditDialog}
            loading={editLoading}
            fieldValue={editContent.name}
            genres={editContent.genres}
            onChange={onChangeEvent}
            onClose={hideEditDialog}
            onClickRestore={resetEditContentName}
            onClickEdit={editBookInfo}
          />

          <SelectBookInfoThumbnailDialog
            open={!!selectDialog}
            infoId={selectDialog}
            onClose={hideSelectDialog}
            onEdit={onEdit}
          />

          {(canMountDownloadDialog) && (
            <DownloadDialog
              open={isShownDownloadDialog}
              onClose={hideDownloadDialog}
              id={infoId}
            />
          )}
        </Card>
      )}
    </div>
  );
};

export default React.memo(BookInfo);
