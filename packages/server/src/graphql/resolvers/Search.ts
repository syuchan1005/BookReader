import { searchClient } from '@server/search';
import type { Resolvers } from '@syuchan1005/book-reader-graphql';

export const resolvers: Resolvers = {
  Mutation: {
    debug_rebuildSearch: async () => {
      try {
        await searchClient.rebuildBookIndex();
      } catch (e) {
        console.error(e);
      }
      return {
        success: true,
      };
    },
  },
};
