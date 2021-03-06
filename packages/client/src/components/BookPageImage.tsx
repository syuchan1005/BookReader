import React from 'react';
import { createStyles, makeStyles } from '@material-ui/core';
import useDebounceValue from '@client/hooks/useDebounceValue';

interface BookPageImageProps {
  bookId?: string;
  pageIndex?: number;
  bookPageCount?: number;
  width: number;
  height: number;
  loading?: 'eager' | 'lazy';
  alt?: string;
  className?: any;
  style?: any;
  noSave?: boolean;

  sizeDebounceDelay?: number;
  forceUsePropSize?: boolean;
}

const useStyles = makeStyles((theme) => createStyles({
  pictureFull: {
    width: '100%',
    height: '100%',
  },
  imageFull: {
    width: '100%',
    height: '100%',
    display: 'block',
  },
  img: {
    ...theme.typography.h5,
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
  extension: 'jpg' | 'webp' = 'jpg',
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

enum ImageState {
  LOADING,
  LOADED,
  ERROR,
  UNSET,
}

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
    className,
    style,
    noSave = true,
    sizeDebounceDelay = 0,
    forceUsePropSize = false,
  } = props;

  const argDebounceWidth = useDebounceValue(argWidth, sizeDebounceDelay);
  const argDebounceHeight = useDebounceValue(argHeight, sizeDebounceDelay);

  const width = React.useMemo(
    () => (argDebounceWidth < argDebounceHeight ? argDebounceWidth : undefined),
    [argDebounceWidth, argDebounceHeight],
  );
  const height = React.useMemo(
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
      const jpgSrc = createBookPageUrl(
        bookId,
        pageIndex,
        bookPageCount,
        width,
        height,
        'jpg',
      );

      let webpSrcSet;
      if (width === undefined && height === undefined) {
        const webpSrc = createBookPageUrl(
          bookId,
          pageIndex,
          bookPageCount,
          width,
          height,
          'webp',
        );
        webpSrcSet = `${webpSrc}${suffix}`;
      } else {
        const sizeRatio = [1, 1.5, 2, 3];
        webpSrcSet = sizeRatio.map((ratio) => {
          const src = createBookPageUrl(
            bookId,
            pageIndex,
            bookPageCount,
            width !== undefined ? Math.ceil(width * ratio) : undefined,
            height !== undefined ? Math.ceil(height * ratio) : undefined,
            'webp',
          );
          return `${src}${suffix} ${ratio}x`;
        })
          .join(',');
      }
      return {
        imgSrc: `${jpgSrc}${suffix}`,
        sources: [
          {
            type: 'image/webp',
            srcSet: webpSrcSet,
          },
        ],
      };
    },
    [bookId, pageIndex, bookPageCount, width, height, noSave],
  );

  const imgClassName = React.useMemo(
    () => (className ? `${classes.img} ${className}` : classes.img),
    [className, classes.img],
  );

  const [imageState, setImageState] = React.useState(ImageState.LOADING);
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
      default:
      case ImageState.UNSET:
      case ImageState.LOADED:
        return argAlt;
    }
  }, [argAlt, imageState]);

  const imgWidth = React.useMemo(() => {
    if (forceUsePropSize) {
      return argWidth;
    }
    return width !== undefined ? '100%' : undefined;
  }, [argWidth, forceUsePropSize, width]);

  const imgHeight = React.useMemo(() => {
    if (forceUsePropSize) {
      return argHeight;
    }
    return height !== undefined ? '100%' : undefined;
  }, [argHeight, forceUsePropSize, height]);

  return (
    <picture className={classes.pictureFull}>
      {imageSourceSet.sources.map(({
        type,
        srcSet,
      }) => (
        <source key={type} type={type} srcSet={srcSet} />
      ))}
      <img
        loading={loading}
        className={`${imgClassName} ${forceUsePropSize ? classes.imageFull : ''}`}
        style={style}
        src={imageSourceSet.imgSrc}
        alt={alt}
        width={imgWidth}
        height={imgHeight}
        onLoad={() => setImageState(ImageState.LOADED)}
        onError={() => setImageState(ImageState.ERROR)}
      />
    </picture>
  );
};

export default React.memo(BookPageImage);
