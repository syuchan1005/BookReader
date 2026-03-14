import {
  ApolloClient,
  ApolloLink,
  CombinedGraphQLErrors,
  ServerError,
} from '@apollo/client';
import { InMemoryCache, isReference } from '@apollo/client/cache';
import { ErrorLink } from '@apollo/client/link/error';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import {
  concatPagination,
  getMainDefinition,
  relayStylePagination,
} from '@apollo/client/utilities';
import { goToAuthPage } from '@client/auth';
import type { BookInfo } from '@syuchan1005/book-reader-graphql';
import UploadHttpLink from 'apollo-upload-client/UploadHttpLink.mjs';
import { CachePersistor, LocalStorageWrapper } from 'apollo3-cache-persist';
import { createClient } from 'graphql-ws';

const uri = `//${window.location.hostname}:${window.location.port}/graphql`;
const schemaVersion = '1.3.1';
const schemaVersionKey = 'apollo-cache-schema-version';

// biome-ignore lint/suspicious/noExplicitAny: we don't care about the type of Target
type Target = any;
type ReadFunc<T, K extends keyof T = Target> = (k: K) => T[K];

const uniqueRelayStylePagination = <T = Target>(
  uniqueKey: keyof T,
  selector: (a: ReadFunc<T>, b: ReadFunc<T>) => boolean,
  keyArgs?: string[],
) => {
  const pagination = relayStylePagination(keyArgs);
  return {
    ...pagination,
    merge(existing, incoming, _a) {
      const select = (target: Target) => (k: keyof T) => {
        const t = { ...target };
        if (isReference(t)) {
          return _a.readField(k, t);
        }
        return t[k];
      };
      // @ts-expect-error
      const mergeResult = pagination.merge(existing, incoming, _a);
      const edges: { cursor: string; node: T }[] = mergeResult.edges.map(
        (edge) => ({
          ...edge,
          node: {
            ...edge.node,
            [uniqueKey]: _a.readField(uniqueKey, edge.node),
          },
        }),
      );
      const filteredEdges: { cursor: string; node: T }[] = [];
      for (const edge of edges) {
        const index = filteredEdges.findIndex(
          (e) => e.node[uniqueKey] === edge.node[uniqueKey],
        );
        if (index !== -1) {
          if (selector(select(edge.node), select(filteredEdges[index].node))) {
            filteredEdges.splice(index, 1);
            filteredEdges.push(edge);
          } // else { /* do nothing */ }
        } else {
          filteredEdges.push(edge);
        }
      }
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
  // @ts-expect-error
  cache,
  storage: new LocalStorageWrapper(window.localStorage),
});

let onErrorHandler: (message: string) => void = () => {};
export const setOnErrorHandler = (handler: (message: string) => void) => {
  onErrorHandler = handler;
};

export const apolloClient = new ApolloClient({
  link: ApolloLink.from([
    new ErrorLink(({ error }) => {
      const log = (message) => {
        onErrorHandler(message);
        console.log(message);
      };

      if (ServerError.is(error)) {
        if (error.statusCode === 401) {
          goToAuthPage();
          return;
        }

        log(
          `[Network error]: ${error.message}, Status Code: ${error.statusCode}`,
        );
      } else if (CombinedGraphQLErrors.is(error)) {
        for (const { message, locations, path } of error.errors) {
          log(
            `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`,
          );
        }
      } else {
        log(`[GraphQL error]: (other) ${error.message}`);
      }
    }),
    ApolloLink.split(
      ({ query }) => {
        const definition = getMainDefinition(query);
        return (
          definition.kind === 'OperationDefinition' &&
          definition.operation === 'subscription'
        );
      },
      new GraphQLWsLink(
        createClient({
          url: `${
            window.location.protocol === 'https:' ? 'wss:' : 'ws:'
          }${uri}`,
        }),
      ),
      new UploadHttpLink({
        uri: `${window.location.protocol}${uri}`,
      }),
    ),
  ]),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
  cache,
  devtools: {
    enabled: process.env.NODE_ENV !== 'production',
  },
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
