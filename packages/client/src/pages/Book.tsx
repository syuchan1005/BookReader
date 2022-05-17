import React, { CSSProperties } from 'react';
import { Theme } from '@mui/material';

import createStyles from '@mui/styles/createStyles';
import makeStyles from '@mui/styles/makeStyles';

import { Virtual, Keyboard } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/virtual';
import 'swiper/css/keyboard';

import {
  useNavigate,
  useLocation,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { useWindowSize } from 'react-use';
import { useRecoilValue, useSetRecoilState } from 'recoil';

import { useBookQuery } from '@syuchan1005/book-reader-graphql/generated/GQLQueries';

import db from '@client/indexedDb/Database';
import usePrevNextBook from '@client/hooks/usePrevNextBook';
import useBooleanState from '@client/hooks/useBooleanState';
import BookPageImage from '@client/components/BookPageImage';
import TitleAndBackHeader from '@client/components/TitleAndBackHeader';
import {
  alertDataState, pageImageEffectState,
  ReadOrder,
  readOrderState,
  showOriginalImageState,
} from '@client/store/atoms';
import useLazyDialog from '@client/hooks/useLazyDialog';
import BookPageOverlay from '@client/components/BookPageOverlay';
import { Remount } from '@client/components/Remount';
import useDebounceValue from '@client/hooks/useDebounceValue';
import { useTitle } from '@client/hooks/useTitle';

const EditPagesDialog = React.lazy(() => import('@client/components/dialogs/EditPagesDialog'));

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
    backgroundColor: theme.palette.grey['900'],
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
    infoId: string,
  ) => Promise<void>,
] => {
  const [loading, setLoading] = React.useState(true);
  const [page, updatePageState] = React.useState(defaultPage);

  React.useEffect(() => {
    setLoading(true);
    db.read.get(bookId)
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

  const setPage = React.useCallback((p: number, infoId: string): Promise<void> => {
    if (loading) {
      return Promise.reject();
    }

    return db.read.put({
      infoId,
      bookId,
      page: p,
      isDirty: true,
      updatedAt: new Date(),
    })
      .then(() => undefined);
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

const Book = (props: BookProps) => {
  const readOrder = useRecoilValue(readOrderState);
  const showOriginalImage = useRecoilValue(showOriginalImageState);
  const pageImageEffect = useRecoilValue(pageImageEffectState);
  const classes = useStyles(props);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const setAlertData = useSetRecoilState(alertDataState);
  const { id: bookId } = useParams();

  const [page, updatePage] = React.useState(0);
  const [dbLoading, dbPage, setDbPage] = useDatabasePage(bookId);
  const [isPageSet, setPageSet] = React.useState(false);
  React.useEffect(() => {
    if (dbLoading) {
      return;
    }

    const queryPage = parseInt(searchParams.get('page'), 10) || -1;
    if (queryPage >= 0 && queryPage !== page) {
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

  const [openEditDialog, canMountEditDialog,
    setOpenEditDialog, setCloseEditDialog] = useLazyDialog(false);
  const [showAppBar, setShowAppBar, setHideAppBar, toggleAppBar] = useBooleanState(false);
  const [pageStyleKey, setPageStyle] = React.useState<PageStyles>('SinglePage');
  const {
    slidesPerView,
    normalizeCount,
  } = PageStyle[pageStyleKey];

  React.useEffect(() => {
    updatePage(0);
    setPageSet(false);
  }, [bookId]);

  const windowSize = useWindowSize();

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
  useTitle(data ? `${data.book.info.name} No.${data.book.number}` : '');
  const maxPage = React.useMemo(() => (data ? data.book.pages : 0), [data]);
  const [prevBook, nextBook] = usePrevNextBook(
    data ? data.book.info.id : undefined,
    bookId,
  );

  React.useEffect(() => {
    if (page >= maxPage) {
      if (nextBook && data) {
        openBook(data.book.info.id, nextBook);
      }
    } else if (isPageSet) {
      setDbPage(page, data.book.info.id)
        .catch((e) => setAlertData({
          message: e,
          variant: 'error',
        }));
      const copiedSearchParams = new URLSearchParams(searchParams);
      copiedSearchParams.set('page', page.toString());
      setSearchParams(copiedSearchParams, {
        replace: true,
        state: location.state,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, setAlertData]);

  const [pageUpdateRequest, setPageUpdateRequest] = React.useState(undefined);
  const setPage = React.useCallback((s, time = 150) => {
    let validatedPage = Math.max(s, 0);
    if (maxPage > 0) {
      const maxPageCount = maxPage - (nextBook ? 0 : 1);
      validatedPage = Math.min(validatedPage, normalizeCount(maxPageCount));
    }
    validatedPage = normalizeCount(validatedPage);
    setPageUpdateRequest({ page: validatedPage, time });
    updatePage(validatedPage);
  }, [maxPage, normalizeCount, nextBook]);

  const increment = React.useCallback(() => {
    setPage(page + slidesPerView);
    setHideAppBar();
  }, [page, setPage, setHideAppBar, slidesPerView]);

  const decrement = React.useCallback(() => {
    setPage(page - slidesPerView);
    setHideAppBar();
  }, [page, setHideAppBar, setPage, slidesPerView]);

  const effectBackGround = React.useMemo(() => {
    switch (pageImageEffect?.type) {
      case 'dark':
        return {
          filter: `brightness(${100 - pageImageEffect.percent}%)`,
        };
      case 'paper':
        return {
          filter: `sepia(${pageImageEffect.percent}%)`,
        };
      default:
        return undefined;
    }
  }, [pageImageEffect]);

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

  const openBook = React.useCallback((infoId: string, targetBookId: string) => {
    navigate(`/book/${targetBookId}`, {
      state: {
        // @ts-ignore
        referrer: location.state?.referrer || location.pathname,
      },
      replace: true,
    });
  }, [navigate, location]);

  const imageSize = React.useMemo(() => {
    if (showOriginalImage) {
      return {
        width: undefined,
        height: undefined,
      };
    }
    return windowSize;
  }, [windowSize, showOriginalImage]);

  const goNextBook = React.useMemo(() => {
    if (nextBook && data) {
      return () => openBook(data.book.info.id, nextBook);
    }
    return undefined;
  }, [data, openBook, nextBook]);

  const goPreviousBook = React.useMemo(() => {
    if (prevBook && data) {
      return () => openBook(data.book.info.id, prevBook);
    }
    return undefined;
  }, [data, openBook, prevBook]);

  const setNextPageStyle = React
    .useCallback(() => setPageStyle((p) => NextPageStyleMap[p]), []);

  const onPageSliderChanged = React.useCallback((p) => setPage(p, 0), [setPage]);

  if (loading || (error && !data)) {
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
            maxPage={maxPage}
            bookId={bookId}
          />
        )}
        {showAppBar && (
          <BookPageOverlay
            currentPage={page}
            onPageSliderChanged={onPageSliderChanged}
            maxPages={maxPage}
            pageStyle={PageStyle[pageStyleKey]}
            onPageStyleClick={setNextPageStyle}
            setHideAppBar={setHideAppBar}
            goNextBook={goNextBook}
            goPreviousBook={goPreviousBook}
            onEditClick={setOpenEditDialog}
          />
        )}

        <SwiperSlider
          bookId={bookId}
          pageStyleKey={pageStyleKey}
          readOrder={readOrder}
          maxPage={maxPage}
          imageSize={imageSize}
          page={page}
          hasNextBook={!!nextBook}
          effectBackGround={effectBackGround}
          openEditDialog={openEditDialog}
          classes={classes}
          pageUpdateRequest={pageUpdateRequest}
          onPageUpdated={updatePage}
          onKeyPress={setHideAppBar}
        />

        <div
          className={classes.pageProgress}
          style={{ justifyContent: `flex-${readOrder === ReadOrder.LTR ? 'start' : 'end'}` }}
        >
          <div style={{ width: `${(page / (maxPage - 1)) * 100}%` }} />
        </div>
      </main>
    </>
  );
};

type SwiperSliderProp = {
  bookId: string;
  pageStyleKey: PageStyles;
  readOrder: keyof typeof ReadOrder;
  maxPage: number;
  imageSize: {
    width: number | undefined;
    height: number | undefined;
  },
  page: number;
  hasNextBook: boolean;
  effectBackGround: CSSProperties | undefined;
  openEditDialog: boolean;
  classes: {
    pageContainer: string;
  },

  pageUpdateRequest: { page: number, time: number } | undefined;

  onPageUpdated: (page: number) => void;
  onKeyPress: () => void;
};

const SwiperSlider = (props: SwiperSliderProp) => {
  const {
    bookId,
    pageStyleKey,
    readOrder,
    maxPage,
    imageSize,
    page,
    hasNextBook,
    effectBackGround,
    openEditDialog,
    classes,
    pageUpdateRequest,
    onPageUpdated,
    onKeyPress,
  } = props;
  const {
    slidesPerView,
    pageClass,
    prefixPage,
  } = PageStyle[pageStyleKey];

  const [swiper, setSwiper] = React.useState(null);
  const debouncePage = useDebounceValue(page, 300);

  const requestRef = React.useRef<typeof pageUpdateRequest>();
  React.useEffect(() => {
    if (pageUpdateRequest && swiper) {
      requestRef.current = pageUpdateRequest;
      swiper.slideTo(pageUpdateRequest.page, pageUpdateRequest.time, false);
    }
    // eslint-disable-next-line
  }, [pageUpdateRequest]);

  React.useEffect(() => {
    if (openEditDialog) {
      swiper?.disable();
    } else {
      swiper?.enable();
    }
    // eslint-disable-next-line
  }, [openEditDialog]);

  const updateSwiper = React.useCallback((s) => {
    s?.slideTo(page, 0, false);
    setSwiper(s);
  }, [page]);

  const handleSlideChange = React.useCallback((s) => {
    if (requestRef.current?.page !== s.activeIndex) {
      onPageUpdated(s.activeIndex);
    } else {
      requestRef.current = undefined;
    }
  }, [onPageUpdated]);

  return (
    <Remount remountKey={`${bookId}:${pageStyleKey}:${readOrder}`}>
      <Swiper
        modules={[Virtual, Keyboard]}
        onSwiper={updateSwiper}
        onSlideChange={handleSlideChange}
        onKeyPress={onKeyPress}
        dir={readOrder === ReadOrder.LTR ? 'ltr' : 'rtl'}
        className={classes.pageContainer}
        slidesPerView={slidesPerView}
        slidesPerGroup={slidesPerView}
        virtual={{
          addSlidesAfter: slidesPerView * 2,
        }}
        keyboard
      >
        {[...new Array(prefixPage).keys()].map((i) => (
          <SwiperSlide key={`virtual-${i}`} virtualIndex={i} />
        ))}
        {[...new Array(maxPage).keys()].map((i, index) => (
          <SwiperSlide
            key={`${i}_${imageSize[0]}_${imageSize[1]}`}
            virtualIndex={index + prefixPage}
            className={pageClass(index)}
          >
            <BookPageImage
              style={effectBackGround}
              bookId={bookId}
              pageIndex={i}
              bookPageCount={maxPage}
              {...imageSize}
              alt={(i + 1).toString(10)}
              loading="eager"
              sizeDebounceDelay={300}
              skip={Math.abs(index - debouncePage) > slidesPerView}
            />
          </SwiperSlide>
        ))}
        {[...new Array(((maxPage + prefixPage) % slidesPerView)).keys()].map((i) => (
          <SwiperSlide
            key={`virtual-${maxPage + prefixPage + i}`}
            virtualIndex={maxPage + prefixPage + i}
          />
        ))}
        {(hasNextBook) && [...new Array(slidesPerView).keys()].map((i) => (
          <SwiperSlide
            key={`virtual-${maxPage + prefixPage + ((maxPage + prefixPage) % slidesPerView) + i}`}
            virtualIndex={maxPage + prefixPage
              + ((maxPage + prefixPage) % slidesPerView) + i}
          />
        ))}
      </Swiper>
    </Remount>
  );
};

export default React.memo(Book);
