import { promises as fs } from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Readable } from 'stream';

import * as unzipper from 'unzipper';
import * as uuidv4 from 'uuid/v4';
import * as rimraf from 'rimraf';
import { createExtractorFromData } from 'node-unrar-js';
import { orderBy as naturalOrderBy } from 'natural-orderby';
import { SubClass } from 'gm';
import { PubSub } from 'apollo-server-koa';

import { Result } from '@common/GraphqlTypes';
import { archiveTypes } from '@common/Common';

import { SubscriptionKeys } from '@server/graphql';
import BookInfoModel from '@server/sequelize/models/bookInfo';
import Errors from '@server/Errors';
import {
  asyncForEach, asyncMap, mkdirpIfNotExists, readdirRecursively, renameFile,
} from '@server/Util';
import Database from '@server/sequelize/models';
import BookModel from '@server/sequelize/models/book';

const GQLUtil = {
  Mutation: {
    addBook: async (gm: SubClass, pubsub: PubSub, parent, {
      id: infoId,
      number,
      file,
      thumbnail,
    }, context, info, customData): Promise<Result> => {
      const bookId = uuidv4();
      if (!await BookInfoModel.hasId(infoId)) {
        return {
          success: false,
          code: 'QL0001',
          message: Errors.QL0001,
        };
      }
      let argThumbnail;
      if (thumbnail) {
        const { stream, mimetype } = await thumbnail;
        if (!mimetype.startsWith('image/jpeg')) {
          return {
            success: false,
            code: 'QL0000',
            message: Errors.QL0000,
          };
        }
        await fs.writeFile(`storage/book/${bookId}/thumbnail.jpg`, stream);
        argThumbnail = `/book/${bookId}/thumbnail.jpg`;
      }

      const type = await GQLUtil.checkArchiveType(file);
      if (type.success === false) {
        return type;
      }
      const { createReadStream, archiveType } = type;

      if (customData) {
        await pubsub.publish(customData.pubsub.key, {
          ...customData.pubsub,
          [customData.pubsub.fieldName]: 'Extract Book...',
        });
      }
      // extract
      const tempPath = `${os.tmpdir()}/bookReader/${bookId}`;
      await GQLUtil.extractCompressFile(tempPath, archiveType, createReadStream);
      if (customData) {
        await pubsub.publish(customData.pubsub.key, {
          ...customData.pubsub,
          [customData.pubsub.fieldName]: 'Move Book...',
        });
      }
      return GQLUtil.addBookFromLocalPath(
        gm,
        tempPath,
        infoId,
        bookId,
        number,
        argThumbnail,
        (resolve) => {
          rimraf(tempPath, () => resolve());
        },
      );
    },
    addBooks: async (gm: SubClass, pubsub: PubSub, parent, {
      id: infoId,
      books,
    }, context, info, customData): Promise<Result[]> => asyncMap(books,
      ({ number, file }) => GQLUtil.Mutation.addBook(gm, pubsub, parent, {
        id: infoId,
        number,
        file,
        thumbnail: null,
      }, context, info, customData || {
        pubsub: {
          key: SubscriptionKeys.ADD_BOOKS,
          fieldName: 'addBooks',
          id: infoId,
        },
      })),
  },
  async addBookFromLocalPath(
    gm: SubClass,
    tempPath: string,
    infoId: string,
    bookId: string,
    number: string,
    argThumbnail?: string,
    deleteTempFolder?: (resolve, reject) => void,
  ) {
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
      files,
      [(v: string) => v.substring(0, v.length - path.extname(v).length)],
      [(a, b) => {
        const iA = a.includes('cover');
        const iB = b.includes('cover');
        if (iA && iB) return 0;
        if (iA) return -1;
        if (iB) return 1;
        return 0;
      }],
    );
    const pad = files.length.toString(10).length;
    await fs.mkdir(`storage/book/${bookId}`);
    await asyncForEach(files, async (f, i) => {
      const fileName = `${i.toString().padStart(pad, '0')}.jpg`;
      const dist = `storage/book/${bookId}/${fileName}`;
      if (/\.jpe?g$/i.test(f)) {
        await renameFile(f, dist);
      } else {
        await new Promise((resolve) => {
          gm(f)
            .quality(85)
            .write(dist, resolve);
        });
      }
    });
    if (deleteTempFolder) await new Promise(deleteTempFolder);

    const bThumbnail = `/book/${bookId}/${'0'.padStart(pad, '0')}.jpg`;
    await Database.sequelize.transaction(async (transaction) => {
      await BookModel.create({
        id: bookId,
        thumbnail: argThumbnail || bThumbnail,
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
        thumbnail: argThumbnail || bThumbnail,
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
  async extractCompressFile(tempPath, archiveType: string, createReadStream: () => Readable) {
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
  async checkArchiveType(file) {
    const awaitFile = await file;
    const { mimetype, filename } = awaitFile;
    let archiveType = archiveTypes[mimetype];
    if (!archiveType) {
      archiveType = [...new Set(Object.values(archiveTypes))]
        .find((ext) => filename.endsWith(`.${ext}`));
    }
    if (!archiveType) {
      return {
        success: false,
        code: 'QL0002',
        message: Errors.QL0002,
      };
    }
    return {
      ...awaitFile,
      archiveType,
    };
  },
};

export default GQLUtil;