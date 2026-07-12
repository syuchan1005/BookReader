import { Button } from '@mui/material';

import {
  getUploadAcceptArchiveTypes,
  getUploadAcceptMimeTypes,
} from '@syuchan1005/book-reader-common';
import { type CSSProperties, useRef } from 'react';

export type AcceptType = 'archive' | 'image';

interface FileFieldProps {
  acceptType?: AcceptType;
  file?: File;
  onChange?: (File) => void;
  style?: CSSProperties;
}

const FileField = (props: FileFieldProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { acceptType = 'archive', file, onChange, style } = props;

  const onFilePicked = (event) => {
    const { files } = event.target;
    if (files[0] !== undefined && onChange) {
      onChange(files[0]);
    }
  };

  let acceptTypeText: string;
  switch (acceptType) {
    case 'image':
      acceptTypeText = getUploadAcceptMimeTypes();
      break;
    case 'archive':
      acceptTypeText = getUploadAcceptArchiveTypes();
      break;
    default: {
      const _exhaustiveCheck: never = acceptType;
      return _exhaustiveCheck;
    }
  }
  return (
    <Button
      onClick={() => inputRef.current.click()}
      sx={(theme) => ({ margin: theme.spacing(1), ...style })}
    >
      <p
        style={{
          margin: 0,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          direction: 'rtl',
          textAlign: 'left',
        }}
      >
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

export default FileField;
