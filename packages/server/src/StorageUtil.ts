import path from 'path';
import { promises as fs, createReadStream, createWriteStream } from 'fs';
import os from 'os';
import du from 'du';

const basePath = 'storage';
const bookFolderName = path.join(basePath, 'book');
const cacheBookFolderName = path.join(basePath, 'cache', 'book');
const downloadFolderName = path.join(basePath, 'downloads');
const userDownloadFolderName = 'downloads';

export const createBookFolderPath = (bookId: string): string => path.join(bookFolderName, bookId);
export const createTemporaryFolderPath = (folderName: string) => path.join(os.tmpdir(), folderName);

export const removeBookCache = async (bookId?: string, page?: number, pages?: number, recreate: boolean = false): Promise<void> => {
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
    await fs.mkdir(bookFolderName, { recursive: true });
    await fs.mkdir(cacheBookFolderName, { recursive: true });
    await fs.mkdir(downloadFolderName, { recursive: true });
    await fs.mkdir(userDownloadFolderName, { recursive: true });
    // `${os.tmp}/bookReader/${bookId|infoId}` processing extracted files.
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

export const getTemporaryFolderSize = (): Promise<number> => du(path.join(os.tmpdir(), 'bookReader')).catch(() => -1);
export const getBookFolderSize = (bookId: string): Promise<number> => du(path.join(bookFolderName, bookId)).catch(() => -1);
export const getCacheFolderSize = (): Promise<number> => du(cacheBookFolderName).catch(() => -1);