import * as React from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@material-ui/core';
import { Swiper } from 'swiper/js/swiper.esm';
import SwiperCustom from 'react-id-swiper/lib/ReactIdSwiper.custom';
import { useMutation, useQuery } from '@apollo/react-hooks';
import { useParams, useHistory } from 'react-router-dom';
import { useKey, useWindowSize } from 'react-use';
import { useSnackbar } from 'notistack';
import { hot } from 'react-hot-loader/root';

import * as BookQuery from '@client/graphqls/Pages_Book_book.gql';
import * as DeleteMutation from '@client/graphqls/Pages_Page_delete.gql';
import * as SplitMutation from '@client/graphqls/Pages_Page_split.gql';

import { Book as BookType, Result } from '@common/GraphqlTypes';
import useDebounceValue from '@client/hooks/useDebounceValue';
import usePrevNextBook from '@client/hooks/usePrevNextBook';
import { useGlobalStore } from '@client/store/StoreProvider';
import { commonTheme } from '@client/App';

import { orange } from '@material-ui/core/colors';
import db from '../Database';
import Img from '../components/Img';
import DeleteDialog from '../components/dialogs/DeleteDialog';
import useNetworkType from '../hooks/useNetworkType';

interface BookProps {
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
  pageContainerRTL: {
    direction: 'rtl',
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
  pageContainerLTR: {
    direction: 'ltr',
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
  },
  overlay: {
    zIndex: 1,
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
  splitButtonWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splitButton: {
    display: 'grid',
    gridTemplateColumns: '150px',
    gridTemplateRows: '100px auto',
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

const Book: React.FC = (props: BookProps) => {
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
  const [deleteNumbers, setDeleteNumbers] = React.useState([]);
  const [showOriginalImage, setShowOriginalImage] = React.useState(false);
  const [openSplitDialog, setOpenSplitDialog] = React.useState(false);
  const [swiper, setSwiper] = React.useState(null);
  const [rebuildSwiper, setReBuildSwiper] = React.useState(false);

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

  const setShowAppBar = React.useCallback((val) => {
    let v = val;
    if (v === undefined) v = !store.showAppBar;
    dispatch({ showAppBar: v });
  }, [store.showAppBar]);

  const {
    loading,
    error,
    data,
  } = useQuery<{ book: BookType }>(BookQuery, {
    variables: {
      id: params.id,
    },
    onCompleted(d) {
      if (!d) return;
      dispatch({
        backRoute: `/info/${d.book.info.id}`,
        barTitle: d.book.info.name,
        barSubTitle: `No.${d.book.number}`,
      });
      if (isPageSet && page >= d.book.pages) {
        setPage(d.book.pages - 1, 0);
      }
    },
    onError() {
      setShowAppBar(true);
    },
  });

  const [deletePage, {
    loading: deleteLoading,
  }] = useMutation<{ del: Result }>(DeleteMutation, {
    variables: {
      id: params.id,
      numbers: deleteNumbers,
    },
    onCompleted() {
      setDeleteNumbers([]);
      window.location.reload();
    },
  });

  const [splitPage, {
    loading: splitLoading,
  }] = useMutation<{ split: Result }>(SplitMutation, {
    variables: {
      id: params.id,
      start: page,
    },
    onCompleted() {
      setOpenSplitDialog(false);
      window.location.reload();
    },
  });

  const [prevBook, nextBook] = usePrevNextBook(
    data ? data.book.info.id : undefined,
    params.id,
  );

  const increment = React.useCallback(() => {
    setPage(Math.min(page + 1, data.book.pages - 1));
    if (store.showAppBar) setShowAppBar(false);
    // eslint-disable-next-line react/destructuring-assignment
  }, [page, data, nextBook, store.showAppBar]);

  const decrement = React.useCallback(() => {
    setPage(Math.max(page - 1, 0));
    if (store.showAppBar) setShowAppBar(false);
    // eslint-disable-next-line react/destructuring-assignment
  }, [page, data, prevBook, store.showAppBar]);

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
    setShowAppBar(false);
    const update = {
      needContentMargin: false,
      barTitle: 'Book',
      barSubTitle: '',
      showBackRouteArrow: true,
    };
    if (data) {
      delete update.barTitle;
      delete update.barSubTitle;
    }
    dispatch(update);

    return () => {
      setShowAppBar(true);
      dispatch({ needContentMargin: true });
    };
  }, []);

  React.useEffect(() => {
    if (!swiper) return;
    db.bookReads.get(params.id).then((read) => {
      if (read) {
        let p = read.page;
        if (data && p >= data.book.pages) p = data.book.pages - 1;
        setPage(Math.max(p, 0), 0);
      } else {
        setPage(0, 0);
      }
      setPageSet(true);
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

  useKey('ArrowRight', () => [increment, decrement][store.readOrder](), undefined, [increment, decrement, store.readOrder]);
  useKey('ArrowLeft', () => [decrement, increment][store.readOrder](), undefined, [increment, decrement, store.readOrder]);

  const clickPage = React.useCallback((event) => {
    const percentX = event.nativeEvent.x / event.target.offsetWidth;
    switch (store.readOrder) {
      case 0:
        if (percentX <= 0.2) decrement();
        else if (percentX >= 0.8) increment();
        else setShowAppBar(undefined);
        break;
      case 1:
        if (percentX <= 0.2) increment();
        else if (percentX >= 0.8) decrement();
        else setShowAppBar(undefined);
        break;
      default:
        setShowAppBar(undefined);
    }
  }, [store.readOrder, increment, decrement]);

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

  const pages = React.useMemo(() => {
    if (!data || !data.book) return [];
    const sizes = [width, height];
    sizes[sizes[0] > sizes[1] ? 0 : 1] = 0;
    const pad = data.book.pages.toString(10).length;
    const suffix = showOriginalImage ? '' : `_${sizes[0]}x${sizes[1]}`;
    return [...Array(data.book.pages).keys()]
      .map((i) => `/book/${params.id}/${i.toString(10).padStart(pad, '0')}${suffix}.jpg`);
  }, [data, showOriginalImage, width, height]);

  const clickEffect = React.useCallback((eff) => {
    setEffect(eff);
    setEffectMenuAnchor(null);
  }, []);

  const networkType = useNetworkType();

  React.useEffect(() => {
    setShowOriginalImage(networkType === 'ethernet');
  }, [networkType]);

  if (loading || error) {
    return (
      <div className={classes.loading}>
        <div>
          {loading && 'Loading'}
          {error && `${error.toString().replace(/:\s*/g, '\n')}`}
        </div>
      </div>
    );
  }

  return (
    // eslint-disable-next-line
    <div className={classes.book} onClick={clickPage}>
      {/* eslint-disable-next-line */}
      <div
        className={classes.overlay}
        style={{ pointerEvents: store.showAppBar ? undefined : 'none' }}
        onClick={(e) => { if (store.showAppBar) { e.stopPropagation(); setShowAppBar(false); } }}
      >
        {store.showAppBar && (
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
                  onClick={() => setOpenSplitDialog(true)}
                >
                  Split after page
                </MenuItem>
                <MenuItem
                  onClick={() => setDeleteNumbers([debouncePage])}
                >
                  Remove this page
                </MenuItem>
                <MenuItem
                  onClick={() => setShowOriginalImage(!showOriginalImage)}
                >
                  {`Show ${showOriginalImage ? 'Compressed' : 'Original'} Image`}
                </MenuItem>
              </Menu>
              <DeleteDialog
                open={deleteNumbers && deleteNumbers.length > 0}
                loading={deleteLoading}
                onClickDelete={() => deletePage()}
                onClose={() => setDeleteNumbers([])}
                page={(debouncePage + 1).toString(10)}
              />
              <Dialog
                open={openSplitDialog}
                onClose={() => !splitLoading && setOpenSplitDialog(false)}
              >
                <DialogTitle>Split page</DialogTitle>
                <DialogContent>
                  <DialogContentText>
                    Do you want to split page?
                  </DialogContentText>

                  <div className={classes.splitButtonWrapper}>
                    <Button
                      disabled={splitLoading}
                      classes={{ label: classes.splitButton }}
                      onClick={() => splitPage({ variables: { type: 'VERTICAL' } })}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 100">
                        <polygon
                          points="10,10 140,10 140,80 10,80"
                          style={{ fill: 'rgba(0, 0, 0, 0)', stroke: '#000', strokeWidth: 3 }}
                        />
                        <line x1="75" y1="0" x2="75" y2="100" strokeWidth="5" stroke="red" />
                      </svg>
                      Vertical
                    </Button>

                    <Button
                      disabled={splitLoading}
                      classes={{ label: classes.splitButton }}
                      onClick={() => splitPage({ variables: { type: 'HORIZONTAL' } })}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 100">
                        <polygon
                          points="10,10 140,10 140,80 10,80"
                          style={{ fill: 'rgba(0, 0, 0, 0)', stroke: '#000', strokeWidth: 3 }}
                        />
                        <line x1="0" y1="45" x2="150" y2="45" strokeWidth="5" stroke="blue" />
                      </svg>
                      Horizontal
                    </Button>
                  </div>
                </DialogContent>

                <DialogActions>
                  <Button onClick={() => setOpenSplitDialog(false)} disabled={splitLoading}>
                    close
                  </Button>
                </DialogActions>
              </Dialog>
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

      <SwiperCustom
        Swiper={Swiper}
        rebuildOnUpdate={rebuildSwiper}
        getSwiper={updateSwiper}
        containerClass={store.readOrder === 0 ? classes.pageContainerLTR : classes.pageContainerRTL}
      >
        {pages.map((t, i) => ((Math.abs(i - debouncePage) <= 1) ? (
          <div className={classes.page} key={t}>
            <Img
              imgStyle={effectBackGround}
              src={t}
              alt={(i + 1).toString(10)}
              className={classes.pageImage}
            />
          </div>
        ) : (<div key={t} />)))}
      </SwiperCustom>

      <div className={classes.pageProgress} style={{ justifyContent: `flex-${['start', 'end'][store.readOrder]}` }}>
        <div style={{ width: `${(swiper ? swiper.progress : 0) * 100}%` }} />
      </div>
    </div>
  );
};

export default hot(Book);
