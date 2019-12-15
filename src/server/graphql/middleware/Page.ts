import GQLMiddleware from '@server/graphql/GQLMiddleware';

import { createWriteStream, promises as fs } from 'fs';
import { orderBy } from 'natural-orderby';

import { Result } from '@common/GraphqlTypes';
import BookModel from '@server/sequelize/models/Book';
import { asyncForEach, removeBookCache, renameFile } from '@server/Util';
import Errors from '@server/Errors';

import GQLUtil from '../GQLUtil';
import { flatRange } from '../scalar/IntRange';

class Page extends GQLMiddleware {
  // eslint-disable-next-line class-methods-use-this
  Mutation() {
    return {
      deletePages: async (parent, { id: bookId, pages }): Promise<Result> => {
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
      splitPages: async (parent, { id: bookId, pages, type }): Promise<Result> => {
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

        const cropOption = type === 'VERTICAL' ? '2x1@' : '1x2@';
        const bookPath = `storage/book/${bookId}`;
        let files = await fs.readdir(bookPath);
        let pageCount = 0;
        await asyncForEach(orderBy(files), async (f, i) => {
          if (!numbers.includes(i)) {
            pageCount += 1;
            return;
          }

          if (this.useIM) {
            await new Promise((resolve, reject) => {
              this.gm(`${bookPath}/${f}`)
                .out('-crop', cropOption)
                .repage('+')
                .write(`${bookPath}/${f.replace('.jpg', '-%d.jpg')}`, (err) => {
                  if (err) reject(err);
                  else {
                    fs.unlink(`${bookPath}/${f}`)
                      .then(() => {
                        pageCount += 2;
                        resolve();
                      });
                  }
                });
            });
          } else {
            const size = await new Promise<{ width: number, height: number }>((resolve, reject) => {
              this.gm(`${bookPath}/${f}`)
                .size((err, s) => {
                  if (err) reject(err);
                  else resolve(s);
                });
            });

            const crops = type === 'VERTICAL' ? [
              [size.width / 2, size.height, 0, 0],
              [size.width / 2, size.height, size.width / 2, 0],
            ] : [
              [size.width, size.height / 2, 0, 0],
              [size.width, size.height / 2, 0, size.height / 2],
            ];

            await asyncForEach(crops, (crop, fileIndex) => new Promise((resolve, reject) => {
              this.gm(`${bookPath}/${f}`)
                // @ts-ignore
                .crop(...crop)
                .write(`${bookPath}/${f.replace('.jpg', `-${fileIndex}.jpg`)}`, (err) => {
                  if (err) reject(err);
                  else {
                    pageCount += 1;
                    resolve();
                  }
                });
            }));

            await fs.unlink(`${bookPath}/${f}`);
          }
        });

        files = orderBy((await fs.readdir(bookPath)), [
          (v) => Number(v.match(/\d+/g)[0]),
          (v) => Number(v.match(/\d+/g)[1]) + 1 || 0,
        ], ['asc', 'desc']);
        await GQLUtil.numberingFiles(bookPath, pageCount.toString(10).length, files);

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
      editPage: async (parent, { id: bookId, page, image }): Promise<Result> => {
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
      putPage: async (parent, { id: bookId, beforePage, image }): Promise<Result> => {
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
            const wStream = createWriteStream(`${bookPath}/${beforePage.toString(10).padStart(pad, '0')}-0.jpg`, { flags: 'w' });
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
            `${beforePage}/${beforePage.toString(10).padStart(pad, '0')}.jpg`,
            `${beforePage}/${beforePage.toString(10).padStart(pad, '0')}-0.jpg`,
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
          ], ['asc', 'desc']);
          await GQLUtil.numberingFiles(bookPath, (book.pages + 1).toString(10).length, files);
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

export default Page;
