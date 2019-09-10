// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as React from 'react';
import { Button, Theme, withStyles } from '@material-ui/core';
import { grey } from '@material-ui/core/colors';

const DashedOutlineButton = withStyles((theme: Theme) => ({
  root: {
    color: theme.palette.getContrastText(grey[300]),
    background: 'rgba(0, 0, 0, 0)',
    width: '100%',
    height: '100%',
    minHeight: theme.spacing(8),
    border: '2px dashed lightgray',
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
}))(Button);

export default DashedOutlineButton;
