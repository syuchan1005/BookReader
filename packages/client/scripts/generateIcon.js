/* eslint-disable no-console */
const { execSync } = require('child_process');

[
  '16',
  '32',
  '48',
  '72',
  '120',
  '144',
  '152',
  '192',
  '512',
].forEach((size) => {
  console.log(`==x${size}.png==`);
  execSync(`inkscape -z -e ./public/icons/x${size}.png -w ${size} -h ${size} ./public/icons/icon.svg`);
});
console.log('==END==');
