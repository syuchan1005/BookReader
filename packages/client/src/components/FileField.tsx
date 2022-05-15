import React from 'react';
import { Button, Theme } from '@mui/material';

import createStyles from '@mui/styles/createStyles';
import makeStyles from '@mui/styles/makeStyles';

import { archiveTypes } from '@syuchan1005/book-reader-common';

export type AcceptType = 'archive' | 'image';

interface FileFieldProps {
  acceptType?: AcceptType;
  file?: File;
  onChange?: Function;
  style?: React.CSSProperties;
}

const useStyles = makeStyles((theme: Theme) => createStyles({
  fileField: {
    margin: theme.spacing(1),
  },
  fieldLabel: {
    margin: 0,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    direction: 'rtl',
    textAlign: 'left',
  },
}));

const FileField = (props: FileFieldProps) => {
  const classes = useStyles(props);
  const inputRef = React.useRef(null);
  const {
    acceptType = 'archive',
    file,
    onChange,
    style,
  } = props;

  const onFilePicked = (event) => {
    const { files } = event.target;
    if (files[0] !== undefined && onChange) {
      onChange(files[0]);
    }
  };

  let acceptTypeText;
  switch (acceptType) {
    case 'image':
      acceptTypeText = 'image/jpeg,image/png,image/webp';
      break;
    case 'archive':
    default:
      acceptTypeText = `${Object.keys(archiveTypes).join(',')},${[...new Set(Object.values(archiveTypes))].map((a) => `.${a}`).join(',')}`;
      break;
  }
  return (
    <Button
      onClick={() => inputRef.current.click()}
      className={classes.fileField}
      style={style}
    >
      <p className={classes.fieldLabel}>
        {file ? file.name : 'Upload'}
      </p>
      <input
        hidden
        type="file"
        accept={acceptTypeText}
        ref={inputRef}
        onChange={onFilePicked}
      />
    </Button>
  );
};

export default React.memo(FileField);
