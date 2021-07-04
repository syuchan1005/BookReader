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
}

const useStyles = makeStyles(() => createStyles({
  picture: {
    width: '100%',
    height: '100%',
  },
  img: {
    width: '100%',
    height: '100%',
    display: 'block', // If the image not found, keep the height of alt text.
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

const BookPageImage = (props: BookPageImageProps) => {
  const classes = useStyles(props);
  const {
    bookId,
    pageIndex,
    bookPageCount,
    width: imgWidth,
    height: imgHeight,
    loading = 'lazy',
    alt,
    className,
    style,
    noSave = true,
    sizeDebounceDelay = 0,
  } = props;

  const argDebounceWidth = useDebounceValue(imgWidth, sizeDebounceDelay);
  const argDebounceHeight = useDebounceValue(imgHeight, sizeDebounceDelay);

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
        const sizeRatio = [1, 2, 3];
        webpSrcSet = sizeRatio.map((ratio) => {
          const src = createBookPageUrl(
            bookId,
            pageIndex,
            bookPageCount,
            width !== undefined ? width * ratio : undefined,
            height !== undefined ? height * ratio : undefined,
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

  return (
    <picture className={classes.picture}>
      {imageSourceSet.sources.map(({
        type,
        srcSet,
      }) => (
        <source key={type} type={type} srcSet={srcSet} />
      ))}
      <img
        loading={loading}
        className={imgClassName}
        style={style}
        src={imageSourceSet.imgSrc}
        alt={alt}
        width={imgWidth} // これ両方undefinedだったらどうなるんだ？
        height={imgHeight}
      />
    </picture>
  );
};

export default React.memo(BookPageImage);
