import React from 'react';

import { ApolloClient } from 'apollo-client';
import { NormalizedCacheObject } from 'apollo-cache-inmemory';
import { CachePersistor } from 'apollo-cache-persist';

interface IApolloProvider {
  client?: ApolloClient<NormalizedCacheObject>;
  persistor?: CachePersistor<NormalizedCacheObject>;
}

const Apollo = React.createContext<IApolloProvider>({
  client: undefined,
  persistor: undefined,
});

export const useApollo = () => React.useContext(Apollo);

const ApolloProvider: React.PropsWithChildren<React.FC<IApolloProvider>> = ({
  children,
  client,
  persistor,
}: React.PropsWithChildren<React.FC> & IApolloProvider) => (
  <Apollo.Provider value={{ client, persistor }}>
    {children}
  </Apollo.Provider>
);

export default ApolloProvider;
