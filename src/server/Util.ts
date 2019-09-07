// @ts-ignore
import { promises as fs } from 'fs';

export const asyncForEach = async (arr, callback) => {
  for (let i = 0; i < arr.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await callback(arr[i], i, arr);
  }
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
