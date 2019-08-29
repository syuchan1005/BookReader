import * as React from 'react';

import {
  Card,
  CardActionArea,
  CardContent,
  makeStyles,
} from '@material-ui/core';

import { Book as QLBook } from '../../common/GraphqlTypes';

interface BookProps extends Omit<QLBook, 'bookId'> {
  onClick?: Function,
}

const useStyles = makeStyles((theme) => ({
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
    info: { name },
    onClick,
  } = props;

  return (
    <Card className={classes.card}>
      <CardActionArea onClick={(e) => onClick && onClick(e)}>
        <CardContent className={classes.cardContent}>
          <img src={thumbnail} alt="thumbnail" className={classes.thumbnail} />
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
