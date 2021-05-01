import { promises as fs, createReadStream as fsCreateReadStream } from 'fs';
import os from 'os';
import path from 'path';

import unzipper from 'unzipper';
import { v4 as uuidv4 } from 'uuid';
import rimraf from 'rimraf';
import { createExtractorFromData } from 'node-unrar-js';
import { orderBy as naturalOrderBy } from 'natural-orderby';
import { PubSubEngine } from 'apollo-server-koa';

import {
  BookInfoOrder, InputBook,
  MutationAddBooksArgs,
  Result, Scalars,
} from '@syuchan1005/book-reader-graphql';
import { archiveTypes } from '@syuchan1005/book-reader-common';

import { SubscriptionKeys } from '@server/graphql';
import Errors from '@server/Errors';
import {
  asyncForEach, asyncMap, mkdirpIfNotExists, readdirRecursively, renameFile,
} from '@server/Util';
import Database from '@server/sequelize/models';
import BookModel from '@server/sequelize/models/Book';
import InfoGenreModel from '@server/sequelize/models/InfoGenre';
import BookInfoModel from '@server/sequelize/models/BookInfo';
import GenreModel from '@server/sequelize/models/Genre';
import { OrderItem } from 'sequelize';
import { convertAndSaveJpg } from '../ImageUtil';

