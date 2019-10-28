import * as React from 'react';
import {
  createStyles,
  makeStyles,
  Theme,
  MuiThemeProvider,
  Slider,
  Button,
  useTheme,
  createMuiTheme, Menu, MenuItem, Icon, IconButton,
} from '@material-ui/core';
import { useMutation, useQuery } from '@apollo/react-hooks';
import { useParams, useHistory } from 'react-router-dom';
import { useWindowSize } from 'react-use';

import * as BookQuery from '@client/graphqls/Pages_Book_book.gql';
import * as DeleteMutation from '@client/graphqls/Pages_Page_delete.gql';

import { Book as BookType, Result } from '@common/GraphqlTypes';
import useDebounceValue from '@client/hooks/useDebounceValue';
import usePrevNextBook from '@client/hooks/usePrevNextBook';
import { useGlobalStore } from '@client/store/StoreProvider';
import { commonTheme } from '@client/App';

import { orange } from '@material-ui/core/colors';
import db from '../Database';
import Img from '../components/Img';
import DeleteDialog from '../components/dialogs/DeleteDialog';

interface BookProps {
  children?: React.ReactElement;
}

const useStyles = makeStyles((theme: Theme) => createStyles({
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
  pageImage: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    paddingTop: commonTheme.safeArea.top,
  },
  overlay: {
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
      gridTemplateRows: '1fr 1fr',
      bottom: theme.spacing(2),
    },
    '&.center': {
      background: 'inherit',
      height: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
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
}));

