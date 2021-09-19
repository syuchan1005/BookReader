import React from 'react';
import { CircularProgress, LinearProgress, Modal, Theme } from '@mui/material';

import createStyles from '@mui/styles/createStyles';
import makeStyles from '@mui/styles/makeStyles';

interface LoadingFullscreenProps {
  open?: boolean;

  progresses?: number[],
  label?: string,
}

const useStyles = makeStyles((theme: Theme) => createStyles({
  modal: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  main: {
    width: '35%',
    fontSize: '1.5rem',
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    '& > *': {
      marginTop: theme.spacing(1),
    },
  },
}));

const LoadingFullscreen = (props: LoadingFullscreenProps) => {
  const classes = useStyles(props);
  const {
    open,
    progresses,
    label,
  } = props;
  return (
    <Modal open={open} className={classes.modal}>
      <div className={classes.main}>
        <CircularProgress color="secondary" size={60} />
        {(Array.isArray(progresses) && progresses.length !== 0) && progresses
          .map((progress, i) => (
            <LinearProgress
              // eslint-disable-next-line react/no-array-index-key
              key={i}
              value={progress}
              style={{ width: '100%' }}
              variant="determinate"
              color="secondary"
            />
          ))}

        {label && (<div>{label}</div>)}
      </div>
    </Modal>
  );
};

export default React.memo(LoadingFullscreen);
