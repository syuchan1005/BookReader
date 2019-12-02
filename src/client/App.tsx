import * as React from 'react';
import { Route, Router, Switch } from 'react-router-dom';
import * as colors from '@material-ui/core/colors';
import {
  AppBar, Button,
  Checkbox, CircularProgress,
  Collapse,
  createMuiTheme,
  createStyles,
  CssBaseline,
  FormControlLabel,
  Icon,
  IconButton,
  InputAdornment,
  InputBase,
  ListItem,
  ListItemText,
  ListSubheader,
  makeStyles,
  Menu,
  MenuItem,
  MuiThemeProvider,
  Theme,
  Toolbar,
  Typography,
} from '@material-ui/core';
import { fade } from '@material-ui/core/styles';
import { createBrowserHistory } from 'history';
import { useSnackbar } from 'notistack';
import loadable from '@loadable/component';
import { hot } from 'react-hot-loader/root';

import { DebugFolderSizes } from '@common/GraphqlTypes';
import { useGlobalStore } from '@client/store/StoreProvider';
import useMatchMedia from '@client/hooks/useMatchMedia';
import { SortOrder } from '@client/store/reducers';
import { useLazyQuery, useMutation } from '@apollo/react-hooks';

import DebugFolderSizesQuery from '@client/graphqls/App_debug_folderSizes.gql';
import DebugDeleteFolderMutation from '@client/graphqls/App_debug_deleteFolderSizes_mutation.gql';
import ColorTile from '@client/components/ColorTile';

const Home = loadable(() => import(/* webpackChunkName: 'Home' */ './pages/Home'));
const Info = loadable(() => import(/* webpackChunkName: 'Info' */ './pages/Info'));
const Book = loadable(() => import(/* webpackChunkName: 'Book' */ './pages/Book'));
const Error = loadable(() => import(/* webpackChunkName: 'Error' */ './pages/Error'));

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

const wrapSize = (size) => {
  if (!size || size === -1) return '0 [B]';
  const sizes = ['', 'K', 'M', 'G', 'T'];
  let index = sizes.findIndex((v, i) => size / 10 ** (i * 3) < 1) - 1;
  if (index < 0) index = sizes.length - 1;
  return `${(size / 10 ** (index * 3)).toString(10).match(/\d+(\.\d{1,2})?/)[0]} [${sizes[index]}B]`;
};

interface AppProps {
  wb: any;
  persistor: any;
}

