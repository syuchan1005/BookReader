/* eslint-disable no-console */
const path = require('path');
const { promises: fs } = require('fs');

const mkdirpIfNotExists = async (p) => {
  let stat;
  try {
    stat = await fs.stat(p);
  } catch (e) {
    await fs.mkdir(p, {
      recursive: true,
    });
    return;
  }
  if (!stat.isDirectory()) {
    throw new Error(`${p} is file exists`);
  }
};

const asyncForEach = async (arr, callback) => {
  for (let i = 0; i < arr.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await callback(arr[i], i, arr);
  }
};

const readdirRecursively = async (dir, files = []) => {
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

(async () => {
  const files = await readdirRecursively('./storage');

  await asyncForEach(files.filter((s) => s.includes('_200x'))
    .map((s) => [s, s.replace('/storage', '/storage/cache').replace('_200x', '_200x0')]), async (s) => {
    await mkdirpIfNotExists(path.join(s[1], '..'));
    await fs.rename(s[0], s[1]);
  });

  console.log('==END==');
})();
