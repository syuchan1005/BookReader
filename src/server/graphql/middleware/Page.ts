import GQLMiddleware from '@server/graphql/GQLMiddleware';

import { createWriteStream, promises as fs } from 'fs';
import { orderBy } from 'natural-orderby';
import rimraf from 'rimraf';

import { MutationResolvers, SplitType } from '@common/GQLTypes';
import BookModel from '@server/sequelize/models/Book';
import { asyncForEach, removeBookCache, renameFile } from '@server/Util';
import Errors from '@server/Errors';

import GQLUtil from '../GQLUtil';
import { flatRange } from '../scalar/IntRange';
import { splitImage } from '../../ImageUtil';

class Page extends GQLMiddleware {
  // eslint-disable-next-line class-methods-use-this
  Mutation(): MutationResolvers {
    // noinspection JSUnusedGlobalSymbols
    return {
      deletePages: async (parent, { id: bookId, pages }) => {
        const numbers = flatRange(pages);
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

        await GQLUtil.numberingFiles(bookPath, pad);
        await new Promise((resolve) => {
          rimraf(`storage/cache/book/${book.id}`, () => resolve());
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
      splitPages: async (parent, { id: bookId, pages, type }) => {
        const numbers = flatRange(pages);
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
        let files = await fs.readdir(bookPath);
        let pageCount = 0;
        await asyncForEach(orderBy(files), async (f, i) => {
          if (!numbers.includes(i)) {
            pageCount += 1;
            return;
          }

          await splitImage(`${bookPath}.${f}`, type === SplitType.Vertical ? 'vertical' : 'horizontal');
          await fs.unlink(`${bookPath}/${f}`);
          pageCount += 2;
        });

        files = orderBy((await fs.readdir(bookPath)), [
          (v) => Number(v.match(/\d+/g)[0]),
          (v) => Number(v.match(/\d+/g)[1]) + 1 || 0,
        ], ['asc', 'desc']);
        await GQLUtil.numberingFiles(bookPath, pageCount.toString(10).length, files);
        await new Promise((resolve) => {
          rimraf(`storage/cache/book/${book.id}`, () => resolve());
        });

        await BookModel.update({
          pages: pageCount,
        }, {
          where: {
            id: bookId,
          },
        });

        return {
          success: true,
        };
      },
      editPage: async (parent, { id: bookId, page, image }) => {
        const book = await BookModel.findOne({ where: { id: bookId } });
        if (!book) {
          return {
            success: false,
            code: 'QL0004',
            message: Errors.QL0004,
          };
        }
        if (page < 0 || page >= book.pages) {
          return {
            success: false,
            code: 'QL0007',
            message: Errors.QL0007,
          };
        }

        const { createReadStream, mimetype } = await image;
        if (!mimetype.startsWith('image/jpeg')) {
          return {
            success: false,
            code: 'QL0000',
            message: Errors.QL0000,
          };
        }

        await new Promise((resolve) => {
          const wStream = createWriteStream(`storage/book/${bookId}/${page.toString(10).padStart(book.pages.toString(10).length, '0')}.jpg`, { flags: 'w' });
          const rStream = createReadStream();
          rStream.pipe(wStream);
          wStream.on('close', resolve);
        });
        await removeBookCache(bookId, page, book.pages);

        return {
          success: true,
        };
      },
      putPage: async (parent, { id: bookId, beforePage, image }) => {
        const book = await BookModel.findOne({ where: { id: bookId } });
        if (!book) {
          return {
            success: false,
            code: 'QL0004',
            message: Errors.QL0004,
          };
        }

        if (beforePage < -1 || beforePage >= book.pages) {
          return {
            success: false,
            code: 'QL0007',
            message: Errors.QL0007,
          };
        }
        const bookPath = `storage/book/${bookId}`;
        const pad = book.pages.toString(10).length;

        const { createReadStream, mimetype } = await image;
        if (!mimetype.startsWith('image/jpeg')) {
          return {
            success: false,
            code: 'QL0000',
            message: Errors.QL0000,
          };
        }

        if (beforePage === -1) {
          await renameFile(
            `${bookPath}/${'0'.repeat(pad)}.jpg`,
            `${bookPath}/${'0'.repeat(pad)}-1.jpg`,
          );
          await new Promise((resolve) => {
            const wStream = createWriteStream(`${bookPath}/${'0'.repeat(pad)}-0.jpg`, { flags: 'w' });
            const rStream = createReadStream();
            rStream.pipe(wStream);
            wStream.on('close', resolve);
          });
        } else if (beforePage === book.pages) {
          await new Promise((resolve) => {
            const wStream = createWriteStream(`${bookPath}/${beforePage.toString(10).padStart(pad, '0')}.jpg`, { flags: 'w' });
            const rStream = createReadStream();
            rStream.pipe(wStream);
            wStream.on('close', resolve);
          });
        } else {
          await renameFile(
            `${bookPath}/${beforePage.toString(10).padStart(pad, '0')}.jpg`,
            `${bookPath}/${beforePage.toString(10).padStart(pad, '0')}-0.jpg`,
          );

          await new Promise((resolve) => {
            const wStream = createWriteStream(`${bookPath}/${beforePage.toString(10).padStart(pad, '0')}-1.jpg`, { flags: 'w' });
            const rStream = createReadStream();
            rStream.pipe(wStream);
            wStream.on('close', resolve);
          });
        }

        if (beforePage !== book.pages) {
          const files = orderBy((await fs.readdir(bookPath)), [
            (v) => Number(v.match(/\d+/g)[0]),
            (v) => Number(v.match(/\d+/g)[1]) + 1 || 0,
          ], ['asc', 'asc']);
          await GQLUtil.numberingFiles(bookPath, (book.pages + 1).toString(10).length, files, true);
          await new Promise((resolve) => {
            rimraf(`storage/cache/book/${book.id}`, () => resolve());
          });
        }

        await BookModel.update({
          pages: book.pages + 1,
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

// noinspection JSUnusedGlobalSymbols
export default Page;
