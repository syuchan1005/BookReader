import GQLMiddleware from '@server/graphql/GQLMiddleware';

import os from 'os';
import { promises as fs } from 'fs';

import du from 'du';
import rimraf from 'rimraf';

import BookModel from '@server/sequelize/models/book';
import { asyncForEach, asyncMap } from '@server/Util';
import { DebugFolderSizes, Result } from '@common/GraphqlTypes';
import GraphQL from '../index';

class Debug extends GQLMiddleware {
  // eslint-disable-next-line class-methods-use-this
  Query() {
    return {
      debug_folderSize: async (): Promise<DebugFolderSizes> => {
        let tmp = 0;
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

        return {
          tmp,
          cache,
          book,
          unusedBook,
        };
      },
    };
  }

  // eslint-disable-next-line class-methods-use-this
  Mutation() {
    return {
      debug_deleteUnusedFolders: async (): Promise<Result> => {
        const rmdir = (p) => new Promise((resolve) => rimraf(p, resolve));
        await rmdir('storage/cache');
        await GraphQL.createFolders();

        const dbBookIds = (await BookModel.findAll({
          attributes: ['id'],
        })).map(({ id }) => id);
        const fsBookIds = await fs.readdir('storage/book');
        await asyncForEach(fsBookIds, async (id) => {
          if (!dbBookIds.includes(id)) {
            return rmdir(`storage/book/${id}`);
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

export default Debug;
