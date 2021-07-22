import React from 'react';
import {
  Button,
  createMuiTheme,
  createStyles,
  Icon,
  IconButton,
  makeStyles,
  Menu,
  MenuItem,
  MuiThemeProvider,
  Slider,
  Theme,
  useTheme,
} from '@material-ui/core';

import SwiperCore, { Virtual } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/swiper-bundle.min.css';

import { useHistory, useParams } from 'react-router-dom';
import { useKey, useWindowSize } from 'react-use';
import { useSnackbar } from 'notistack';
import { orange } from '@material-ui/core/colors';
import { useRecoilState } from 'recoil';

import { useBookQuery } from '@syuchan1005/book-reader-graphql/generated/GQLQueries';

import useDebounceValue from '@client/hooks/useDebounceValue';
import usePrevNextBook from '@client/hooks/usePrevNextBook';
import { commonTheme } from '@client/App';

import { defaultTitle } from '@syuchan1005/book-reader-common';
import useBooleanState from '@client/hooks/useBooleanState';
import BookPageImage from '@client/components/BookPageImage';
import TitleAndBackHeader from '@client/components/TitleAndBackHeader';
import { ReadOrder, readOrderState, showOriginalImageState } from '@client/store/atoms';
import db from '@client/Database';
import { NumberParam, useQueryParam } from 'use-query-params';
import useLazyDialog from '@client/hooks/useLazyDialog';

