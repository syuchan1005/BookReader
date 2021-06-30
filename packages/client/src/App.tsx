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
import { useApolloClient } from '@apollo/react-hooks';
import { QueryParamProvider } from 'use-query-params';

import useMatchMedia from '@client/hooks/useMatchMedia';
import { workbox } from '@client/registerServiceWorker';
import { useRecoilValue } from 'recoil';
import { primaryColorState, secondaryColorState } from '@client/store/atoms';

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

const history = createBrowserHistory();

const App = () => {
  const primaryColor = useRecoilValue(primaryColorState);
  const secondaryColor = useRecoilValue(secondaryColorState);

  const theme = useMatchMedia(
    ['(prefers-color-scheme: dark)', '(prefers-color-scheme: light)'],
    ['dark', 'light'],
    'light',
  );

  const { enqueueSnackbar } = useSnackbar();
  const apolloClient = useApolloClient();

  React.useEffect(() => {
    // @ts-ignore
    apolloClient.snackbar = enqueueSnackbar;

    const handleUpdate = (event) => {
      if (event.isUpdate) {
        enqueueSnackbar('Update here! Please reload.', {
          variant: 'warning',
          persist: true,
        });
      }
    };
    workbox?.addEventListener('installed', handleUpdate);

    return () => {
      workbox?.removeEventListener('installed', handleUpdate);
    };
  }, [apolloClient, enqueueSnackbar]);

  const provideTheme = React.useMemo(
    () => createMuiTheme({
      palette: {
        type: theme,
        primary: colors[primaryColor],
        secondary: colors[secondaryColor],
      },
    }),
    [theme, primaryColor, secondaryColor],
  );

  return (
    <MuiThemeProvider theme={provideTheme}>
      <CssBaseline />
      <Router history={history}>
        <QueryParamProvider ReactRouterRoute={Route}>
          <Switch>
            <Route exact path="/" component={Home} />
            <Route exact path="/info/:id" component={Info} />
            <Route exact path="/book/:id" component={Book} />
            <Route exact path="/setting" component={Setting} />
            <Route component={Error} />
          </Switch>
        </QueryParamProvider>
      </Router>
    </MuiThemeProvider>
  );
};

export default App;
