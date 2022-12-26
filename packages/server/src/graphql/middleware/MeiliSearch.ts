import {
  MutationResolvers,
  QueryResolvers,
  SearchMode,
} from '@syuchan1005/book-reader-graphql';
import { meiliSearchClient, elasticSearchClient } from '@server/search';
import GQLMiddleware from '../GQLMiddleware';

class MeiliSearch extends GQLMiddleware {
  Query(): QueryResolvers {
    return {
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
    };
  }

  Mutation(): MutationResolvers {
    return {
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
    };
  }
}

export default MeiliSearch;