const Book: React.FC = (props: BookProps) => {
  const { state: store, dispatch } = useGlobalStore();
  const classes = useStyles(props);
  const history = useHistory();
  const params = useParams<{ id: string }>();

  const [routeButton, setRouteButton] = React.useState([false, false]); // prev, next
  const [page, setPage] = React.useState(0);
  const debouncePage = useDebounceValue(page, 200);
  const [readOrder, setReadOrder] = React.useState(0); // LtoR, RtoL
  const [effect, setEffect] = React.useState<undefined | 'paper' | 'dark'>(undefined);
  const [effectMenuAnchor, setEffectMenuAnchor] = React.useState(null);
  const [effectPercentage, setEffectPercentage] = React.useState(0);
  const [isPageSet, setPageSet] = React.useState(false);
  const [settingsMenuAnchor, setSettingsMenuAnchor] = React.useState(undefined);
  const [deleteNumbers, setDeleteNumbers] = React.useState([]);
  const [showOriginalImage, setShowOriginalImage] = React.useState(false);

  const windowSize = useWindowSize();
  const { width, height } = useDebounceValue(windowSize, 800);

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
        barTitle: `${d.book.info.name} No.${d.book.number}`,
      });
      if (isPageSet && page >= d.book.pages) {
        setPage(d.book.pages - 1);
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

  const [prevBook, nextBook] = usePrevNextBook(
    data ? data.book.info.id : undefined,
    params.id,
  );

  const increment = React.useCallback(() => {
    let preRoute = [];
    if (page === data.book.pages - 1) {
      preRoute = [false, !!(data.book && nextBook)];
    } else if (page === 0 && routeButton[0]) {
      preRoute = [false, false];
      return;
    } else {
      preRoute = [false, false];
    }
    if (preRoute[0] !== routeButton[0] || preRoute[1] !== routeButton[1]) {
      setRouteButton(preRoute);
    }
    setPage(Math.min(page + 1, data.book.pages - 1));
    if (store.showAppBar) setShowAppBar(false);
    // eslint-disable-next-line react/destructuring-assignment
  }, [page, data, nextBook, routeButton[0], store.showAppBar]);

  const decrement = React.useCallback(() => {
    let preRoute = [];
    if (page === 0) {
      preRoute = [!!(data.book && prevBook), false];
    } else if (page === data.book.pages - 1 && routeButton[1]) {
      preRoute = [false, false];
      return;
    } else {
      preRoute = [false, false];
    }
    if (preRoute[0] !== routeButton[0] || preRoute[1] !== routeButton[1]) {
      setRouteButton(preRoute);
    }
    setPage(Math.max(page - 1, 0));
    if (store.showAppBar) setShowAppBar(false);
    // eslint-disable-next-line react/destructuring-assignment
  }, [page, data, prevBook, routeButton[1], store.showAppBar]);

  const theme = useTheme();
  const sliderTheme = React.useMemo(() => createMuiTheme({
    ...theme,
    direction: readOrder === 1 ? 'rtl' : 'ltr',
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
          backgroundColor: `rgba(0, 0, 0, ${effectPercentage / 100}`,
        };
      case 'paper':
        return {
          backgroundColor: `rgba(255, 250, 240, ${effectPercentage / 100}`,
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
      showBackRouteArrow: true,
    };
    if (data) delete update.barTitle;
    dispatch(update);

    db.bookReads.get(params.id).then((read) => {
      if (read) {
        let p = read.page;
        if (data && p >= data.book.pages) p = data.book.pages - 1;
        setPage(Math.max(p, 0));
      }
      setPageSet(true);
    });

    return () => {
      setShowAppBar(true);
      // remove onkeydown
      window.document.onkeydown = () => {
      };
      dispatch({ needContentMargin: true });
    };
  }, []);

  React.useEffect(() => {
    if (isPageSet) {
      db.bookReads.put({
        bookId: params.id,
        page,
      }).catch(() => { /* ignored */
      });
    }
  }, [isPageSet, page]);

  React.useEffect(() => {
    window.document.onkeydown = ({ key }) => {
      switch (key) {
        case 'ArrowRight':
          if (readOrder === 0) increment();
          else if (readOrder === 1) decrement();
          break;
        case 'ArrowLeft':
          if (readOrder === 0) decrement();
          else if (readOrder === 1) increment();
          break;
        case 'ArrowUp':
          if (readOrder === 2) decrement();
          else if (readOrder === 3) increment();
          break;
        case 'ArrowDown':
          if (readOrder === 2) increment();
          else if (readOrder === 3) decrement();
          break;
        default:
      }
    };
  }, [readOrder, increment, decrement]);

  const clickPage = React.useCallback((event) => {
    const percentX = event.nativeEvent.x / event.target.offsetWidth;
    const percentY = event.nativeEvent.y / event.target.offsetHeight;
    switch (readOrder) {
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
      case 2:
        if (percentY <= 0.2) decrement();
        else if (percentY >= 0.8) increment();
        else setShowAppBar(undefined);
        break;
      case 3:
        if (percentY <= 0.2) increment();
        else if (percentY >= 0.8) decrement();
        else setShowAppBar(undefined);
        break;
      default:
        setShowAppBar(undefined);
    }
  }, [readOrder, increment, decrement]);

  const clickRouteButton = React.useCallback((e, i) => {
    e.stopPropagation();
    const bookId = [prevBook, nextBook][i];
    if (!bookId) return;
    db.infoReads.put({
      infoId: data.book.info.id,
      bookId,
    }).catch(() => { /* ignored */
    });
    history.push('/dummy');
    setTimeout(() => {
      history.replace(`/book/${bookId}`);
    });
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
      <div className={classes.overlay} style={effectBackGround}>
        {store.showAppBar && (
          <>
            {/* eslint-disable-next-line */}
            <div className={`${classes.overlayContent} top`} onClick={(e) => e.stopPropagation()}>
              <div style={{ gridColumn: '1 / span 3' }}>{`${page + 1} / ${data.book.pages}`}</div>
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
              <Button
                variant="outlined"
                style={{ color: 'white', borderColor: 'white', margin: '0 auto' }}
                onClick={() => setReadOrder((readOrder + 1) % 2)}
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
                    value={page + 1}
                    onChange={(e, v: number) => setPage(v - 1)}
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
        {(routeButton.some((a) => a)) ? (
          // eslint-disable-next-line
          <div className={`${classes.overlayContent} center`} onClick={(e) => { e.stopPropagation(); setRouteButton([false, false]); }}>
            {routeButton[1] && (
              <Button variant="contained" color="secondary" onClick={(e) => clickRouteButton(e, 1)}>
                to Next book
              </Button>
            )}
            {routeButton[0] && (
              <Button variant="contained" color="secondary" onClick={(e) => clickRouteButton(e, 0)}>
                to Prev book
              </Button>
            )}
          </div>
        ) : null}
      </div>

      <div className={classes.page}>
        {(debouncePage >= 1) ? (
          <Img src={pages[debouncePage - 1]} hidden />
        ) : null}
        <Img
          src={pages[debouncePage]}
          alt={(debouncePage + 1).toString(10)}
          className={classes.pageImage}
        />
        {(debouncePage <= data.book.pages - 2) ? (
          <Img src={pages[debouncePage + 1]} hidden />
        ) : null}
      </div>
    </div>
  );
};

// @ts-ignore
Book.whyDidYouRender = true;

export default Book;
