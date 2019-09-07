import * as React from 'react';

import {
  Card,
  CardActionArea,
  CardContent,
  makeStyles,
  createStyles,
  Omit,
} from '@material-ui/core';

import { Book as QLBook } from '../../common/GraphqlTypes';

interface BookProps extends Omit<QLBook, 'bookId'> {
  name: string;
  onClick?: Function;
}

const useStyles = makeStyles((theme) => createStyles({
  thumbnail: {
    maxWidth: '200px',
    marginBottom: theme.spacing(1),
  },
  card: {
    maxWidth: '250px',
  },
  cardContent: {
    paddingBottom: `${theme.spacing(1)}px !important`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
}));

const Book: React.FC<BookProps> = (props: BookProps) => {
  const classes = useStyles(props);
  const {
    thumbnail,
    number,
    pages,
    name,
    onClick,
  } = props;

  return (
    <Card className={classes.card}>
      <CardActionArea onClick={(e) => onClick && onClick(e)}>
        <CardContent className={classes.cardContent}>
          <img
            src={thumbnail || `http://placehold.jp/99ccff/003366/100x150.jpg?text=${name}\n${number}`}
            alt="thumbnail"
            className={classes.thumbnail}
          />
          <div>
            {name}
            {number}
            巻
          </div>
          <div>
            {pages}
            ページ
          </div>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default Book;
