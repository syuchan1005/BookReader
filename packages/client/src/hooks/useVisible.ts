import { MutableRefObject, useEffect, useState } from 'react';

export const useVisible = (
  ref: MutableRefObject<Element>,
  keepVisible = true,
  rootMargin?: string,
) => {
  const [isIntersecting, setIntersecting] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: isIntersecting, keepVisible
  useEffect(() => {
    if (!ref.current) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (keepVisible) {
          if (entry.isIntersecting && !isIntersecting) {
            setIntersecting(true);
          }
        } else {
          setIntersecting(entry.isIntersecting);
        }
      },
      {
        rootMargin,
      },
    );
    observer.observe(ref.current);
    return () => {
      observer.disconnect();
    };
  }, [ref, rootMargin]);

  return isIntersecting;
};
