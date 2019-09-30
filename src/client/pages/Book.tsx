import * as React from 'react';
import {
  createStyles,
  makeStyles,
  Theme,
  IconButton,
  Icon,
  Slider, Button,
} from '@material-ui/core';
import useReactRouter from 'use-react-router';
import { useQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { Observer } from 'mobx-react';

import db from '../Database';
import Img from '../components/Img';
import { Book as BookType } from '../../common/GraphqlTypes';

interface BookProps {
  store: any;
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
      top: `calc(${theme.spacing(/* appBar */8 + 2)}px + env(safe-area-inset-top))`,
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
}));

const Book: React.FC = (props: BookProps) => {
  const classes = useStyles(props);
  const { match, history } = useReactRouter();
  const {
    loading,
    error,
    data,
  } = useQuery<{ book: BookType }>(gql`
      query ($id: ID!) {
          book(id: $id) {
              id
              number
              pages
              info {
                  id
                  name
              }
              
              nextBook
              prevBook
          }
      }
  `, {
    variables: {
      id: match.params.id,
    },
    onCompleted({ book }) {
      // eslint-disable-next-line no-param-reassign
      props.store.backRoute = `/info/${book.info.id}`;
    },
  });

  const [routeButton, setRouteButton] = React.useState([false, false]); // prev, next
  const [page, setPage] = React.useState(0);
  const [readOrder, setReadOrder] = React.useState(0); // LtoR, RtoL, TtoB, BtoT

  const setShowAppBar = (val) => {
    let v = val;
    if (v === undefined) v = !props.store.showAppBar;
    // eslint-disable-next-line
    props.store.showAppBar = v;
  };

  const increment = () => {
    if (page === data.book.pages - 1) {
      setRouteButton([false, !!(data.book && data.book.nextBook)]);
    } else if (page === 0 && routeButton[0]) {
      setRouteButton([false, false]);
      return;
    } else {
      setRouteButton([false, false]);
    }
    setPage(Math.min(page + 1, data.book.pages - 1));
    if (props.store.showAppBar) setShowAppBar(false);
  };

  const decrement = () => {
    if (page === 0) {
      setRouteButton([!!(data.book && data.book.prevBook), false]);
    } else if (page === data.book.pages - 1 && routeButton[1]) {
      setRouteButton([false, false]);
      return;
    } else {
      setRouteButton([false, false]);
    }
    setPage(Math.max(page - 1, 0));
    if (props.store.showAppBar) setShowAppBar(false);
  };

  const [isPageSet, setPageSet] = React.useState(false);
  React.useEffect(() => {
    setShowAppBar(false);
    // eslint-disable-next-line
    props.store.needContentMargin = false;

    db.bookReads.get(match.params.id).then((read) => {
      if (read) {
        setPage(read.page);
      }
      setPageSet(true);
    });

    return () => {
      setShowAppBar(true);
      // remove onkeydown
      window.document.onkeydown = () => {
      };
      // eslint-disable-next-line
      props.store.needContentMargin = true;
    };
  }, []);

  if (isPageSet) {
    db.bookReads.put({
      bookId: match.params.id,
      page,
    }).catch(() => { /* ignored */
    });
  } else {
    return null;
  }

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

  // eslint-disable-next-line
  props.store.barTitle = 'Book';

  const clickPage = (event) => {
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
  };

  const clickRouteButton = (e, i) => {
    e.stopPropagation();
    const bookId = [data.book.prevBook, data.book.nextBook][i];
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
  };

  if (loading || error || !data || !data.book) {
    return (
      <div>
        {loading && 'Loading'}
        {error && `Error: ${error}`}
        {(!data || !data.book) && 'Empty'}
      </div>
    );
  }
  // eslint-disable-next-line
  props.store.barTitle = `${data.book.info.name} No.${data.book.number}`;

  const sizes = [document.body.offsetWidth, document.body.offsetHeight];
  sizes[sizes[0] > sizes[1] ? 0 : 1] = 0;
  const pad = data.book.pages.toString(10).length;
  const pages = [...Array(data.book.pages).keys()]
    .map((i) => `/book/${match.params.id}/${i.toString(10).padStart(pad, '0')}_${sizes[0]}x${sizes[1]}.jpg`);

  return (
    // eslint-disable-next-line
    <div className={classes.book} onClick={clickPage}>
      <div className={classes.overlay}>
        <Observer>
          {() => (props.store.showAppBar ? (
            // eslint-disable-next-line
            <div className={`${classes.overlayContent} top`} onClick={(e) => e.stopPropagation()}>
              <div style={{ gridColumn: '1 / span 3' }}>{`${page + 1} / ${data.book.pages}`}</div>
            </div>
          ) : null)}
        </Observer>
        <Observer>
          {() => (props.store.showAppBar ? (
            // eslint-disable-next-line
            <div className={`${classes.overlayContent} bottom`} onClick={(e) => e.stopPropagation()}>
              <IconButton size="small" onClick={decrement}>
                <Icon style={{ color: 'white' }}>keyboard_arrow_left</Icon>
              </IconButton>
              <Button
                variant="outlined"
                style={{ color: 'white', borderColor: 'white', margin: '0 auto' }}
                onClick={() => setReadOrder((readOrder + 1) % 4)}
              >
                {['L > R', 'L < R', 'T > B', 'T < B'][readOrder]}
              </Button>
              <IconButton size="small" onClick={increment}>
                <Icon style={{ color: 'white' }}>keyboard_arrow_right</Icon>
              </IconButton>
              <div className={classes.bottomSlider}>
                <Slider
                  color="secondary"
                  valueLabelDisplay="auto"
                  max={data.book.pages}
                  min={1}
                  value={page + 1}
                  onChange={(e, v: number) => setPage(v - 1)}
                />
              </div>
            </div>
          ) : null)}
        </Observer>
        {(routeButton.some((a) => a)) ? (
          // eslint-disable-next-line
          <div className={`${classes.overlayContent} center`} onClick={(e) => { e.stopPropagation(); setRouteButton([false, false]); }}>
            {routeButton[1] ? (
              <Button variant="contained" color="secondary" onClick={(e) => clickRouteButton(e, 1)}>
                to Next book
              </Button>
            ) : null}
            {routeButton[0] ? (
              <Button variant="contained" color="secondary" onClick={(e) => clickRouteButton(e, 0)}>
                to Prev book
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className={classes.page}>
        {(page >= 1) ? (
          <Img src={pages[page - 1]} hidden />
        ) : null}
        <Img src={pages[page]} alt={(page + 1).toString(10)} className={classes.pageImage} />
        {(page <= data.book.pages - 2) ? (
          <Img src={pages[page + 1]} hidden />
        ) : null}
      </div>
    </div>
  );
};

export default Book;
