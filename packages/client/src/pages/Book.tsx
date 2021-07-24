import React from 'react';
import { createStyles, makeStyles, Theme, } from '@material-ui/core';

import SwiperCore, { Virtual } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/swiper-bundle.min.css';

import { useHistory, useParams } from 'react-router-dom';
import { useKey, useWindowSize } from 'react-use';
import { useSnackbar } from 'notistack';
import { useRecoilValue } from 'recoil';
import { NumberParam, useQueryParam } from 'use-query-params';

import { useBookQuery } from '@syuchan1005/book-reader-graphql/generated/GQLQueries';
import { defaultTitle } from '@syuchan1005/book-reader-common';

import db from '@client/Database';
import { commonTheme } from '@client/App';
import useDebounceValue from '@client/hooks/useDebounceValue';
import usePrevNextBook from '@client/hooks/usePrevNextBook';
import useBooleanState from '@client/hooks/useBooleanState';
import BookPageImage from '@client/components/BookPageImage';
import TitleAndBackHeader from '@client/components/TitleAndBackHeader';
import { ReadOrder, readOrderState, showOriginalImageState } from '@client/store/atoms';
import useLazyDialog from '@client/hooks/useLazyDialog';
import BookPageOverlay from '@client/components/BookPageOverlay';
import { Remount } from '@client/components/Remount';

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
    maxWidth: '100%',
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
    db.bookReads.get(bookId)
      .then((read) => {
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

export type PageStyleType = {
  slidesPerView: number,
  pageClass: (_index: number) => string,
  normalizeCount: (i: number) => number,
  icon: {
    name: string,
    style: Object,
  },
  prefixPage: number,
};

const PageStyle: { [key: string]: PageStyleType } = {
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

export type PageEffect = 'paper' | 'dark';

const Book = (props: BookProps) => {
  const readOrder = useRecoilValue(readOrderState);
  const showOriginalImage = useRecoilValue(showOriginalImageState);
  const classes = useStyles(props);
  const history = useHistory();
  const { enqueueSnackbar } = useSnackbar();
  const { id: bookId } = useParams<{ id: string }>();
  const setTitle = React.useCallback((title) => {
    document.title = typeof title === 'function' ? title(defaultTitle) : title;
  }, []);

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
    if (page >= data.book.pages) {
      if (nextBook) {
        openBook(nextBook);
      }
    } else if (isPageSet) {
      setDbPage(page)
        .catch((e) => enqueueSnackbar(e, { variant: 'error' }));
      setQueryPage(page, 'replace');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const [effect, setEffect] = React.useState<PageEffect | undefined>(undefined);
  const [effectPercentage, setEffectPercentage] = React.useState(0);
  const [swiper, setSwiper] = React.useState(null);
  const [openEditDialog, canMountEditDialog,
    setOpenEditDialog, setCloseEditDialog] = useLazyDialog(false);
  const [showAppBar, setShowAppBar, setHideAppBar, toggleAppBar] = useBooleanState(false);
  const [pageStyleKey, setPageStyle] = React.useState<PageStyles>('SinglePage');
  const {
    slidesPerView,
    pageClass,
    normalizeCount,
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
  React.useEffect(() => {
    if (data) {
      setTitle((t) => `${data.book.info.name} No.${data.book.number} - ${t}`);
    }
  }, [data, setTitle]);

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

  const openBook = React.useCallback((targetBookId: string) => {
    db.infoReads.put({
      infoId: data.book.info.id,
      bookId: targetBookId,
    })
      .catch((e1) => enqueueSnackbar(e1, { variant: 'error' }));
    history.push(`/book/${targetBookId}`);
  }, [data, enqueueSnackbar, history]);

  const imageSize = React.useMemo(() => {
    if (showOriginalImage) {
      return {
        width: undefined,
        height: undefined,
      };
    }
    return windowSize;
  }, [windowSize, showOriginalImage]);

  const canImageVisible = React.useCallback((i: number) => imageSize
    && isPageSet
    && (i < debouncePage
      ? debouncePage - i <= slidesPerView
      : i - debouncePage <= (slidesPerView * 2 - 1)),
  [debouncePage, imageSize, isPageSet, slidesPerView]);

  const goNextBook = React.useMemo(
    () => (nextBook ? () => openBook(nextBook) : undefined), [openBook, nextBook],
  );

  const goPreviousBook = React.useCallback(
    () => (prevBook ? () => openBook(prevBook) : undefined), [openBook, prevBook],
  );

  const setNextPageStyle = React
    .useCallback(() => setPageStyle((p) => NextPageStyleMap[p]), []);

  const onPageSliderChanged = React.useCallback((p) => setPage(p, 0), [setPage]);

  if (loading || error) {
    return (
      <>
        <TitleAndBackHeader title="Book" />
        <main>
          <div className={classes.loading}>
            <div>
              {loading && 'Loading'}
              {error && `${error.toString()
                .replace(/:\s*/g, '\n')}`}
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

      {/* eslint-disable-next-line */}
      <main className={classes.book} onClick={clickPage}>
        {(canMountEditDialog) && (
          <EditPagesDialog
            open={openEditDialog}
            onClose={setCloseEditDialog}
            maxPage={data ? data.book.pages : 0}
            bookId={bookId}
          />
        )}
        {showAppBar && (
          <BookPageOverlay
            currentPage={page}
            onPageSliderChanged={onPageSliderChanged}
            maxPages={data ? data.book.pages : 0}
            pageStyle={PageStyle[pageStyleKey]}
            onPageStyleClick={setNextPageStyle}
            pageEffect={effect}
            onPageEffectChanged={setEffect}
            pageEffectPercentage={effectPercentage}
            onPageEffectPercentage={setEffectPercentage}
            setHideAppBar={setHideAppBar}
            goNextBook={goNextBook}
            goPreviousBook={goPreviousBook}
            onEditClick={setOpenEditDialog}
          />
        )}

        <Remount remountKey={`${bookId}:${pageStyleKey}:${readOrder}`}>
          <Swiper
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
              <SwiperSlide
                key={`virtual-${data.book.pages + prefixPage + i}`}
                virtualIndex={data.book.pages + prefixPage + i}
              />
            ))}
            {(nextBook) && [...new Array(slidesPerView).keys()].map((i) => (
              <SwiperSlide
                key={`virtual-${data.book.pages + prefixPage + ((data.book.pages + prefixPage) % slidesPerView) + i}`}
                virtualIndex={data.book.pages + prefixPage
                + ((data.book.pages + prefixPage) % slidesPerView) + i}
              />
            ))}
          </Swiper>
        </Remount>

        <div
          className={classes.pageProgress}
          style={{ justifyContent: `flex-${['start', 'end'][readOrder]}` }}
        >
          <div style={{ width: `${(swiper ? swiper.progress : 0) * 100}%` }} />
        </div>
      </main>
    </>
  );
};

export default React.memo(Book);
