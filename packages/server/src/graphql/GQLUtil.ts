import { promises as fs, createWriteStream as fsCreateWriteStream } from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';

import { v4 as uuidv4 } from 'uuid';
import { orderBy as naturalOrderBy } from 'natural-orderby';
import { extractFull } from 'node-7z';

import {
  Result,
  Scalars,
} from '@syuchan1005/book-reader-graphql';

import Errors from '@server/Errors';
import { asyncForEach, readdirRecursively } from '@server/Util';
import {
  createDownloadFilePath, renameFile, userDownloadFolderName,
} from '@server/StorageUtil';
import Database from '@server/database/sequelize/models';
import BookModel from '@server/database/sequelize/models/Book';
import InfoGenreModel from '@server/database/sequelize/models/InfoGenre';
import BookInfoModel from '@server/database/sequelize/models/BookInfo';
import GenreModel from '@server/database/sequelize/models/Genre';
import { convertAndSaveJpg } from '../ImageUtil';

const GQLUtil = {
  async addBookFromLocalPath(
    tempPath: string,
    infoId: string,
    bookId: string,
    number: string,
    onProgress: (current: number, total: number) => void,
    deleteTempFolder?: () => Promise<void>,
  ): Promise<Result> {
    let files = await readdirRecursively(tempPath)
      .then((fileList) => fileList.filter(
        (f) => /^(?!.*__MACOSX).*\.(jpe?g|png)$/i.test(f),
      ));
    if (files.length <= 0) {
      if (deleteTempFolder) await deleteTempFolder;
      return {
        success: false,
        code: 'QL0003',
        message: Errors.QL0003,
      };
    }
    files = naturalOrderBy(files, undefined, undefined, ['_', '.', '!', 'cover']);
    const pad = files.length.toString(10).length;
    await fs.mkdir(`storage/book/${bookId}`);
    await asyncForEach(files, async (f, i) => {
      const fileName = `${i.toString()
        .padStart(pad, '0')}.jpg`;
      const dist = `storage/book/${bookId}/${fileName}`;

      onProgress(i + 1, files.length);
      if (/\.jpe?g$/i.test(f)) {
        await renameFile(f, dist);
      } else {
        await convertAndSaveJpg(f, dist);
      }
    })
      .catch(async (reason) => (deleteTempFolder ? deleteTempFolder() : reason));
    if (deleteTempFolder) await deleteTempFolder();

    await Database.sequelize.transaction(async (transaction) => {
      await BookModel.create({
        id: bookId,
        thumbnail: 0,
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
        thumbnail: bookId,
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
  extractCompressFile(
    tempPath: string,
    archiveFilePath: string,
    onProgress: (percent: number) => void,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const extractStream = extractFull(archiveFilePath, tempPath, {
        recursive: true,
        $progress: true,
      });
      extractStream.on('progress', (event) => {
        onProgress(event.percent);
      });
      extractStream.on('error', reject);
      extractStream.on('end', resolve);
    });
  },
  async saveArchiveFile(file?: Scalars['Upload'], localPath?: string): Promise<({ success: false } & Result) | { success: true, archiveFilePath: string }> {
    if (!file && !localPath) {
      return {
        success: false,
        code: 'QL0012',
        message: Errors.QL0012,
      };
    }

    let archiveFilePath: string;
    if (localPath) {
      const downloadPath = userDownloadFolderName;
      const normalizeLocalPath = path.normalize(path.join(downloadPath, localPath));
      const hasPathTraversal = path.relative(downloadPath, normalizeLocalPath).startsWith('../');
      if (hasPathTraversal) {
        return {
          success: false,
          code: 'QL0012',
          message: Errors.QL0012,
        };
      }
      archiveFilePath = path.resolve(normalizeLocalPath);
    } else if (file) {
      const awaitFile = await file;
      archiveFilePath = createDownloadFilePath(uuidv4());
      try {
        await GQLUtil.writeFile(archiveFilePath, awaitFile.createReadStream());
      } catch (e) {
        return {
          success: false,
          code: 'QL0006',
          message: Errors.QL0006,
        };
      }
    }

    return {
      success: true,
      archiveFilePath,
    };
  },
  writeFile(filePath: string, readableStream: NodeJS.ReadableStream): Promise<void> {
    return pipeline(
      readableStream,
      fsCreateWriteStream(filePath),
    );
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
              const nestNumbers = [...Array(max - min + 1).keys()]
                .map((index) => index + min);
              const nestFolders = await fs.readdir(
                path.join(tempBooksFolder, d.name), { withFileTypes: true },
              )
                .then((nestDirs) => nestDirs.filter((a) => a.isDirectory()));
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
};

export default GQLUtil;
