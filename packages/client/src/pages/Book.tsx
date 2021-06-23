import React from 'react';
import {
  createStyles,
  makeStyles,
  Theme,
  MuiThemeProvider,
  Slider,
  Button,
  useTheme,
  createMuiTheme,
  Menu,
  MenuItem,
  Icon,
  IconButton,
} from '@material-ui/core';

import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/swiper-bundle.min.css';

import { useParams, useHistory } from 'react-router-dom';
import { useKey, useWindowSize } from 'react-use';
import { useSnackbar } from 'notistack';
import { orange } from '@material-ui/core/colors';

import { useBookQuery } from '@syuchan1005/book-reader-graphql/generated/GQLQueries';

import useDebounceValue from '@client/hooks/useDebounceValue';
import usePrevNextBook from '@client/hooks/usePrevNextBook';
import { useGlobalStore } from '@client/store/StoreProvider';
import { commonTheme } from '@client/App';

import { defaultTitle } from '@syuchan1005/book-reader-common';
import EditPagesDialog from '@client/components/dialogs/EditPagesDialog';
import db from '../Database';
import BookPageImage from '../components/BookPageImage';
import useNetworkType from '../hooks/useNetworkType';
import TitleAndBackHeader from '../components/TitleAndBackHeader';
import { Remount } from '../components/Remount';

interface BookProps {
  // eslint-disable-next-line react/no-unused-prop-types
  children?: React.ReactElement;
}

const useStyles = makeStyles((theme: Theme) => createStyles({
  '@global': {
    body: {
      overflow: 'hidden',
    },
  },
  book: {
    width: '100%',
    height: '100%',
  },
  page: {
    width: '100%',
    minWidth: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageContainer: {
    width: '100%',
    height: '100%',
    margin: '0 auto',
    position: 'relative',
    overflow: 'hidden',
    listStyle: 'none',
    padding: 0,
    '& > .swiper-wrapper': {
      zIndex: 'inherit',
    },
  },
  pageImage: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    paddingTop: commonTheme.safeArea.top,
    '-webkit-touch-callout': 'none',
    'user-select': 'none',
  },
  overlay: {
    zIndex: 2,
    top: '0',
    position: 'fixed',
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    userSelect: 'none',
  },
  overlayContent: {
    userSelect: 'none',
    background: 'rgba(0, 0, 0, 0.7)',
    color: 'white',
    display: 'grid',
    gridTemplateRows: '1fr',
    gridTemplateColumns: '1fr 1fr 1fr',
    '& > div': {
      textAlign: 'center',
    },
    padding: theme.spacing(1),
    borderRadius: theme.spacing(1),
    position: 'absolute',
    '&.top': {
      ...commonTheme.appbar(theme, 'top', ` + ${theme.spacing(2)}px`),
      whiteSpace: 'nowrap',
    },
    '&.bottom': {
      width: '80%',
      gridTemplateRows: 'auto auto',
      bottom: theme.spacing(2),
    },
    '&.center': {
      background: 'inherit',
      height: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'column',
      '& > button + button': {
        marginTop: theme.spacing(1),
      },
    },
  },
  bottomSlider: {
    gridColumn: '1 / span 3',
    margin: theme.spacing(0, 2),
  },
  loading: {
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '2rem',
    whiteSpace: 'pre-line',
    textAlign: 'center',
  },
  pageProgress: {
    display: 'inline-flex',
    position: 'absolute',
    width: '100%',
    height: theme.spacing(0.5),
    bottom: 0,
    '& > div': {
      height: 'inherit',
      background: theme.palette.secondary.main,
    },
  },
}));

