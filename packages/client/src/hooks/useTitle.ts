import { useEffect, useRef } from 'react';
import { defaultTitle } from '@syuchan1005/book-reader-common';

type Options = {
  restoreOnUnmount: boolean;
  inheritTitle: boolean;
};

const DEFAULT_OPTIONS: Options = {
  restoreOnUnmount: false,
  inheritTitle: false,
};

export const useTitle = (title: string, options: Options = DEFAULT_OPTIONS) => {
  const prevTitleRef = useRef(document.title);

  if (document.title !== title) {
    const suffix = options.inheritTitle ? prevTitleRef.current : defaultTitle;
    document.title = title ? `${title} - ${suffix}` : suffix;
  }

  useEffect(() => {
    if (options.restoreOnUnmount) {
      return () => {
        document.title = prevTitleRef.current;
      };
    }
    return undefined;
    // eslint-disable-next-line
  }, []);
};
