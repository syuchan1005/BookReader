import { ApolloClient, split } from '@apollo/client';
import { InMemoryCache, isReference } from '@apollo/client/cache';
import {
  getMainDefinition,
  relayStylePagination,
  concatPagination,
} from '@apollo/client/utilities';
import { createUploadLink } from 'apollo-upload-client';
import { CachePersistor, LocalStorageWrapper } from 'apollo3-cache-persist';

import createCustomFetcher from '@client/CustomFetcher';

import { BookInfo } from '@syuchan1005/book-reader-graphql/generated/GQLQueries';
import { WebSocketLink } from '@client/apollo/WebSocketLink';

const uri = `//${window.location.hostname}:${window.location.port}/graphql`;
const schemaVersion = '1.3.1';
const schemaVersionKey = 'apollo-cache-schema-version';

type ReadFunc<T, K extends keyof T = any> = (k: K) => T[K];

const uniqueRelayStylePagination = <T = any>(
  uniqueKey: keyof T,
  selector: (a: ReadFunc<T>, b: ReadFunc<T>) => boolean,
  keyArgs?: string[],
) => {
  const pagination = relayStylePagination(keyArgs);
  return {
    ...pagination,
    merge(existing, incoming, _a) {
      const select = (target: any) => (k: keyof T) => {
        const t = { ...target };
        if (isReference(t)) {
          return _a.readField(k, t);
        }
        return t[k];
      };
      // @ts-ignore
      const mergeResult = pagination.merge(existing, incoming, _a);
      const edges: { cursor: string, node: T }[] = mergeResult.edges.map((edge) => ({
        ...edge,
        node: {
          ...edge.node,
          [uniqueKey]: _a.readField(uniqueKey, edge.node),
        },
      }));
      const filteredEdges: { cursor: string, node: T }[] = [];
      edges.forEach((edge) => {
        const index = filteredEdges
          .findIndex((e) => e.node[uniqueKey] === edge.node[uniqueKey]);
        if (index !== -1) {
          if (selector(select(edge.node), select(filteredEdges[index].node))) {
            filteredEdges.splice(index, 1);
            filteredEdges.push(edge);
          } // else { /* do nothing */ }
        } else {
          filteredEdges.push(edge);
        }
      });
      return {
        ...mergeResult,
        edges: filteredEdges,
      };
    },
  };
};

const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        relayBookInfos: uniqueRelayStylePagination<BookInfo>(
          'id',
          (a, b) => a('updatedAt') > b('updatedAt'),
          ['option'],
        ),
        books: concatPagination(),
      },
    },
    BookInfo: {
      fields: {
        books: {
          // always preferring incoming data.
          merge: false,
        },
      },
    },
  },
});

const cachePersistor = new CachePersistor({
  // @ts-ignore
  cache,
  storage: new LocalStorageWrapper(window.localStorage),
});

export const apolloClient = new ApolloClient({
  link: split(
    ({ query }) => {
      const definition = getMainDefinition(query);
      return (
        definition.kind === 'OperationDefinition'
        && definition.operation === 'subscription'
      );
    },
    new WebSocketLink({
      url: `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}${uri}`,
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
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
      nextFetchPolicy: 'cache-first',
    },
  },
  cache,
  connectToDevTools: process.env.NODE_ENV !== 'production',
});

export const resetStore: () => Promise<void> = () => cachePersistor.purge();

export const setUpApollo = async () => {
  const currentVersion = window.localStorage.getItem(schemaVersionKey);
  if (currentVersion === schemaVersion) {
    await cachePersistor.restore();
  } else {
    await resetStore();
    window.localStorage.setItem(schemaVersionKey, schemaVersion);
  }
};

export default apolloClient;
