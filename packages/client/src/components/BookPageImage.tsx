import React from 'react';
import { createStyles, makeStyles } from '@material-ui/core';

type ImageProps = {
  src?: string;
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
};

type BookPageImageProps = {
  bookId: string;
  pageIndex: number;
  bookPageCount: number;
  width?: number;
  height?: number;
} & Omit<ImageProps, 'src'>;

type ThumbnailBookPageImageProps = {
  thumbnail?: string;
  width?: number;
  height?: number;
} & Omit<ImageProps, 'src'>;

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

const createSizeUrlSuffix = (width?: number, height?: number) => (!width && !height) ? '' : `_${Math.ceil(width) || 0}x${Math.ceil(height) || 0}`;

export const createBookPageUrl = (
  bookId: string,
  pageIndex: number,
  bookPageCount: number,
  width?: number,
  height?: number,
) => {
  const pageFileName = pageIndex.toString(10).padStart(bookPageCount.toString(10).length, '0');
  const sizeString = createSizeUrlSuffix(width, height);

  console.info(width, height, sizeString);
  return `/book/${bookId}/${pageFileName}${sizeString}.jpg`;
};

const minOrNot = (value: number | undefined, minValue: number): number | undefined => (value === undefined ? undefined : Math.max(value, minValue));

const Image: React.FC<ImageProps> = React.memo((props: ImageProps) => {
  const classes = useStyles(props);
  const {
    src,
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

  // [beforeLoading, rendered, failed]
  const [_state, setState] = React.useState(0);

  const state = React.useMemo(() => {
    if (onLoad && src === undefined) onLoad(false);
    return (src === undefined ? 2 : _state);
  }, [_state, src]);

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
            className={className}
            style={{ ...imgStyle, display: (state === 1) ? 'block' : 'none' }}
            src={`${src}${noSave ? '?nosave' : ''}`}
            alt={alt}
            onLoad={() => { if (onLoad) { onLoad(true); } setState(1); }}
            onError={() => { if (onLoad) { onLoad(true); } setState(2); }}
          />
        </picture>
      ) : null}
    </div>
  );
});

const Thumbnail: React.FC<ThumbnailBookPageImageProps> = (props: ThumbnailBookPageImageProps) => {
  const {
    thumbnail,
    width,
    height,
    minWidth = 150,
    minHeight = 200,
  } = props;

  const src = React.useMemo(
    () => !thumbnail ? undefined : thumbnail.replace('.jpg', `${createSizeUrlSuffix(minOrNot(width, minWidth), minOrNot(height, minHeight))}.jpg`),
    [thumbnail, width, height, minWidth, minHeight]
  );

  return (<Image {...props} src={src} />);
};

const BookPageImage: React.FC<BookPageImageProps> & { Thumbnail: typeof Thumbnail } = (props: BookPageImageProps) => {
  const {
    bookId,
    pageIndex,
    bookPageCount,
    width,
    height,
    minWidth = 150,
    minHeight = 200,
  } = props;

  const src = React.useMemo(
    () => createBookPageUrl(bookId, pageIndex, bookPageCount, minOrNot(width, minWidth), minOrNot(height, minHeight)),
    [bookId, pageIndex, bookPageCount, width, height, minWidth, minHeight]
  );

  return (<Image {...props} src={src} />);
};

BookPageImage.Thumbnail = Thumbnail;

export default BookPageImage;
