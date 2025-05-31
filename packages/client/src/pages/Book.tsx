import { Theme } from '@mui/material';
import JSZip from 'jszip';
import {
  CSSProperties,
  Fragment,
  ReactElement,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import createStyles from '@mui/styles/createStyles';
import makeStyles from '@mui/styles/makeStyles';

import { Keyboard, Virtual } from 'swiper';
import 'swiper/css';
import 'swiper/css/keyboard';
import 'swiper/css/virtual';
import { Swiper, SwiperSlide } from 'swiper/react';

import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { useWindowSize } from 'react-use';
import { useRecoilValue, useSetRecoilState } from 'recoil';

import { BookQuery, useBookQuery } from '@syuchan1005/book-reader-graphql';

import BookPageImage from '@client/components/BookPageImage';
import BookPageOverlay from '@client/components/BookPageOverlay';
import { Remount } from '@client/components/Remount';
import TitleAndBackHeader from '@client/components/TitleAndBackHeader';
import { useBooleanState } from '@client/hooks/useBooleanState';
import { useDebounceValue } from '@client/hooks/useDebounceValue';
import { useLazyDialog } from '@client/hooks/useLazyDialog';
import { usePrevNextBook } from '@client/hooks/usePrevNextBook';
import { useTitle } from '@client/hooks/useTitle';
import db, { DownloadedBook } from '@client/indexedDb/Database';
import { workbox } from '@client/registerServiceWorker';
import {
  ReadOrder,
  alertDataState,
  pageImageEffectState,
  readOrderState,
  showOriginalImageState,
} from '@client/store/atoms';

const EditPagesDialog = lazy(
  () => import('@client/components/dialogs/EditPagesDialog'),
);

interface BookProps {
  children?: ReactElement;
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
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
  }),
);

const useDatabasePage = (
  bookId: string,
  defaultPage = 0,
): [
  loading: boolean,
  page: number,
  setPage: (page: number, infoId: string) => Promise<void>,
] => {
  const [loading, setLoading] = useState(true);
  const [page, updatePageState] = useState(defaultPage);

  // biome-ignore lint/correctness/useExhaustiveDependencies: defaultPage
  useEffect(() => {
    setLoading(true);
    db.read.get(bookId).then((read) => {
      if (read) {
        updatePageState(read.page);
      } else {
        updatePageState(defaultPage);
      }
      setLoading(false);
    });
  }, [bookId]);

  const setPage = useCallback(
    (p: number, infoId: string): Promise<void> => {
      if (loading) {
        return Promise.reject();
      }

      return db.read
        .put({
          infoId,
          bookId,
          page: p,
          updatedAt: new Date(),
        })
        .then(() => undefined);
    },
    [bookId, loading],
  );

  return [loading, page, setPage];
};

type PageStyles = keyof typeof PageStyle;