// @ts-ignore
const useStyles = makeStyles((theme: Theme) => createStyles({
  backIcon: {
    color: theme.palette.primary.contrastText,
    marginRight: theme.spacing(1),
  },
  title: {
    color: theme.palette.primary.contrastText,
    marginRight: theme.spacing(1),
  },
  subTitle: {
    flexGrow: 1,
    color: theme.palette.primary.contrastText,
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

const history = createBrowserHistory();

const App: React.FC<AppProps> = (props: AppProps) => {
  const { state: store, dispatch } = useGlobalStore();
  const classes = useStyles(props);

  const theme = useMatchMedia(
    ['(prefers-color-scheme: dark)', '(prefers-color-scheme: light)'],
    ['dark', 'light'],
    'light',
  );

  React.useEffect(() => {
    if (store.theme !== theme) {
      dispatch({ theme });
    }
  }, [theme]);

  const [sortAnchorEl, setSortAnchorEl] = React.useState(null);
  const [menuAnchorEl, setMenuAnchorEl] = React.useState(null);
  const [debugAnchorEl, setDebugAnchorEl] = React.useState(null);
  const [openFolderSize, setOpenFolderSize] = React.useState(false);
  const [openCacheControl, setOpenCacheControl] = React.useState(null);

  const [colorAnchorEl, setColorAnchorEl] = React.useState(null);
  const [colorType, setColorType] = React.useState<'primary' | 'secondary'>(undefined);

  const { enqueueSnackbar } = useSnackbar();

  const [getFolderSizes, { refetch, loading, data }] = useLazyQuery<{
    sizes: DebugFolderSizes,
  }>(DebugFolderSizesQuery);

  const [deleteUnusedFolder, { loading: deleteLoading }] = useMutation(DebugDeleteFolderMutation, {
    onCompleted() {
      // noinspection JSIgnoredPromiseFromCall
      refetch();
    },
  });

  React.useEffect(() => {
    if (props.wb) {
      dispatch({ wb: props.wb });
      props.wb.addEventListener('installed', (event) => {
        if (event.isUpdate) {
          enqueueSnackbar('Update here! Please reload.', {
            variant: 'warning',
            persist: true,
          });
        }
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

  const clickBack = React.useCallback(() => {
    if (store.backRoute) {
      history.push(store.backRoute);
      dispatch({ backRoute: undefined });
    } else {
      history.goBack();
    }
  }, [history, store, dispatch]);

  const purgeCache = React.useCallback((i) => {
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
  }, [store]);

  const provideTheme = React.useMemo(
    () => createMuiTheme({
      palette: {
        type: store.theme,
        primary: colors[store.primary],
        secondary: colors[store.secondary],
      },
    }),
    [store.theme, store.primary, store.secondary],
  );

  return (
    <MuiThemeProvider theme={provideTheme}>
      <CssBaseline />
      {store.showAppBar && (
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
                        style={{ color: provideTheme.palette.common.white }}
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
              <ListSubheader style={{ lineHeight: 'normal' }}>
                Show
              </ListSubheader>
              <ListItem style={{ outline: 0, flexDirection: 'column', alignItems: 'flex-start' }}>
                {Object.entries({ history: 'History', invisible: 'Invisible' }).map(([k, v]) => (
                  <FormControlLabel
                    key={k}
                    control={(
                      <Checkbox
                        checked={store[k]}
                        onChange={(e) => dispatch({ [k]: e.target.checked })}
                      />
                    )}
                    label={v}
                  />
                ))}
              </ListItem>
              <MenuItem onClick={(e) => setSortAnchorEl(e.currentTarget)}>
                {`Sort: ${store.sortOrder}`}
              </MenuItem>
              <MenuItem
                onClick={(e) => { setColorType('primary'); setColorAnchorEl(e.currentTarget); }}
              >
                <span>Primary:</span>
                <ColorTile marginLeft color={store.primary} />
              </MenuItem>
              <MenuItem
                onClick={(e) => { setColorType('secondary'); setColorAnchorEl(e.currentTarget); }}
              >
                <span>Secondary:</span>
                <ColorTile marginLeft color={store.secondary} />
              </MenuItem>
              <MenuItem onClick={() => setDebugAnchorEl(!debugAnchorEl)}>
                Debug
                <Icon>{`keyboard_arrow_${debugAnchorEl ? 'up' : 'down'}`}</Icon>
              </MenuItem>
              <Collapse in={debugAnchorEl}>
                <MenuItem onClick={() => setOpenCacheControl(!openCacheControl)}>
                  Cache Control
                  <Icon>{`keyboard_arrow_${openCacheControl ? 'up' : 'down'}`}</Icon>
                </MenuItem>
                <Collapse in={openCacheControl}>
                  {['Purge apollo cache', 'Purge cacheStorage', 'Purge All'].map((order, i) => (
                    <MenuItem
                      key={order}
                      onClick={() => purgeCache(i)}
                      style={{ paddingLeft: provideTheme.spacing(3) }}
                    >
                      {order}
                    </MenuItem>
                  ))}
                </Collapse>
                <MenuItem
                  onClick={() => {
                    if (!openFolderSize) getFolderSizes();
                    setOpenFolderSize(!openFolderSize);
                  }}
                >
                  Folder sizes
                  <Icon>{`keyboard_arrow_${openFolderSize ? 'up' : 'down'}`}</Icon>
                </MenuItem>
                <Collapse in={openFolderSize}>
                  {(deleteLoading || loading || !data) ? (
                    <MenuItem style={{ display: 'flex', justifyContent: 'center' }}>
                      <CircularProgress color="secondary" />
                    </MenuItem>
                  ) : (
                    <>
                      {Object.entries(data.sizes)
                        .filter(([k]) => !k.startsWith('_'))
                        .map(([k, v]) => (
                          <ListItem
                            key={k}
                            style={{
                              paddingLeft: provideTheme.spacing(3),
                              paddingTop: 0,
                              paddingBottom: 0,
                            }}
                          >
                            <ListItemText primary={k} secondary={k.endsWith('Count') ? v : wrapSize(v)} />
                          </ListItem>
                        ))}
                      <ListItem>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => deleteUnusedFolder()}
                        >
                            Delete Unused and Cache
                        </Button>
                      </ListItem>
                    </>
                  )}
                </Collapse>
              </Collapse>
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
              {['Update_Newest', 'Update_Oldest', 'Add_Newest', 'Add_Oldest', 'Name_Asc', 'Name_Desc'].map((order: SortOrder) => (
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
              anchorEl={colorAnchorEl}
              open={!!colorAnchorEl && !!colorType}
              onClose={() => {
                setColorAnchorEl(null);
                setColorType(undefined);
              }}
              PaperProps={{
                style: { maxHeight: provideTheme.spacing(7 * 5) },
              }}
            >
              {Object.keys(colors).map((c) => ((c !== 'common') ? (
                <MenuItem
                  key={c}
                  onClick={() => {
                    dispatch({ [colorType]: c });
                    setColorType(undefined);
                    setColorAnchorEl(null);
                  }}
                >
                  <ColorTile color={c} />
                </MenuItem>
              ) : null))}
            </Menu>
          </Toolbar>
        </AppBar>
      )}
      <main className={store.needContentMargin ? 'appbar--margin' : ''}>
        <Router history={history}>
          <Switch>
            <Route exact path="/" component={Home} />
            <Route exact path="/info/:id" component={Info} />
            <Route exact path="/book/:id" component={Book} />
            <Route component={Error} />
          </Switch>
        </Router>
      </main>
    </MuiThemeProvider>
  );
};

export default hot(App);
