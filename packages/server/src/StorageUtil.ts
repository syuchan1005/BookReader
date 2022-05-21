import path from 'path';
import os from 'os';

export const storageBasePath = 'storage';
export const bookFolderPath = path.join(storageBasePath, 'book');

export const createBookFolderPath = (bookId: string): string => path.join(bookFolderPath, bookId);
export const createTemporaryFolderPath = (folderName: string) => path.join(os.tmpdir(), folderName);
