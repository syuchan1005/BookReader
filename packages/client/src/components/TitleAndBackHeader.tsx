import { Icon, IconButton, Toolbar, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { type ReactNode, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SafeAreaAppBar } from '@client/components/SafeAreaAppBar';

const PREFIX = 'TitleAndBackHeader';

const classes = {
  backIcon: `${PREFIX}-backIcon`,
  title: `${PREFIX}-title`,
  subTitle: `${PREFIX}-subTitle`,
  appBar: `${PREFIX}-appBar`,
};

const StyledAppBar = styled(SafeAreaAppBar)(({ theme }) => ({
  [`& .${classes.backIcon}`]: {
    color: theme.palette.common.white,
    marginRight: theme.spacing(1),
  },

  [`& .${classes.title}`]: {
    color: theme.palette.common.white,
    marginRight: theme.spacing(1),
  },

  [`& .${classes.subTitle}`]: {
    flexGrow: 1,
    color: theme.palette.common.white,
    fontSize: '1.25rem',
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontWeight: 500,
    lineHeight: 1.6,
    letterSpacing: '0.0075em',
  },

}));

interface TitleAndBackHeaderProps {
  backRoute?: string;
  title?: string;
  subTitle?: string;
  children?: ReactNode;
  position?: 'fixed' | 'absolute' | 'sticky' | 'static' | 'relative';
}

const TitleAndBackHeader = (props: TitleAndBackHeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { backRoute, title, subTitle, children, position } = props;

  const clickBack = useCallback(() => {
    if (!location.state?.referrer && backRoute) {
      navigate(backRoute, {
        state: { referrer: location.pathname },
      });
    } else {
      navigate(-1); // go back
    }
  }, [navigate, backRoute, location]);

  return (
    <StyledAppBar className={classes.appBar} position={position}>
      <Toolbar>
        <IconButton
          className={classes.backIcon}
          onClick={clickBack}
          size="large"
        >
          <Icon>arrow_back</Icon>
        </IconButton>
        <Typography variant="h6" className={classes.title} noWrap>
          {title}
        </Typography>
        <div className={classes.subTitle}>{subTitle}</div>
        {children}
      </Toolbar>
    </StyledAppBar>
  );
};

export default TitleAndBackHeader;
