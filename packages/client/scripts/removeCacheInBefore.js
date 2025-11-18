const path = require('path');
const { promises: fs } = require('fs');

const mkdirpIfNotExists = async (p) => {
  let stat;
  try {
    stat = await fs.stat(p);
  } catch (_e) {
    await fs.mkdir(p, {
      recursive: true,
    });
    return;
  }
  if (!stat.isDirectory()) {
    throw new Error(`${p} is file exists`);
  }
};

const readdirRecursively = async (dir, files) => {
  let fileList = files || [];
  const dirents = await fs.readdir(dir, { withFileTypes: true });
  const dirs = [];
  for (const dirent of dirents) {
    if (dirent.isDirectory()) dirs.push(`${dir}/${dirent.name}`);
    if (dirent.isFile()) fileList.push(`${dir}/${dirent.name}`);
  }
  for (const _dir of dirs) {
    fileList = await readdirRecursively(d, fileList);
  }
  return Promise.resolve(fileList);
};

(async () => {
  const files = await readdirRecursively('./storage');

  const cachableFiles = files
    .filter((s) => s.includes('_200x'))
    .map((s) => [
      s,
      s.replace('/storage', '/storage/cache').replace('_200x', '_200x0'),
    ]);
  for (const file of cachableFiles) {
    await mkdirpIfNotExists(path.join(file[1], '..'));
    await fs.rename(file[0], file[1]);
  }

  console.log('==END==');
})();
