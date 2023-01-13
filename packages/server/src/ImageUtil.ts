import sharp from 'sharp';
import { Buffer } from 'buffer';
import { getContentType, StorageDataManager } from '@server/storage/StorageDataManager';

// eslint-disable-next-line import/prefer-default-export
export const convertImage = async (
  bookId: string,
  pageNumber: string,
  info: { ext: 'jpg', size: { width: number, height: number } } | { ext: 'webp', size?: { width: number, height: number } },
  isSave: boolean,
): Promise<{
  success: true,
  type: 'image/jpeg' | 'image/webp',
  body: Buffer,
  byteLength: number,
  lastModified: Date,
} | {
  success: false,
  body?: string | Error,
}> => {
  const metadata = {
    bookId,
    pageNumber,
    width: info.size?.width ?? 0,
    height: info.size?.height ?? 0,
    extension: info.ext,
  };
  const cachePageData = await StorageDataManager.getPageData(metadata);
  if (cachePageData) {
    return {
      success: true,
      type: cachePageData.contentType,
      body: cachePageData.data,
      byteLength: cachePageData.contentLength,
      lastModified: cachePageData.lastModified,
    };
  }

  const originalPageData = await StorageDataManager.getOriginalPageData(metadata);
  if (!originalPageData) {
    return {
      success: false,
      body: undefined,
    };
  }

  let sharpInstance = await sharp(originalPageData.data);
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
      sharpInstance = sharpInstance.jpeg();
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

  let cachePageBuffer: Buffer;
  try {
    cachePageBuffer = await sharpInstance.toBuffer();
  } catch (e) {
    return {
      success: false,
      body: e,
    };
  }
  if (isSave) {
    await StorageDataManager.writePage(metadata, cachePageBuffer, true);
  }

  return {
    success: true,
    type: getContentType(metadata.extension),
    body: cachePageBuffer,
    byteLength: cachePageBuffer.byteLength,
    lastModified: originalPageData.lastModified,
  };
};

export const convertAndSaveJpg = async (src: string | Buffer, dist: string) => {
  await sharp(src).jpeg().toFile(dist);
};

export const convertToJpg = (
  srcBuffer: Buffer,
): Promise<Buffer | undefined> => sharp(srcBuffer).jpeg().toBuffer();

export const getImageSize = async (data: Buffer): Promise<{ width: number, height: number }> => {
  const { width, height } = await sharp(data).metadata();
  return { width, height };
};

export const purgeImageCache = () => {
  sharp.cache(false);
  sharp.cache(true);
};

const getLeftTopPixelData = async (src: Buffer): Promise<{ r: number, g: number, b: number }> => {
  const { data: [r, g, b] } = await sharp(src)
    .extract({
      left: 0,
      top: 0,
      width: 1,
      height: 1,
    })
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { r, g, b };
};

export const joinImagesAndSaveToJpg = async (srcBuffers: Buffer[], dist: string) => {
  if (srcBuffers.length < 1) {
    return;
  }
  const imageAttrs = await Promise.all(
    srcBuffers.map(async (srcBuffer) => {
      const { width, height } = await sharp(srcBuffer).metadata();
      return {
        width,
        height,
        data: srcBuffer,
      };
    }),
  );
  const background = await getLeftTopPixelData(srcBuffers[0]);

  const distWidth = imageAttrs.reduce((acc, cur) => acc + cur.width, 0);
  const distHeight = Math.max(...imageAttrs.map((v) => v.height));
  let totalLeft = 0;
  const compositeParams = imageAttrs.map((image) => {
    const left = totalLeft;
    totalLeft += image.width;
    return {
      input: image.data,
      gravity: 'northwest',
      left,
      top: 0,
    };
  });

  await sharp({
    create: {
      width: distWidth,
      height: distHeight,
      channels: 3,
      background,
    },
  })
    .composite(compositeParams)
    .jpeg()
    .toFile(dist);
};
