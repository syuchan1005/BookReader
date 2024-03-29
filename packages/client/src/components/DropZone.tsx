import * as React from 'react';
import { DropEvent, FileRejection, useDropzone } from 'react-dropzone';
import { Theme } from '@mui/material';
import createStyles from '@mui/styles/createStyles';
import makeStyles from '@mui/styles/makeStyles';
import { grey } from '@mui/material/colors';

import { archiveTypes } from '@syuchan1005/book-reader-common';
import useOS from '@client/hooks/useOS';

interface FileFieldProps {
  onChange?: <T extends File>(
    acceptedFiles: T[],
    fileRejections: FileRejection[],
    event: DropEvent,
  ) => void;
}

const useStyles = makeStyles((theme: Theme) => createStyles({
  dropZone: {
    marginTop: theme.spacing(1),
    width: '100%',
    border: `dashed ${theme.spacing(0.25)} ${grey[600]}`,
    padding: theme.spacing(1),
    '&.dragging': {
      background: grey[200],
    },
    '& > p': {
      pointerEvents: 'none',
    },
  },
}));

const DropZone = (props: FileFieldProps) => {
  const classes = useStyles(props);
  const { onChange } = props;

  const [width, setWidth] = React.useState(undefined);
  const ref = React.useRef<HTMLDivElement>();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop: onChange });

  React.useEffect(() => {
    if (!isDragActive && ref.current) {
      setWidth(Math.max(width || -1, ref.current.offsetWidth));
    }
    // eslint-disable-next-line
  }, [isDragActive]);

  const os = useOS();

  const acceptType = `${Object.keys(archiveTypes).join(',')},${[...new Set(Object.values(archiveTypes))].map((a) => `.${a}`).join(',')}`;
  return (
    <div
      {...getRootProps()}
      className={`${classes.dropZone}${isDragActive ? ' dragging' : ''}`}
      style={{ minWidth: width }}
      ref={ref}
    >
      <input {...getInputProps()} accept={os === 'iOS' ? undefined : acceptType} />
      {
        isDragActive
          ? <p>Drop the files here ...</p>
          : <p>Drag and drop some files here, or click to select files</p>
      }
    </div>
  );
};

export default React.memo(DropZone);
