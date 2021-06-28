import { useState, useCallback } from 'react';

const useMenuAnchor = () => {
  const [anchor, setAnchor] = useState(null);
  const setAnchorFromEvent = useCallback((e: MouseEvent) => {
    setAnchor(e.currentTarget);
  }, []);
  const resetAnchor = useCallback(() => {
    setAnchor(null);
  }, []);
  return [anchor, setAnchorFromEvent, resetAnchor];
};

export default useMenuAnchor;
