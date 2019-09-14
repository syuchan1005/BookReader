// @ts-ignore
import { promises as fs, createReadStream, createWriteStream } from 'fs';

export const asyncForEach = async (arr, callback) => {
  for (let i = 0; i < arr.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await callback(arr[i], i, arr);
  }
};

export const asyncMap = async <T, E>
(arr: Array<E>, transform: (e: E, index: number, arr: Array<E>) => Promise<T>): Promise<T[]> => {
  const result = [];
  for (let i = 0; i < arr.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    result[i] = await transform(arr[i], i, arr);
  }
  return result;
};

export const readdirRecursively = async (dir, files = []) => {
  const dirents = await fs.readdir(dir, { withFileTypes: true });
  const dirs = [];
  dirents.forEach((dirent) => {
    if (dirent.isDirectory()) dirs.push(`${dir}/${dirent.name}`);
    if (dirent.isFile()) files.push(`${dir}/${dirent.name}`);
  });
  await asyncForEach(dirs, async (d) => {
    // eslint-disable-next-line no-param-reassign
    files = await readdirRecursively(d, files);
  });
  return Promise.resolve(files);
};

export const mkdirpIfNotExists = async (path) => {
  let stat;
  try {
    stat = await fs.stat(path);
  } catch (e) {
    await fs.mkdir(path, {
      recursive: true,
    });
    return;
  }
  if (!stat.isDirectory()) {
    throw new Error(`${path} is file exists`);
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
        fs.unlink(srcPath)
          .then(resolve);
      });
      srcStream
        .pipe(destStream);
    });
  }
};
