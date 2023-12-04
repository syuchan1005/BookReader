import { ReactElement, useEffect } from 'react';
import { RecoilState, useSetRecoilState } from 'recoil';

export const RecoilValue = <T,>({
  atom,
  value,
  children,
}: { atom: RecoilState<T>; value: T; children: ReactElement }) => {
  const setter = useSetRecoilState(atom);
  useEffect(() => {
    setter(value);
  }, [setter, value]);
  return children;
};
