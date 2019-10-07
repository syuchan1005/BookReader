import * as React from 'react';
import { Router, Route, Switch } from 'react-router-dom';
import * as colors from '@material-ui/core/colors';
import {
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Icon,
  MuiThemeProvider,
  createMuiTheme,
  makeStyles,
  createStyles,
  InputBase,
  Menu,
  MenuItem,
  Theme,
  ListItem,
  ListItemText,
  Switch as MSwitch,
} from '@material-ui/core';
import { fade } from '@material-ui/core/styles';
import { createBrowserHistory } from 'history';
import { useLocalStore, Observer } from 'mobx-react';

import Home from './pages/Home';
import Info from './pages/Info';
import Book from './pages/Book';
import Error from './pages/Error';
import useMatchMedia from './hooks/useMatchMedia';

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
        contrastText: colors.common.white,
      },
    },
  }),
};

interface AppProps {
  wb: any;
}

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
    '& + .appbar--margin': {
      paddingTop: 'calc(env(safe-area-inset-top, 0) + 64px)',
    },
    paddingTop: 'env(safe-area-inset-top)',
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
  const store = useLocalStore(() => ({
    showAppBar: true,
    needContentMargin: true,
    barTitle: 'Book Reader',
    backRoute: undefined,
    wb: props.wb,
    searchText: '',
    sortOrder: 'Update_Newest',
    history: false,
    theme: 'light',
    webp: false,
  }));
  const classes = useStyles(props);

  const theme = useMatchMedia(
    ['(prefers-color-scheme: dark)', '(prefers-color-scheme: light)'],
    ['dark', 'light'],
    'light',
  );

  if (store.theme !== theme) {
    store.theme = theme;
  }

  const [isShowBack, setShowBack] = React.useState(history.location.pathname.startsWith('/info'));
  const [sortAnchorEl, setSortAnchorEl] = React.useState(null);
  const [menuAnchorEl, setMenuAnchorEl] = React.useState(null);

  const listener = (location) => {
    setShowBack(['/info', '/book'].some((s) => location.pathname.startsWith(s)));
  };
  history.listen(listener);
  React.useEffect(() => {
    listener(window.location);

    // https://stackoverflow.com/questions/5573096/detecting-webp-support
    new Promise((resolve) => {
      const imgElem = window.document.createElement('img');
      imgElem.onload = () => { resolve(imgElem.width === 2 && imgElem.height === 1); };
      imgElem.onerror = () => { resolve(false); };
      // noinspection SpellCheckingInspection
      imgElem.src = 'data:image/webp;base64,UklGRjIAAABXRUJQVlA4ICYAAACyAgCdASoCAAEALmk0mk0iIiIiIgBoSygABc6zbAAA/v56QAAAAA==';
    }).then((r: boolean) => {
      store.webp = r;
    });
  }, []);

  const clickBack = () => {
    if (store.backRoute) {
      history.push(store.backRoute);
      store.backRoute = undefined;
    } else {
      history.goBack();
    }
  };

  return (
    <MuiThemeProvider theme={themes[store.theme] || themes.light}>
      <CssBaseline />
      <Observer>
        {() => (store.showAppBar ? (
          <AppBar className={classes.appBar}>
            <Toolbar>
              {isShowBack && (
                <IconButton className={classes.backIcon} onClick={clickBack}>
                  <Icon>arrow_back</Icon>
                </IconButton>
              )}
              <Typography variant="h6" className={classes.title} noWrap>{store.barTitle}</Typography>
              {(history.location.pathname === '/') ? (
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
                    onChange={(e) => { store.searchText = e.target.value; }}
                  />
                </div>
              ) : null}
              {(history.location.pathname === '/') ? (
                <IconButton
                  size="small"
                  className={classes.sortIcon}
                  onClick={(event) => setMenuAnchorEl(event.currentTarget)}
                >
                  <Icon>sort</Icon>
                </IconButton>
              ) : null}
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
                <ListItem>
                  <ListItemText>History</ListItemText>
                  <MSwitch
                    checked={store.history}
                    onChange={(e) => { store.history = e.target.checked; }}
                  />
                </ListItem>
                <MenuItem onClick={(e) => setSortAnchorEl(e.currentTarget)}>{`Sort: ${store.sortOrder}`}</MenuItem>
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
                {['Update_Newest', 'Update_Oldest', 'Add_Newest', 'Add_Oldest'].map((order) => (
                  <MenuItem
                    key={order}
                    onClick={() => {
                      store.sortOrder = order;
                      setSortAnchorEl(null);
                    }}
                  >
                    {order}
                  </MenuItem>
                ))}
              </Menu>
            </Toolbar>
          </AppBar>
        ) : null)}
      </Observer>
      <Observer>
        {() => (
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
        )}
      </Observer>
    </MuiThemeProvider>
  );
};

export default App;
