import { promises as fs } from 'fs';
import path from 'path';
import { Buffer } from 'buffer';

import { orderBy as naturalOrderBy } from 'natural-orderby';
import { extractFull } from 'node-7z';
import { SpanStatusCode } from '@opentelemetry/api';
import { PromisePool } from '@supercharge/promise-pool';

import { Result, Scalars } from '@syuchan1005/book-reader-graphql';
import { defaultStoredImageExtension } from '@syuchan1005/book-reader-common';

import Errors from '@server/Errors';
import { asyncForEach } from '@server/Util';
import { BookDataManager } from '@server/database/BookDataManager';
import {
  readFile,
  StorageDataManager,
  streamToBuffer,
  withTemporaryFolder,
} from '@server/storage/StorageDataManager';
import { convertToDefaultImageType } from '@server/ImageUtil';
import { tracer } from '@server/OpenTelemetry';

const readImageFilePathsRecursively = async (dir, files: string[] = []): Promise<string[]> => {
  const dirents = await fs.readdir(dir, { withFileTypes: true });
  const dirs = [];
  dirents.forEach((dirent) => {
    if (dirent.isDirectory()) dirs.push(`${dir}/${dirent.name}`);
    if (dirent.isFile()) files.push(`${dir}/${dirent.name}`);
  });
  await asyncForEach(dirs, async (d) => {
    // eslint-disable-next-line no-param-reassign
    files = await readImageFilePathsRecursively(d, files);
  });
  return files
    // TODO: Filter node-sharp not supported types only
    .filter(
      (f) => /^(?!.*__MACOSX).*\.(jpe?g|png|webp)$/i.test(f),
    );
};

const GQLUtil = {
  async addBookFromLocalPath(
    tempPath: string,
    infoId: string,
    bookId: string,
    number: string,
    onProgress: (current: number, total: number) => void,
  ): Promise<Result> {
    return tracer.startActiveSpan(
      'GQLUtil.addBookFromLocalPath',
      async (span) => {
        let files = await readImageFilePathsRecursively(tempPath);
        if (files.length <= 0) {
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: 'QL0003',
          });
          span.end();
          return {
            success: false,
            code: 'QL0003',
            message: Errors.QL0003,
          };
        }
        files = naturalOrderBy(files, undefined, undefined, ['_', '.', '!', 'cover']);
        onProgress(0, files.length);
        await PromisePool
          .for(files)
          .withConcurrency(10)
          .onTaskFinished((_, pool) => {
            onProgress(pool.processedCount(), files.length);
          })
          .process(async (f, i) => {
            const imageBuffer = await convertToDefaultImageType(await readFile(f));
            await StorageDataManager.writePage(
              {
                bookId,
                pageNumber: {
                  pageIndex: i,
                  totalPageCount: files.length,
                },
                width: 0,
                height: 0,
                extension: defaultStoredImageExtension,
              },
              imageBuffer,
              false,
            );
          });
        await BookDataManager.addBook({
          id: bookId,
          thumbnailPage: 0,
          number,
          pageCount: files.length,
          infoId,
        });

        span.end();
        return { success: true };
      },
    );
  },
  extractCompressFile(
    tempPath: string,
    archiveFileData: Buffer,
    onProgress: (percent: number) => void,
  ): Promise<unknown> {
    return tracer.startActiveSpan(
      'GQLUtil.extractCompressFile',
      {
        attributes: {
          archiveSize: archiveFileData.length,
        },
      },
      (span) => withTemporaryFolder(async (writeFile) => {
        const filePath = await writeFile('archive.zip', archiveFileData);
        return new Promise((resolve, reject) => {
          const extractStream = extractFull(filePath, tempPath, {
            recursive: true,
            $progress: true,
          });
          extractStream.on('progress', (event) => {
            onProgress(event.percent);
          });
          extractStream.on('error', (err) => {
            span.end();
            reject(err);
          });
          extractStream.on('end', (...args) => {
            span.end();
            resolve(args);
          });
        });
      }),
    );
  },
  async getArchiveFile(
    onProgress: (downloadedBytes: number) => void,
    file?: Scalars['Upload'],
    localPath?: string,
  ): Promise<({ success: false } & Result) | { success: true, data: Buffer }> {
    return tracer.startActiveSpan(
      'GQLUtil.getArchiveFile',
      async (span): Promise<({ success: false } & Result) | { success: true, data: Buffer }> => {
        if (!file && !localPath) {
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: 'QL0012',
          });
          span.end();
          return {
            success: false,
            code: 'QL0012',
            message: Errors.QL0012,
          };
        }

        let buffer: Buffer;
        if (localPath) {
          buffer = await StorageDataManager.getUserStoredArchive(localPath);
          onProgress(0);
        } else if (file) {
          buffer = await streamToBuffer((await file).createReadStream(), onProgress);
        }

        if (!buffer) {
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: 'QL0012',
          });
          span.end();
          return {
            success: false,
            code: 'QL0012',
            message: Errors.QL0012,
          };
        }
        span.end();
        return {
          success: true,
          data: buffer,
        };
      },
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
