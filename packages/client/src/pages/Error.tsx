import { useTitle } from '@client/hooks/useTitle';
import { Fab, Icon, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTestId } from '../hooks/useTestId';

const PREFIX = 'ErrorComponent';

const classes = {
  oops: `${PREFIX}-oops`,
  backButton: `${PREFIX}-backButton`,
  backIcon: `${PREFIX}-backIcon`,
};

const Root = styled('main')(({ theme }) => ({
  '&': {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },

  [`& .${classes.oops}`]: {
    margin: theme.spacing(2),
    maxWidth: '70vw',
    maxHeight: '30vw',
  },

  [`& .${classes.backButton}`]: {
    marginTop: theme.spacing(3),
  },

  [`& .${classes.backIcon}`]: {
    transform: 'rotate(-35deg)',
    marginRight: theme.spacing(0.75),
    marginLeft: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
}));

const ErrorComponent = (_props) => {
  useTitle('Error');

  const navigate = useNavigate();
  const location = useLocation();
  const svgTestId = useTestId('svg');
  const textTestId = useTestId('text');
  const buttonTestId = useTestId('button');

  return (
    <Root>
      <svg
        {...svgTestId}
        className={classes.oops}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 38 17"
      >
        <title>Oops!</title>
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
        <text y="12" fill="url(#g)">
          Oops!
        </text>
      </svg>
      <Typography {...textTestId}>404 - Not Found</Typography>
      <Fab
        {...buttonTestId}
        className={classes.backButton}
        color="secondary"
        variant="extended"
        onClick={() =>
          navigate('/', { state: { referrer: location.pathname } })
        }
      >
        <Icon className={classes.backIcon}>send</Icon>
        Go to homepage
      </Fab>
    </Root>
  );
};

export default ErrorComponent;
