import React from 'react';
import createStyles from '@mui/styles/createStyles';
import makeStyles from '@mui/styles/makeStyles';
import useDebounceValue from '@client/hooks/useDebounceValue';
import { Remount } from '@client/components/Remount';
import { Theme } from '@mui/material';
import {
  availableImageExtensions,
  availableImageExtensionWithContentType,
  defaultStoredImageExtension,
} from '@syuchan1005/book-reader-common';
import { goToAuthPage } from '@client/auth';

interface BookPageImageProps {
  bookId?: string;
  pageIndex?: number;
  bookPageCount?: number;
  width: number;
  height: number;
  loading?: 'eager' | 'lazy';
  alt?: string;
  style?: any;
  noSave?: boolean;

  sizeDebounceDelay?: number;

  skip?: boolean;
}

const useStyles = makeStyles((theme: Theme) => createStyles({
  pictureFull: {
    width: '100%',
    height: '100%',
  },
  imageFull: {
    ...theme.typography.h5,
    width: '100%',
    height: '100%',
    display: 'block',
    objectFit: 'contain',
  },
}));

const createSizeUrlSuffix = (width?: number, height?: number) => ((!width && !height) ? '' : `_${Math.ceil(width) || 0}x${Math.ceil(height) || 0}`);

export const createBookPageUrl = (
  bookId: string,
  pageIndex: number,
  bookPageCount: number,
  width?: number,
  height?: number,
  extension: keyof typeof availableImageExtensionWithContentType = defaultStoredImageExtension,
) => {
  const pageFileName = pageIndex.toString(10)
    .padStart(bookPageCount.toString(10).length, '0');
  const sizeString = createSizeUrlSuffix(width, height);

  return `/book/${bookId}/${pageFileName}${sizeString}.${extension}`;
};

// B6判
export const pageAspectRatio = (width: number) => Math.ceil((width / 128) * 182);

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
type ImageStateType = typeof ImageState[keyof typeof ImageState];

const BookPageImage = (props: BookPageImageProps) => {
  const classes = useStyles(props);
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
  const imageRef = React.useRef<HTMLImageElement>();

  const argDebounceWidth = useDebounceValue(argWidth, sizeDebounceDelay);
  const argDebounceHeight = useDebounceValue(argHeight, sizeDebounceDelay);

  const requestImageWidth = React.useMemo(
    () => (argDebounceWidth < argDebounceHeight ? argDebounceWidth : undefined),
    [argDebounceWidth, argDebounceHeight],
  );
  const requestImageHeight = React.useMemo(
    () => (argDebounceWidth < argDebounceHeight ? undefined : argDebounceHeight),
    [argDebounceWidth, argDebounceHeight],
  );

  const imageSourceSet = React.useMemo<SourceSet>(
    () => {
      if ([bookId, pageIndex, bookPageCount]
        .findIndex((a) => a === null || a === undefined) !== -1) {
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

        availableImageExtensions.forEach((imageType) => {
          const srcSet = sizeRatio.map((ratio) => {
            const src = createBookPageUrl(
              bookId,
              pageIndex,
              bookPageCount,
              requestImageWidth !== undefined ? Math.ceil(requestImageWidth * ratio) : undefined,
              requestImageHeight !== undefined ? Math.ceil(requestImageHeight * ratio) : undefined,
              imageType,
            );
            return `${src}${suffix} ${ratio}x`;
          })
            .join(',');
          sources.push({
            type: availableImageExtensionWithContentType[imageType],
            srcSet,
          });
        });
      }
      return {
        imgSrc: `${defaultSrc}${suffix}`,
        sources,
      };
    },
    [bookId, pageIndex, bookPageCount, requestImageWidth, requestImageHeight, noSave],
  );

  const [imageState, setImageState] = React.useState<ImageStateType>(ImageState.LOADING);
  React.useEffect(() => {
    if (!imageSourceSet.imgSrc && imageState !== ImageState.UNSET) {
      setImageState(ImageState.UNSET);
    } else if (imageState !== ImageState.LOADING) {
      setImageState(ImageState.LOADING);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageSourceSet]);
  const alt = React.useMemo(() => {
    switch (imageState) {
      case ImageState.LOADING:
        return `Loading ${argAlt}`;
      case ImageState.ERROR:
        return `Error ${argAlt}`;
      case ImageState.UNSET:
      case ImageState.LOADED:
      default:
        return argAlt;
    }
  }, [argAlt, imageState]);
  const [isRetried, setRetried] = React.useState(false);

  const checkAuthenticate = React.useCallback(() => {
    fetch('/auth')
      .then((res) => {
        if (res.status === 401) {
          goToAuthPage();
        }
      });
  }, []);

  return (
    <Remount remountKey={`${isRetried}`}>
      <picture className={classes.pictureFull}>
        {!skip && imageSourceSet.sources.map(({
          type,
          srcSet,
        }) => (
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
      </picture>
    </Remount>
  );
};

export default React.memo(BookPageImage);
