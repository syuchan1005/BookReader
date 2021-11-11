import React, {
  useEffect, useMemo, lazy, Suspense, useCallback,
} from 'react';
import { Route, Router, Switch } from 'react-router-dom';
import {
  CssBaseline,
  ThemeProvider,
  StyledEngineProvider,
  Theme,
  Snackbar, Alert,
} from '@mui/material';
import { createTheme } from '@mui/material/styles';
import * as colors from '@mui/material/colors';
import { createBrowserHistory } from 'history';
import { useApolloClient } from '@apollo/client';
import { QueryParamProvider } from 'use-query-params';

import { workbox } from '@client/registerServiceWorker';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import {
  alertDataState,
  alertOpenState, innerAlertDataState,
  primaryColorState,
  secondaryColorState,
} from '@client/store/atoms';
import LoadingFullscreen from '@client/components/LoadingFullscreen';
import useMediaQuery from '@client/hooks/useMediaQuery';

const Top = lazy(() => import('@client/pages/Top'));
const Info = lazy(() => import('@client/pages/Info'));
const Book = lazy(() => import('@client/pages/Book'));
const Setting = lazy(() => import('@client/pages/Setting'));
const Error = lazy(() => import('@client/pages/Error'));

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

  const isSystemDarkTheme = useMediaQuery('@media (prefers-color-scheme: dark)');

  const apolloClient = useApolloClient();

  const openAlert = useRecoilValue(alertOpenState);
  const alertData = useRecoilValue(innerAlertDataState);
  const setAlertData = useSetRecoilState(alertDataState);
  const closeAlert = useCallback((event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setAlertData(undefined);
  }, [setAlertData]);

  useEffect(() => {
    // @ts-ignore
    apolloClient.snackbar = (message: string, opt: { variant: 'error' }) => {
      setAlertData({ message, variant: opt.variant, persist: true });
    };

    const handleUpdate = (event) => {
      if (event.isUpdate) {
        setAlertData({
          message: 'Update here! Please reload.',
          variant: 'warning',
          persist: true,
        });
      }
    };
    workbox?.addEventListener('installed', handleUpdate);

    return () => {
      workbox?.removeEventListener('installed', handleUpdate);
    };
  }, [apolloClient, setAlertData]);

  const provideTheme = useMemo(
    () => createTheme({
      palette: {
        mode: isSystemDarkTheme ? 'dark' : 'light',
        primary: colors[primaryColor],
        secondary: colors[secondaryColor],
      },
    }),
    [isSystemDarkTheme, primaryColor, secondaryColor],
  );

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={provideTheme}>
        <CssBaseline />
        <Router history={history}>
          <QueryParamProvider ReactRouterRoute={Route}>
            <Suspense fallback={<LoadingFullscreen open />}>
              <Switch>
                <Route exact path="/" component={Top} />
                <Route exact path="/bookshelf" component={Top} />
                <Route exact path="/info/:id" component={Info} />
                <Route exact path="/book/:id" component={Book} />
                <Route exact path="/setting" component={Setting} />
                <Route component={Error} />
              </Switch>
            </Suspense>
          </QueryParamProvider>
        </Router>
        <Snackbar
          open={openAlert}
          autoHideDuration={alertData?.persist ? undefined : 6000}
          onClose={alertData?.persist ? undefined : closeAlert}
        >
          <Alert
            severity={alertData?.variant}
            sx={{ width: '100%' }}
            onClose={alertData?.persist ? undefined : closeAlert}
          >
            {alertData?.message}
          </Alert>
        </Snackbar>
      </ThemeProvider>
    </StyledEngineProvider>
  );
};

export default App;
