import * as React from 'react';
import { createStyles, makeStyles } from '@material-ui/core';

interface ImgProps {
  src: string;
  alt?: string;
  minWidth?: number;
  minHeight?: number;
  className?: any;
  hidden?: boolean | 'false' | 'true';

  onClick?: () => void;
}

const useStyles = makeStyles(() => createStyles({
  noImg: {
    fontSize: '1.5rem',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
  },
  hasImg: {
    width: '100%',
    height: '100%',
    overflowY: 'hidden',
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
    hidden,
    onClick,
  } = props;

  // [beforeLoading, rendered, failed]
  const [_state, setState] = React.useState(0);

  const state = React.useMemo(() => (src === undefined ? 2 : _state), [_state, src]);

  return (
    // eslint-disable-next-line
    <div
      aria-hidden={hidden}
      className={state !== 1 ? classes.noImg : classes.hasImg}
      style={{ ...(state !== 1 ? { minWidth, minHeight } : {}), display: hidden === true ? 'none' : undefined }}
      onClick={onClick}
    >
      {(state === 0) && (
        <div>
          <div>loading</div>
          <div>{alt}</div>
        </div>
      )}
      {(state === 2) && (
        <div>
          <div>failed</div>
          <div>{alt}</div>
        </div>
      )}
      {(src) ? (
        <picture>
          <source type="image/webp" srcSet={`${src}.webp?nosave`} />
          <img
            className={className}
            style={{ display: (state === 1) ? '' : 'none' }}
            src={src}
            alt={alt}
            onLoad={() => setState(1)}
            onError={() => setState(2)}
          />
        </picture>
      ) : null}
    </div>
  );
};

export default Img;
