import { createReadStream, promises as fs } from 'fs';
import sharp from 'sharp';
import { Buffer } from 'buffer';
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

export const convertAndSaveJpg = (
  src: string | Buffer,
  dist: string,
): Promise<void> => sharp(src).jpeg({ quality: jpegQuality }).toFile(dist).then(() => undefined);

export const getImageSize = async (src: string): Promise<{ width: number, height: number }> => {
  const { width, height } = await sharp(src).metadata();
  return { width, height };
};

export const purgeImageCache = () => {
  sharp.cache(false);
  sharp.cache(true);
};
