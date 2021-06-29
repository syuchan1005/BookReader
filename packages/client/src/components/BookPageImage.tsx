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
  img: {
    width: '100%',
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
) => {
  const pageFileName = pageIndex.toString(10)
    .padStart(bookPageCount.toString(10).length, '0');
  const sizeString = createSizeUrlSuffix(width, height);

  return `/book/${bookId}/${pageFileName}${sizeString}.jpg`;
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

  const width = useDebounceValue(imgWidth, sizeDebounceDelay);
  const height = useDebounceValue(imgHeight, sizeDebounceDelay);

  const imageSourceSet = React.useMemo<SourceSet>(
    () => {
      if ([bookId, pageIndex, bookPageCount]
        .findIndex((a) => a === null || a === undefined) !== -1) {
        return { imgSrc: undefined, sources: [] };
      }
      const src = createBookPageUrl(
        bookId,
        pageIndex,
        bookPageCount,
        width < height ? width : undefined,
        width < height ? undefined : height,
      );
      const src2 = createBookPageUrl(
        bookId,
        pageIndex,
        bookPageCount,
        width < height ? width * 2 : undefined,
        width < height ? undefined : height * 2,
      );
      const src3 = createBookPageUrl(
        bookId,
        pageIndex,
        bookPageCount,
        width < height ? width * 3 : undefined,
        width < height ? undefined : height * 3,
      );
      const suffix = noSave ? '?nosave' : '';

      return {
        imgSrc: `${src}${suffix}`,
        sources: [
          {
            type: 'image/webp',
            srcSet: `${src}.webp${suffix} 1x, ${src2}.webp${suffix} 2x, ${src3}.webp${suffix} 3x`,
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
    <picture>
      {imageSourceSet.sources.map(({ type, srcSet }) => (
        <source key={type} type={type} srcSet={srcSet} />
      ))}
      <img
        loading={loading}
        className={imgClassName}
        style={style}
        src={imageSourceSet.imgSrc}
        alt={alt}
        width={imgWidth}
        height={imgHeight}
      />
    </picture>
  );
};

export default React.memo(BookPageImage);
