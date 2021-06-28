import React from 'react';
import { createStyles, makeStyles } from '@material-ui/core';

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
}

const useStyles = makeStyles(() => createStyles({
  img: {
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

const BookPageImage = (props: BookPageImageProps) => {
  const classes = useStyles(props);
  const {
    bookId,
    pageIndex,
    bookPageCount,
    width,
    height,
    loading = 'lazy',
    alt,
    className,
    style,
    noSave = true,
  } = props;

  const src = React.useMemo(
    () => {
      if ([bookId, pageIndex, bookPageCount]
        .findIndex((a) => a === null || a === undefined) !== -1) {
        return undefined;
      }
      return createBookPageUrl(
        bookId,
        pageIndex,
        bookPageCount,
        width < height ? width : undefined,
        width < height ? undefined : height,
      );
    },
    [bookId, pageIndex, bookPageCount, width, height],
  );

  return (
    <picture>
      <source type="image/webp" srcSet={`${src}.webp${noSave ? '?nosave' : ''}`} />
      <img
        loading={loading}
        className={`${classes.img} ${className ?? ''}`}
        style={style}
        src={`${src}${noSave ? '?nosave' : ''}`}
        alt={alt}
        width={width}
        height={height}
      />
    </picture>
  );
};

export default React.memo(BookPageImage);
