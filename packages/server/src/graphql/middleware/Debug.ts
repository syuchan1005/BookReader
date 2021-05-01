import GQLMiddleware from '@server/graphql/GQLMiddleware';

import os from 'os';
import { promises as fs } from 'fs';

import du from 'du';

import BookModel from '@server/sequelize/models/Book';
import BookInfoModel from '@server/sequelize/models/BookInfo';
import { asyncForEach, asyncMap } from '@server/Util';
import { MutationResolvers, QueryResolvers } from '@syuchan1005/book-reader-graphql';
import GraphQL from '../index';

class Debug extends GQLMiddleware {
  // eslint-disable-next-line class-methods-use-this
  Query(): QueryResolvers {
    // noinspection JSUnusedGlobalSymbols
    return {
      debug_folderSize: async () => {
        let tmp;
        try {
          tmp = await du(`${os.tmpdir()}/bookReader/`);
        } catch (e) { tmp = -1; }
        const cache = await du('storage/cache');

        const dbBookIds = (await BookModel.findAll({
          attributes: ['id'],
        })).map(({ id }) => id);
        const fsBookIds = await fs.readdir('storage/book');
        const bookSizes = await asyncMap(fsBookIds, async (b) => ({
          id: b,
          size: await du(`storage/book/${b}`),
        }));
        let book = 0;
        let unusedBook = 0;
        bookSizes.forEach(({ id, size }) => {
          if (!dbBookIds.includes(id)) {
            unusedBook += size;
          }
          book += size;
        });

        const bookInfoCount = await BookInfoModel.count();

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

  // eslint-disable-next-line class-methods-use-this
  Mutation(): MutationResolvers {
    // noinspection JSUnusedGlobalSymbols
    return {
      debug_deleteUnusedFolders: async () => {
        await fs.rm('storage/cache', { recursive: true, force: true });
        await GraphQL.createFolders();

        const dbBookIds = (await BookModel.findAll({
          attributes: ['id'],
        })).map(({ id }) => id);
        const fsBookIds = await fs.readdir('storage/book');
        await asyncForEach(fsBookIds, async (id) => {
          if (!dbBookIds.includes(id)) {
            return fs.rm(`storage/book/${id}`, { recursive: true, force: true });
          }
          return undefined;
        });

        return {
          success: true,
        };
      },
    };
  }
}

// noinspection JSUnusedGlobalSymbols
export default Debug;
