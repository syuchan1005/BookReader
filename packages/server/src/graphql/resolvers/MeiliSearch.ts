import { Resolvers, SearchMode } from '@syuchan1005/book-reader-graphql';
import { meiliSearchClient, elasticSearchClient } from '@server/search';

export const resolvers: Resolvers = {
  Query: {
    availableSearchModes: async () => {
      const result: SearchMode[] = [SearchMode.Database];
      if (meiliSearchClient.isAvailable()) {
        result.push(SearchMode.Meilisearch);
      }
      if (elasticSearchClient.isAvailable()) {
        result.push(SearchMode.Elasticsearch);
      }
      return result;
    },
  },
  Mutation: {
    debug_rebuildMeiliSearch: async () => {
      try {
        await meiliSearchClient.rebuildBookIndex();
        await elasticSearchClient.rebuildBookIndex();
      } catch (e) {
        console.error(e);
      }
      return {
        success: true,
      };
    },
  },
};
