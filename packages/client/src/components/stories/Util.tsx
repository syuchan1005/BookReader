import { RecoilState, useSetRecoilState } from 'recoil';
import React, { useEffect } from 'react';
import { Auth0ContextInterface } from '@auth0/auth0-react/src/auth0-context';
import { Auth0Context } from '@auth0/auth0-react';

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

export const MockedAuth0Provider = ({
  onLogin,
  onLogout,
  auth0,
  children,
}: {
  onLogin?: (options: unknown) => Promise<void>,
  onLogout?: () => void,
  auth0: Partial<Auth0ContextInterface<unknown>>,
  children: React.ReactElement,
}) => (
  <Auth0Context.Provider
    // @ts-ignore
    // eslint-disable-next-line
    value={{
      loginWithRedirect: onLogin || (() => Promise.resolve()),
      logout: onLogout || (() => {}),
      isAuthenticated: false,
      user: {
        name: 'TestName',
        picture: 'https://placehold.jp/36/ababab/ffffff/120x120.png?text=T',
      },
      getAccessTokenSilently: (): Promise<string> => {
        throw new Error('Mocked');
      },
      isLoading: false,
      // eslint-disable-next-line
      ...auth0,
    }}
  >
    {children}
  </Auth0Context.Provider>
);
