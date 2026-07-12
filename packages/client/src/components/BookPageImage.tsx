import { goToAuthPage } from '@client/auth';
import { useDebounceValue } from '@client/hooks/useDebounceValue';
import { styled } from '@mui/material/styles';
import {
  availableImageExtensions,
  availableImageExtensionWithContentType,
  defaultStoredImageExtension,
} from '@syuchan1005/book-reader-common';
import { useAvifState } from '@client/store/atoms';
import { useAtomValue } from 'jotai';
import {
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

const PREFIX = 'BookPageImage';

const classes = {
  pictureFull: `${PREFIX}-pictureFull`,
  imageFull: `${PREFIX}-imageFull`,
};

const Root = styled('picture')(({ theme }) => ({
  [`&.${classes.pictureFull}`]: {
    width: '100%',
    height: '100%',
  },

  [`& .${classes.imageFull}`]: {
    ...theme.typography.h5,
    width: '100%',
    height: '100%',
    display: 'block',
    objectFit: 'contain',
  },
}));

interface BookPageImageProps {
  bookId?: string;
  pageIndex?: number;
  bookPageCount?: number;
  width: number;
  height: number;
  loading?: 'eager' | 'lazy';
  alt?: string;
  style?: CSSProperties;
  noSave?: boolean;

  sizeDebounceDelay?: number;

  skip?: boolean;
}

const createSizeUrlSuffix = (width?: number, height?: number) =>
  !width && !height
    ? ''
    : `_${Math.ceil(width) || 0}x${Math.ceil(height) || 0}`;

export const createBookPageUrl = (
  bookId: string,
  pageIndex: number,
  bookPageCount: number,
  width?: number,
  height?: number,
  extension: keyof typeof availableImageExtensionWithContentType = defaultStoredImageExtension,
) => {
  const pageFileName = pageIndex
    .toString(10)
    .padStart(bookPageCount.toString(10).length, '0');
  const sizeString = createSizeUrlSuffix(width, height);

  return `/book/${bookId}/${pageFileName}${sizeString}.${extension}`;
};

// B6判
export const pageAspectRatio = (width: number) =>
  Math.ceil((width / 128) * 182);

interface SourceSet {
  imgSrc: string | undefined;
  sources: {
    type: string;
    srcSet: string;
  }[];
}

const ImageState = {
  LOADING: 'LOADING',
  LOADED: 'LOADED',
  ERROR: 'ERROR',
  UNSET: 'UNSET',
} as const;
type ImageStateType = (typeof ImageState)[keyof typeof ImageState];

const BookPageImage = (props: BookPageImageProps) => {
  const {
    bookId,
    pageIndex,
    bookPageCount,
    width: argWidth,
    height: argHeight,
    loading = 'lazy',
    alt: argAlt,
    style,
    noSave = true,
    sizeDebounceDelay = 0,
    skip = false,
  } = props;
  const imageRef = useRef<HTMLImageElement>(null);
  const useAvif = useAtomValue(useAvifState);

  const argDebounceWidth = useDebounceValue(argWidth, sizeDebounceDelay);
  const argDebounceHeight = useDebounceValue(argHeight, sizeDebounceDelay);

  const requestImageWidth = useMemo(
    () => (argDebounceWidth < argDebounceHeight ? argDebounceWidth : undefined),
    [argDebounceWidth, argDebounceHeight],
  );
  const requestImageHeight = useMemo(
    () =>
      argDebounceWidth < argDebounceHeight ? undefined : argDebounceHeight,
    [argDebounceWidth, argDebounceHeight],
  );

  const imageSourceSet = useMemo<SourceSet>(() => {
    if (
      [bookId, pageIndex, bookPageCount].findIndex(
        (a) => a === null || a === undefined,
      ) !== -1
    ) {
      return {
        imgSrc: undefined,
        sources: [],
      };
    }
    const suffix = noSave ? '?nosave' : '';
    const defaultSrc = createBookPageUrl(
      bookId,
      pageIndex,
      bookPageCount,
      requestImageWidth,
      requestImageHeight,
      defaultStoredImageExtension,
    );

    const sources = [];
    if (requestImageWidth !== undefined || requestImageHeight !== undefined) {
      const sizeRatio = [1, 1.5, 2, 3];

      // If AVIF is disabled, exclude it from the source sets.
      const allowedExtensions = useAvif
        ? availableImageExtensions
        : availableImageExtensions.filter((ext) => ext !== 'avif');

      for (const imageType of allowedExtensions) {
        const srcSet = sizeRatio
          .map((ratio) => {
            const src = createBookPageUrl(
              bookId,
              pageIndex,
              bookPageCount,
              requestImageWidth !== undefined
                ? Math.ceil(requestImageWidth * ratio)
                : undefined,
              requestImageHeight !== undefined
                ? Math.ceil(requestImageHeight * ratio)
                : undefined,
              imageType,
            );
            return `${src}${suffix} ${ratio}x`;
          })
          .join(',');
        sources.push({
          type: availableImageExtensionWithContentType[imageType],
          srcSet,
        });
      }
    }
    return {
      imgSrc: `${defaultSrc}${suffix}`,
      sources,
    };
  }, [
    bookId,
    pageIndex,
    bookPageCount,
    requestImageWidth,
    requestImageHeight,
    noSave,
    useAvif,
  ]);

  const [imageState, setImageState] = useState<ImageStateType>(
    ImageState.LOADING,
  );
  // biome-ignore lint/correctness/useExhaustiveDependencies: imageState
  useEffect(() => {
    if (!imageSourceSet.imgSrc && imageState !== ImageState.UNSET) {
      setImageState(ImageState.UNSET);
    } else if (imageState !== ImageState.LOADING) {
      setImageState(ImageState.LOADING);
    }
  }, [imageSourceSet]);
  const alt = useMemo(() => {
    switch (imageState) {
      case ImageState.LOADING:
        return `Loading ${argAlt}`;
      case ImageState.ERROR:
        return `Error ${argAlt}`;
      case ImageState.UNSET:
      case ImageState.LOADED:
        return argAlt;
      default: {
        const _exhaustiveCheck: never = imageState;
        return _exhaustiveCheck;
      }
    }
  }, [argAlt, imageState]);
  const [isRetried, setRetried] = useState(false);

  const checkAuthenticate = useCallback(() => {
    fetch('/auth').then((res) => {
      if (res.status === 401) {
        goToAuthPage();
      }
    });
  }, []);

  return (
    <Root className={classes.pictureFull} key={`${isRetried}`}>
      {!skip &&
        imageSourceSet.sources.map(({ type, srcSet }) => (
          <source key={type} type={type} srcSet={srcSet} />
        ))}
      {!skip && (
        <img
          ref={imageRef}
          loading={loading}
          style={style}
          className={classes.imageFull}
          src={imageSourceSet.imgSrc}
          alt={alt}
          width={argWidth}
          height={argHeight}
          onLoad={() => setImageState(ImageState.LOADED)}
          onError={() => {
            setImageState(ImageState.ERROR);
            if (isRetried) {
              checkAuthenticate();
            }
            setRetried(true);
          }}
        />
      )}
    </Root>
  );
};

export default BookPageImage;
