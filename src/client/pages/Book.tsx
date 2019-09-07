import * as React from 'react';
import {
  createStyles,
  makeStyles,
  Theme,
  IconButton,
  Icon,
  Slider,
} from '@material-ui/core';
import useReactRouter from 'use-react-router';
import { useQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { Observer } from 'mobx-react';

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
      top: theme.spacing(/* appBar */8 + 2),
      whiteSpace: 'nowrap',
    },
    '&.bottom': {
      width: '80%',
      gridTemplateRows: '1fr 1fr',
      bottom: theme.spacing(2),
    },
  },
  bottomSlider: {
    gridColumn: '1 / span 3',
    margin: `0 ${theme.spacing(2)}`,
  },
}));

const Book: React.FC = (props: BookProps) => {
  const classes = useStyles(props);
  const { match } = useReactRouter();
  const {
    loading,
    error,
    data,
  } = useQuery(gql`
      query ($id: ID!) {
          book(bookId: $id) {
              number
              pages
              info {
                  name
              }
          }
      }
  `, {
    variables: {
      id: match.params.id,
    },
  });
  const [page, setPage] = React.useState(0);
  const increment = () => {
    setPage(Math.min(page + 1, data.book.pages - 1));
  };
  const decrement = () => {
    setPage(Math.max(page - 1, 0));
  };
  const setShowAppBar = (val) => {
    let v = val;
    if (v === undefined) v = !props.store.showAppBar;
    // eslint-disable-next-line
    props.store.showAppBar = v;
  };
  React.useEffect(() => {
    setShowAppBar(false);
    // eslint-disable-next-line
    props.store.needContentMargin = false;
    return () => {
      setShowAppBar(true);
      // remove onkeydown
      window.document.onkeydown = () => {
      };
      // eslint-disable-next-line
      props.store.needContentMargin = true;
    };
  }, []);
  window.document.onkeydown = ({ key }) => {
    switch (key) {
      case 'ArrowRight':
        increment();
        break;
      case 'ArrowLeft':
        decrement();
        break;
      default:
    }
  };

  // eslint-disable-next-line
  props.store.barTitle = 'Book';
  if (loading || error || !data.book) {
    return (
      <div>
        {loading && 'Loading'}
        {error && `Error: ${error}`}
        {!data.bookInfo && 'Empty'}
      </div>
    );
  }
  // eslint-disable-next-line
  props.store.barTitle = `${data.book.info.name} No.${data.book.number}`;

  const pad = data.book.pages.toString(10).length;
  const pages = [...Array(data.book.pages).keys()]
    .map((i) => `${window.location.protocol}//${window.location.hostname}:8081/book/${match.params.id}/${i.toString(10).padStart(pad, '0')}.jpg`);

  const clickPage = (event) => {
    const targetWidth = event.target.offsetWidth;
    const clickX = event.nativeEvent.x;
    const percent = clickX / targetWidth;
    if (percent <= 0.2) decrement();
    else if (percent >= 0.8) increment();
    else setShowAppBar(undefined);
  };

  /* eslint-disable */
  return (
    <div className={classes.book} onClick={clickPage}>
      <div className={classes.overlay}>
        <Observer>
          {() => (props.store.showAppBar ? (
            <div className={`${classes.overlayContent} top`} onClick={(e) => e.stopPropagation()}>
              <div style={{ gridColumn: '1 / span 3' }}>{`${page + 1} / ${data.book.pages}`}</div>
            </div>
          ) : null)}
        </Observer>
        <Observer>
          {() => (props.store.showAppBar ? (
            <div className={`${classes.overlayContent} bottom`} onClick={(e) => e.stopPropagation()}>
              <IconButton size="small" onClick={decrement}>
                <Icon style={{ color: 'white' }}>keyboard_arrow_left</Icon>
              </IconButton>
              <div />
              <IconButton size="small" onClick={increment}>
                <Icon style={{ color: 'white' }}>keyboard_arrow_right</Icon>
              </IconButton>
              <div className={classes.bottomSlider}>
                <Slider
                  max={data.book.pages}
                  min={1}
                  value={page + 1}
                  onChange={(e, v: number) => setPage(v - 1)} />
              </div>
            </div>
          ) : null)}
        </Observer>
      </div>

      <div className={classes.page}>
        <img src={pages[page]} alt={page.toString(10)} className={classes.pageImage} />
      </div>
    </div>
  );
};

export default Book;
