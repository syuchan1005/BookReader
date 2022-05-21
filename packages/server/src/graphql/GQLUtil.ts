import { promises as fs } from 'fs';
import path from 'path';
import { Buffer } from 'buffer';

import { orderBy as naturalOrderBy } from 'natural-orderby';
import { extractFull } from 'node-7z';

import {
  Result,
  Scalars,
} from '@syuchan1005/book-reader-graphql';

import Errors from '@server/Errors';
import { asyncForEach, readdirRecursively } from '@server/Util';
import { BookDataManager } from '@server/database/BookDataManager';
import {
  readFile,
  StorageDataManager,
  streamToBuffer,
  withTemporaryFolder,
} from '@server/storage/StorageDataManager';
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
    let count = 0;
    onProgress(count, files.length);
    const promises = files.map(async (f, i) => {
      const fileName = `${i.toString().padStart(pad, '0')}.jpg`;
      const dist = `storage/book/${bookId}/${fileName}`;

      if (/\.jpe?g$/i.test(f)) {
        await StorageDataManager.writeOriginalPage(
          {
            bookId,
            pageNumber: {
              pageIndex: i,
              totalPageCount: files.length,
            },
          },
          await readFile(f),
          false,
        );
      } else {
        await convertAndSaveJpg(f, dist);
      }
      count += 1;
      onProgress(count, files.length);
    });
    await Promise.all(promises)
      .catch(async (reason) => (deleteTempFolder ? deleteTempFolder() : reason));
    if (deleteTempFolder) await deleteTempFolder();

    await BookDataManager.addBook({
      id: bookId,
      thumbnailPage: 0,
      number,
      pageCount: files.length,
      infoId,
    });
    return {
      success: true,
    };
  },
  extractCompressFile(
    tempPath: string,
    archiveFileData: Buffer,
    onProgress: (percent: number) => void,
  ): Promise<void> {
    return withTemporaryFolder(async (writeFile) => {
      const filePath = await writeFile('archive.zip', archiveFileData);
      return new Promise((resolve, reject) => {
        const extractStream = extractFull(filePath, tempPath, {
          recursive: true,
          $progress: true,
        });
        extractStream.on('progress', (event) => {
          onProgress(event.percent);
        });
        extractStream.on('error', reject);
        extractStream.on('end', (...args) => {
          resolve(...args);
        });
      });
    });
  },
  async getArchiveFile(
    file?: Scalars['Upload'],
    localPath?: string,
  ): Promise<({ success: false } & Result) | { success: true, data: Buffer }> {
    if (!file && !localPath) {
      return {
        success: false,
        code: 'QL0012',
        message: Errors.QL0012,
      };
    }

    let buffer: Buffer;
    if (localPath) {
      buffer = await StorageDataManager.getUserStoredArchive(localPath);
    } else if (file) {
      buffer = await streamToBuffer((await file).createReadStream());
    }

    if (!buffer) {
      return {
        success: false,
        code: 'QL0012',
        message: Errors.QL0012,
      };
    }
    return {
      success: true,
      data: buffer,
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
              const nestNumbers = [...Array(max - min + 1)
                .keys()]
                .map((index) => index + min);
              const nestFolders = await fs.readdir(
                path.join(tempBooksFolder, d.name),
                { withFileTypes: true },
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
