import { useScrollTrigger } from '@mui/material';
import { useMemo } from 'react';

export const useAppBarScrollElevation = (): number => {
  const isScrolled = useScrollTrigger({ disableHysteresis: true, threshold: 0 });
  const elevation = useMemo(() => (isScrolled ? 4 : 0), [isScrolled]);
  return elevation;
};
