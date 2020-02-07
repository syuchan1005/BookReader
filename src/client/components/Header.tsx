import React from 'react';
import {
  AppBar,
  createStyles,
  Icon,
  IconButton,
  InputAdornment,
  InputBase,
  makeStyles,
  Theme,
  Toolbar,
  Typography,
  useTheme,
} from '@material-ui/core';
import { fade } from '@material-ui/core/styles';
import { useHistory } from 'react-router-dom';

import { useGlobalStore } from '@client/store/StoreProvider';
import { commonTheme } from '@client/App';
import HeaderMenu from '@client/components/HeaderMenu';

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
    '& + .appbar--margin': commonTheme.appbar(theme, 'paddingTop'),
    paddingTop: commonTheme.safeArea.top,
  },
  search: {
    position: 'relative',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: fade(theme.palette.common.white, 0.15),
    '&:hover': {
      backgroundColor: fade(theme.palette.common.white, 0.25),
    },
    color: theme.palette.common.white,
    marginLeft: 0,
    width: '100%',
    [theme.breakpoints.up('sm')]: {
      marginLeft: theme.spacing(1),
      width: 'auto',
    },
  },
  searchIcon: {
    width: theme.spacing(7),
    height: '100%',
    position: 'absolute',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputRoot: {
    color: 'inherit',
    width: '100%',
  },
  inputInput: {
    padding: theme.spacing(1, 1, 1, 7),
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('sm')]: {
      width: 120,
      '&:focus': {
        width: 200,
      },
    },
  },
  sortIcon: {
    marginLeft: theme.spacing(1),
    color: 'white',
  },
}));

const Header: React.FC = (props) => {
  const classes = useStyles(props);
  const { state: store, dispatch } = useGlobalStore();
  const history = useHistory();
  const theme = useTheme();

  const [menuAnchorEl, setMenuAnchorEl] = React.useState(null);

  const clickBack = React.useCallback(() => {
    if (store.backRoute) {
      history.push(store.backRoute);
      dispatch({ backRoute: undefined });
    } else {
      history.goBack();
    }
  }, [history, store.backRoute, dispatch]);

  return (
    <AppBar className={classes.appBar}>
      <Toolbar>
        {store.showBackRouteArrow && (
          <IconButton className={classes.backIcon} onClick={clickBack}>
            <Icon>arrow_back</Icon>
          </IconButton>
        )}
        <Typography
          variant="h6"
          className={classes.title}
          noWrap
        >
          {store.barTitle}
        </Typography>
        <div className={classes.subTitle}>{store.barSubTitle}</div>
        {(history.location.pathname === '/') && (
          <div className={classes.search}>
            <div className={classes.searchIcon}>
              <Icon>search</Icon>
            </div>
            <InputBase
              placeholder="Search…"
              classes={{
                root: classes.inputRoot,
                input: classes.inputInput,
              }}
              inputProps={{ 'aria-label': 'search' }}
              endAdornment={(store.searchText) ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    style={{ color: theme.palette.common.white }}
                    onClick={() => {
                      dispatch({ searchText: '' });
                    }}
                  >
                    <Icon>clear</Icon>
                  </IconButton>
                </InputAdornment>
              ) : undefined}
              value={store.searchText}
              onChange={(e) => {
                dispatch({ searchText: e.target.value });
              }}
            />
          </div>
        )}
        {(history.location.pathname === '/') && (
          <IconButton
            size="small"
            className={classes.sortIcon}
            onClick={(event) => setMenuAnchorEl(event.currentTarget)}
            aria-label="sort"
          >
            <Icon>sort</Icon>
          </IconButton>
        )}
        <HeaderMenu
          menuAnchorEl={menuAnchorEl}
          setMenuAnchorEl={setMenuAnchorEl}
        />
      </Toolbar>
    </AppBar>
  );
};

export default Header;
