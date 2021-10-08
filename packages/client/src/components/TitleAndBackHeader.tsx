import React, { ReactNode } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { AppBar, Icon, IconButton, Toolbar, Typography } from '@mui/material';
import createStyles from '@mui/styles/createStyles';
import makeStyles from '@mui/styles/makeStyles';
import { commonTheme } from '../App';
import { useAppBarScrollElevation } from '@client/hooks/useAppBarScrollElevation';

interface TitleAndBackHeaderProps {
  backRoute?: string;
  title?: string;
  subTitle?: string;
  children?: ReactNode;
}

const useStyles = makeStyles((theme) => createStyles({
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
  const history = useHistory();
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
      history.push(backRoute, { referrer: location.pathname });
    } else {
      history.goBack();
    }
  }, [history, backRoute, location]);

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
