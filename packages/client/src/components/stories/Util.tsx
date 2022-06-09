import { RecoilState, useSetRecoilState } from 'recoil';
import React, { useEffect } from 'react';

export const RecoilValue = <T, >({
  atom,
  value,
  children,
}: { atom: RecoilState<T>, value: T, children: React.ReactElement }) => {
  const setter = useSetRecoilState(atom);
  useEffect(() => {
    setter(value);
  }, [setter, value]);
  return children;
};
