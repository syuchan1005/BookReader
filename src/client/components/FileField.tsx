import * as React from 'react';
import {
  Button,
  createStyles,
  makeStyles,
  Theme,
} from '@material-ui/core';

interface FileFieldProps {
  label?: string;
  file?: File;
  onChange?: Function;
}

const useStyles = makeStyles((theme: Theme) => createStyles({
  fileField: {
    margin: theme.spacing(1),
  },
}));

const FileField: React.FC<FileFieldProps> = (props: FileFieldProps) => {
  const classes = useStyles(props);
  const inputRef = React.useRef(null);
  const { label, file, onChange } = props;

  const onFilePicked = (event) => {
    const { files } = event.target;
    if (files[0] !== undefined && onChange) {
      onChange(files[0]);
    }
  };

  let buttonText = label || 'Upload';
  if (file) {
    buttonText += ` [${file.name}]`;
  }

  return (
    <Button onClick={() => inputRef.current.click()} className={classes.fileField}>
      {buttonText}
      <input
        hidden
        type="file"
        accept="application/zip"
        ref={inputRef}
        onChange={onFilePicked}
      />
    </Button>
  );
};

export default FileField;
