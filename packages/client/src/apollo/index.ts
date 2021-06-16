import { ApolloClient, ApolloLink, InMemoryCache } from '@apollo/client';
import { WebSocketLink } from '@apollo/client/link/ws';
import { createUploadLink } from 'apollo-upload-client';
import { getMainDefinition } from 'apollo-utilities';
import createCustomFetcher from '@client/CustomFetcher';

const uri = `//${window.location.hostname}:${window.location.port}/graphql`;

const getClient = async (): Promise<ApolloClient<any>> => {
  const apolloClient = new ApolloClient({
    link: ApolloLink.split(
      ({ query }) => {
        const definition = getMainDefinition(query);
        return (
          definition.kind === 'OperationDefinition'
          && definition.operation === 'subscription'
        );
      },
      new WebSocketLink({
        uri: `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}${uri}`,
        options: {
          lazy: true,
          reconnect: true,
        },
      }),
      createUploadLink({
        uri: `${window.location.protocol}${uri}`,
        // credentials: "same-origin",
        fetch: (url, options) => {
          let f = fetch;
          if (options.useUpload) {
            f = createCustomFetcher(options.onProgress, options.onAbortPossible);
          }
          return f(url, options);
        },
      }),
    ).setOnError(({ graphQLErrors, networkError }) => {
      const log = (message) => {
        // @ts-ignore
        if (apolloClient.snackbar) apolloClient.snackbar(message, { variant: 'error' });
        // eslint-disable-next-line
        console.log(message);
      };
      if (graphQLErrors) {
        graphQLErrors.forEach(({ message, locations, path }) => log(
          `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`,
        ));
      }
      if (networkError) log(`[Network error]: ${networkError}`);
    }),
    cache: new InMemoryCache(),
    connectToDevTools: process.env.NODE_ENV !== 'production',
  });

  return apolloClient;
};

export default getClient;
