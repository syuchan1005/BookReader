import React from 'react';
import makeStyles from '@mui/styles/makeStyles';
import { Theme, useTheme } from '@mui/material';
import createStyles from '@mui/styles/createStyles';
import { pageAspectRatio } from '@client/components/BookPageImage';
import useMediaQuery from '@client/hooks/useMediaQuery';
import db, { BookInfoFavorite } from '@client/indexedDb/Database';
import { useBookInfosQuery } from '@syuchan1005/book-reader-graphql/generated/GQLQueries';
import BookInfo from '@client/components/BookInfo';
import { useTitle } from '@client/hooks/useTitle';

const useStyles = makeStyles((theme: Theme) => createStyles({
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
}));

const defaultLoadBookInfosCount = 20;

const Favorite = () => {
  useTitle('BookShelf');
  const classes = useStyles();
  const theme = useTheme();

  const downSm = useMediaQuery(theme.breakpoints.down('sm'));

  const [favoriteBookInfos, setFavoriteBookInfos] = React.useState<BookInfoFavorite[]>([]);
  const [favoriteLoading, setFavoriteLoading] = React.useState(false);
  const getFavoriteBookInfos = React.useCallback(() => {
    let after;
    if (favoriteBookInfos.length > 0) {
      after = favoriteBookInfos[favoriteBookInfos.length - 1].createdAt;
    }
    setFavoriteLoading(true);
    db.bookInfoFavorite.getAll(
      defaultLoadBookInfosCount,
      {
        key: 'createdAt',
        direction: 'prev',
        after,
      },
    )
      .then((bookInfos) => {
        setFavoriteBookInfos((p) => [...p, ...bookInfos]);
        setFavoriteLoading(false);
      })
      .catch(() => {
        setFavoriteLoading(false);
      });
  }, [favoriteBookInfos]);
  React.useEffect(() => {
    getFavoriteBookInfos();
    // eslint-disable-next-line
  }, []);
  const {
    loading,
    data,
  } = useBookInfosQuery({
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
    <div className={classes.grid}>
      {(data?.bookInfos ?? []).map((info, i, arr) => (
        <BookInfo
          key={info.id}
          {...info}
          simple
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
  );
};

export default Favorite;
