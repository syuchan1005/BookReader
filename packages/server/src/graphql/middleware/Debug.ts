import GQLMiddleware from '@server/graphql/GQLMiddleware';
import { promises as fs } from 'fs';
import { MutationResolvers, QueryResolvers } from '@syuchan1005/book-reader-graphql';
import {
  bookFolderPath,
  removeBook,
} from '@server/StorageUtil';
import { BookDataManager } from '@server/database/BookDataManager';

class Debug extends GQLMiddleware {
  Query(): QueryResolvers {
    return {
      debug_bookCounts: async () => {
        const dbBookIds = await BookDataManager.Debug.getBookIds();
        const bookInfoCount = await BookDataManager.Debug.getBookInfoCount();

        return {
          bookInfoCount,
          bookCount: dbBookIds.length,
        };
      },
    };
  }

  Mutation(): MutationResolvers {
    return {
      debug_deleteUnusedFolders: async () => {
        const dbBookIds = await BookDataManager.Debug.getBookIds();
        const fsBookIds = await fs.readdir(bookFolderPath);
        const removePromises = fsBookIds
          .filter((id) => !dbBookIds.includes(id))
          .map((id) => removeBook(id));
        await Promise.allSettled(removePromises);

        return {
          success: true,
        };
      },
    };
  }
}

export default Debug;
