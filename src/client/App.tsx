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
} from '@material-ui/core';
import { createBrowserHistory } from 'history';

import Home from './pages/Home';
import Info from './pages/Info';
import Error from './pages/Error';

const theme = createMuiTheme({
  palette: {
    primary: { main: colors.green['500'] },
    secondary: { main: colors.blue.A700 },
    text: { secondary: 'white' },
  },
});

const useStyles = makeStyles((th) => ({
  backIcon: {
    color: 'white',
    marginRight: th.spacing(1),
  },
}));

const history = createBrowserHistory();

export default (props) => {
  const classes = useStyles(props);
  const [isShowBack, setShowBack] = React.useState(history.location.pathname.startsWith('/info'));
  history.listen((location) => {
    setShowBack(location.pathname.startsWith('/info'));
  });

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar>
        <Toolbar>
          {isShowBack && (
            <IconButton className={classes.backIcon} onClick={() => history.goBack()}>
              <Icon>arrow_back</Icon>
            </IconButton>
          )}
          <Typography variant="h6" color="textSecondary" noWrap>Book Reader</Typography>
        </Toolbar>
      </AppBar>
      <main style={{ marginTop: '64px' }}>
        <Router history={history}>
          <Switch>
            <Route exact path="/" component={Home} />
            <Route exact path="/info/:id" component={Info} />
            <Route component={Error} />
          </Switch>
        </Router>
      </main>
    </MuiThemeProvider>
  );
};
