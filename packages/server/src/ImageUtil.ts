import path from 'path';
import { createReadStream, promises as fs } from 'fs';
import sharp from 'sharp';
import { mkdirpIfNotExists } from './Util';

const jpegQuality = 85;

// eslint-disable-next-line import/prefer-default-export
export const convertImage = async (
  bookId: string,
  pageNum: string,
  info: { ext: 'jpg', size: { width: number, height: number } } | { ext: 'jpg.webp', size?: { width: number, height: number } },
  isSave: boolean,
): Promise<{
  success: true,
  type: string,
  body: any,
  lastModified: string,
  // eslint-disable-next-line consistent-return
} | {
  success: false,
  body?: any,
}> => {
  const originalFilePath = `storage/book/${bookId}/${pageNum}.jpg`;
  const sizeString = info.size ? `_${info.size.width}x${info.size.height}` : '';
  const cacheFilePath = `storage/cache/book/${bookId}/${pageNum}${sizeString}.${info.ext}`;
  const type = info.ext === 'jpg' ? 'image/jpeg' : 'image/webp';

  try {
    const cacheStats = await fs.stat(cacheFilePath);
    if (cacheStats.isFile()) {
      return {
        success: true,
        type,
        body: createReadStream(cacheFilePath),
        lastModified: cacheStats.mtime.toUTCString(),
      };
    }
  } catch (e) { /* ignored */
  }

  const stats = await fs.stat(originalFilePath);
  if (!stats.isFile()) {
    return {
      success: false,
      body: undefined,
    };
  }

  let sharpInstance = await sharp(originalFilePath);
  if (info.size) {
    sharpInstance = sharpInstance.resize({
      width: info.size.width > 0 ? info.size.width : undefined,
      height: info.size.height > 0 ? info.size.height : undefined,
      withoutEnlargement: true,
      fit: 'contain',
    });
  }

  switch (info.ext) {
    case 'jpg':
      sharpInstance = sharpInstance.jpeg({ progressive: true, quality: jpegQuality });
      break;
    case 'jpg.webp':
      sharpInstance = sharpInstance.webp();
      break;
    default:
      return {
        success: false,
        body: 'unknown extension',
      };
  }

  let imageBuffer: Buffer;
  try {
    imageBuffer = await sharpInstance.toBuffer();
  } catch (e) {
    return {
      success: false,
      body: e,
    };
  }
  if (isSave) {
    await mkdirpIfNotExists(path.join(cacheFilePath, '..'));
    await fs.writeFile(cacheFilePath, imageBuffer);
  }
  return {
    success: true,
    type,
    body: imageBuffer,
    lastModified: stats.mtime.toUTCString(),
  };
};

export const convertAndSaveJpg = async (src: string | Buffer, dist: string) => {
  await sharp(src)
    .jpeg({ progressive: true, quality: jpegQuality })
    .toFile(dist);
};

export const splitImage = async (src: string, orientation: 'horizontal' | 'vertical', splitCount: number = 2) => {
  const meta = await sharp(src).metadata();
  const toString = (num) => num.toString().padStart(splitCount.toString().length, '0');
  switch (orientation) {
    case 'vertical': {
      const widthPerPage = meta.width / splitCount;
      for (let i = 0; i < splitCount; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await sharp(src)
          .extract({
            top: 0,
            left: widthPerPage * i,
            width: widthPerPage,
            height: meta.height,
          })
          .toFile(src.replace('.jpg', `-${toString(i)}.jpg`));
      }
      break;
    }
    case 'horizontal': {
      const heightPerPage = meta.height / splitCount;
      for (let i = 0; i < splitCount; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await sharp(src)
          .extract({
            top: heightPerPage * i,
            left: 0,
            width: meta.width,
            height: heightPerPage,
          })
          .toFile(src.replace('.jpg', `-${toString(i)}.jpg`));
      }
      break;
    }
    default: /* ignored */
  }
};
