import { createReadStream, promises as fs } from 'fs';
import sharp from 'sharp';
import { Buffer } from 'buffer';
import {
  cacheBookFolderName,
  createBookPagePath,
  createCacheBookPagePath,
} from '@server/StorageUtil';
import ReadableStream = NodeJS.ReadableStream;

const jpegQuality = 85;

// eslint-disable-next-line import/prefer-default-export
export const obsoleteConvertImage = async (
  bookId: string,
  pageNum: string,
  info: { ext: 'jpg', size: { width: number, height: number } } | { ext: 'webp', size?: { width: number, height: number } },
  isSave: boolean,
): Promise<{
  success: true,
  type: 'image/jpeg' | 'image/webp',
  body: Buffer | ReadableStream,
  byteLength: number,
  lastModified: string,
} | {
  success: false,
  body?: string | Error,
}> => {
  const originalFilePath = `storage/book/${bookId}/${pageNum}.jpg`;
  const sizeString = info.size ? `_${info.size.width}x${info.size.height}` : '';
  const cacheFolderPath = `storage/cache/book/${bookId}`;
  const cacheFilePath = `${cacheFolderPath}/${pageNum}${sizeString}.${info.ext}`;
  const type = info.ext === 'jpg' ? 'image/jpeg' : 'image/webp';

  try {
    const cacheStats = await fs.stat(cacheFilePath);
    if (cacheStats.isFile()) {
      return {
        success: true,
        type,
        body: createReadStream(cacheFilePath),
        byteLength: cacheStats.size,
        lastModified: cacheStats.mtime.toUTCString(),
      };
    }
  } catch (e) { /* ignored */ }

  const stats = await fs.stat(originalFilePath).catch(() => undefined);
  if (!stats || !stats.isFile()) {
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
      fit: 'cover',
    });
  }

  switch (info.ext) {
    case 'jpg':
      sharpInstance = sharpInstance.jpeg({ progressive: true, quality: jpegQuality });
      break;
    case 'webp':
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
    await fs.mkdir(cacheFolderPath, { recursive: true });
    await fs.writeFile(cacheFilePath, imageBuffer);
  }
  return {
    success: true,
    type,
    body: imageBuffer,
    byteLength: imageBuffer.byteLength,
    lastModified: stats.mtime.toUTCString(),
  };
};

export const getCacheOrConvertImage = async (
  bookId: string,
  pageNum: string,
  extension: 'jpg' | 'webp',
  width: number | undefined,
  height: number | undefined,
  isCache: boolean,
): Promise<{ success: false } | {
  success: true,
  body: Buffer | ReadableStream,
  length: number,
  mimeType: string,
  lastModified: Date,
}> => {
  try {
    const cachePagePath = createCacheBookPagePath(bookId, pageNum, extension, width, height);
    try {
      const stat = await fs.stat(cachePagePath);
      if (stat.isFile()) {
        return {
          success: true,
          body: createReadStream(cachePagePath),
          length: stat.size,
          mimeType: 'image/jpeg',
          lastModified: stat.mtime,
        };
      }
    } catch (e) {
      /* ignored */
    }

    const pagePath = createBookPagePath(bookId, pageNum);
    const stats = await fs.stat(pagePath);
    if (!stats.isFile()) {
      return { success: false };
    }

    let sharpInstance = sharp(pagePath);
    if (width || height) {
      sharpInstance = sharpInstance.resize({
        width,
        height,
        withoutEnlargement: true,
        fit: 'contain',
      });
    }
    switch (extension) {
      case 'jpg':
        sharpInstance = sharpInstance.jpeg({ quality: jpegQuality });
        break;
      case 'webp':
        sharpInstance = sharpInstance.webp();
        break;
      default:
        return { success: false };
    }
    const mimeType = extension === 'jpg' ? 'image/jpeg' : 'image/webp';

    let imageBuffer: Buffer;
    try {
      imageBuffer = await sharpInstance.toBuffer();
    } catch (e) {
      return { success: false };
    }
    if (isCache) {
      await fs.mkdir(`${cacheBookFolderName}/${bookId}`, { recursive: true });
      await fs.writeFile(cachePagePath, imageBuffer);
    }
    return {
      success: true,
      body: imageBuffer,
      length: imageBuffer.length,
      mimeType,
      lastModified: stats.mtime,
    };
  } catch (e) {
    return {
      success: false,
    };
  }
};

export const convertAndSaveJpg = async (src: string | Buffer, dist: string) => {
  await sharp(src)
    .jpeg({ progressive: true, quality: jpegQuality })
    .toFile(dist);
};

export const getImageSize = async (src: string): Promise<{ width: number, height: number }> => {
  const { width, height } = await sharp(src).metadata();
  return { width, height };
};

export const splitImage = async (src: string, orientation: 'horizontal' | 'vertical', splitCount: number = 2) => {
  const meta = await sharp(src).metadata();
  const toString = (num) => num.toString().padStart(splitCount.toString().length, '0');
  switch (orientation) {
    case 'vertical': {
      const widthPerPage = meta.width / splitCount;
      for (let i = 0; i < splitCount; i += 1) {
        const left = Math.round(widthPerPage * i);
        // eslint-disable-next-line no-await-in-loop
        await sharp(src)
          .extract({
            top: 0,
            left,
            width: Math.min(Math.round(widthPerPage * (i + 1)) - left, meta.width),
            height: meta.height,
          })
          .toFile(src.replace('.jpg', `-${toString(i)}.jpg`));
      }
      break;
    }
    case 'horizontal': {
      const heightPerPage = meta.height / splitCount;
      for (let i = 0; i < splitCount; i += 1) {
        const top = Math.round(heightPerPage * i);
        // eslint-disable-next-line no-await-in-loop
        await sharp(src)
          .extract({
            top,
            left: 0,
            width: meta.width,
            height: Math.min(Math.round(heightPerPage * (i + 1)) - top, meta.height),
          })
          .toFile(src.replace('.jpg', `-${toString(i)}.jpg`));
      }
      break;
    }
    default: /* ignored */
  }
};

export const cropImage = async (src: string, left: number, width: number) => {
  const meta = await sharp(src).metadata();
  const buffer = await sharp(src)
    .extract({
      top: 0,
      left,
      width,
      height: meta.height,
    })
    .toBuffer();
  await fs.writeFile(src, buffer);
};

export const purgeImageCache = () => {
  sharp.cache(false);
  sharp.cache(true);
};
