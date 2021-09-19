import { useCallback, useMemo, useState } from 'react';
import { useTheme } from '@mui/material';
import useDebounceValue from '@client/hooks/useDebounceValue';

export const useLazyDialog = (initialState: boolean, leavingScreen?: number): [
  openState: boolean,
  componentVisibleState: boolean,
  setTrue: () => void, setFalse: () => void, toggle: () => void,
  setState: (state: boolean) => void,
] => {
  const theme = useTheme();
  const [state, setState] = useState(initialState);
  const debounceState = useDebounceValue(
    state,
    leavingScreen !== undefined ? leavingScreen : theme.transitions.duration.leavingScreen,
  );
  const componentVisibleState = useMemo(
    () => state || debounceState,
    [state, debounceState],
  );

  const setTrue = useCallback(() => setState(true), [setState]);
  const setFalse = useCallback(() => setState(false), [setState]);
  const toggle = useCallback(() => setState(!state), [setState, state]);

  return [state, componentVisibleState, setTrue, setFalse, toggle, setState];
};

export default useLazyDialog;
