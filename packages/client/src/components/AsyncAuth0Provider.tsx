import React from 'react';
import { useAuth0Query } from '@syuchan1005/book-reader-graphql/generated/GQLQueries';
import { Auth0Provider } from '@auth0/auth0-react';
import { useSetRecoilState } from 'recoil';
import { auth0State } from '@client/store/atoms';

export const AsyncAuth0Provider = ({ children }: { children: React.ReactElement }) => {
  const setAuth0 = useSetRecoilState(auth0State);
  const { data } = useAuth0Query({
    fetchPolicy: 'cache-and-network',
    onCompleted({ auth0 }) {
      setAuth0(auth0);
    },
  });
  if (data?.auth0) {
    return (
      <Auth0Provider
        domain={data.auth0.domain}
        clientId={data.auth0.clientId}
        redirectUri={window.location.origin}
        audience={window.location.origin}
      >
        {children}
      </Auth0Provider>
    );
  }
  return children;
};
