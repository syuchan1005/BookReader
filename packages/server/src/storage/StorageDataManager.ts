import { Buffer } from 'buffer';
import Koa from 'koa';

import { LocalStorageDataManager } from './local';

export interface IStorageDataManager {
  init(): Promise<void>;

  middleware(app: Koa);

  getOriginalPageData(
    metadata: Pick<PageMetadata, 'bookId' | 'pageNumber'>,
  ): Promise<PageData | undefined>;

  getPageData(metadata: PageMetadata): Promise<PageData | undefined>;

  writePage(metadata: PageMetadata, data: Buffer, overwrite: boolean): Promise<void>;
}

export const getContentType = (
  extension: 'jpg' | 'webp',
): 'image/jpeg' | 'image/webp' => (extension === 'jpg' ? 'image/jpeg' : 'image/webp');

export type PageMetadata = {
  bookId: string;
  pageNumber: { pageIndex: number, totalPageCount: number } | string;
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
