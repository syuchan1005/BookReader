import {
  Canvas,
  CanvasRenderingContext2D,
  createCanvas,
  loadImage,
  registerFont,
} from 'canvas';
import chunk from 'lodash.chunk';
import Application from 'koa';
import { BookDataManager } from '@server/database/BookDataManager';

const drawBookImage = async (
  canvasCtx: CanvasRenderingContext2D,
  width: number,
  height: number,
  bookId: string,
  pageCount: string,
): Promise<{ x: number, y: number, width: number, height: number }> => {
  const image = await loadImage(`./storage/book/${bookId}/${pageCount}.jpg`);
  const widthScale = (width * 0.5) / image.naturalWidth;
  const heightScale = (height * 0.8) / image.naturalHeight;
  const scale = Math.min(widthScale, heightScale);
  const drawImageWidth = image.naturalWidth * scale;
  const drawImageHeight = image.naturalHeight * scale;
  const drawInfo = {
    x: width - drawImageWidth - 32,
    y: 32 + (height * 0.8 - drawImageHeight) / 2,
    width: drawImageWidth,
    height: drawImageHeight,
  };
  canvasCtx.drawImage(image, drawInfo.x, drawInfo.y, drawInfo.width, drawInfo.height);
  return drawInfo;
};

const drawText = (
  canvasCtx: CanvasRenderingContext2D,
  size: number,
  x: number,
  y: number,
  text: string,
  color: string,
  textAlign: CanvasTextAlign,
  textBaseline: CanvasTextBaseline,
) => {
  /* eslint-disable no-param-reassign */
  canvasCtx.font = `${size}px NotoSansJP`;
  canvasCtx.fillStyle = color;
  canvasCtx.textAlign = textAlign;
  canvasCtx.textBaseline = textBaseline;
  /* eslint-enable no-param-reassign */
  canvasCtx.fillText(text, x, y);
};

const drawTitle = (
  canvasCtx: CanvasRenderingContext2D,
  titleText: string,
  titleTextSize: number,
  maxWidth: number,
  maxLines: number,
): number => {
  const titleLineLen = Math.floor(maxWidth / titleTextSize);
  const lineTexts: Array<string> = chunk([...titleText], titleLineLen)
    .map((arr) => arr.join(''));
  if (lineTexts.length > maxLines) {
    lineTexts.splice(maxLines);
    lineTexts[lineTexts.length - 1] = `${lineTexts[lineTexts.length - 1].slice(0, titleLineLen - 1)}…`;
  }
  lineTexts.forEach((text, index) => {
    drawText(canvasCtx, titleTextSize, 32, titleTextSize * index, text, '#FFF', 'start', 'hanging');
  });
  return lineTexts.length;
};

const drawSubtitle = (
  canvasCtx: CanvasRenderingContext2D,
  subtitleText: string,
  subtitlePrefix: { text: string, dummy: string } | undefined,
  subtitleTextSize: number,
  maxWidth: number,
  subtitleMaxLint: number,
  paddingTopPx: number,
) => {
  const subtitleLineLen = Math.floor(maxWidth / subtitleTextSize);
  const subtitleLineTexts = chunk([...`${subtitlePrefix?.dummy || ''}${subtitleText}`], subtitleLineLen)
    .map((arr) => arr.join(''));
  if (subtitleLineTexts.length > subtitleMaxLint) {
    subtitleLineTexts.splice(subtitleMaxLint);
    subtitleLineTexts[subtitleLineTexts.length - 1] = `${subtitleLineTexts[subtitleLineTexts.length - 1].slice(0, subtitleLineLen - 1)}…`;
  }
  subtitleLineTexts.forEach((text, index) => {
    let t = text;
    if (subtitlePrefix && index === 0) {
      t = `${subtitlePrefix.text}${text.slice(subtitlePrefix.dummy.length)}`;
    }
    drawText(canvasCtx, subtitleTextSize, 32, 24 + paddingTopPx + (subtitleTextSize * index), t, '#FFF', 'start', 'hanging');
  });
};

