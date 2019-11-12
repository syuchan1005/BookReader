import * as React from 'react';
import * as colors from '@material-ui/core/colors';
import { useTheme } from '@material-ui/core';

interface ColorTileProps {
  color: string;
  num?: string | number;
  marginLeft?: boolean;
}

const ColorTile: React.FC<ColorTileProps> = ({ color, num = 500, marginLeft }: ColorTileProps) => {
  const theme = useTheme();

  return (
    <>
      <span
        style={{
          width: '1rem',
          height: '1rem',
          background: colors[color][num],
          marginRight: theme.spacing(1),
          marginLeft: marginLeft ? theme.spacing(1) : undefined,
        }}
      />
      <span>{color}</span>
    </>
  );
};

export default ColorTile;
