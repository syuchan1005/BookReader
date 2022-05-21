import { promises as fs } from 'fs';
import { Buffer } from 'buffer';
import { join, dirname } from 'path';

import Koa from 'koa';
import Serve from 'koa-static';

import {
  getContentType, IStorageDataManager, PageData, PageMetadata,
} from './StorageDataManager';

const storageBasePath = 'storage';
const bookFolderPath = join(storageBasePath, 'book');
const cacheFolderPath = join(storageBasePath, 'cache');
const cacheBookFolderName = join(storageBasePath, 'cache', 'book');
const downloadFolderName = join(storageBasePath, 'downloads');
const userDownloadFolderName = 'downloads';

const IgnoreErrorFunc = () => undefined;

export class LocalStorageDataManager implements IStorageDataManager {
  init(): Promise<void> {
    return Promise.all([
      fs.mkdir(bookFolderPath, { recursive: true }),
      fs.mkdir(cacheBookFolderName, { recursive: true }),
      fs.mkdir(downloadFolderName, { recursive: true }),
      fs.mkdir(userDownloadFolderName, { recursive: true }),
    ]).then(() => {});
  }

  middleware(app: Koa) {
    app.use(Serve(storageBasePath));
    app.use(Serve(cacheFolderPath));
  }

  getOriginalPageData(
    { bookId, pageNumber }: Pick<PageMetadata, 'bookId' | 'pageNumber'>,
  ): Promise<PageData | undefined> {
    return this.getPageData({
      bookId,
      pageNumber,
      width: 0,
      height: 0,
      extension: 'jpg',
    });
  }

  async getPageData(metadata: PageMetadata): Promise<PageData | undefined> {
    const filePath = LocalStorageDataManager.toFilePath(metadata);
    const stat = await fs.stat(filePath).catch(() => undefined);
    if (!stat?.isFile()) {
      return undefined;
    }

    const data = await fs.readFile(filePath).catch(IgnoreErrorFunc);
    if (!data) {
      return undefined;
    }

    return {
      data,
      contentLength: data.byteLength,
      contentType: getContentType(metadata.extension),
      lastModified: stat.mtime,
    };
  }

  async writePage(metadata: PageMetadata, data: Buffer, overwrite: boolean): Promise<void> {
    const filePath = LocalStorageDataManager.toFilePath(metadata);
    if (!overwrite && (await LocalStorageDataManager.existFile(filePath))) {
      return Promise.resolve();
    }
    await fs.mkdir(dirname(filePath), { recursive: true });
    return fs.writeFile(filePath, data);
  }

  private static existFile(filePath: string): Promise<boolean> {
    return fs.stat(filePath).then((s) => s.isFile()).catch(() => false);
  }

  private static toFilePath(metadata: PageMetadata): string {
    const pageName = typeof metadata.pageNumber === 'string'
      ? metadata.pageNumber
      : metadata.pageNumber.pageIndex.toString(10)
        .padStart(metadata.pageNumber.totalPageCount.toString(10).length, '0');

    if (LocalStorageDataManager.isCachePageMetadata(metadata)) {
      return join(bookFolderPath, metadata.bookId, `${pageName}.${metadata.extension}`);
    }

    const sizeSuffix = metadata.width === 0 && metadata.height === 0
      ? ''
      : `_${metadata.width}x${metadata.height}`;
    return join(
      cacheBookFolderName,
      metadata.bookId,
      `${pageName}${sizeSuffix}.${metadata.extension}`,
    );
  }

  private static isCachePageMetadata(metadata: PageMetadata): boolean {
    return metadata.extension === 'jpg'
      && metadata.width === 0
      && metadata.height === 0;
  }
}
