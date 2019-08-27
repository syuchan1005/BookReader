import * as React from 'react';
import { BrowserRouter, Route } from 'react-router-dom';
import green from '@material-ui/core/colors/green';
import {
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  makeStyles,
} from '@material-ui/core';

import Home from './pages/Home';

const useStyles = makeStyles((/* theme */) => ({
  appbar: {
    background: green['500'],
  },
}));

export default (props) => {
  const classes = useStyles(props);

  return (
    <div>
      <CssBaseline />
      <AppBar position="relative">
        <Toolbar className={classes.appbar}>
          <Typography variant="h6" noWrap>Book Reader</Typography>
        </Toolbar>
      </AppBar>
      <main>
        <BrowserRouter>
          <div>
            <Route exact path="/" component={Home} />
          </div>
        </BrowserRouter>
      </main>
    </div>
  );
};
