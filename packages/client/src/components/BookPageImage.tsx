import React from 'react';
import { createStyles, makeStyles } from '@material-ui/core';
import { ImageHeader } from '../../../common';

interface BookPageImageProps {
  bookId?: string;
  pageIndex?: number;
  bookPageCount?: number;
  width?: number;
  height?: number;
  alt?: string;
  minWidth?: number;
  minHeight?: number;
  className?: any;
  style?: any;
  imgStyle?: any;
  hidden?: boolean | 'false' | 'true';
  noSave?: boolean;

  onClick?: () => void;
  onLoad?: (success: boolean) => void;
}

const useStyles = makeStyles(() => createStyles({
  noImg: {
    width: '100%',
    height: '100%',
    fontSize: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
  },
  hasImg: {
    width: '100%',
    height: '100%',
  },
  altText: {
    width: '100%',
    overflowWrap: 'break-word',
  },
  pic: {
    display: 'block',
    width: '100%',
    height: '100%',
  },
}));

export const createBookPageUrl = (
  bookId: string,
  pageIndex: number,
  bookPageCount: number,
  extension: 'jpg' | 'webp',
) => {
  const pageFileName = pageIndex.toString(10).padStart(bookPageCount.toString(10).length, '0');

  return `/book/${bookId}/${pageFileName}.${extension}`;
};

const minOrNot = (
  value: number | undefined,
  minValue: number
): number | undefined => (value === undefined ? undefined : Math.max(value, minValue));

const isWebpSupported = document.createElement('canvas')
  .toDataURL('image/webp').indexOf('data:image/webp') == 0;

// @ts-ignore
const BookPageImage: React.FC<BookPageImageProps> = React.memo((props: BookPageImageProps) => {
  const classes = useStyles(props);
  const {
    bookId,
    pageIndex,
    bookPageCount,
    width,
    height,
    minWidth = 150,
    minHeight = 200,
    alt,
    className,
    style,
    imgStyle,
    hidden,
    onClick,
    noSave = true,
    onLoad,
  } = props;
  const imageRef = React.useRef<HTMLImageElement>();

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
        isWebpSupported ? 'webp' : 'jpg',
      );
    },
    [bookId, pageIndex, bookPageCount]
  );

  // [beforeLoading, rendered, failed]
  const [_state, setState] = React.useState(0);

  const state = React.useMemo(() => {
    if (onLoad && src === undefined) onLoad(false);
    return (src === undefined ? 2 : _state);
  }, [_state, src]);

  React.useEffect(() => {
    if (src === undefined) {
      setState(2);
      return;
    }
    const headers: { [key: string]: string | undefined } = {
      [ImageHeader.width]: minOrNot(width, minWidth)?.toString(),
      [ImageHeader.height]: minOrNot(height, minHeight)?.toString(),
      [ImageHeader.cache]: noSave === true ? undefined : 'true',
    };
    const controller = new AbortController();
    setState(0);
    fetch(src, {
      signal: controller.signal,
      headers: Object.fromEntries(
        Object.entries(headers).filter((e) => !!e[1]),
      ),
    })
      .then((res) => res.blob())
      .then((blob) => {
        const imageElement = imageRef.current;
        if (imageElement) {
          imageElement.src = URL.createObjectURL(blob);
        }
        setState(1);
      })
      .catch(() => {
        setState(2);
      });
    return () => {
      if (!controller.signal.aborted) {
        controller.abort();
      }
    };
  }, [src, width, height, minWidth, minHeight, noSave]);

  return (
    // eslint-disable-next-line
    <div
      className={state !== 1 ? classes.noImg : classes.hasImg}
      style={{
        ...style,
        ...(state !== 1 ? { minWidth, minHeight } : {}),
        display: hidden === true ? 'none' : undefined,
      }}
      onClick={onClick}
    >
      {(state === 0 || state === 2 || src === undefined) && (
        <>
          <div>{state === 0 ? 'loading' : 'failed'}</div>
          <div className={classes.altText} style={{ maxHeight: minHeight }}>{alt}</div>
        </>
      )}
      <img
        ref={imageRef}
        alt={alt}
        style={{ ...imgStyle, display: state === 1 ? 'block' : 'none' }}
        className={`${classes.pic} ${className}`}
      />
    </div>
  );
});

export default BookPageImage;
