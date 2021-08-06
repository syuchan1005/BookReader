import GQLMiddleware from '@server/graphql/GQLMiddleware';
import { promises as fs } from 'fs';
import { asyncMap } from '@server/Util';
import { MutationResolvers, QueryResolvers } from '@syuchan1005/book-reader-graphql';
import {
  bookFolderPath,
  getBookFolderSize,
  getCacheFolderSize,
  getTemporaryFolderSize,
  removeBook,
} from '@server/StorageUtil';
import { BookDataManager } from '@server/database/BookDataManager';

class Debug extends GQLMiddleware {
  Query(): QueryResolvers {
    return {
      debug_folderSize: async () => {
        const tmp = await getTemporaryFolderSize();
        const cache = await getCacheFolderSize();

        const dbBookIds = await BookDataManager.Debug.getBookIds();
        const fsBookIds = await fs.readdir(bookFolderPath);
        const bookSizes = await asyncMap(fsBookIds, async (b) => ({
          id: b,
          size: await getBookFolderSize(b),
        }));
        let book = 0;
        let unusedBook = 0;
        bookSizes.forEach(({ id, size }) => {
          if (!dbBookIds.includes(id)) {
            unusedBook += size;
          }
          book += size;
        });

        const bookInfoCount = await BookDataManager.Debug.getBookInfoCount();

        return {
          tmp,
          cache,
          book,
          unusedBook,
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
