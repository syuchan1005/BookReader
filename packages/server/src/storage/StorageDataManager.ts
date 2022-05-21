import { Buffer } from 'buffer';
import { Stream } from 'stream';
import { promises as fs } from 'fs';
import { join } from 'path';
import os from 'os';

import Koa from 'koa';
import { move } from 'fs-extra';

import { LocalStorageDataManager, bookFolderPath } from './local';

export interface IStorageDataManager {
  init(): Promise<void>;

  middleware(app: Koa);

  getOriginalPageData(metadata: PageMetadata): Promise<PageData | undefined>;

  getPageData(metadata: CacheablePageMetadata): Promise<PageData | undefined>;

  writeOriginalPage(metadata: PageMetadata, data: Buffer, overwrite: boolean): Promise<void>;

  writePage(metadata: CacheablePageMetadata, data: Buffer, overwrite: boolean): Promise<void>;

  removeBook(bookId: string, cacheOnly: boolean): Promise<void>;

  getStoredBookIds(): Promise<Array<string>>;

  getUserStoredArchive(fileName: string): Promise<Buffer | undefined>;
}

export const getContentType = (
  extension: 'jpg' | 'webp',
): 'image/jpeg' | 'image/webp' => (extension === 'jpg' ? 'image/jpeg' : 'image/webp');

export const streamToBuffer = (stream: Stream): Promise<Buffer> => new Promise(
  (resolve, reject) => {
    const buffer = [];
    stream.on('data', (chunk) => buffer.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(buffer)));
    stream.on('error', reject);
  },
);

export const withTemporaryFolder = async <T>(
  block: (
    writeFile: (fileName: string, data: Buffer) => Promise<string>,
    folderPath: string,
  ) => Promise<T>,
) => {
  let folderPath: string;
  let result: T;
  try {
    folderPath = await fs.mkdtemp(join(os.tmpdir(), 'book-reader'));
    result = await block(
      async (f, d) => {
        const filePath = join(folderPath, f);
        await fs.writeFile(filePath, d);
        return filePath;
      },
      folderPath,
    );
  } finally {
    await fs.rm(folderPath, { recursive: true, force: true });
  }
  return result;
};

export const withPageEditFolder = async <T>(
  bookId: string,
  block: (folderPath: string, replaceNewFiles: () => Promise<void>) => Promise<T>,
): Promise<T> => {
  const oldFolderPath = join(bookFolderPath, bookId);
  const folderPath = `${oldFolderPath}_new`;
  await fs.mkdir(folderPath, { recursive: true });
  const replaceNewFiles = async () => {
    await fs.rm(oldFolderPath, { recursive: true });
    await move(folderPath, oldFolderPath, { overwrite: true });
  };
  let result;
  let error;
  try {
    result = await block(folderPath, replaceNewFiles);
  } catch (e) {
    error = e;
  } finally {
    for (let i = 0; i < 4; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => { setTimeout(resolve, 1500); });
      try {
        // eslint-disable-next-line no-await-in-loop
        await fs.rm(folderPath, { recursive: true, force: true });
        break;
      } catch (ignored) { /* ignored */ }
    }
  }
  if (error) {
    throw error;
  } else {
    return result;
  }
};

export const { readFile, writeFile } = fs;

export type PageMetadata = {
  bookId: string;
  pageNumber: { pageIndex: number, totalPageCount: number } | string;
};

export type CacheablePageMetadata = PageMetadata & {
  width: number; /* 0 = auto */
  height: number; /* 0 = auto */
  extension: 'jpg' | 'webp';
};

export type PageData = {
  data: Buffer;
  contentLength: number;
  contentType: 'image/jpeg' | 'image/webp';
  lastModified: Date;
};

export const StorageDataManager: IStorageDataManager = new LocalStorageDataManager();
