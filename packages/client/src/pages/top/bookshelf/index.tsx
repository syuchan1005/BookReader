import { useQuery } from '@apollo/client/react';
import BookInfo from '@client/components/BookInfo';
import { pageAspectRatio } from '@client/components/BookPageImage';
import { useConfirmDialog } from '@client/components/dialogs/ConfirmDialog';
import { useMediaQuery } from '@client/hooks/useMediaQuery';
import { useMenuAnchor } from '@client/hooks/useMenuAnchor';
import { useTitle } from '@client/hooks/useTitle';
import db, {
  type BookInfoFavorite,
  type DownloadedBook,
} from '@client/indexedDb/Database';
import {
  Card,
  CardActionArea,
  Icon,
  IconButton,
  Menu,
  MenuItem,
  type Theme,
  Typography,
  useTheme,
} from '@mui/material';
import createStyles from '@mui/styles/createStyles';
import makeStyles from '@mui/styles/makeStyles';
import { BookInfosDocument } from '@syuchan1005/book-reader-graphql';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    grid: {
      padding: theme.spacing(1),
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, 200px) [end]',
      gridTemplateRows: `repeat(auto-fit, ${pageAspectRatio(200)}px)`,
      justifyContent: 'center',
      columnGap: theme.spacing(2),
      rowGap: theme.spacing(2),
      [theme.breakpoints.down('sm')]: {
        gridTemplateColumns: 'repeat(auto-fill, 150px) [end]',
        gridTemplateRows: `repeat(auto-fit, ${pageAspectRatio(150)}px)`,
      },
    },
  }),
);

const defaultLoadBookInfosCount = 20;

const BookShelfContent = () => {
  useTitle('BookShelf');

  return (
    <>
      <DownloadedBooks />
      <Favorite />
    </>
  );
};

const DownloadedBooks = () => {
  const classes = useStyles();
  const theme = useTheme();

  const [downloadedBooks, setDownloadedBooks] = useState<
    Omit<DownloadedBook, 'bookZipArchive'>[]
  >([]);
  const [updateDownloadedBooks, setUpdateDownloadedBooks] = useState(0);
  // biome-ignore lint/correctness/useExhaustiveDependencies: updateDownloadedBooks
  useEffect(() => {
    db.downloadedBook
      .getAll(
        Number.MAX_SAFE_INTEGER,
        { key: 'createdAt', direction: 'prev' },
        undefined,
        ({ bookZipArchive, ...v }) => v,
      )
      .then((books) => {
        setDownloadedBooks(books);
      });
  }, [updateDownloadedBooks]);

  const handleDelete = useCallback((bookId: string) => {
    db.downloadedBook.delete(bookId).then(() => {
      setUpdateDownloadedBooks((prev) => prev + 1);
    });
  }, []);

  const { open, close, dialogElement } = useConfirmDialog({
    title: 'Delete All Downloads',
    content: 'Are you sure you want to delete all downloaded books?',
    confirmText: 'Delete All',
    onClickConfirm: async () => {
      await db.downloadedBook.clear();
      setUpdateDownloadedBooks((prev) => prev + 1);
      close();
    },
  });

  return (
    <>
      {dialogElement}
      {downloadedBooks.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            margin: theme.spacing(1),
          }}
        >
          <Typography variant="h6">Downloads</Typography>
          <IconButton onClick={open} aria-label="delete all downloads">
            <Icon>delete_sweep</Icon>
          </IconButton>
        </div>
      )}
      <div className={classes.grid}>
        {downloadedBooks.map((book) => (
          <Book
            key={book.bookId}
            book={book}
            onDelete={() => handleDelete(book.bookId)}
          />
        ))}
      </div>
    </>
  );
};

const Book = (props: {
  book: Omit<DownloadedBook, 'bookZipArchive'>;
  onDelete: () => void;
}) => {
  const { book, onDelete } = props;
  const theme = useTheme();
  const downSm = useMediaQuery(theme.breakpoints.down('sm'));

  const [menuAnchor, setMenuAnchor, resetMenuAnchor] = useMenuAnchor();
  return (
    <Card key={book.bookId}>
      <CardActionArea style={{ zIndex: 1 }}>
        <IconButton
          onClick={setMenuAnchor}
          aria-label="menu"
          size="large"
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
          }}
        >
          <Icon>more_vert</Icon>
        </IconButton>
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={resetMenuAnchor}
        >
          <MenuItem
            onClick={() => {
              resetMenuAnchor();
              onDelete();
            }}
          >
            Delete download cache
          </MenuItem>
        </Menu>
      </CardActionArea>
      <CardActionArea
        component={Link}
        to={`/book/${book.bookId}`}
        style={{ height: '100%' }}
      >
        <img
          src={URL.createObjectURL(book.thumbnail)}
          alt={book.bookName}
          width={downSm ? 150 : 200}
          height="100%"
          style={{ objectFit: 'contain' }}
        />
      </CardActionArea>
    </Card>
  );
};

const Favorite = () => {
  const classes = useStyles();
  const theme = useTheme();

  const downSm = useMediaQuery(theme.breakpoints.down('sm'));

  const [favoriteBookInfos, setFavoriteBookInfos] = useState<
    BookInfoFavorite[]
  >([]);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const getFavoriteBookInfos = useCallback(() => {
    let after: Date | undefined;
    if (favoriteBookInfos.length > 0) {
      after = favoriteBookInfos[favoriteBookInfos.length - 1].createdAt;
    }
    setFavoriteLoading(true);
    db.bookInfoFavorite
      .getAll(defaultLoadBookInfosCount, {
        key: 'createdAt',
        direction: 'prev',
        after,
      })
      .then((bookInfos) => {
        setFavoriteBookInfos((p) => [...p, ...bookInfos]);
        setFavoriteLoading(false);
      })
      .catch(() => {
        setFavoriteLoading(false);
      });
  }, [favoriteBookInfos]);
  // biome-ignore lint/correctness/useExhaustiveDependencies: getFavoriteBookInfos
  useEffect(() => {
    getFavoriteBookInfos();
  }, []);
  const { loading, data } = useQuery(BookInfosDocument, {
    skip: favoriteBookInfos.length === 0,
    variables: {
      ids: favoriteBookInfos.map((bookInfo) => bookInfo.infoId),
    },
  });
  useEffect(() => {
    if (!loading) {
      setFavoriteLoading(false);
    }
  }, [loading]);

  return (
    <>
      {data?.bookInfos && (
        <Typography variant="h6" sx={{ margin: theme.spacing(1) }}>
          Favorites
        </Typography>
      )}
      <div className={classes.grid}>
        {(data?.bookInfos ?? []).map((info, i, arr) => (
          <BookInfo
            key={info.id}
            {...info}
            thumbnailSize={downSm ? 150 : 200}
            showName
            index={i}
            onVisible={(index, _isVisible, isFirstVisible) => {
              if (!isFirstVisible) {
                return;
              }
              if (arr.length - 1 === index && !loading && !favoriteLoading) {
                getFavoriteBookInfos();
              }
            }}
          />
        ))}
      </div>
    </>
  );
};

export default BookShelfContent;
