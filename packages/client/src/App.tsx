import { setOnErrorHandler } from '@client/apollo/index';
import { HeaderWithBookListSkeleton } from '@client/components/HeaderWithBookListSkeleton';
import { useMediaQuery } from '@client/hooks/useMediaQuery';
import { workbox } from '@client/registerServiceWorker';
import {
  alertDataState,
  alertOpenState,
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
import { useAtom, useAtomValue } from 'jotai';
import {
  Fragment,
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import {
  BrowserRouter,
  Route,
  Routes,
  useLocation,
  useNavigationType,
  useParams,
} from 'react-router-dom';

import Top from '@client/pages/Top';
import Home from '@client/pages/top/Home';
import BookShelf from '@client/pages/top/BookShelf';
import BookShelfContent from '@client/pages/top/bookshelf/index';
import History from '@client/pages/top/bookshelf/History';

import Info from '@client/pages/Info';
import Setting from '@client/pages/Setting';
import ErrorComponent from '@client/pages/Error';

// NOTE: It's intentionally lazy-loaded due to its large size (~130KB) to reduce parsing overhead on initial load.
const Book = lazy(() => import('@client/pages/Book'));

const ScrollToTop = () => {
  const { pathname } = useLocation();
  const navType = useNavigationType();

  useEffect(() => {
    if (navType !== 'POP') {
      window.scrollTo(0, 0);
    }
  }, [pathname, navType]);

  return null;
};

export const commonTheme = {
  safeArea: {
    top: 'var(--safe-area-inset-top)',
    bottom: 'var(--safe-area-inset-bottom)',
    right: 'var(--safe-area-inset-right)',
    left: 'var(--safe-area-inset-left)',
  },
};

const App = () => {
  const primaryColor = useAtomValue(primaryColorState);
  const secondaryColor = useAtomValue(secondaryColorState);

  const isSystemDarkTheme = useMediaQuery(
    '@media (prefers-color-scheme: dark)',
  );
  const openAlert = useAtomValue(alertOpenState);
  const [alertData, setAlertData] = useAtom(alertDataState);
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
    setOnErrorHandler((message: string) => {
      setAlertData({ message, variant: 'error' });
    });

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
  }, [setAlertData]);

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
          <ScrollToTop />
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
          sx={{ marginBottom: 5 }}
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