const GQLUtil = {
  Mutation: {
    addBooks: async (
      pubsub: PubSubEngine,
      parent,
      {
        id: infoId,
        books,
      }: MutationAddBooksArgs,
      context,
      info,
      customData,
    ): Promise<Result[]> => asyncMap(books,
      (book) => GQLUtil.Mutation.addBook(
        pubsub,
        infoId,
        book,
        context,
        info,
        customData || {
          pubsub: {
            key: SubscriptionKeys.ADD_BOOKS,
            fieldName: 'addBooks',
            id: infoId,
          },
        },
      )),
    addBook: async (
      pubsub: PubSubEngine,
      infoId: string,
      book: InputBook,
      context, info, customData,
    ): Promise<Result> => {
      const bookId = uuidv4();
      if (!await BookInfoModel.hasId(infoId)) {
        return {
          success: false,
          code: 'QL0001',
          message: Errors.QL0001,
        };
      }

      const type = await GQLUtil.checkArchiveType(book.file, book.path);
      if (type.success !== true) {
        return type;
      }
      const { createReadStream, archiveType } = type;

      if (customData) {
        await pubsub.publish(customData.pubsub.key, {
          ...customData.pubsub,
          [customData.pubsub.fieldName]: `Extract Book (${book.number}) ...`,
        });
      }
      // extract
      const tempPath = `${os.tmpdir()}/bookReader/${bookId}`;
      await GQLUtil.extractCompressFile(tempPath, archiveType, createReadStream);
      if (customData) {
        await pubsub.publish(customData.pubsub.key, {
          ...customData.pubsub,
          [customData.pubsub.fieldName]: `Move Book (${book.number}) ...`,
        });
      }
      return GQLUtil.addBookFromLocalPath(
        tempPath,
        infoId,
        bookId,
        book.number,
        (resolve) => {
          rimraf(tempPath, () => resolve());
        },
      );
    },
  },
  async addBookFromLocalPath(
    tempPath: string,
    infoId: string,
    bookId: string,
    number: string,
    deleteTempFolder?: (resolve, reject) => void,
  ): Promise<Result> {
    let files = await readdirRecursively(tempPath).then((fileList) => fileList.filter(
      (f) => /^(?!.*__MACOSX).*\.(jpe?g|png)$/i.test(f),
    ));
    if (files.length <= 0) {
      if (deleteTempFolder) await new Promise(deleteTempFolder);
      return {
        success: false,
        code: 'QL0003',
        message: Errors.QL0003,
      };
    }
    files = naturalOrderBy(
      files.map((s) => s.replace(/cover/g, '!!!!!cover')),
    ).map((s) => s.replace(/!!!!!cover/g, 'cover'));
    const pad = files.length.toString(10).length;
    await fs.mkdir(`storage/book/${bookId}`);
    await asyncForEach(files, async (f, i) => {
      const fileName = `${i.toString().padStart(pad, '0')}.jpg`;
      const dist = `storage/book/${bookId}/${fileName}`;
      if (/\.jpe?g$/i.test(f)) {
        await renameFile(f, dist);
      } else {
        await convertAndSaveJpg(f, dist);
      }
    }).catch((reason) => new Promise((resolve, reject) => {
      if (deleteTempFolder) {
        deleteTempFolder(resolve, () => {
        });
      }
      reject(reason);
    }));
    if (deleteTempFolder) await new Promise(deleteTempFolder);

    const bThumbnail = `/book/${bookId}/${'0'.padStart(pad, '0')}.jpg`;
    await Database.sequelize.transaction(async (transaction) => {
      await BookModel.create({
        id: bookId,
        thumbnail: bThumbnail,
        number,
        pages: files.length,
        infoId,
      }, {
        transaction,
      });
      await BookInfoModel.update({
        // @ts-ignore
        count: Database.sequelize.literal('count + 1'),
      }, {
        where: {
          id: infoId,
        },
        transaction,
      });
      await BookInfoModel.update({
        history: false,
        count: 1,
      }, {
        where: {
          id: infoId,
          history: true,
        },
        transaction,
      });
      await BookInfoModel.update({
        thumbnail: bThumbnail,
      }, {
        where: {
          id: infoId,
          thumbnail: null,
        },
        transaction,
      });
    });
    return {
      success: true,
    };
  },
  async extractCompressFile(
    tempPath: string,
    archiveType: typeof archiveTypes[keyof typeof archiveTypes],
    createReadStream: () => NodeJS.ReadableStream,
  ) {
    if (archiveType === 'zip') {
      await new Promise((resolve) => {
        createReadStream()
          .pipe(unzipper.Extract({ path: tempPath }))
          .on('close', resolve);
      });
    } else if (archiveType === 'rar') {
      const readStream = createReadStream();
      const buffer: Buffer = await new Promise((resolve, reject) => {
        const chunks = [];
        readStream.once('error', (err) => reject(err));
        readStream.once('end', () => resolve(Buffer.concat(chunks)));
        readStream.on('data', (c) => chunks.push(c));
      });

      await new Promise((resolve, reject) => {
        const extractor = createExtractorFromData(buffer);
        // eslint-disable-next-line camelcase
        const [obj_state, obj_header] = extractor.extractAll();
        if (obj_state.state !== 'SUCCESS') {
          reject(new Error('Unrar failed'));
        }
        // eslint-disable-next-line camelcase
        asyncForEach(obj_header.files, async (f) => {
          if (f.fileHeader.flags.directory) return;
          await mkdirpIfNotExists(path.join(tempPath, f.fileHeader.name, '..'));
          await fs.writeFile(path.join(tempPath, f.fileHeader.name), f.extract[1]);
        }).then(resolve);
      });
    }
  },
  async checkArchiveType(file?: Scalars['Upload'], localPath?: string): Promise<({ success: false } & Result) | {
    success: true,
    archiveType: typeof archiveTypes[keyof typeof archiveTypes],
    createReadStream: () => NodeJS.ReadableStream,
  }> {
    if (!file && !path) {
      return {
        success: false,
        code: 'QL0012',
        message: Errors.QL0012,
      };
    }

    let archiveType: typeof archiveTypes[keyof typeof archiveTypes] | undefined;
    let createReadStream: () => NodeJS.ReadableStream;
    if (localPath) {
      archiveType = [...new Set(Object.values(archiveTypes))]
        .find((ext) => localPath.endsWith(`.${ext}`));
      const downloadPath = path.normalize('downloads');
      const normalizeLocalPath = path.normalize(path.join(downloadPath, localPath));
      if (path.relative(downloadPath, normalizeLocalPath).startsWith('../')) {
        return {
          success: false,
          code: 'QL0012',
          message: Errors.QL0012,
        };
      }
      createReadStream = () => fsCreateReadStream(normalizeLocalPath);
    } else if (file) {
      const awaitFile = await file;
      const { mimetype, filename } = awaitFile;
      archiveType = archiveTypes[mimetype];
      if (!archiveType) {
        archiveType = [...new Set(Object.values(archiveTypes))]
          .find((ext) => filename.endsWith(`.${ext}`));
      }
      createReadStream = awaitFile.createReadStream;
    }

    if (!archiveType) {
      return {
        success: false,
        code: 'QL0002',
        message: Errors.QL0002,
      };
    }
    return {
      success: true,
      createReadStream,
      archiveType,
    };
  },
  async searchBookFolders(tempPath: string) {
    let booksFolderPath = '/';
    const bookFolders = [];
    for (let i = 0; i < 10; i += 1) {
      const tempBooksFolder = path.join(tempPath, booksFolderPath);
      // eslint-disable-next-line no-await-in-loop
      const dirents = await fs.readdir(tempBooksFolder, { withFileTypes: true });
      const dirs = dirents.filter((d) => d.isDirectory());
      if (dirs.length > 1) {
        // eslint-disable-next-line no-await-in-loop
        await asyncForEach(dirs, async (d) => {
          const hasMulti = d.name.match(/(\d+)-(\d+)/);
          if (hasMulti) {
            const min = parseInt(hasMulti[1], 10);
            const max = parseInt(hasMulti[2], 10);
            if (min < max) {
              const nestNumbers = [...Array(max - min + 1).keys()].map((index) => index + min);
              const nestFolders = await fs.readdir(
                path.join(tempBooksFolder, d.name), { withFileTypes: true },
              ).then((nestDirs) => nestDirs.filter((a) => a.isDirectory()));
              const folderNumbers = nestFolders.map((f) => {
                const inNums = f.name.match(/\d+/g);
                if (inNums) {
                  return parseInt(inNums[inNums.length - 1], 10);
                }
                return min - 1;
              });
              if (nestNumbers.filter((n) => !folderNumbers.includes(n)).length === 0
                && folderNumbers.filter((n) => !nestNumbers.includes(n)).length === 0) {
                bookFolders.push(...nestFolders.map((f) => path.join(d.name, f.name)));
                return;
              }
            }
          }
          bookFolders.push(d.name);
        });
        break;
      } else if (dirs.length === 1) {
        booksFolderPath = path.join(booksFolderPath, dirs[0].name);
      } else {
        break;
      }
    }
    return {
      booksFolderPath,
      bookFolders,
    };
  },
  async numberingFiles(folderPath: string, pad: number, fileList?: string[], reverse = false) {
    const files = fileList || naturalOrderBy(await fs.readdir(folderPath));
    return asyncMap(files, (f, i) => {
      const dist = `${i.toString(10).padStart(pad, '0')}.jpg`;
      if (dist !== f) {
        return renameFile(`${folderPath}/${f}`, `${folderPath}/${dist}`);
      }
      return Promise.resolve();
    }, reverse);
  },
  bookInfoOrderToOrderBy(order: BookInfoOrder): OrderItem {
    switch (order) {
      case BookInfoOrder.UpdateNewest:
        return ['updatedAt', 'desc'];
      case BookInfoOrder.UpdateOldest:
        return ['updatedAt', 'asc'];
      case BookInfoOrder.AddNewest:
        return ['createdAt', 'asc'];
      case BookInfoOrder.AddOldest:
        return ['createdAt', 'desc'];
      case BookInfoOrder.NameAsc:
        return ['name', 'asc'];
      case BookInfoOrder.NameDesc:
        return ['name', 'desc'];
      default:
        return undefined;
    }
  },
  async linkGenres(infoId: string, genreList: string[]) {
    const dbGenres = (await InfoGenreModel.findAll({
      where: { infoId },
      include: [{
        model: GenreModel,
        as: 'genre',
      }],
    })).map((g) => g.genre);

    const genres = genreList.filter((v) => v);
    const rmGenres = dbGenres.filter((g) => !genres.includes(g.name));
    const addGenres = genres.filter((g) => !dbGenres.find((v) => v.name === g));

    await InfoGenreModel.destroy({
      where: {
        infoId,
        genreId: rmGenres.map((g) => g.id),
      },
    });

    await GenreModel.bulkCreate(addGenres.map((name) => ({
      name,
    })), {
      ignoreDuplicates: true,
    });

    const addedGenres = await GenreModel.findAll({
      attributes: ['id'],
      where: {
        name: addGenres,
      },
    });

    await InfoGenreModel.bulkCreate(addedGenres.map((a) => ({
      infoId,
      genreId: a.id,
    })));
  },
};

export default GQLUtil;