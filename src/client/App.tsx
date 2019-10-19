import * as React from 'react';
import { Route, Router, Switch } from 'react-router-dom';
import * as colors from '@material-ui/core/colors';
import {
  AppBar,
  createMuiTheme,
  createStyles,
  CssBaseline,
  Icon,
  IconButton,
  InputBase,
  ListItem,
  ListItemText,
  makeStyles,
  Menu,
  MenuItem,
  MuiThemeProvider,
  Switch as MSwitch,
  Theme,
  Toolbar,
  Typography,
} from '@material-ui/core';
import { fade } from '@material-ui/core/styles';
import { createBrowserHistory } from 'history';
import { useSnackbar } from 'notistack';

import { useGlobalStore } from '@client/store/StoreProvider';
import useMatchMedia from '@client/hooks/useMatchMedia';
import { SortOrder } from '@client/store/reducers';

import Home from './pages/Home';
import Info from './pages/Info';
import Book from './pages/Book';
import Error from './pages/Error';

export const commonTheme = {
  safeArea: {
    top: 'env(safe-area-inset-top)',
    bottom: 'env(safe-area-inset-bottom)',
    right: 'env(safe-area-inset-right)',
    left: 'env(safe-area-inset-left)',
  },
  appbar: (
    theme: Theme,
    styleName: string,
    calcOption?: string,
  ) => Object.keys(theme.mixins.toolbar)
    .map((key) => {
      const val = theme.mixins.toolbar[key];
      if (key === 'minHeight') {
        return [
          [styleName, `calc(${commonTheme.safeArea.top} + ${val}px${calcOption || ''})`],
          ['fallbacks', {
            [styleName]: (calcOption) ? `calc(${val}px${calcOption})` : val,
          }],
        ];
      }
      return [
        [key, {
          // @ts-ignore
          [styleName]: `calc(${commonTheme.safeArea.top} + ${val.minHeight}px${calcOption || ''})`,
          fallbacks: {
            // @ts-ignore
            [styleName]: (calcOption) ? `calc(${val.minHeight}px${calcOption})` : val.minHeight,
          },
        }],
      ];
    })
    .reduce((o, props) => {
      props.forEach(([k, v]) => {
        // @ts-ignore
        // eslint-disable-next-line no-param-reassign
        o[k] = v;
      });
      return o;
    }, {}),
};

const themes = {
  light: createMuiTheme({
    palette: {
      type: 'light',
      primary: {
        main: colors.green['500'],
      },
      secondary: {
        main: colors.blue.A700,
        contrastText: colors.common.white,
      },
    },
  }),
  dark: createMuiTheme({
    palette: {
      type: 'dark',
      primary: {
        main: colors.green['600'],
      },
      secondary: {
        main: colors.blue.A400,
        contrastText: colors.common.black,
      },
    },
  }),
};

interface AppProps {
  wb: any;
  persistor: any;
}

