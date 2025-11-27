import { useOS } from '@client/hooks/useOS';
import { Box } from '@mui/material';
import { grey } from '@mui/material/colors';
import { archiveTypes } from '@syuchan1005/book-reader-common';
import { useEffect, useRef, useState } from 'react';
import {
  type DropEvent,
  type FileRejection,
  useDropzone,
} from 'react-dropzone';

interface FileFieldProps {
  onChange?: <T extends File>(
    acceptedFiles: T[],
    fileRejections: FileRejection[],
    event: DropEvent,
  ) => void;
}

const DropZone = (props: FileFieldProps) => {
  const { onChange } = props;

  const [width, setWidth] = useState(undefined);
  const ref = useRef<HTMLDivElement>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onChange,
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: width
  useEffect(() => {
    if (!isDragActive && ref.current) {
      setWidth(Math.max(width || -1, ref.current.offsetWidth));
    }
  }, [isDragActive]);

  const os = useOS();

  const acceptType = `${Object.keys(archiveTypes).join(',')},${[
    ...new Set(Object.values(archiveTypes)),
  ]
    .map((a) => `.${a}`)
    .join(',')}`;
  return (
    <Box
      {...getRootProps()}
      className={`${isDragActive ? ' dragging' : ''}`}
      sx={(theme) => ({
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
        minWidth: width,
      })}
      ref={ref}
    >
      <input
        {...getInputProps()}
        accept={os === 'iOS' ? undefined : acceptType}
      />
      {isDragActive ? (
        <p>Drop the files here ...</p>
      ) : (
        <p>Drag and drop some files here, or click to select files</p>
      )}
    </Box>
  );
};

export default DropZone;
