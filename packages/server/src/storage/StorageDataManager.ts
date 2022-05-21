import { Buffer } from 'buffer';
import { Stream } from 'stream';
import { promises as fs } from 'fs';
import { join } from 'path';
import os from 'os';

import Koa from 'koa';

import { LocalStorageDataManager } from './local';

export interface IStorageDataManager {
  init(): Promise<void>;

  middleware(app: Koa);

  getOriginalPageData(metadata: PageMetadata): Promise<PageData | undefined>;

  getPageData(metadata: CacheablePageMetadata): Promise<PageData | undefined>;

  writeOriginalPage(metadata: PageMetadata, data: Buffer, overwrite: boolean): Promise<void>;

  writePage(metadata: CacheablePageMetadata, data: Buffer, overwrite: boolean): Promise<void>;

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
    );
  } finally {
    await fs.rm(folderPath, { recursive: true });
  }
  return result;
};

export const { readFile } = fs;

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
