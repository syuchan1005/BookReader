import * as React from 'react';

import {
  Card,
  CardActionArea,
  CardContent,
  makeStyles,
  createStyles,
  Omit,
  Theme,
} from '@material-ui/core';

import { Book as QLBook } from '../../common/GraphqlTypes';

interface BookProps extends Omit<QLBook, 'bookId'> {
  name: string;
  reading?: boolean;
  onClick?: Function;
}

const useStyles = makeStyles((theme: Theme) => createStyles({
  thumbnail: {
    minWidth: '100%',
    height: '250px',
    objectFit: 'contain',
  },
  card: {
    margin: 'auto',
  },
  cardContent: {
    position: 'absolute',
    bottom: '0',
    width: '100%',
    background: 'rgba(0, 0, 0, 0.7)',
    color: 'white',
    fontSize: '1rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  readLabel: {
    position: 'absolute',
    top: 0,
    right: theme.spacing(1),
    background: theme.palette.secondary.main,
    color: theme.palette.secondary.contrastText,
    padding: theme.spacing(1),
    borderRadius: theme.spacing(1),
  },
}));

const Book: React.FC<BookProps> = (props: BookProps) => {
  const classes = useStyles(props);
  const {
    thumbnail,
    number,
    pages,
    name,
    reading,
    onClick,
  } = props;

  return (
    <Card className={classes.card}>
      <CardActionArea onClick={(e) => onClick && onClick(e)}>
        <img
          src={thumbnail || `http://placehold.jp/99ccff/003366/100x150.jpg?text=${name}\n${number}`}
          alt="thumbnail"
          className={classes.thumbnail}
        />
        <CardContent className={classes.cardContent}>
          <div>
            {number}
            巻
          </div>
          <div>
            {pages}
            ページ
          </div>
        </CardContent>
        {reading && (
          <div className={classes.readLabel}>Read</div>
        )}
      </CardActionArea>
    </Card>
  );
};

export default Book;
