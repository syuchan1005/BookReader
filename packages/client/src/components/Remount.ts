import { memo, type ReactNode, useEffect, useState } from 'react';

type RemountProps = {
  remountKey: string;
  children?: ReactNode;
};

const RemountInner = ({ remountKey, children }: RemountProps) => {
  const [shouldUnmount, setShouldUnmount] = useState(false);
  // biome-ignore lint/correctness/useExhaustiveDependencies: remountKey
  useEffect(() => {
    setShouldUnmount(true);
    requestAnimationFrame(() => {
      setShouldUnmount(false);
    });
  }, [remountKey]);

  return shouldUnmount ? null : children;
};

// @ts-expect-error
export const Remount = memo(RemountInner);
