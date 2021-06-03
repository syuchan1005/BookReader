import { promises as fs } from 'fs';

export const asyncForEach = async <T> (
  arr: Array<T>,
  callback: (item: T, index: number, arr: Array<T>,
) => void) => {
  for (let i = 0; i < arr.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await callback(arr[i], i, arr);
  }
};

export const asyncMap = async <T, E>(
  arr: Array<E>,
  transform: (e: E, index: number, arr: Array<E>) => Promise<T>,
  reversed = false,
): Promise<T[]> => {
  const result = [];
  if (reversed) {
    for (let i = arr.length - 1; i >= 0; i -= 1) {
      // eslint-disable-next-line no-await-in-loop
      result[i] = await transform(arr[i], i, arr);
    }
  } else {
    for (let i = 0; i < arr.length; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      result[i] = await transform(arr[i], i, arr);
    }
  }
  return result;
};

export const readdirRecursively = async (dir, files: string[] = []): Promise<string[]> => {
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