const drawOGPImage = async (
  titleText: string,
  subtitleText: string | undefined,
  subtitlePrefix: { text: string, dummy: string } | undefined,
  bookId: string | undefined,
  thumbnailPage: number | undefined,
  pageCount: number | undefined,
): Promise<Canvas> => {
  const width = 1200;
  const height = 630;
  const canvas = createCanvas(width, height);
  const canvasCtx = canvas.getContext('2d');

  canvasCtx.fillStyle = '#4caf50';
  canvasCtx.fillRect(0, 0, width, height);

  let imageRect = {
    x: width,
    y: 0,
    width: 0,
    height: 0,
  };

  if (bookId !== undefined && thumbnailPage !== undefined && pageCount !== undefined) {
    try {
      imageRect = await drawBookImage(
        canvasCtx,
        width,
        height,
        bookId,
        `${thumbnailPage}`.padStart(`${pageCount}`.length, '0'),
      );
    } catch (e) { /* ignored */ }
  }

  drawText(canvasCtx, 40, width - 8, height - 8, 'Book Reader', '#FFF', 'end', 'bottom');
  const maxWidth = imageRect.x - /* right padding */ 32 - /* left padding */ 32;
  const maxLines = 6;
  const titleTextSize = 80;
  const titleLineLen = drawTitle(canvasCtx, titleText, titleTextSize, maxWidth, maxLines);
  if (subtitleText !== undefined) {
    drawSubtitle(
      canvasCtx,
      subtitleText,
      subtitlePrefix,
      70,
      maxWidth,
      maxLines - titleLineLen + 1,
      titleTextSize * titleLineLen,
    );
  }

  return canvas;
};

const drawBookOGPImage = async (bookId: string): Promise<Canvas> => {
  const bookInfo = await BookDataManager.getBookInfoFromBookId(bookId);
  const book = await BookDataManager.getBook(bookId);
  if (!bookInfo || !book) {
    throw new Error('book not found');
  }

  return drawOGPImage(
    bookInfo.name,
    book.number,
    { text: 'No. ', dummy: '    ' },
    book.id,
    book.thumbnailPage,
    book.pageCount,
  );
};

const drawInfoOGPImage = async (infoId: string): Promise<Canvas> => {
  const bookInfo = await BookDataManager.getBookInfo(infoId);
  const thumbnailBook = await BookDataManager.getBookInfoThumbnail(infoId);
  if (!bookInfo) {
    throw new Error('book not found');
  }

  return drawOGPImage(
    bookInfo.name,
    `(${bookInfo.bookCount})`,
    undefined,
    thumbnailBook?.bookId,
    thumbnailBook?.thumbnailPage,
    thumbnailBook?.pageCount,
  );
};

const drawTopOGPImage = (): Canvas => {
  const width = 1200;
  const height = 630;
  const canvas = createCanvas(width, height);
  const canvasCtx = canvas.getContext('2d');

  canvasCtx.fillStyle = '#4caf50';
  canvasCtx.fillRect(0, 0, width, height);

  const text = 'Book Reader';
  drawText(canvasCtx, 120, width / 2, height / 2, text, '#FFF', 'center', 'middle');

  return canvas;
};

export const OGPImageRoute: Application.Middleware = async (ctx, next) => {
  try {
    registerFont('./assets/NotoSansJP-Regular.otf', { family: 'NotoSansJP' });

    const match = ctx.req.url.match(/^\/(book|info)\/([^/]+)\/image$/);
    let canvas;
    if (match) {
      if (match[1] === 'book') {
        canvas = await drawBookOGPImage(match[2]);
      } else {
        canvas = await drawInfoOGPImage(match[2]);
      }
    } else if (ctx.req.url.endsWith('/image')) {
      canvas = drawTopOGPImage();
    }

    if (canvas) {
      ctx.status = 200;
      ctx.body = canvas.toBuffer('image/png');
      ctx.type = 'image/png';
      return;
    }
  } catch (e) {
    ctx.status = 500;
    ctx.body = 'Internal Server Error';
    return;
  }
  await next();
};
