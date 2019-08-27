import * as React from 'react';
import { makeStyles } from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
  home: {
    marginTop: theme.spacing(1),
  },
}));

export default (props) => {
  const classes = useStyles(props);

  return (
    <div className={classes.home}>
      Home
    </div>
  );
};
