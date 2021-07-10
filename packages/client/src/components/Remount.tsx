import {
  ReactNode,
  useEffect,
  useState,
  memo,
} from 'react';

type RemountProps = {
  remount: boolean;
  children?: ReactNode;
};

const RemountInner = ({ remount: shouldRemount, children }: RemountProps) => {
  const [shouldUnmount, setShouldUnmount] = useState(false);
  useEffect(() => {
    if (!shouldRemount) return;
    setShouldUnmount(true);
    requestAnimationFrame(() => {
      setShouldUnmount(false);
    });
  }, [shouldRemount]);

  return shouldUnmount ? null : children;
};

// @ts-ignore
// eslint-disable-next-line import/prefer-default-export
export const Remount = memo(RemountInner);
