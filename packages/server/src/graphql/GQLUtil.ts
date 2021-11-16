import { promises as fs } from 'fs';
import path from 'path';

import { generateId } from '@server/database/models/Id';
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
import { BookDataManager } from '@server/database/BookDataManager';
import { Span, startSpan } from '@server/open-telemetry';
import { convertAndSaveJpg } from '../ImageUtil';

const GQLUtil = {
  async addBookFromLocalPath(
    tempPath: string,
    infoId: string,
    bookId: string,
    number: string,
    onProgress: (current: number, total: number) => void,
    deleteTempFolder?: () => Promise<void>,
    parentSpan?: Span,
  ): Promise<Result> {
    const span = startSpan(parentSpan, 'addBookFromLocalPath');
    let files = await readdirRecursively(tempPath)
      .then((fileList) => fileList.filter(
        (f) => /^(?!.*__MACOSX).*\.(jpe?g|png)$/i.test(f),
      ));
    if (files.length <= 0) {
      span?.end();
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
    let renamedFiles = 0;
    let convertedFiles = 0;
    await asyncForEach(files, async (f, i) => {
      const fileName = `${i.toString()
        .padStart(pad, '0')}.jpg`;
      const dist = `storage/book/${bookId}/${fileName}`;

      onProgress(i + 1, files.length);
      if (/\.jpe?g$/i.test(f)) {
        renamedFiles += 1;
        await renameFile(f, dist);
      } else {
        convertedFiles += 1;
        await convertAndSaveJpg(f, dist);
      }
    })
      .catch(async (reason) => {
        span?.end();
        return (deleteTempFolder ? deleteTempFolder() : reason);
      });
    span?.setAttribute('files.count', files.length);
    span?.setAttribute('files.renamed', renamedFiles);
    span?.setAttribute('files.converted', convertedFiles);
    if (deleteTempFolder) await deleteTempFolder();

    await BookDataManager.addBook({
      id: bookId,
      thumbnailPage: 0,
      number,
      pageCount: files.length,
      infoId,
    });
    span?.end();
    return {
      success: true,
    };
  },
  extractCompressFile(
    tempPath: string,
    archiveFilePath: string,
    onProgress: (percent: number) => void,
    parentSpan?: Span,
  ): Promise<void> {
    const span = startSpan(parentSpan, 'extractCompressFile');
    return new Promise((resolve, reject) => {
      const extractStream = extractFull(archiveFilePath, tempPath, {
        recursive: true,
        $progress: true,
      });
      extractStream.on('progress', (event) => {
        onProgress(event.percent);
      });
      extractStream.on('error', (...args) => {
        span?.end();
        // eslint-disable-next-line prefer-promise-reject-errors
        reject(...args);
      });
      extractStream.on('end', (...args) => {
        span?.end();
        resolve(...args);
      });
    });
  },
  async saveArchiveFile(
    file?: Scalars['Upload'],
    localPath?: string,
    parentSpan?: Span,
  ): Promise<({ success: false } & Result) | { success: true, archiveFilePath: string }> {
    const span = startSpan(parentSpan, 'saveArchiveFile');
    if (!file && !localPath) {
      span?.end();
      return {
        success: false,
        code: 'QL0012',
        message: Errors.QL0012,
      };
    }

    let archiveFilePath: string;
    if (localPath) {
      span?.setAttribute('type', 'local');
      const downloadPath = userDownloadFolderName;
      const normalizeLocalPath = path.normalize(path.join(downloadPath, localPath));
      const hasPathTraversal = path.relative(downloadPath, normalizeLocalPath)
        .startsWith('../');
      if (hasPathTraversal) {
        span?.end();
        return {
          success: false,
          code: 'QL0012',
          message: Errors.QL0012,
        };
      }
      archiveFilePath = path.resolve(normalizeLocalPath);
    } else if (file) {
      span?.setAttribute('type', 'download');
      const awaitFile = await file;
      archiveFilePath = createDownloadFilePath(generateId());
      try {
        await fs.writeFile(archiveFilePath, awaitFile.createReadStream());
      } catch (e) {
        span?.end();
        return {
          success: false,
          code: 'QL0006',
          message: Errors.QL0006,
        };
      }
    }
    if (span) {
      const stat = await fs.stat(archiveFilePath).catch(() => undefined);
      span?.setAttribute('bytes', stat?.size);
    }
    span?.end();

    return {
      success: true,
      archiveFilePath,
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
