import React from 'react';
import createStyles from '@mui/styles/createStyles';
import makeStyles from '@mui/styles/makeStyles';
import useDebounceValue from '@client/hooks/useDebounceValue';
import { Theme } from '@mui/material';

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

  skip?: boolean;
}

const useStyles = makeStyles((theme: Theme) => createStyles({
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
  planePageLabel: {
    userSelect: 'none',
    fontSize: '2rem',
    fontWeight: 'bold',
    position: 'absolute',
    background: theme.palette.background.default,
    color: theme.palette.text.disabled,
    padding: theme.spacing(1),
    marginTop: '45%',
    borderRadius: theme.spacing(1),
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
    className,
    style,
    noSave = true,
    sizeDebounceDelay = 0,
    forceUsePropSize = false,
    skip = false,
  } = props;
  const imageRef = React.useRef<HTMLImageElement>();

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

      const sources = [];
      if (width !== undefined || height !== undefined) {
        const sizeRatio = [1, 1.5, 2, 3];
        const webpSrcSet = sizeRatio.map((ratio) => {
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
        sources.push({
          type: 'image/webp',
          srcSet: webpSrcSet,
        });
      }
      return {
        imgSrc: `${jpgSrc}${suffix}`,
        sources,
      };
    },
    [bookId, pageIndex, bookPageCount, width, height, noSave],
  );

  const imgClassName = React.useMemo(
    () => (className ? `${classes.img} ${className}` : classes.img),
    [className, classes.img],
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

  const [isPlane, setPlane] = React.useState(false);
  const handleLoad = React.useCallback(() => {
    setImageState(ImageState.LOADED);
    const imageElement = imageRef.current;
    if (!imageElement) {
      return;
    }
    setTimeout(() => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = imageElement.naturalWidth;
      canvas.height = imageElement.naturalHeight;
      context.drawImage(imageElement, 0, 0, canvas.width, canvas.height);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height).data;
      const threshold = 10;
      let isPlaneColor = true;
      for (let i = 4; i < imageData.length; i += 4) {
        if (
          Math.abs(imageData[0] - imageData[i]) > threshold
          || Math.abs(imageData[1] - imageData[i + 1]) > threshold
          || Math.abs(imageData[2] - imageData[i + 2]) > threshold
        ) {
          isPlaneColor = false;
          break;
        }
      }
      setPlane(isPlaneColor);
    }, 2);
  }, []);

  return (
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
          className={`${imgClassName} ${forceUsePropSize ? classes.imageFull : ''}`}
          style={{ ...style, maxHeight: imgHeight }}
          src={imageSourceSet.imgSrc}
          alt={alt}
          width={imgWidth}
          height={imageState === ImageState.LOADED ? undefined : imgHeight}
          onLoad={handleLoad}
          onError={() => setImageState(ImageState.ERROR)}
        />
      )}
      {isPlane && (
        <div className={classes.planePageLabel}>EMPTY</div>
      )}
    </picture>
  );
};

export default React.memo(BookPageImage);
