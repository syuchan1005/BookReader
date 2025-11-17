import { WritableAtom, useSetAtom } from 'jotai';
import { ReactElement, useEffect } from 'react';

export const RecoilValue = <T,>({
  atom,
  value,
  children,
}: { atom: WritableAtom<T, [T], void>; value: T; children: ReactElement }) => {
  const setter = useSetAtom(atom);
  useEffect(() => {
    setter(value);
  }, [setter, value]);
  return children;
};
