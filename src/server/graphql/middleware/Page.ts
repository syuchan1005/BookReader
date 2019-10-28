import GQLMiddleware from '@server/graphql/GQLMiddleware';

import { promises as fs } from 'fs';

import { Result } from '@common/GraphqlTypes';
import BookModel from '@server/sequelize/models/book';
import Errors from '../../Errors';
import { asyncMap, renameFile } from '../../Util';

class Page extends GQLMiddleware {
  // eslint-disable-next-line class-methods-use-this
  Mutation() {
    return {
      deletePages: async (parent, { id: bookId, numbers }): Promise<Result> => {
        const book = await BookModel.findOne({ where: { id: bookId } });
        if (!book) {
          return {
            success: false,
            code: 'QL0004',
            message: Errors.QL0004,
          };
        }

        const minNum = Math.min(...numbers);
        const maxNum = Math.max(...numbers);
        if (book.pages < maxNum || minNum < 0) {
          return {
            success: false,
            code: 'QL0007',
            message: Errors.QL0007,
          };
        }

        const bookPath = `storage/book/${bookId}`;
        let pad = book.pages.toString(10).length;
        await Promise.all(numbers
          .map((i) => `${bookPath}/${i.toString(10).padStart(pad, '0')}.jpg`)
          .map((p) => fs.unlink(p)));

        pad = (book.pages - numbers.length).toString(10).length;

        const files = await fs.readdir(bookPath);
        await asyncMap(files, (f, i) => {
          const dist = `${i.toString(10).padStart(pad, '0')}.jpg`;
          if (dist !== f) {
            return renameFile(`${bookPath}/${f}`, `${bookPath}/${dist}`);
          }
          return Promise.resolve();
        });

        await BookModel.update({
          pages: book.pages - numbers.length,
        }, {
          where: {
            id: bookId,
          },
        });

        return {
          success: true,
        };
      },
    };
  }
}

export default Page;
