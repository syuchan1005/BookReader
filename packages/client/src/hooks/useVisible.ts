import { MutableRefObject, useEffect, useState } from 'react';

export const useVisible = (
  ref: MutableRefObject<any>,
  keepVisible: boolean = true,
  rootMargin?: string,
) => {
  const [isIntersecting, setIntersecting] = useState(false);

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
      }, {
        rootMargin,
      },
    );
    observer.observe(ref.current);
    return () => {
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, rootMargin]);

  return isIntersecting;
};

export default useVisible;
