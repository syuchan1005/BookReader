import path from 'path';
import { promises as fs } from 'fs';
import { move } from 'fs-extra';
import os from 'os';

export const storageBasePath = 'storage';
export const bookFolderPath = path.join(storageBasePath, 'book');
export const cacheFolderPath = path.join(storageBasePath, 'cache');
export const cacheBookFolderName = path.join(cacheFolderPath, 'book');

export const createBookFolderPath = (bookId: string): string => path.join(bookFolderPath, bookId);
export const createTemporaryFolderPath = (folderName: string) => path.join(os.tmpdir(), folderName);

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
