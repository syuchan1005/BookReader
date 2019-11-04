import * as React from 'react';
import { createStyles, makeStyles } from '@material-ui/core';

interface ImgProps {
  src: string;
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

const Img: React.FC<ImgProps> = (props: ImgProps) => {
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
        <picture className={classes.pic}>
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
};

export default Img;
