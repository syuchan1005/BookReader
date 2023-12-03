import useDebounceValue from '@client/hooks/useDebounceValue';
import { useTheme } from '@mui/material';
import { useCallback, useMemo, useState } from 'react';

export const useLazyDialog = (
  initialState: boolean,
  leavingScreen?: number,
): [
  openState: boolean,
  componentVisibleState: boolean,
  setTrue: () => void,
  setFalse: () => void,
  toggle: () => void,
  setState: (state: boolean) => void,
] => {
  const theme = useTheme();
  const [state, setState] = useState(initialState);
  const debounceState = useDebounceValue(
    state,
    leavingScreen !== undefined
      ? leavingScreen
      : theme.transitions.duration.leavingScreen,
  );
  const componentVisibleState = useMemo(
    () => state || debounceState,
    [state, debounceState],
  );

  const setTrue = useCallback(() => setState(true), []);
  const setFalse = useCallback(() => setState(false), []);
  const toggle = useCallback(() => setState((state) => !state), []);

  return [state, componentVisibleState, setTrue, setFalse, toggle, setState];
};

export default useLazyDialog;