const EditPagesDialog = React.lazy(() => import('@client/components/dialogs/EditPagesDialog'));
SwiperCore.use([Virtual]);

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
    '& .swiper-slide > *': {
      display: 'flex',
      justifyContent: 'center',
    },
    '& .swiper-slide.start > *': {
      justifyContent: 'flex-start',
    },
    '& .swiper-slide.end > *': {
      justifyContent: 'flex-end',
    },
  },
  pageImage: {
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
      gridTemplateColumns: '1fr 1fr 1fr 1fr',
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
    gridColumn: '1 / span 4',
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

const useDatabasePage = (
  bookId: string,
  defaultPage: number = 0,
): [
  loading: boolean,
  page: number,
  setPage: (
    page: number,
  ) => Promise<void>,
] => {
  const [loading, setLoading] = React.useState(true);
  const [page, updatePageState] = React.useState(defaultPage);

  React.useEffect(() => {
    setLoading(true);
    db.bookReads.get(bookId).then((read) => {
      if (read) {
        updatePageState(read.page);
      } else {
        updatePageState(defaultPage);
      }
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId]);

  const setPage = React.useCallback((p: number): Promise<void> => {
    if (loading) {
      return Promise.reject();
    }

    // @ts-ignore
    return db.bookReads.put({
      bookId,
      page: p,
    });
  }, [bookId, loading]);

  return [
    loading,
    page,
    setPage,
  ];
};

type PageStyles = keyof typeof PageStyle;

const PageStyle = {
  SinglePage: {
    slidesPerView: 1,
    pageClass: (_index: number) => undefined,
    normalizeCount: (i: number) => i,
    icon: {
      name: 'crop_portrait',
      style: undefined,
    },
    prefixPage: 0,
  },
  FullSpread: {
    slidesPerView: 2,
    pageClass: (index: number) => (index % 2 === 0 ? 'end' : 'start'),
    normalizeCount: (i: number) => Math.floor(i / 2) * 2,
    icon: {
      name: 'splitscreen',
      style: {
        transform: 'rotate(90deg)',
      },
    },
    prefixPage: 0,
  },
  FullSpreadPlusOne: {
    slidesPerView: 2,
    pageClass: (index: number) => ((index + 1) % 2 === 0 ? 'end' : 'start'),
    normalizeCount: (i: number) => Math.floor(i / 2) * 2 + 1,
    icon: {
      name: 'horizontal_split',
      style: {
        transform: 'rotate(-90deg) scaleX(0.9) scaleY(1.4)',
      },
    },
    prefixPage: 1,
  },
};

// @ts-ignore
const NextPageStyleMap: { [p: PageStyles]: PageStyles } = {
  SinglePage: 'FullSpread',
  FullSpread: 'FullSpreadPlusOne',
  FullSpreadPlusOne: 'SinglePage',
};

const Book = (props: BookProps) => {
  const [readOrder, setReadOrder] = useRecoilState(readOrderState);
  const [showOriginalImage, setShowOriginalImage] = useRecoilState(showOriginalImageState);
  const classes = useStyles(props);
  const history = useHistory();
  const { enqueueSnackbar } = useSnackbar();
  const { id: bookId } = useParams<{ id: string }>();

  const [page, updatePage] = React.useState(0);
  const debouncePage = useDebounceValue(page, 200);
  const [queryPage, setQueryPage] = useQueryParam('page', NumberParam);
  const [dbLoading, dbPage, setDbPage] = useDatabasePage(bookId);
  const [isPageSet, setPageSet] = React.useState(false);
  React.useEffect(() => {
    if (dbLoading) {
      return;
    }

    if (queryPage !== undefined && queryPage !== page) {
      setPage(queryPage, 0);
    } else if (page !== dbPage) {
      setPage(dbPage, 0);
    } else {
      setPageSet(true);
      return;
    }
    setTimeout(() => {
      setPageSet(true);
    }, 210);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbLoading]);

  React.useEffect(() => {
    if (isPageSet) {
      setDbPage(page).catch((e) => enqueueSnackbar(e, { variant: 'error' }));
      setQueryPage(page, 'replace');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const [effect, setEffect] = React.useState<undefined | 'paper' | 'dark'>(undefined);
  const [effectMenuAnchor, setEffectMenuAnchor] = React.useState(null);
  const [effectPercentage, setEffectPercentage] = React.useState(0);
  const [settingsMenuAnchor, setSettingsMenuAnchor] = React.useState(undefined);
  const [swiper, setSwiper] = React.useState(null);
  const [openEditDialog, canMountEditDialog, setOpenEditDialog, setCloseEditDialog] = useLazyDialog(false);
  const [showAppBar, setShowAppBar, setHideAppBar, toggleAppBar] = useBooleanState(false);
  const [pageStyleKey, setPageStyle] = React.useState<PageStyles>('SinglePage');
  const {
    slidesPerView,
    pageClass,
    normalizeCount,
    icon: pageStyleIcon,
    prefixPage,
  } = PageStyle[pageStyleKey];

  React.useEffect(() => {
    document.title = defaultTitle;
  }, []);

  React.useEffect(() => {
    updatePage(0);
    setPageSet(false);
  }, [bookId]);

  const windowSize = useWindowSize();

  const updateSwiper = React.useCallback((s) => {
    if (!s) return;
    s.on('slideChange', () => updatePage(s.realIndex));
    s.slideTo(page, 0, false);
    setSwiper(s);
  }, [page]);

  const {
    loading,
    error,
    data,
  } = useBookQuery({
    variables: {
      id: bookId,
    },
    onCompleted(d) {
      if (!d) return;
      if (isPageSet && page >= d.book.pages) {
        setPage(d.book.pages - 1, 0);
      }
    },
    onError() {
      setShowAppBar();
    },
  });

  const setPage = React.useCallback((s, time = 150) => {
    let validatedPage = Math.max(s, 0);
    if (data) {
      validatedPage = Math.min(validatedPage, normalizeCount(data.book.pages - 1));
    }
    validatedPage = normalizeCount(validatedPage);
    if (swiper) {
      swiper.slideTo(validatedPage, time, false);
    }
    updatePage(validatedPage);
  }, [data, swiper, normalizeCount]);

  const [prevBook, nextBook] = usePrevNextBook(
    data ? data.book.info.id : undefined,
    bookId,
  );

  const increment = React.useCallback(() => {
    setPage(page + slidesPerView);
    setHideAppBar();
  }, [page, setPage, setHideAppBar, slidesPerView]);

  const decrement = React.useCallback(() => {
    setPage(page - slidesPerView);
    setHideAppBar();
  }, [page, setHideAppBar, setPage, slidesPerView]);

  const theme = useTheme();
  const sliderTheme = React.useMemo(() => createMuiTheme({
    ...theme,
    direction: readOrder === ReadOrder.RTL ? 'rtl' : 'ltr',
  }), [theme, readOrder]);

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

  useKey('ArrowRight', () => (openEditDialog) || [increment, decrement][readOrder](), undefined, [increment, decrement, readOrder, openEditDialog]);
  useKey('ArrowLeft', () => (openEditDialog) || [decrement, increment][readOrder](), undefined, [increment, decrement, readOrder, openEditDialog]);

  const clickPage = React.useCallback((event) => {
    if (openEditDialog) return;
    const percentX = event.nativeEvent.x / windowSize.width;
    switch (readOrder) {
      case ReadOrder.LTR:
        if (percentX <= 0.2) {
          decrement();
        } else if (percentX >= 0.8) {
          increment();
        } else {
          toggleAppBar();
        }
        break;
      case ReadOrder.RTL:
        if (percentX <= 0.2) {
          increment();
        } else if (percentX >= 0.8) {
          decrement();
        } else {
          toggleAppBar();
        }
        break;
      default:
        toggleAppBar();
    }
  }, [readOrder, increment, decrement, openEditDialog, toggleAppBar, windowSize.width]);

  const clickRouteButton = React.useCallback((e, i) => {
    e.stopPropagation();
    const jumpBookId = [prevBook, nextBook][i];
    if (!jumpBookId) return;
    db.infoReads.put({
      infoId: data.book.info.id,
      bookId: jumpBookId,
    }).catch((e1) => enqueueSnackbar(e1, { variant: 'error' }));
    // history.push('/dummy');
    history.push(`/book/${jumpBookId}`);
  }, [prevBook, nextBook, data, history, enqueueSnackbar]);

  const imageSize = React.useMemo(() => {
    if (showOriginalImage) {
      return { width: undefined, height: undefined };
    }
    return windowSize;
  }, [windowSize, showOriginalImage]);

  const clickEffect = React.useCallback((eff) => {
    setEffect(eff);
    setEffectMenuAnchor(null);
  }, []);

  const toggleOriginalImage = React.useCallback(() => {
    setShowOriginalImage((v) => !v);
  }, [setShowOriginalImage]);

  const canImageVisible = React.useCallback((i: number) => imageSize
    && isPageSet
    && (i < debouncePage
      ? debouncePage - i <= slidesPerView
      : i - debouncePage <= (slidesPerView * 2 - 1)),
  [debouncePage, imageSize, isPageSet, slidesPerView]);

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
          {(canMountEditDialog) && (
            <EditPagesDialog
              open={openEditDialog}
              onClose={setCloseEditDialog}
              maxPage={data ? data.book.pages : 0}
              bookId={bookId}
            />
          )}

          {/* eslint-disable-next-line */}
          <div
            className={classes.overlay}
            style={{ pointerEvents: showAppBar ? undefined : 'none' }}
            onClick={(e) => {
              if (showAppBar) {
                e.stopPropagation();
                setHideAppBar();
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
                  {(nextBook && data && Math.abs(data.book.pages - page) <= slidesPerView) && (
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
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <IconButton
                      size="small"
                      style={{ color: 'white' }}
                      onClick={() => setPageStyle((p) => NextPageStyleMap[p])}
                    >
                      <Icon style={pageStyleIcon.style}>{pageStyleIcon.name}</Icon>
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
                        setOpenEditDialog();
                      }}
                    >
                      Edit pages
                    </MenuItem>
                    <MenuItem
                      onClick={toggleOriginalImage}
                    >
                      {`Show ${showOriginalImage ? 'Compressed' : 'Original'} Image`}
                    </MenuItem>
                  </Menu>
                  <Button
                    variant="outlined"
                    style={{ color: 'white', borderColor: 'white', margin: '0 auto' }}
                    onClick={() => {
                      if (readOrder === ReadOrder.RTL) {
                        setReadOrder(ReadOrder.LTR);
                      } else {
                        setReadOrder(ReadOrder.RTL);
                      }
                    }}
                  >
                    {['L > R', 'L < R'][readOrder]}
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
                        step={slidesPerView}
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

          <Swiper
            key={`${bookId}:${pageStyleKey}:${readOrder}`}
            onSwiper={updateSwiper}
            dir={readOrder === ReadOrder.LTR ? 'ltr' : 'rtl'}
            className={classes.pageContainer}
            slidesPerView={slidesPerView}
            slidesPerGroup={slidesPerView}
            virtual
          >
            {[...new Array(prefixPage).keys()].map((i) => (
              <SwiperSlide key={`virtual-${i}`} virtualIndex={i} />
            ))}
            {[...new Array(data.book.pages).keys()].map((i, index) => (
              <SwiperSlide
                key={`${i}_${imageSize[0]}_${imageSize[1]}`}
                virtualIndex={index + prefixPage}
                className={pageClass(index)}
              >
                {canImageVisible(i) && (
                  <BookPageImage
                    style={effectBackGround}
                    bookId={bookId}
                    pageIndex={i}
                    bookPageCount={data.book.pages}
                    {...imageSize}
                    alt={(i + 1).toString(10)}
                    className={classes.pageImage}
                    loading="eager"
                    sizeDebounceDelay={300}
                  />
                )}
              </SwiperSlide>
            ))}
            {[...new Array(((data.book.pages + prefixPage) % slidesPerView)).keys()].map((i) => (
              <SwiperSlide virtualIndex={data.book.pages + prefixPage + i} />
            ))}
          </Swiper>

          <div className={classes.pageProgress} style={{ justifyContent: `flex-${['start', 'end'][readOrder]}` }}>
            <div style={{ width: `${(swiper ? swiper.progress : 0) * 100}%` }} />
          </div>
        </div>
      </main>
    </>
  );
};

export default React.memo(Book);
