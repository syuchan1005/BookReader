import * as React from 'react';
import { useDropzone } from 'react-dropzone';
import { createStyles, makeStyles, Theme } from '@material-ui/core';
import { grey } from '@material-ui/core/colors';

import { archiveTypes } from '@common/Common';

interface FileFieldProps {
  onChange?<T extends File>
  (acceptedFiles: T[], rejectedFiles: T[], event: React.DragEvent<HTMLElement>): void;
}

const useStyles = makeStyles((theme: Theme) => createStyles({
  dropZone: {
    marginTop: theme.spacing(1),
    width: 'minmax(80%, 50vw)',
    border: `dashed ${theme.spacing(0.25)}px ${grey[600]}`,
    padding: theme.spacing(1),
    '&.dragging': {
      background: grey[200],
    },
  },
}));

const DropZone: React.FC<FileFieldProps> = (props: FileFieldProps) => {
  const classes = useStyles(props);
  const { onChange } = props;

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop: onChange });

  const acceptType = `${Object.keys(archiveTypes).join(',')},${[...new Set(Object.values(archiveTypes))].map((a) => `.${a}`).join(',')}`;
  return (
    <div {...getRootProps()} className={`${classes.dropZone}${isDragActive ? ' dragging' : ''}`}>
      <input {...getInputProps()} accept={acceptType} />
      {
        isDragActive
          ? <p>Drop the files here ...</p>
          : <p>Drag and drop some files here, or click to select files</p>
      }
    </div>
  );
};

// @ts-ignore
DropZone.whyDidYouRender = true;

export default DropZone;
