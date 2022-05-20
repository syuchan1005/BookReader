import React from 'react';
import { Skeleton, Theme } from '@mui/material';
import { createStyles, makeStyles } from '@mui/styles';
import { pageAspectRatio } from './BookPageImage';

const useStyles = makeStyles((theme: Theme) => createStyles({
  homeGrid: {
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

export const HeaderWithBookListSkeleton = (props) => {
  const classes = useStyles(props);
  return (
    <div>
      <Skeleton variant="rectangular" width="100%" height={72} />
      <div className={classes.homeGrid}>
        <Skeleton variant="rectangular" height="100%" />
      </div>
      <div style={{ position: 'absolute', right: 16, bottom: 80 }}>
        <Skeleton variant="circular" width={64} height={64} />
        <Skeleton variant="circular" width={64} height={64} style={{ marginTop: 16 }} />
      </div>
      <Skeleton
        variant="rectangular"
        width="100%"
        height={64}
        style={{ position: 'absolute', bottom: 0 }}
      />
    </div>
  );
};
