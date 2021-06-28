import { useCallback, useState } from 'react';

type Creator<T> = ((i: T, p: T) => T) | T;

const useStateWithReset = <T>(initValue: T): [T, (c: Creator<T>) => void, () => void] => {
  const [state, setState] = useState(initValue);
  const reset = useCallback(() => {
    setState(initValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setValue = useCallback((creator: Creator<T>) => {
    setState((prevValue: T) => {
      if (typeof creator === 'function') {
        // @ts-ignore
        return creator(initValue, prevValue);
      }
      return creator;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [state, setValue, reset];
};

export default useStateWithReset;
