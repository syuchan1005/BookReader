import * as React from 'react';
import {
  Card,
  CardActionArea,
  CardContent,
  makeStyles,
  createStyles,
  Omit,
} from '@material-ui/core';

import { BookInfo as QLBookInfo } from '../../common/GraphqlTypes';

interface BookInfoProps extends Omit<QLBookInfo, 'infoId'> {
  onClick?: Function;
}

const useStyles = makeStyles(() => createStyles({
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
}));

const BookInfo: React.FC<BookInfoProps> = (props: BookInfoProps) => {
  const classes = useStyles(props);
  const {
    thumbnail,
    name,
    count,
    onClick,
  } = props;
  return (
    <Card className={classes.card}>
      <CardActionArea onClick={(e) => onClick && onClick(e)}>
        <img
          src={thumbnail || `http://placehold.jp/99ccff/003366/100x150.jpg?text=${name}`}
          alt="thumbnail"
          className={classes.thumbnail}
        />
        <CardContent className={classes.cardContent}>
          <div>{name}</div>
          <div>
            {count}
            巻まで
          </div>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default BookInfo;
