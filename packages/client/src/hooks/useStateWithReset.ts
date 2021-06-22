import { useCallback, useState } from 'react';

const useStateWithReset = <T>(initValue: T): [T, (t: T) => void, () => void] => {
  const [state, setState] = useState(initValue);
  const reset = useCallback(() => {
    setState(initValue);
  }, [setState]);

  const setValue = useCallback((creator: ((i: T, p: T) => T) | T) => {
    setState((prevValue: T) => {
      if (typeof creator === 'function') {
        // @ts-ignore
        return creator(initValue, prevValue);
      }
      return creator;
    });
  }, [setState]);

  return [state, setValue, reset];
};

export default useStateWithReset;
