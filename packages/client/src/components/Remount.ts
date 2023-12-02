import { ReactNode, memo, useEffect, useState } from 'react';

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
export const Remount = memo(RemountInner);
