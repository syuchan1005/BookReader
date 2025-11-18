import { useCallback, useState } from 'react';

type Creator<T> = ((i: T, p: T) => T) | T;

export const useStateWithReset = <T>(
  initValue: T,
): [T, (c: Creator<T>) => void, () => void] => {
  const [state, setState] = useState(initValue);
  // biome-ignore lint/correctness/useExhaustiveDependencies: initValue
  const reset = useCallback(() => {
    setState(initValue);
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: initValue
  const setValue = useCallback((creator: Creator<T>) => {
    setState((prevValue: T) => {
      if (typeof creator === 'function') {
        // @ts-expect-error
        return creator(initValue, prevValue);
      }
      return creator;
    });
  }, []);

  return [state, setValue, reset];
};
