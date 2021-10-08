import React from 'react';
import {
  Theme, Fab, Icon, Typography,
} from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import createStyles from '@mui/styles/createStyles';
import { useHistory, useLocation } from 'react-router-dom';
import { defaultTitle } from '@syuchan1005/book-reader-common';
import useTestId from '../hooks/useTestId';

const useStyles = makeStyles((theme: Theme) => createStyles({
  error: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  oops: {
    margin: theme.spacing(2),
    maxWidth: '70vw',
    maxHeight: '30vw',
  },
  backButton: {
    marginTop: theme.spacing(3),
  },
  backIcon: {
    transform: 'rotate(-35deg)',
    marginRight: theme.spacing(0.75),
    marginLeft: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
}));

const Error = (props) => {
  const classes = useStyles(props);
  const history = useHistory();
  const location = useLocation();
  const svgTestId = useTestId('svg');
  const textTestId = useTestId('text');
  const buttonTestId = useTestId('button');

  React.useEffect(() => {
    document.title = defaultTitle;
  }, []);

  return (
    <main className={classes.error}>
      <svg
        {...svgTestId}
        className={classes.oops}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 38 17"
      >
        <defs>
          <linearGradient id="g">
            <stop stopColor="#FF0018" offset="0%" />
            <stop stopColor="#FFA52C" offset="18%" />
            <stop stopColor="#FFFF41" offset="36%" />
            <stop stopColor="#008018" offset="54%" />
            <stop stopColor="#0000F9" offset="72%" />
            <stop stopColor="#86007D" offset="100%" />
          </linearGradient>
        </defs>
        <text y="12" fill="url(#g)">Oops!</text>
      </svg>
      <Typography {...textTestId}>404 - Not Found</Typography>
      <Fab
        {...buttonTestId}
        className={classes.backButton}
        color="secondary"
        variant="extended"
        onClick={() => history.push('/', { referrer: location.pathname })}
      >
        <Icon className={classes.backIcon}>send</Icon>
        Go to homepage
      </Fab>
    </main>
  );
};

export default React.memo(Error);
