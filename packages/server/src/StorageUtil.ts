import path from 'path';
import { promises as fs, createReadStream, createWriteStream } from 'fs';
import { move } from 'fs-extra';
import os from 'os';

export const storageBasePath = 'storage';
export const bookFolderPath = path.join(storageBasePath, 'book');
export const cacheFolderPath = path.join(storageBasePath, 'cache');
export const cacheBookFolderName = path.join(cacheFolderPath, 'book');
const downloadFolderName = path.join(storageBasePath, 'downloads');
export const userDownloadFolderName = 'downloads';

export const createBookFolderPath = (bookId: string): string => path.join(bookFolderPath, bookId);
export const createTemporaryFolderPath = (folderName: string) => path.join(os.tmpdir(), folderName);
export const createDownloadFilePath = (bookId: string) => path.join(downloadFolderName, bookId);
export const createCacheBookPagePath = (
  bookId: string,
  pageNum: string,
  extension: string,
  width?: number,
  height?: number,
) => {
  const sizeSuffix = (!width && !height)
    ? ''
    : `_${Math.ceil(width) || 0}x${Math.ceil(height) || 0}`;
  return `${cacheBookFolderName}/${bookId}/${pageNum}${sizeSuffix}.${extension}`;
};
export const createBookPagePath = (bookId: string, pageNum: string) => `${bookFolderPath}/${bookId}/${pageNum}.jpg`;

export const removeBook = async (bookId: string): Promise<void> => {
  await fs.rm(path.join(cacheBookFolderName, bookId), { recursive: true, force: true });
  await fs.rm(path.join(bookFolderPath, bookId), { recursive: true, force: true });
};

export const removeBookCache = async (
  bookId?: string,
  page?: number,
  pages?: number,
  recreate: boolean = false,
): Promise<void> => {
  const pageFileName = (bookId && page && pages) ? page.toString(10).padStart(pages.toString(10).length, '0') : undefined;
  const folderPath = path.join(cacheBookFolderName, bookId);
  if (pageFileName) {
    const pageFiles = (await fs.readdir(folderPath))
      .filter((f) => f.startsWith(pageFileName) && ['.', '_'].includes(f[pageFileName.length]));
    await Promise.all(pageFiles.map((f) => fs.unlink(path.join(folderPath, f))));
  } else {
    await fs.rm(folderPath, { recursive: true });
    if (!recreate) {
      await fs.mkdir(folderPath, { recursive: true });
    }
  }
};

export const createStorageFolders = async (): Promise<void> => {
  await fs.mkdir(bookFolderPath, { recursive: true });
  await fs.mkdir(cacheBookFolderName, { recursive: true });
  await fs.mkdir(downloadFolderName, { recursive: true });
  await fs.mkdir(userDownloadFolderName, { recursive: true });
  // `${os.tmp}/bookReader/${bookId|infoId}` processing extracted files.
};

export const withPageEditFolder = async <T>(
  bookId: string,
  block: (folderPath: string, replaceNewFiles: () => Promise<void>) => Promise<T>,
): Promise<T> => {
  const oldFolderPath = createBookFolderPath(bookId);
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

export const renameFile = async (srcPath: string, destPath: string, fallback = true) => {
  try {
    await fs.rename(srcPath, destPath);
  } catch (e) {
    if (!e) return;
    if (e.code !== 'EXDEV' || !fallback) throw e;

    const srcStream = createReadStream(srcPath);
    const destStream = createWriteStream(destPath);
    await new Promise((resolve) => {
      destStream.once('close', () => {
        fs.unlink(srcPath).then(resolve);
      });
      srcStream.pipe(destStream);
    });
  }
};