const Book = (props: BookProps) => {
  const { state: store, dispatch } = useGlobalStore();
  const classes = useStyles(props);
  const history = useHistory();
  const params = useParams<{ id: string }>();

  const [page, updatePage] = React.useState(0);
  const debouncePage = useDebounceValue(page, 200);
  const [effect, setEffect] = React.useState<undefined | 'paper' | 'dark'>(undefined);
  const [effectMenuAnchor, setEffectMenuAnchor] = React.useState(null);
  const [effectPercentage, setEffectPercentage] = React.useState(0);
  const [isPageSet, setPageSet] = React.useState(false);
  const [settingsMenuAnchor, setSettingsMenuAnchor] = React.useState(undefined);
  const [swiper, setSwiper] = React.useState(null);
  const [rebuildSwiper, setReBuildSwiper] = React.useState(false);
  const [openEditDialog, setOpenEditDialog] = React.useState(false);
  const [showAppBar, setShowAppBar] = React.useState(false);

  React.useEffect(() => {
    document.title = defaultTitle;
  }, []);

  React.useEffect(() => {
    updatePage(0);
    setSwiper(null);
    setPageSet(false);
    setReBuildSwiper(true);
  }, [params.id]);

  const windowSize = useWindowSize();
  const { width, height } = useDebounceValue(windowSize, 800);

  const setPage = React.useCallback((s, time = 150) => {
    if (swiper && !rebuildSwiper) {
      swiper.slideTo(s, time, false);
      updatePage(s);
    }
  }, [swiper, rebuildSwiper]);

  const updateSwiper = React.useCallback((s) => {
    if (!s) return;
    setReBuildSwiper(false);
    s.on('slideChange', () => updatePage(s.realIndex));
    setSwiper(s);
  }, [isPageSet, page]);

  const {
    loading,
    error,
    data,
  } = useBookQuery({
    variables: {
      id: params.id,
    },
    onCompleted(d) {
      if (!d) return;
      if (isPageSet && page >= d.book.pages) {
        setPage(d.book.pages - 1, 0);
      }
    },
    onError() {
      setShowAppBar(true);
    },
  });

  const [prevBook, nextBook] = usePrevNextBook(
    data ? data.book.info.id : undefined,
    params.id,
  );

  const increment = React.useCallback(() => {
    setPage(Math.min(page + 1, data.book.pages - 1));
    if (showAppBar) setShowAppBar(false);
    // eslint-disable-next-line react/destructuring-assignment
  }, [page, data, nextBook, showAppBar, setPage]);

  const decrement = React.useCallback(() => {
    setPage(Math.max(page - 1, 0));
    if (showAppBar) setShowAppBar(false);
    // eslint-disable-next-line react/destructuring-assignment
  }, [page, data, prevBook, showAppBar, setPage]);

  const theme = useTheme();
  const sliderTheme = React.useMemo(() => createMuiTheme({
    ...theme,
    direction: store.readOrder === 1 ? 'rtl' : 'ltr',
  }), [theme, store.readOrder]);

  const effectTheme = React.useMemo(() => createMuiTheme({
    ...theme,
    palette: {
      primary: {
        main: orange['700'],
      },
    },
  }), [theme]);

  const effectBackGround = React.useMemo(() => {
    switch (effect) {
      case 'dark':
        return {
          filter: `brightness(${100 - effectPercentage}%)`,
        };
      case 'paper':
        return {
          filter: `sepia(${effectPercentage}%)`,
        };
      default:
        return undefined;
    }
  }, [effect, effectPercentage]);

  React.useEffect(() => {
    if (!swiper) return;
    db.bookReads.get(params.id).then((read) => {
      if (read && read.page !== 0) {
        let p = read.page;
        if (data && p >= data.book.pages) p = data.book.pages - 1;
        setPage(Math.max(p, 0), 0);
        setTimeout(() => {
          setPageSet(true);
        }, 210);
      } else {
        setPage(0, 0);
        setPageSet(true);
      }
    });
  }, [swiper]);

  const { enqueueSnackbar } = useSnackbar();

  React.useEffect(() => {
    if (isPageSet) {
      db.bookReads.put({
        bookId: params.id,
        page,
      }).catch((e) => enqueueSnackbar(e, { variant: 'error' }));
    }
  }, [isPageSet, page]);

  useKey('ArrowRight', () => (openEditDialog) || [increment, decrement][store.readOrder](), undefined, [increment, decrement, store.readOrder, openEditDialog]);
  useKey('ArrowLeft', () => (openEditDialog) || [decrement, increment][store.readOrder](), undefined, [increment, decrement, store.readOrder, openEditDialog]);

  const clickPage = React.useCallback((event) => {
    if (openEditDialog) return;
    const percentX = event.nativeEvent.x / event.target.offsetWidth;
    switch (store.readOrder) {
      case 0:
        if (percentX <= 0.2) decrement();
        else if (percentX >= 0.8) increment();
        else setShowAppBar(!showAppBar);
        break;
      case 1:
        if (percentX <= 0.2) increment();
        else if (percentX >= 0.8) decrement();
        else setShowAppBar(!showAppBar);
        break;
      default:
        setShowAppBar(!showAppBar);
    }
  }, [store.readOrder, increment, decrement, openEditDialog]);

  const clickRouteButton = React.useCallback((e, i) => {
    e.stopPropagation();
    const bookId = [prevBook, nextBook][i];
    if (!bookId) return;
    db.infoReads.put({
      infoId: data.book.info.id,
      bookId,
    }).catch((e1) => enqueueSnackbar(e1, { variant: 'error' }));
    // history.push('/dummy');
    history.push(`/book/${bookId}`);
  }, [prevBook, nextBook, data, history]);

  const imageSize = React.useMemo(() => {
    if (store.showOriginalImage) return { width: undefined, height: undefined };
    const sizes = [width * window.devicePixelRatio, height * window.devicePixelRatio];
    sizes[sizes[0] > sizes[1] ? 0 : 1] = undefined;
    return { width: sizes[0], height: sizes[1] };
  }, [width, height, store]);

  const clickEffect = React.useCallback((eff) => {
    setEffect(eff);
    setEffectMenuAnchor(null);
  }, []);

  const networkType = useNetworkType();

  React.useEffect(() => {
    dispatch({ showOriginalImage: networkType === 'ethernet' });
  }, [networkType]);

  if (loading || error) {
    return (
      <>
        <TitleAndBackHeader title="Book" />
        <main>
          <div className={classes.loading}>
            <div>
              {loading && 'Loading'}
              {error && `${error.toString().replace(/:\s*/g, '\n')}`}
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      {showAppBar && (
        <TitleAndBackHeader
          backRoute={data && `/info/${data.book.info.id}`}
          title={data && data.book.info.name}
          subTitle={data && `No.${data.book.number}`}
        />
      )}
      <main>
        {/* eslint-disable-next-line */}
        <div className={classes.book} onClick={clickPage}>
          <EditPagesDialog
            open={openEditDialog}
            onClose={() => setOpenEditDialog(false)}
            maxPage={data ? data.book.pages : 0}
            bookId={params.id}
          />

          {/* eslint-disable-next-line */}
          <div
            className={classes.overlay}
            style={{ pointerEvents: showAppBar ? undefined : 'none' }}
            onClick={(e) => {
              if (showAppBar) {
                e.stopPropagation();
                setShowAppBar(false);
              }
            }}
          >
            {showAppBar && (
              <>
                {/* eslint-disable-next-line */}
                <div className={`${classes.overlayContent} top`} onClick={(e) => e.stopPropagation()}>
                  <div style={{ gridColumn: '1 / span 3' }}>{`${page + 1} / ${data.book.pages}`}</div>
                </div>
                {/* eslint-disable-next-line */}
                <div className={`${classes.overlayContent} center`}>
                  {(prevBook && page === 0) && (
                    <Button variant="contained" color="secondary" onClick={(e) => clickRouteButton(e, 0)}>
                      to Prev book
                    </Button>
                  )}
                  {(nextBook && data && page === data.book.pages - 1) && (
                    <Button variant="contained" color="secondary" onClick={(e) => clickRouteButton(e, 1)}>
                      to Next book
                    </Button>
                  )}
                </div>
                {/* eslint-disable-next-line */}
                <div className={`${classes.overlayContent} bottom`} onClick={(e) => e.stopPropagation()}>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <IconButton
                      size="small"
                      style={{ color: 'white' }}
                      aria-label="settings"
                      onClick={(e) => setSettingsMenuAnchor(e.currentTarget)}
                    >
                      <Icon>settings</Icon>
                    </IconButton>
                  </div>
                  <Menu
                    anchorEl={settingsMenuAnchor}
                    open={Boolean(settingsMenuAnchor)}
                    onClose={() => setSettingsMenuAnchor(null)}
                    getContentAnchorEl={null}
                    anchorOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                  >
                    <MenuItem
                      onClick={() => {
                        setSettingsMenuAnchor(null);
                        setOpenEditDialog(true);
                      }}
                    >
                      Edit pages
                    </MenuItem>
                    <MenuItem
                      onClick={() => dispatch({ showOriginalImage: !store.showOriginalImage })}
                    >
                      {`Show ${store.showOriginalImage ? 'Compressed' : 'Original'} Image`}
                    </MenuItem>
                  </Menu>
                  <Button
                    variant="outlined"
                    style={{ color: 'white', borderColor: 'white', margin: '0 auto' }}
                    onClick={() => {
                      dispatch({ readOrder: (store.readOrder + 1) % 2 });
                      setReBuildSwiper(true);
                    }}
                  >
                    {['L > R', 'L < R'][store.readOrder]}
                  </Button>
                  <Button
                    aria-controls="effect menu"
                    aria-haspopup
                    onClick={(e) => setEffectMenuAnchor(e.currentTarget)}
                    style={{ color: 'white' }}
                  >
                    {effect || 'normal'}
                  </Button>
                  <Menu
                    anchorEl={effectMenuAnchor}
                    open={Boolean(effectMenuAnchor)}
                    onClose={() => setEffectMenuAnchor(null)}
                  >
                    <MenuItem onClick={() => clickEffect(undefined)}>Normal</MenuItem>
                    <MenuItem onClick={() => clickEffect('paper')}>Paper</MenuItem>
                    <MenuItem onClick={() => clickEffect('dark')}>Dark</MenuItem>
                  </Menu>
                  <div className={classes.bottomSlider}>
                    <MuiThemeProvider theme={sliderTheme}>
                      <Slider
                        color="secondary"
                        valueLabelDisplay="auto"
                        max={data.book.pages}
                        min={1}
                        value={page + 1}
                        onChange={(e, v: number) => setPage(v - 1, 0)}
                      />
                    </MuiThemeProvider>
                  </div>
                  {(effect) && (
                    <div className={classes.bottomSlider}>
                      <MuiThemeProvider theme={effectTheme}>
                        <Slider
                          valueLabelDisplay="auto"
                          max={100}
                          min={0}
                          value={effectPercentage}
                          onChange={(e, v: number) => setEffectPercentage(v)}
                        />
                      </MuiThemeProvider>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <Remount remount={rebuildSwiper}>
            <Swiper
              onSwiper={updateSwiper}
              dir={store.readOrder === 0 ? 'ltr' : 'rtl'}
              className={classes.pageContainer}
            >
              {[...new Array(data.book.pages).keys()].map((i) => (
                <SwiperSlide
                  key={`${i}_${imageSize[0]}_${imageSize[1]}`}
                  className={classes.page}
                >
                  {(Math.abs(i - debouncePage) <= 1 && imageSize && isPageSet) ? (
                    <BookPageImage
                      imgStyle={effectBackGround}
                      bookId={params.id}
                      pageIndex={i}
                      bookPageCount={data.book.pages}
                      {...imageSize}
                      alt={(i + 1).toString(10)}
                      className={classes.pageImage}
                    />
                  ) : null}
                </SwiperSlide>
              ))}
            </Swiper>
          </Remount>

          <div className={classes.pageProgress} style={{ justifyContent: `flex-${['start', 'end'][store.readOrder]}` }}>
            <div style={{ width: `${(swiper ? swiper.progress : 0) * 100}%` }} />
          </div>
        </div>
      </main>
    </>
  );
};

export default React.memo(Book);
