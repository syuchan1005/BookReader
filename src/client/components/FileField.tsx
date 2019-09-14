import * as React from 'react';
import {
  Button,
  createStyles,
  makeStyles,
  Theme,
} from '@material-ui/core';

import { archiveTypes } from '../../common/Common';

interface FileFieldProps {
  file?: File;
  onChange?: Function;
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

const FileField: React.FC<FileFieldProps> = (props: FileFieldProps) => {
  const classes = useStyles(props);
  const inputRef = React.useRef(null);
  const { file, onChange } = props;

  const onFilePicked = (event) => {
    const { files } = event.target;
    if (files[0] !== undefined && onChange) {
      onChange(files[0]);
    }
  };

  const acceptType = `${Object.keys(archiveTypes).join(',')},${[...new Set(Object.values(archiveTypes))].map((a) => `.${a}`).join(',')}`;
  return (
    <Button
      onClick={() => inputRef.current.click()}
      className={classes.fileField}
    >
      <p className={classes.fieldLabel}>
        {file.name || 'Upload'}
      </p>
      <input
        hidden
        type="file"
        accept={acceptType}
        ref={inputRef}
        onChange={onFilePicked}
      />
    </Button>
  );
};

export default FileField;