export type PageStyleType = {
  slidesPerView: number;
  pageClass: (_index: number) => string;
  normalizeCount: (i: number) => number;
  icon: {
    name: string;
    style?: CSSProperties;
  };
  prefixPage: number;
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

  const [page, updatePage] = useState(0);
  const [dbLoading, dbPage, setDbPage] = useDatabasePage(bookId);
  const [isPageSet, setPageSet] = useState(false);
  // biome-ignore lint/correctness/useExhaustiveDependencies: dbPage
  useEffect(() => {
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
  }, [dbLoading]);

  const [
    openEditDialog,
    canMountEditDialog,
    setOpenEditDialog,
    setCloseEditDialog,
  ] = useLazyDialog(false);
  const [showAppBar, setShowAppBar, setHideAppBar, toggleAppBar] =
    useBooleanState(false);
  const [pageStyleKey, setPageStyle] = useState<PageStyles>('SinglePage');
  const { slidesPerView, normalizeCount } = PageStyle[pageStyleKey];

  // biome-ignore lint/correctness/useExhaustiveDependencies: refresh page
  useEffect(() => {
    updatePage(0);
    setPageSet(false);
  }, [bookId]);

  const windowSize = useWindowSize();
  const { loading, error, data, refetch, ImageComponent } = useBookData({
    bookId,
    onCompleted: (data) => {
      if (!data) return;
      if (isPageSet && page >= data.totalPageCount) {
        setPage(data.totalPageCount - 1, 0);
      }
    },
    onError: () => {
      setShowAppBar();
    },
  });
  useTitle(data ? `${data.infoName} No.${data.bookNumber}` : '');
  const maxPage = useMemo(() => (data ? data.totalPageCount : 0), [data]);
  const [prevBook, nextBook] = usePrevNextBook(
    data ? data.infoId : undefined,
    bookId,
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: data, isPageSet, searchParams, setSearchParams, nextBook, setDbPage, maxPage, location
  useEffect(() => {
    if (page >= maxPage) {
      if (nextBook && data) {
        openBook(data.infoId, nextBook);
      }
    } else if (isPageSet) {
      setDbPage(page, data.infoId).catch((e) =>
        setAlertData({
          message: e,
          variant: 'error',
        }),
      );
      const copiedSearchParams = new URLSearchParams(searchParams);
      copiedSearchParams.set('page', page.toString());
      setSearchParams(copiedSearchParams, {
        replace: true,
        state: location.state,
      });
    }
  }, [page, setAlertData]);

  const [pageUpdateRequest, setPageUpdateRequest] = useState(undefined);
  const setPage = useCallback(
    (s, time = 150) => {
      let validatedPage = Math.max(s, 0);
      if (maxPage > 0) {
        const maxPageCount = maxPage - (nextBook ? 0 : 1);
        validatedPage = Math.min(validatedPage, normalizeCount(maxPageCount));
      }
      validatedPage = normalizeCount(validatedPage);
      setPageUpdateRequest({
        page: validatedPage,
        time,
      });
      updatePage(validatedPage);
    },
    [maxPage, normalizeCount, nextBook],
  );

  const increment = useCallback(() => {
    setPage(page + slidesPerView);
    setHideAppBar();
  }, [page, setPage, setHideAppBar, slidesPerView]);

  const decrement = useCallback(() => {
    setPage(page - slidesPerView);
    setHideAppBar();
  }, [page, setHideAppBar, setPage, slidesPerView]);

  const effectBackGround = useMemo(() => {
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

  const clickPage = useCallback(
    (event) => {
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
    },
    [
      readOrder,
      increment,
      decrement,
      openEditDialog,
      toggleAppBar,
      windowSize.width,
    ],
  );

  const openBook = useCallback(
    (infoId: string, targetBookId: string) => {
      navigate(`/book/${targetBookId}`, {
        state: {
          // @ts-ignore
          referrer: location.state?.referrer || location.pathname,
        },
        replace: true,
      });
    },
    [navigate, location],
  );

  const imageSize = useMemo(() => {
    if (showOriginalImage) {
      return {
        width: undefined,
        height: undefined,
      };
    }
    return windowSize;
  }, [windowSize, showOriginalImage]);

  const goNextBook = useMemo(() => {
    if (nextBook && data) {
      return () => openBook(data.infoId, nextBook);
    }
    return undefined;
  }, [data, openBook, nextBook]);

  const goPreviousBook = useMemo(() => {
    if (prevBook && data) {
      return () => openBook(data.infoId, prevBook);
    }
    return undefined;
  }, [data, openBook, prevBook]);

  const setNextPageStyle = useCallback(
    () => setPageStyle((p) => NextPageStyleMap[p]),
    [],
  );

  const onPageSliderChanged = useCallback((p) => setPage(p, 0), [setPage]);

  const [showSliderImage, setShowSliderImage] = useState(true);
  // biome-ignore lint/correctness/useExhaustiveDependencies: refetch, setCloseEditDialog
  useEffect(() => {
    if (showSliderImage) {
      return;
    }
    Promise.all([
      refetch(),
      Promise.race([
        workbox
          ? workbox.messageSW({ type: 'PURGE_CACHE' })
          : Promise.resolve(),
        new Promise((r) => {
          setTimeout(r, 2000);
        }), // timeout: 1000ms
      ]),
    ]).finally(() => {
      setCloseEditDialog();
      setShowSliderImage(true);
    });
  }, [showSliderImage]);
  const purgeCache = useCallback(() => {
    setShowSliderImage(false);
  }, []);

  if (loading || (error && !data)) {
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
          backRoute={data && `/info/${data.infoId}`}
          title={data?.infoName}
          subTitle={data && `No.${data.bookNumber}`}
        />
      )}

      {/* biome-ignore lint/a11y/useKeyWithClickEvents: TODO */}
      <main className={classes.book} onClick={clickPage}>
        {canMountEditDialog && (
          <EditPagesDialog
            open={openEditDialog}
            onClose={setCloseEditDialog}
            maxPage={maxPage}
            bookId={bookId}
            onSuccess={purgeCache}
          />
        )}
        {showAppBar && (
          <BookPageOverlay
            currentPage={page}
            onPageSliderChanged={onPageSliderChanged}
            maxPages={maxPage}
            pageStyle={PageStyle[pageStyleKey]}
            onPageStyleClick={setNextPageStyle}
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
          ImageComponent={ImageComponent}
          pageUpdateRequest={pageUpdateRequest}
          onPageUpdated={updatePage}
          onKeyPress={setHideAppBar}
          showSliderImage={showSliderImage}
        />

        <div
          className={classes.pageProgress}
          style={{
            justifyContent: `flex-${
              readOrder === ReadOrder.LTR ? 'start' : 'end'
            }`,
          }}
        >
          <div style={{ width: `${(page / (maxPage - 1)) * 100}%` }} />
        </div>
      </main>
    </>
  );
};

type BookData = {
  infoId: string;
  totalPageCount: number;
  infoName: string;
  bookNumber: string;
};
const convertToBookData = (data: BookQuery): BookData | undefined => {
  if (!data || !data.book) return undefined;
  return {
    infoId: data.book.info.id,
    totalPageCount: data.book.pages,
    infoName: data.book.info.name,
    bookNumber: data.book.number,
  };
};

const useBookData = (props: {
  bookId: string;
  onCompleted: (data: BookData) => void;
  onError: () => void;
}): {
  loading: boolean;
  error: Error | undefined;
  data: BookData | undefined;
  refetch: () => void;
  ImageComponent: (props: {
    style: CSSProperties | undefined;
    pageIndex: number;
    imageSize: {
      width: number;
      height: number;
    };
    skip: boolean;
  }) => ReactElement;
} => {
  const { bookId, onCompleted, onError } = props;
  const [downloadedBook, setDownloadedBook] = useState<
    DownloadedBook | null | undefined
  >(undefined);
  // biome-ignore lint/correctness/useExhaustiveDependencies: onCompleted
  useEffect(() => {
    db.downloadedBook
      .get(bookId)
      .then((book) => {
        if (book) {
          setDownloadedBook(book);
          onCompleted({
            infoId: book.infoId,
            totalPageCount: book.totalPageCount,
            infoName: book.infoName,
            bookNumber: book.bookName,
          });
        } else {
          setDownloadedBook(null);
        }
      })
      .catch(() => {
        setDownloadedBook(null);
      });
  }, [bookId]);
  const { loading, error, data, refetch } = useBookQuery({
    variables: {
      id: bookId,
    },
    onCompleted(d) {
      onCompleted(convertToBookData(d));
    },
    onError: onError,
    skip: downloadedBook !== null,
  });
  const convertedData = useMemo(() => {
    if (!data) return null;
    return convertToBookData(data);
  }, [data]);

  const [bookImageProvider, setBookImageProvider] = useState<
    (filePath: string) => Promise<string>
  >(() => () => Promise.resolve(''));
  useEffect(() => {
    if (!downloadedBook) return;
    const promises = {};
    new JSZip().loadAsync(downloadedBook.bookZipArchive).then((zip) => {
      setBookImageProvider(() => (filePath) => {
        if (!zip.file(filePath)) {
          return Promise.resolve(undefined);
        }
        if (promises[filePath]) {
          return promises[filePath];
        }
        promises[filePath] = zip
          .file(filePath)
          .async('base64')
          .then((b) => `data:image/webp;base64,${b}`);
        return promises[filePath];
      });
    });
  }, [downloadedBook]);

  if (downloadedBook === undefined) {
    return {
      loading: true,
      error: undefined,
      data: undefined,
      refetch: () => {},
      ImageComponent: () => undefined,
    };
  }

  if (downloadedBook) {
    return {
      loading: false,
      error: undefined,
      data: {
        infoId: downloadedBook.infoId,
        totalPageCount: downloadedBook.totalPageCount,
        infoName: downloadedBook.infoName,
        bookNumber: downloadedBook.bookName,
      },
      refetch: () => {},
      ImageComponent: (props) => {
        const pageFileName = props.pageIndex
          .toString(10)
          .padStart(downloadedBook.totalPageCount.toString(10).length, '0');
        const src = usePromise(
          bookImageProvider(`${pageFileName}.webp`).catch(() => undefined),
        );
        return (
          <img
            style={{
              ...props.style,
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
            src={src}
            alt={`${pageFileName}.webp`}
          />
        );
      },
    };
  }

  return {
    loading,
    error,
    data: convertedData,
    refetch,
    ImageComponent: (props) => (
      <BookPageImage
        {...props}
        {...props.imageSize}
        bookId={bookId}
        bookPageCount={data.book?.pages || 0}
        alt={(props.pageIndex + 1).toString(10)}
        loading="eager"
        sizeDebounceDelay={300}
      />
    ),
  };
};

const usePromise = <T,>(promise: Promise<T>): T | undefined => {
  const [result, setResult] = useState<T | undefined>(undefined);
  useEffect(() => {
    let isMounted = true;
    promise
      .then((res) => {
        if (isMounted) setResult(res);
      })
      .catch(() => setResult(undefined));
    return () => {
      isMounted = false;
    };
  }, [promise]);
  return result;
};

type SwiperSliderProp = {
  bookId: string;
  pageStyleKey: PageStyles;
  readOrder: keyof typeof ReadOrder;
  maxPage: number;
  imageSize: {
    width: number | undefined;
    height: number | undefined;
  };
  page: number;
  hasNextBook: boolean;
  effectBackGround: CSSProperties | undefined;
  openEditDialog: boolean;
  classes: {
    pageContainer: string;
  };

  ImageComponent: ReturnType<typeof useBookData>['ImageComponent'];

  pageUpdateRequest: { page: number; time: number } | undefined;

  onPageUpdated: (page: number) => void;
  onKeyPress: () => void;

  showSliderImage: boolean;
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
    ImageComponent,
    pageUpdateRequest,
    onPageUpdated,
    onKeyPress,
    showSliderImage,
  } = props;
  const { slidesPerView, pageClass, prefixPage } = PageStyle[pageStyleKey];

  const [swiper, setSwiper] = useState(null);
  const debouncePage = useDebounceValue(page, 300);

  const requestRef = useRef<typeof pageUpdateRequest>();
  // biome-ignore lint/correctness/useExhaustiveDependencies: swiper
  useEffect(() => {
    if (pageUpdateRequest && swiper) {
      requestRef.current = pageUpdateRequest;
      swiper.slideTo(pageUpdateRequest.page, pageUpdateRequest.time, false);
    }
  }, [pageUpdateRequest]);

  useEffect(() => {
    if (!swiper?.params) {
      return;
    }

    if (openEditDialog) {
      swiper?.disable();
    } else {
      swiper?.enable();
    }
  }, [openEditDialog, swiper]);

  const updateSwiper = useCallback(
    (s) => {
      s?.slideTo(page, 0, false);
      setSwiper(s);
    },
    [page],
  );

  const handleSlideChange = useCallback(
    (s) => {
      if (requestRef.current?.page !== s.activeIndex) {
        onPageUpdated(s.activeIndex);
      } else {
        requestRef.current = undefined;
      }
    },
    [onPageUpdated],
  );

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
            {showSliderImage && (
              <ImageComponent
                style={effectBackGround}
                pageIndex={i}
                imageSize={imageSize}
                skip={Math.abs(index - debouncePage) > slidesPerView}
              />
            )}
          </SwiperSlide>
        ))}
        {[...new Array((maxPage + prefixPage) % slidesPerView).keys()].map(
          (i) => (
            <SwiperSlide
              key={`virtual-${maxPage + prefixPage + i}`}
              virtualIndex={maxPage + prefixPage + i}
            />
          ),
        )}
        {hasNextBook &&
          [...new Array(slidesPerView).keys()].map((i) => (
            <SwiperSlide
              key={`virtual-${
                maxPage +
                prefixPage +
                ((maxPage + prefixPage) % slidesPerView) +
                i
              }`}
              virtualIndex={
                maxPage +
                prefixPage +
                ((maxPage + prefixPage) % slidesPerView) +
                i
              }
            />
          ))}
      </Swiper>
    </Remount>
  );
};

export default () => {
  const { id: bookId } = useParams();
  return (
    <Fragment key={bookId}>
      <Book />
    </Fragment>
  );
};
