import * as React from 'react';
import {
  makeStyles,
  createStyles,
  Theme,
  Fab,
  Icon, Typography,
} from '@material-ui/core';
import { useHistory } from 'react-router-dom';
import { useGlobalStore } from '@client/store/StoreProvider';

const useStyles = makeStyles((theme: Theme) => createStyles({
  error: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    marginTop: theme.spacing(2),
  },
  backIcon: {
    marginRight: theme.spacing(1),
  },
}));

const Error: React.FC = (props) => {
  const classes = useStyles(props);
  const { dispatch } = useGlobalStore();
  const history = useHistory();

  React.useEffect(() => {
    dispatch({
      barTitle: 'Error',
    });
  }, []);

  return (
    <div className={classes.error}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 38 17">
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
      <Typography>404 - Not Found</Typography>
      <Fab
        className={classes.backButton}
        color="secondary"
        variant="extended"
        onClick={() => history.push('/')}
      >
        <Icon className={classes.backIcon}>send</Icon>
        Go to homepage
      </Fab>
    </div>
  );
};

// @ts-ignore
Error.whyDidYouRender = true;

export default Error;
