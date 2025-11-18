import { useApolloClient } from '@apollo/client';
import { HeaderWithBookListSkeleton } from '@client/components/HeaderWithBookListSkeleton';
import { useMediaQuery } from '@client/hooks/useMediaQuery';
import { workbox } from '@client/registerServiceWorker';
import {
  alertDataState,
  alertOpenState,
  innerAlertDataState,
  primaryColorState,
  secondaryColorState,
} from '@client/store/atoms';
import {
  Alert,
  CssBaseline,
  Snackbar,
  StyledEngineProvider,
  type Theme,
  ThemeProvider,
} from '@mui/material';
import * as colors from '@mui/material/colors';
import { createTheme } from '@mui/material/styles';
import { useAtomValue, useSetAtom } from 'jotai';
import {
  Fragment,
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import { BrowserRouter, Route, Routes, useParams } from 'react-router-dom';

const Top = lazy(() => import('@client/pages/Top'));
const Home = lazy(() => import('@client/pages/top/Home'));
const BookShelf = lazy(() => import('@client/pages/top/BookShelf'));
const BookShelfContent = lazy(
  () => import('@client/pages/top/bookshelf/index'),
);
const History = lazy(() => import('@client/pages/top/bookshelf/History'));

const Info = lazy(() => import('@client/pages/Info'));
const Book = lazy(() => import('@client/pages/Book'));
const Setting = lazy(() => import('@client/pages/Setting'));
const ErrorComponent = lazy(() => import('@client/pages/Error'));

export const commonTheme = {
  safeArea: {
    top: 'env(safe-area-inset-top)',
    bottom: 'env(safe-area-inset-bottom)',
    right: 'env(safe-area-inset-right)',
    left: 'env(safe-area-inset-left)',
  },
  appbar: (theme: Theme, styleName: string, calcOption?: string) =>
    Object.keys(theme.mixins.toolbar)
      .map((key) => {
        const val = theme.mixins.toolbar[key];
        if (key === 'minHeight') {
          return [
            [
              styleName,
              `calc(${commonTheme.safeArea.top} + ${val}px${calcOption || ''})`,
            ],
            [
              'fallbacks',
              {
                [styleName]: calcOption ? `calc(${val}px${calcOption})` : val,
              },
            ],
          ];
        }
        // @ts-expect-error
        if (val.minHeight !== undefined) {
          return [
            [
              key,
              {
                // @ts-expect-error
                [styleName]: `calc(${commonTheme.safeArea.top} + ${
                  val.minHeight
                }px${calcOption || ''})`,
                fallbacks: {
                  // @ts-expect-error
                  [styleName]: calcOption
                    ? `calc(${val.minHeight}px${calcOption})`
                    : val.minHeight,
                },
              },
            ],
          ];
        }
        return [];
      })
      .reduce((o, props) => {
        for (const [k, v] of props) {
          // @ts-expect-error
          o[k] = v;
        }
        return o;
      }, {}),
};

const App = () => {
  const primaryColor = useAtomValue(primaryColorState);
  const secondaryColor = useAtomValue(secondaryColorState);

  const isSystemDarkTheme = useMediaQuery(
    '@media (prefers-color-scheme: dark)',
  );

  const apolloClient = useApolloClient();

  const openAlert = useAtomValue(alertOpenState);
  const alertData = useAtomValue(innerAlertDataState);
  const setAlertData = useSetAtom(alertDataState);
  const closeAlert = useCallback(
    (_event, reason?: string) => {
      if (reason === 'clickaway') {
        return;
      }
      setAlertData(undefined);
    },
    [setAlertData],
  );

  useEffect(() => {
    // @ts-expect-error
    apolloClient.snackbar = (message: string, opt: { variant: 'error' }) => {
      setAlertData({
        message,
        variant: opt.variant,
      });
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
    () =>
      createTheme({
        palette: {
          mode: isSystemDarkTheme ? 'dark' : 'light',
          // biome-ignore lint/performance/noDynamicNamespaceImportAccess: for theme
          primary: colors[primaryColor],
          // biome-ignore lint/performance/noDynamicNamespaceImportAccess: for theme
          secondary: colors[secondaryColor],
        },
      }),
    [isSystemDarkTheme, primaryColor, secondaryColor],
  );

  useEffect(() => {
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute(
        'content',
        isSystemDarkTheme
          ? provideTheme.palette.background.default
          : provideTheme.palette.primary.main,
      );
  }, [isSystemDarkTheme, provideTheme]);

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={provideTheme}>
        <CssBaseline />
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={
                <Suspense fallback={<HeaderWithBookListSkeleton />}>
                  <Top />
                </Suspense>
              }
            >
              <Route
                index
                element={
                  <Suspense fallback={<HeaderWithBookListSkeleton />}>
                    <Home />
                  </Suspense>
                }
              />
              <Route
                path="bookshelf"
                element={
                  <Suspense fallback={<HeaderWithBookListSkeleton />}>
                    <BookShelf />
                  </Suspense>
                }
              >
                <Route
                  index
                  element={
                    <Suspense fallback={<HeaderWithBookListSkeleton />}>
                      <BookShelfContent />
                    </Suspense>
                  }
                />
                <Route
                  path="history"
                  element={
                    <Suspense fallback={<HeaderWithBookListSkeleton />}>
                      <History />
                    </Suspense>
                  }
                />
              </Route>
            </Route>

            <Route
              path="info/:id"
              element={
                <Suspense fallback={<HeaderWithBookListSkeleton />}>
                  <RemountByParams>
                    <Info />
                  </RemountByParams>
                </Suspense>
              }
            />
            <Route
              path="book/:id"
              element={
                <Suspense fallback={<HeaderWithBookListSkeleton />}>
                  <RemountByParams>
                    <Book />
                  </RemountByParams>
                </Suspense>
              }
            />
            <Route
              path="setting"
              element={
                <Suspense fallback={<HeaderWithBookListSkeleton />}>
                  <Setting />
                </Suspense>
              }
            />
            <Route
              path="*"
              element={
                <Suspense fallback={<HeaderWithBookListSkeleton />}>
                  <ErrorComponent />
                </Suspense>
              }
            />
          </Routes>
        </BrowserRouter>
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

const RemountByParams = ({ children }: { children: React.ReactNode }) => {
  const params = useParams();
  return <Fragment key={Object.values(params).join('_')}>{children}</Fragment>;
};

export default App;
