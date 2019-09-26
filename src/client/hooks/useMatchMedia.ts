import * as React from 'react';

const useMatchMedia = (queries, values, defaultValue) => {
  const mediaQueryLists = queries.map((q) => window.matchMedia(q));

  const getValue = () => {
    const index = mediaQueryLists.findIndex(({ matches }) => matches);
    return typeof values[index] !== 'undefined' ? values[index] : defaultValue;
  };

  const [value, setValue] = React.useState(getValue);

  React.useEffect(() => {
    const handler = () => setValue(getValue);
    mediaQueryLists.forEach((m) => m.addListener(handler));
    return () => mediaQueryLists.forEach((m) => m.removeListener(handler));
  }, []);

  return value;
};

export default useMatchMedia;
