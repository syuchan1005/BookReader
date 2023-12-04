import { useCallback, useState } from 'react';

export const useMenuAnchor = () => {
  const [anchor, setAnchor] = useState(null);
  const setAnchorFromEvent = useCallback((e: MouseEvent) => {
    setAnchor(e.currentTarget);
  }, []);
  const resetAnchor = useCallback(() => {
    setAnchor(null);
  }, []);
  return [anchor, setAnchorFromEvent, resetAnchor];
};
