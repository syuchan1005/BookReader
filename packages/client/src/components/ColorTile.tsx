import React from 'react';
import * as colors from '@mui/material/colors';
import { useTheme } from '@mui/material';
import useTestId from '../hooks/useTestId';

interface ColorTileProps {
  color: string;
  num?: string | number;
  marginLeft?: boolean;
}

const ColorTile = ({ color, num = 500, marginLeft }: ColorTileProps) => {
  const theme = useTheme();
  const tileTestId = useTestId('tile');
  const textTestId = useTestId('text');

  return (
    <>
      <span
        {...tileTestId}
        style={{
          width: '1rem',
          height: '1rem',
          background: colors[color][num],
          marginRight: theme.spacing(1),
          marginLeft: marginLeft ? theme.spacing(1) : undefined,
        }}
      />
      <span {...textTestId}>{color}</span>
    </>
  );
};

export default React.memo(ColorTile);
