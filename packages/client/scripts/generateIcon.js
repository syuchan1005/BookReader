/* eslint-disable no-console */
const { promises: fs } = require('fs');
const { join } = require('path');

const sharp = require('sharp');
const pngToIco = require('png-to-ico');

const publicPath = join(__dirname, '..', 'public');
const iconsPath = join(publicPath, 'icons');
const baseSvgPath = join(iconsPath, 'icon.svg');

const sizes = [
  16,
  32,
  48,
  72,
  120,
  144,
  152,
  192,
  512,
];

const createIconPngPath = (size) => join(iconsPath, `x${size}.png`);

let count = 0;
const promises = sizes.map(async (size) => {
  await sharp(baseSvgPath)
    .resize(size)
    .png()
    .toFile(createIconPngPath(size));
  count += 1;
  console.log(`${count} / ${sizes.length}`);
});

(async () => {
  await Promise.all(promises);

  console.log('==FAVICON==');
  const icoBuffer = await pngToIco(sizes.slice(0, 3).map(createIconPngPath));
  await fs.writeFile(join(publicPath, 'favicon.ico'), icoBuffer);

  console.log('==END==');
})();
