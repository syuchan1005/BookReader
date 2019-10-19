import * as React from 'react';
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
import * as DeleteBookInfoMutation from '@client/graphqls/BookInfo_deleteBookInfo.gql';
import * as EditBookInfoMutation from '@client/graphqls/BookInfo_editBookInfo.gql';

import DeleteDialog from '@client/components/dialogs/DeleteDialog';
import EditDialog from '@client/components/dialogs/EditDialog';
import { BookInfo as QLBookInfo, BookInfoResult, Result } from '@common/GraphqlTypes';
import Img from './Img';
import SelectBookInfoThumbnailDialog from './dialogs/SelectBookInfoThumbnailDialog';

interface BookInfoProps extends QLBookInfo {
  style?: React.CSSProperties;
  thumbnailSize?: number;

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
    margin: 'auto',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  cardContent: {
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
    onClick,
    onDeleted,
    onEdit,
  } = props;

  const [menuAnchor, setMenuAnchor] = React.useState(null);
  const [askDelete, setAskDelete] = React.useState(false);
  const [editDialog, setEditDialog] = React.useState(false);
  const [editContent, setEditContent] = React.useState({
    name,
  });
  const [selectDialog, setSelectDialog] = React.useState<string | undefined>(undefined);

  const [deleteBookInfo, { loading: delLoading }] = useMutation<{ del: BookInfoResult }>(
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

  const [editBookInfo, { loading: editLoading }] = useMutation<{ edit: Result }>(
    EditBookInfoMutation,
    {
      variables: {
        id: infoId,
        ...editContent,
      },
      onCompleted(d) {
        if (!d) return;
        setEditDialog(!d.edit.success);
        if (d.edit.success && onEdit) onEdit();
      },
    },
  );

  const clickEditBookInfo = () => {
    setMenuAnchor(null);
    setEditDialog(true);
  };

  const clickDeleteBookInfo = () => {
    setMenuAnchor(null);
    setAskDelete(true);
  };

  const clickSelectThumbnailBookInfo = () => {
    setMenuAnchor(null);
    setSelectDialog(infoId);
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
          keepMounted
          open={Boolean(menuAnchor)}
          onClose={() => setMenuAnchor(null)}
        >
          <MenuItem onClick={clickSelectThumbnailBookInfo}>Select Thumbnail</MenuItem>
          <MenuItem onClick={clickEditBookInfo}>Edit</MenuItem>
          <MenuItem onClick={clickDeleteBookInfo}>Delete</MenuItem>
        </Menu>
      </CardActions>
      <CardActionArea onClick={(e) => onClick && onClick(e)}>
        <Img
          src={thumbnail ? thumbnail.replace('.jpg', `_${thumbnailSize}x0.jpg`) : undefined}
          alt={name}
          className={classes.thumbnail}
          noSave={false}
        />
        <CardContent className={classes.cardContent}>
          <div>{count}</div>
        </CardContent>
        {(history) ? (
          <div className={classes.historyLabel}>History</div>
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
        onChange={(n) => setEditContent({ ...editContent, name: n })}
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
    </Card>
  );
};

// @ts-ignore
BookInfo.whyDidYouRender = true;

export default BookInfo;
