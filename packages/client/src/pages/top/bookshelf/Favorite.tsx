import BookInfo from '@client/components/BookInfo';
import { pageAspectRatio } from '@client/components/BookPageImage';
import { useMediaQuery } from '@client/hooks/useMediaQuery';
import { useTitle } from '@client/hooks/useTitle';
import db, { BookInfoFavorite } from '@client/indexedDb/Database';
import { Theme, Typography, useTheme } from '@mui/material';
import createStyles from '@mui/styles/createStyles';
import makeStyles from '@mui/styles/makeStyles';
import { useBookInfosQuery } from '@syuchan1005/book-reader-graphql';
import { useCallback, useEffect, useState } from 'react';

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

const Favorite = () => {
  useTitle('BookShelf');
  const classes = useStyles();
  const theme = useTheme();

  const downSm = useMediaQuery(theme.breakpoints.down('sm'));

  const [favoriteBookInfos, setFavoriteBookInfos] = useState<
    BookInfoFavorite[]
  >([]);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const getFavoriteBookInfos = useCallback(() => {
    let after;
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
  const { loading, data } = useBookInfosQuery({
    skip: favoriteBookInfos.length === 0,
    variables: {
      ids: favoriteBookInfos.map((bookInfo) => bookInfo.infoId),
    },
    onCompleted() {
      setFavoriteLoading(false);
    },
    onError() {
      setFavoriteLoading(false);
    },
  });

  return (
    <>
      {(data?.bookInfos) && (
        <Typography
          variant='h6'
          sx={{ margin: theme.spacing(1) }}
        >
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
            onVisible={(index, isVisible, isFirstVisible) => {
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

export default Favorite;
