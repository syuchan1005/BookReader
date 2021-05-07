import React from 'react';
import { Route, Router, Switch } from 'react-router-dom';
import {
  createMuiTheme,
  CssBaseline,
  MuiThemeProvider,
  Theme,
} from '@material-ui/core';
import * as colors from '@material-ui/core/colors';
import { createBrowserHistory } from 'history';
import { useSnackbar } from 'notistack';
import loadable from '@loadable/component';
import { hot } from 'react-hot-loader/root';
import { useApolloClient } from '@apollo/react-hooks';

import { useGlobalStore } from '@client/store/StoreProvider';
import useMatchMedia from '@client/hooks/useMatchMedia';

const Home = loadable(() => import(/* webpackChunkName: 'Home' */ './pages/Home'));
const Info = loadable(() => import(/* webpackChunkName: 'Info' */ './pages/Info'));
const Book = loadable(() => import(/* webpackChunkName: 'Book' */ './pages/Book'));
const Setting = loadable(() => import(/* webpackChunkName: 'Setting' */ './pages/Setting'));
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

interface AppProps {
  wb: any;
}

const history = createBrowserHistory();

const App: React.FC<AppProps> = (props: AppProps) => {
  const { state: store, dispatch } = useGlobalStore();

  const theme = useMatchMedia(
    ['(prefers-color-scheme: dark)', '(prefers-color-scheme: light)'],
    ['dark', 'light'],
    'light',
  );

  React.useEffect(() => {
    if (store.theme !== theme) {
      dispatch({ theme });
    }
  }, [theme, store.theme]);

  const { enqueueSnackbar } = useSnackbar();
  const apolloClient = useApolloClient();

  React.useEffect(() => {
    // @ts-ignore
    apolloClient.snackbar = enqueueSnackbar;
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
  }, []);

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
      <Router history={history}>
        <Switch>
          <Route exact path="/" component={Home} />
          <Route exact path="/info/:id" component={Info} />
          <Route exact path="/book/:id" component={Book} />
          <Route exact path="/setting" component={Setting} />
          <Route component={Error} />
        </Switch>
      </Router>
    </MuiThemeProvider>
  );
};

export default hot(App);
