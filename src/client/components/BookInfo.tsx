import * as React from 'react';
import {
  Card,
  CardActionArea,
  CardContent,
  makeStyles,
} from '@material-ui/core';

import { BookInfo as QLBookInfo } from '../../common/GraphqlTypes';

interface BookInfoProps extends Omit<QLBookInfo, 'infoId'> {
  onClick?: Function;
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
        <CardContent className={classes.cardContent}>
          <img src={thumbnail} alt="thumbnail" className={classes.thumbnail} />
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