// @ts-ignore
const useStyles = makeStyles((theme: Theme) => createStyles({
  backIcon: {
    color: 'white',
    marginRight: theme.spacing(1),
  },
  title: {
    color: 'white',
    flexGrow: 1,
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

const history = createBrowserHistory();

const App: React.FC<AppProps> = (props: AppProps) => {
  const { state: store, dispatch } = useGlobalStore();
  const classes = useStyles(props);

  React.useEffect(() => {
    dispatch({ wb: props.wb });
  }, []);


  const theme = useMatchMedia(
    ['(prefers-color-scheme: dark)', '(prefers-color-scheme: light)'],
    ['dark', 'light'],
    'light',
  );

  if (store.theme !== theme) {
    dispatch({ theme });
  }

  const [isShowBack, setShowBack] = React.useState(history.location.pathname.startsWith('/info'));
  const [sortAnchorEl, setSortAnchorEl] = React.useState(null);
  const [menuAnchorEl, setMenuAnchorEl] = React.useState(null);
  const [cacheAnchorEl, setCacheAnchorEl] = React.useState(null);

  const { enqueueSnackbar } = useSnackbar();

  const listener = (location) => {
    setShowBack(['/info', '/book'].some((s) => location.pathname.startsWith(s)));
  };

  history.listen(listener);

  React.useEffect(() => {
    listener(window.location);

    if (props.wb) {
      props.wb.addEventListener('waiting', () => {
        enqueueSnackbar('Update here! Please reload.', {
          variant: 'warning',
          persist: true,
        });
      });
    }

    // https://stackoverflow.com/questions/5573096/detecting-webp-support
    new Promise((resolve) => {
      const imgElem = window.document.createElement('img');
      imgElem.onload = () => {
        resolve(imgElem.width === 2 && imgElem.height === 1);
      };
      imgElem.onerror = () => {
        resolve(false);
      };
      // noinspection SpellCheckingInspection
      imgElem.src = 'data:image/webp;base64,UklGRjIAAABXRUJQVlA4ICYAAACyAgCdASoCAAEALmk0mk0iIiIiIgBoSygABc6zbAAA/v56QAAAAA==';
    }).then((r: boolean) => {
      dispatch({ webp: r });
    });
  }, []);

  const clickBack = () => {
    if (store.backRoute) {
      history.push(store.backRoute);
      dispatch({ backRoute: undefined });
    } else {
      history.goBack();
    }
  };

  const purgeCache = (i) => {
    (i !== 1 ? props.persistor.purge() : Promise.resolve())
      .then(() => {
        if (store.wb && i === 1) {
          navigator.serviceWorker.addEventListener('message', () => {
            window.location.reload();
          });
          store.wb.messageSW({
            type: 'PURGE_CACHE',
          });
          setTimeout(() => {
            window.location.reload();
          }, 10 * 1000);
        } else {
          window.location.reload();
        }
      });
  };

  return (
    <MuiThemeProvider theme={themes[store.theme] || themes.light}>
      <CssBaseline />
      {store.showAppBar && (
        <AppBar className={classes.appBar}>
          <Toolbar>
            {isShowBack && (
              <IconButton className={classes.backIcon} onClick={clickBack}>
                <Icon>arrow_back</Icon>
              </IconButton>
            )}
            <Typography variant="h6" className={classes.title} noWrap>{store.barTitle}</Typography>
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
            <Menu
              getContentAnchorEl={null}
              anchorOrigin={{
                horizontal: 'center',
                vertical: 'bottom',
              }}
              anchorEl={menuAnchorEl}
              open={!!menuAnchorEl}
              onClose={() => setMenuAnchorEl(null)}
            >
              <ListItem style={{ outline: '0' }}>
                <ListItemText>History</ListItemText>
                <MSwitch
                  checked={store.history}
                  onChange={(e) => {
                    dispatch({ history: e.target.checked });
                  }}
                />
              </ListItem>
              <MenuItem onClick={(e) => setSortAnchorEl(e.currentTarget)}>{`Sort: ${store.sortOrder}`}</MenuItem>
              <MenuItem onClick={(e) => setCacheAnchorEl(e.currentTarget)}>
                Cache Control
              </MenuItem>
            </Menu>
            <Menu
              getContentAnchorEl={null}
              anchorOrigin={{
                horizontal: 'center',
                vertical: 'bottom',
              }}
              anchorEl={sortAnchorEl}
              open={!!sortAnchorEl}
              onClose={() => setSortAnchorEl(null)}
            >
              {['Update_Newest', 'Update_Oldest', 'Add_Newest', 'Add_Oldest'].map((order: SortOrder) => (
                <MenuItem
                  key={order}
                  onClick={() => {
                    dispatch({ sortOrder: order });
                    setSortAnchorEl(null);
                  }}
                >
                  {order}
                </MenuItem>
              ))}
            </Menu>
            <Menu
              getContentAnchorEl={null}
              anchorOrigin={{
                horizontal: 'center',
                vertical: 'bottom',
              }}
              anchorEl={cacheAnchorEl}
              open={!!cacheAnchorEl}
              onClose={() => setCacheAnchorEl(null)}
            >
              {['Purge apollo cache', 'Purge cacheStorage', 'Purge All'].map((order, i) => (
                <MenuItem
                  key={order}
                  onClick={() => {
                    purgeCache(i);
                    // setCacheAnchorEl(null);
                  }}
                >
                  {order}
                </MenuItem>
              ))}
            </Menu>
          </Toolbar>
        </AppBar>
      )}
      <main className={store.needContentMargin ? 'appbar--margin' : ''}>
        <Router history={history}>
          <Switch>
            <Route exact path="/" render={(p) => <Home {...p} store={store} />} />
            <Route exact path="/info/:id" render={(p) => <Info {...p} store={store} />} />
            <Route exact path="/book/:id" render={(p) => <Book {...p} store={store} />} />
            <Route render={(p) => <Error {...p} store={store} />} />
          </Switch>
        </Router>
      </main>
    </MuiThemeProvider>
  );
};

// @ts-ignore
App.whyDidYouRender = true;

export default App;
