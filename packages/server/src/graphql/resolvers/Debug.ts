import { Resolvers } from '@syuchan1005/book-reader-graphql';
import { BookDataManager } from '@server/database/BookDataManager';
import { StorageDataManager } from '@server/storage/StorageDataManager';

export const resolvers: Resolvers = {
  Query: {
    debug_bookCounts: async () => {
      const dbBookIds = await BookDataManager.Debug.getBookIds();
      const bookInfoCount = await BookDataManager.Debug.getBookInfoCount();

      return {
        bookInfoCount,
        bookCount: dbBookIds.length,
      };
    },
  },
  Mutation: {
    debug_deleteUnusedFolders: async () => {
      const dbBookIds = await BookDataManager.Debug.getBookIds();
      const fsBookIds = await StorageDataManager.getStoredBookIds();
      const removePromises = fsBookIds
        .filter((id) => !dbBookIds.includes(id))
        .map((id) => StorageDataManager.removeBook(id, false));
      await Promise.allSettled(removePromises);

      return {
        success: true,
      };
    },
  },
};
