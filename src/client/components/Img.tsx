import * as React from 'react';
import { createStyles, makeStyles } from '@material-ui/core';

interface ImgProps {
  src: string;
  alt?: string;
  className?: any;
}

const useStyles = makeStyles(() => createStyles({
  noImg: {
    minWidth: 150,
    minHeight: 200,
    fontSize: '1.5rem',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hasImg: {
    width: '100%',
    height: '100%',
  },
}));

const Img: React.FC<ImgProps> = (props: ImgProps) => {
  const classes = useStyles(props);
  const {
    src,
    alt,
    className,
  } = props;

  // [beforeLoading, rendered, failed]
  const [state, setState] = React.useState(0);

  if (src === undefined) {
    return (
      <div className={classes.noImg}><p>failed</p></div>
    );
  }

  return (
    <div className={state !== 1 ? classes.noImg : classes.hasImg}>
      {(state === 0) && (
        <p>loading</p>
      )}
      {(state === 2) && (
        <p>failed</p>
      )}
      <img
        className={className}
        style={{ display: (state === 1) ? '' : 'none' }}
        src={src}
        alt={alt}
        onLoad={() => setState(1)}
        onError={() => setState(2)}
      />
    </div>
  );
};

export default Img;
