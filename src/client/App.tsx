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
} from '@material-ui/core';
import { createBrowserHistory } from 'history';
import { useLocalStore, Observer } from 'mobx-react';

import Home from './pages/Home';
import Info from './pages/Info';
import Book from './pages/Book';
import Error from './pages/Error';

const theme = createMuiTheme({
  palette: {
    primary: {
      main: colors.green['500'],
    },
    secondary: {
      main: colors.blue.A700,
      contrastText: colors.common.white,
    },
  },
});

interface AppProps {
  wb: any;
}

const useStyles = makeStyles((th) => createStyles({
  backIcon: {
    color: 'white',
    marginRight: th.spacing(1),
  },
  title: {
    color: 'white',
  },
  appBar: {
    '& + .appbar--margin': {
      marginTop: 'calc(env(safe-area-inset-top, 0) + 64px)',
    },
    paddingTop: 'env(safe-area-inset-top)',
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
  }));
  const classes = useStyles(props);
  const [isShowBack, setShowBack] = React.useState(history.location.pathname.startsWith('/info'));
  const listener = (location) => {
    setShowBack(['/info', '/book'].some((s) => location.pathname.startsWith(s)));
  };
  history.listen(listener);
  React.useEffect(() => {
    listener(window.location);
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
    <MuiThemeProvider theme={theme}>
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
