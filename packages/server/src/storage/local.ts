import { promises as fs } from 'fs';
import { Buffer } from 'buffer';
import { join, dirname } from 'path';

import {
  availableImageExtensions,
  availableImageExtensionWithContentType,
  defaultStoredImageExtension,
  optionalImageExtensions,
} from '@syuchan1005/book-reader-common';
import {
  IStorageDataManager,
  PageData,
  CacheablePageMetadata,
  PageMetadata,
} from './StorageDataManager';

const storageBasePath = 'storage';
export const bookFolderPath = join(storageBasePath, 'book');
const cacheFolderPath = join(storageBasePath, 'cache');
const cacheBookFolderName = join(storageBasePath, 'cache', 'book');
const downloadFolderName = join(storageBasePath, 'downloads');
const userDownloadFolderName = 'downloads';

const IgnoreErrorFunc = () => undefined;

type FilePath = {
  path: string,
  isOriginalFolderPath: boolean,
};

export class LocalStorageDataManager implements IStorageDataManager {
  init(): Promise<void> {
    return Promise.all([
      fs.mkdir(bookFolderPath, { recursive: true }),
      fs.mkdir(cacheBookFolderName, { recursive: true }),
      fs.mkdir(downloadFolderName, { recursive: true }),
      fs.mkdir(userDownloadFolderName, { recursive: true }),
    ])
      .then(IgnoreErrorFunc);
  }

  getStaticFolders(): string[] {
    return [storageBasePath, cacheFolderPath];
  }

  async getOriginalPageData({
    bookId,
    pageNumber,
  }: PageMetadata): Promise<PageData | undefined> {
    // eslint-disable-next-line no-restricted-syntax
    for (const extension of [defaultStoredImageExtension, ...optionalImageExtensions]) {
      // eslint-disable-next-line no-await-in-loop
      const pageData = await this.getPageData({
        bookId,
        pageNumber,
        width: 0,
        height: 0,
        extension,
      });

      if (pageData) {
        return pageData;
      }
    }
    return undefined;
  }

  async getPageData(metadata: CacheablePageMetadata): Promise<PageData | undefined> {
    const filePaths = LocalStorageDataManager.getMayExistFilePaths(metadata);
    // eslint-disable-next-line no-restricted-syntax
    for (const filePath of filePaths) {
      // eslint-disable-next-line no-await-in-loop
      const stat = await fs.stat(filePath.path)
        .catch(IgnoreErrorFunc);
      if (!stat?.isFile()) {
        // eslint-disable-next-line no-continue
        continue;
      }

      // eslint-disable-next-line no-await-in-loop
      const data = await fs.readFile(filePath.path)
        .catch(IgnoreErrorFunc);
      if (!data) {
        // eslint-disable-next-line no-continue
        continue;
      }

      return {
        data,
        contentLength: data.byteLength,
        contentExtension: metadata.extension,
        lastModified: stat.mtime,
      };
    }

    return undefined;
  }

  async writePage(
    metadata: CacheablePageMetadata,
    data: Buffer,
    overwrite: boolean,
  ): Promise<void> {
    const filePaths = LocalStorageDataManager.getMayExistFilePaths(metadata);
    const fileExists = await Promise.all(
      filePaths.map(((f) => LocalStorageDataManager.existFile(f.path))),
    );
    if (!overwrite && fileExists.some((e) => e)) {
      return Promise.resolve();
    }
    const preferredIndex = fileExists.indexOf(true);
    const filePath = filePaths[preferredIndex] || filePaths[0];
    await fs.mkdir(dirname(filePath.path), { recursive: true });
    await fs.writeFile(filePath.path, data);
    if (filePath.isOriginalFolderPath) {
      const extensions = availableImageExtensions.filter((e) => e !== metadata.extension);
      await Promise.allSettled(extensions
        .flatMap((e) => LocalStorageDataManager.getMayExistFilePaths({
          ...metadata,
          extension: e,
        })
          .map((f) => fs.rm(f.path, { force: true }))));
    }
    return undefined;
  }

  private static existFile(filePath: string): Promise<boolean> {
    return fs.stat(filePath)
      .then((s) => s.isFile())
      .catch(() => false);
  }

  getUserStoredArchive(fileName: string): Promise<Buffer | undefined> {
    const filePath = join(userDownloadFolderName, fileName);
    return fs.readFile(filePath)
      .catch(IgnoreErrorFunc);
  }

  removeBook(bookId: string, cacheOnly: boolean): Promise<void> {
    const cacheRemovePromise = fs.rm(join(cacheBookFolderName, bookId), {
      recursive: true,
      force: true,
    });
    if (cacheOnly) {
      return cacheRemovePromise;
    }
    return Promise.all([
      cacheRemovePromise,
      fs.rm(join(bookFolderPath, bookId), {
        recursive: true,
        force: true,
      }),
    ])
      .then(IgnoreErrorFunc);
  }

  getStoredBookIds(): Promise<Array<string>> {
    return fs.readdir(bookFolderPath);
  }

  private static getMayExistFilePaths(metadata: CacheablePageMetadata): FilePath[] {
    const pageName = typeof metadata.pageNumber === 'string'
      ? metadata.pageNumber
      : metadata.pageNumber.pageIndex.toString(10)
        .padStart(metadata.pageNumber.totalPageCount.toString(10).length, '0');

    const filePaths: FilePath[] = [];
    const hasNotSizeOption = metadata.width === 0 && metadata.height === 0;
    if (hasNotSizeOption) {
      filePaths.push({
        path: join(bookFolderPath, metadata.bookId, `${pageName}.${metadata.extension}`),
        isOriginalFolderPath: true,
      });
    }

    const sizeSuffix = hasNotSizeOption ? '' : `_${metadata.width}x${metadata.height}`;
    filePaths.push({
      path: join(
        cacheBookFolderName,
        metadata.bookId,
        `${pageName}${sizeSuffix}.${metadata.extension}`,
      ),
      isOriginalFolderPath: false,
    });

    return filePaths;
  }
}
