import { useEffect, useState } from 'react';

export const useDebounceValue = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  // biome-ignore lint/correctness/useExhaustiveDependencies: delay
  useEffect(() => {
    if (delay <= 0) {
      setDebouncedValue(value);
      return undefined;
    }

    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value]);

  return debouncedValue;
};
