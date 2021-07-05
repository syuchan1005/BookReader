import { useTheme } from '@material-ui/core';
import React, { useState } from 'react';

const useToolbarHeight = (): number => {
  const theme = useTheme();
  const toolbarStyle = theme.mixins.toolbar;
  const [height, setHeight] = useState(toolbarStyle.minHeight);
  React.useEffect(() => {
    if (!window.matchMedia) {
      setHeight(toolbarStyle.minHeight);
      return undefined;
    }
    const onResize = () => {
      const keys = Object.keys(toolbarStyle).filter((k) => k.startsWith('@media')).reverse();
      const k = keys.find((key) => {
        const mediaQuery = key.replace(/^@media( ?)/m, '');
        return window.matchMedia(mediaQuery).matches;
      });
      if (k) {
        // @ts-ignore
        setHeight(toolbarStyle[k].minHeight);
      } else {
        setHeight(toolbarStyle.minHeight);
      }
    };

    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, [toolbarStyle]);
  return parseInt(height as any, 10);
};

export default useToolbarHeight;
