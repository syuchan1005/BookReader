import { useMediaQuery as muiUseMediaQuery } from '@mui/material';
import { useMemo } from 'react';

export const useMediaQuery = (queryInput: string) => {
  const options = useMemo(() => {
    if (!window.matchMedia) return undefined;
    const mediaQuery = queryInput.replace(/^@media( ?)/m, '');
    return {
      defaultMatches: window.matchMedia(mediaQuery).matches,
    };
  }, [queryInput]);

  return muiUseMediaQuery(queryInput, options);
};

export default useMediaQuery;
