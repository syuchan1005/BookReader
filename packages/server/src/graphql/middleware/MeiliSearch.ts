import {
  MutationResolvers,
  QueryResolvers,
  SearchMode,
} from '@syuchan1005/book-reader-graphql';
import { meiliSearchClient } from '@server/meilisearch';
import GQLMiddleware from '../GQLMiddleware';

class MeiliSearch extends GQLMiddleware {
  Query(): QueryResolvers {
    return {
      availableSearchModes: async () => {
        const result: SearchMode[] = ['DATABASE'];
        if (meiliSearchClient.isAvailable()) {
          result.push('MEILISEARCH');
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
