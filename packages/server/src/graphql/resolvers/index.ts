import { Resolvers } from '@syuchan1005/book-reader-graphql';
import { mergeResolvers } from '@graphql-tools/merge';

import { resolvers as Book } from './Book';
import { resolvers as BookInfo } from './BookInfo';
import { resolvers as Debug } from './Debug';
import { resolvers as Genre } from './Genre';
import { resolvers as Page } from './Page';
import { resolvers as RelayBookInfo } from './RelayBookInfo';
import { resolvers as MeiliSearch } from './MeiliSearch';

export const resolvers: Resolvers = mergeResolvers([
  Book,
  BookInfo,
  Debug,
  Genre,
  Page,
  RelayBookInfo,
  MeiliSearch,
]);
