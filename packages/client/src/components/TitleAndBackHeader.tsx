import React, { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar, Icon, IconButton, Theme, Toolbar, Typography,
} from '@mui/material';
import createStyles from '@mui/styles/createStyles';
import makeStyles from '@mui/styles/makeStyles';
import { useAppBarScrollElevation } from '@client/hooks/useAppBarScrollElevation';
import { commonTheme } from '../App';

interface TitleAndBackHeaderProps {
  backRoute?: string;
  title?: string;
  subTitle?: string;
  children?: ReactNode;
}

const useStyles = makeStyles((theme: Theme) => createStyles({
  backIcon: {
    color: theme.palette.common.white,
    marginRight: theme.spacing(1),
  },
  title: {
    color: theme.palette.common.white,
    marginRight: theme.spacing(1),
  },
  subTitle: {
    flexGrow: 1,
    color: theme.palette.common.white,
    fontSize: '1.25rem',
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontWeight: 500,
    lineHeight: 1.6,
    letterSpacing: '0.0075em',
  },
  appBar: {
    paddingTop: commonTheme.safeArea.top,
  },
}));

const TitleAndBackHeader = (props: TitleAndBackHeaderProps) => {
  const classes = useStyles(props);
  const navigate = useNavigate();
  const location = useLocation();
  const {
    backRoute,
    title,
    subTitle,
    children,
  } = props;

  const clickBack = React.useCallback(() => {
    // @ts-ignore
    if (!location.state?.referrer && backRoute) {
      navigate(
        backRoute,
        {
          state: { referrer: location.pathname },
        },
      );
    } else {
      navigate(-1); // go back
    }
  }, [navigate, backRoute, location]);

  const elevation = useAppBarScrollElevation();

  return (
    <AppBar className={classes.appBar} elevation={elevation}>
      <Toolbar>
        <IconButton className={classes.backIcon} onClick={clickBack} size="large">
          <Icon>arrow_back</Icon>
        </IconButton>
        <Typography
          variant="h6"
          className={classes.title}
          noWrap
        >
          {title}
        </Typography>
        <div className={classes.subTitle}>
          {subTitle}
        </div>
        {children}
      </Toolbar>
    </AppBar>
  );
};

export default React.memo(TitleAndBackHeader);
