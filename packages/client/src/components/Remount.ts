import {
  ReactNode,
  useEffect,
  useState,
  memo,
} from 'react';

type RemountProps = {
  remountKey: string;
  children?: ReactNode;
};

const RemountInner = ({ remountKey, children }: RemountProps) => {
  const [shouldUnmount, setShouldUnmount] = useState(false);
  useEffect(() => {
    setShouldUnmount(true);
    requestAnimationFrame(() => {
      setShouldUnmount(false);
    });
  }, [remountKey]);

  return shouldUnmount ? null : children;
};

// @ts-ignore
// eslint-disable-next-line import/prefer-default-export
export const Remount = memo(RemountInner);
