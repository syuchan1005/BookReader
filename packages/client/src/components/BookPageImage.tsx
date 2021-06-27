import React from 'react';
import { createStyles, makeStyles } from '@material-ui/core';

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

const minOrNot = (
  value: number | undefined,
  minValue: number,
): number | undefined => (value === undefined ? undefined : Math.max(value, minValue));

const BookPageImage = (props: BookPageImageProps) => {
  const classes = useStyles(props);
  const {
    bookId,
    pageIndex,
    bookPageCount,
    width,
    height,
    alt,
    minWidth = 150,
    minHeight = 200,
    className,
    style,
    imgStyle,
    hidden,
    onClick,
    noSave = true,
    onLoad,
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
        minOrNot(width, minWidth),
        minOrNot(height, minHeight),
      );
    },
    [bookId, pageIndex, bookPageCount, width, height, minWidth, minHeight],
  );

  // [beforeLoading, rendered, failed]
  const [_state, setState] = React.useState(0);

  const state = React.useMemo(() => {
    if (onLoad && src === undefined) onLoad(false);
    return (src === undefined ? 2 : _state);
  }, [onLoad, _state, src]);

  const handleLoad = React.useCallback(() => {
    if (onLoad) {
      onLoad(true);
    }
    setState(1);
  }, [onLoad]);

  const handleError = React.useCallback(() => {
    if (onLoad) {
      onLoad(true);
    }
    setState(2);
  }, [onLoad]);

  return (
    // eslint-disable-next-line
    <div
      className={state !== 1 ? classes.noImg : classes.hasImg}
      style={{
        ...style,
        ...(state !== 1 ? {
          minWidth,
          minHeight,
        } : {}),
        display: hidden === true ? 'none' : undefined,
      }}
      onClick={onClick}
    >
      {(state === 0 || state === 2) && (
        <>
          <div>{state === 0 ? 'loading' : 'failed'}</div>
          <div className={classes.altText} style={{ maxHeight: minHeight }}>{alt}</div>
        </>
      )}
      {(src) ? (
        <picture className={classes.pic} style={{ height: state === 1 ? undefined : 0 }}>
          <source type="image/webp" srcSet={`${src}.webp${noSave ? '?nosave' : ''}`} />
          <img
            loading="lazy"
            className={className}
            style={imgStyle}
            src={`${src}${noSave ? '?nosave' : ''}`}
            alt={alt}
            onLoad={handleLoad}
            onError={handleError}
          />
        </picture>
      ) : null}
    </div>
  );
};

export default React.memo(BookPageImage);
