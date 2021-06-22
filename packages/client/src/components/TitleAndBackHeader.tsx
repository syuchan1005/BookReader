import React, { ReactNode } from 'react';
import { useHistory } from 'react-router-dom';
import {
  AppBar,
  createStyles,
  Icon,
  IconButton,
  makeStyles,
  Toolbar,
  Typography,
} from '@material-ui/core';
import { commonTheme } from '../App';

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

const TitleAndBackHeader: React.FC<TitleAndBackHeaderProps> = (props: TitleAndBackHeaderProps) => {
  const classes = useStyles(props);
  const history = useHistory();
  const {
    backRoute,
    title,
    subTitle,
    children,
  } = props;

  const clickBack = React.useCallback(() => {
    if (backRoute) history.push(backRoute);
    else history.goBack();
  }, [history, backRoute]);

  return (
    <AppBar className={classes.appBar}>
      <Toolbar>
        <IconButton className={classes.backIcon} onClick={clickBack}>
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
