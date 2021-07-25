import GQLMiddleware from '@server/graphql/GQLMiddleware';

import { createWriteStream, promises as fs } from 'fs';
import { orderBy } from 'natural-orderby';
import sharp from 'sharp';

import {
  MutationResolvers, Result, SplitType, EditAction, Scalars, EditType,
} from '@syuchan1005/book-reader-graphql/generated/GQLTypes';
import { StrictEditAction } from '@syuchan1005/book-reader-graphql/GQLTypesEx';
import Database from '@server/sequelize/models';
import BookModel from '@server/sequelize/models/Book';
import { asyncForEach } from '@server/Util';
import {
  renameFile, withPageEditFolder, createBookFolderPath, removeBookCache,
} from '@server/StorageUtil';
import Errors from '@server/Errors';

import GQLUtil from '../GQLUtil';
import { flatRange } from '../scalar/IntRange';
import {
  splitImage, purgeImageCache, cropImage, getImageSize,
} from '../../ImageUtil';

const pageMutationResolvers: MutationResolvers = {
  deletePages: async (parent, { id: bookId, pages }) => {
    const numbers = flatRange(pages);
    const book = await BookModel.findOne({ where: { id: bookId } });
    if (!book) {
      return {
        success: false,
        code: 'QL0004',
        message: Errors.QL0004,
      };
    }

    const minNum = Math.min(...numbers);
    const maxNum = Math.max(...numbers);
    if (book.pages < maxNum || minNum < 0) {
      return {
        success: false,
        code: 'QL0007',
        message: Errors.QL0007,
      };
    }

    const bookPath = createBookFolderPath(bookId);
    let pad = book.pages.toString(10).length;
    await Promise.all(numbers
      .map((i) => `${bookPath}/${i.toString(10).padStart(pad, '0')}.jpg`)
      .map((p) => fs.unlink(p)));

    pad = (book.pages - numbers.length).toString(10).length;

    await GQLUtil.numberingFiles(bookPath, pad);
    await removeBookCache(book.id);
    purgeImageCache();

    await BookModel.update({
      pages: book.pages - numbers.length,
    }, {
      where: {
        id: bookId,
      },
    });

    return {
      success: true,
    };
  },
  splitPages: async (parent, { id: bookId, pages, type }) => {
    const numbers = flatRange(pages);
    const book = await BookModel.findOne({ where: { id: bookId } });
    if (!book) {
      return {
        success: false,
        code: 'QL0004',
        message: Errors.QL0004,
      };
    }

    const minNum = Math.min(...numbers);
    const maxNum = Math.max(...numbers);
    if (book.pages < maxNum || minNum < 0) {
      return {
        success: false,
        code: 'QL0007',
        message: Errors.QL0007,
      };
    }

    const bookPath = `storage/book/${bookId}`;
    let files = await fs.readdir(bookPath);
    let pageCount = 0;
    await asyncForEach(orderBy(files), async (f, i) => {
      if (!numbers.includes(i)) {
        pageCount += 1;
        return;
      }

      await splitImage(`${bookPath}/${f}`, type === SplitType.Vertical ? 'vertical' : 'horizontal');
      await fs.unlink(`${bookPath}/${f}`);
      pageCount += 2;
    });

    files = orderBy((await fs.readdir(bookPath)), [
      (v) => Number(v.match(/\d+/g)[0]),
      (v) => Number(v.match(/\d+/g)[1]) + 1 || 0,
    ], ['asc', 'desc']);
    await GQLUtil.numberingFiles(bookPath, pageCount.toString(10).length, files, true);
    await fs.rm(`storage/cache/book/${book.id}`, { recursive: true, force: true });
    purgeImageCache();

    await BookModel.update({
      pages: pageCount,
    }, {
      where: {
        id: bookId,
      },
    });

    return {
      success: true,
    };
  },
  editPage: async (parent, { id: bookId, page, image }) => {
    const book = await BookModel.findOne({ where: { id: bookId } });
    if (!book) {
      return {
        success: false,
        code: 'QL0004',
        message: Errors.QL0004,
      };
    }
    if (page < 0 || page >= book.pages) {
      return {
        success: false,
        code: 'QL0007',
        message: Errors.QL0007,
      };
    }

    const { createReadStream, mimetype } = await image;
    if (!mimetype.startsWith('image/jpeg')) {
      return {
        success: false,
        code: 'QL0000',
        message: Errors.QL0000,
      };
    }

    await new Promise((resolve) => {
      const wStream = createWriteStream(`storage/book/${bookId}/${page.toString(10).padStart(book.pages.toString(10).length, '0')}.jpg`, { flags: 'w' });
      const rStream = createReadStream();
      rStream.pipe(wStream);
      wStream.on('close', resolve);
    });
    await removeBookCache(bookId, page, book.pages);
    purgeImageCache();

    return {
      success: true,
    };
  },
  putPage: async (parent, { id: bookId, beforePage, image }) => {
    const book = await BookModel.findOne({ where: { id: bookId } });
    if (!book) {
      return {
        success: false,
        code: 'QL0004',
        message: Errors.QL0004,
      };
    }

    if (beforePage < -1 || beforePage >= book.pages) {
      return {
        success: false,
        code: 'QL0007',
        message: Errors.QL0007,
      };
    }
    const bookPath = `storage/book/${bookId}`;
    const pad = book.pages.toString(10).length;

    const { createReadStream, mimetype } = await image;
    if (!mimetype.startsWith('image/jpeg')) {
      return {
        success: false,
        code: 'QL0000',
        message: Errors.QL0000,
      };
    }

    if (beforePage === -1) {
      await renameFile(
        `${bookPath}/${'0'.repeat(pad)}.jpg`,
        `${bookPath}/${'0'.repeat(pad)}-1.jpg`,
      );
      await new Promise((resolve) => {
        const wStream = createWriteStream(`${bookPath}/${'0'.repeat(pad)}-0.jpg`, { flags: 'w' });
        const rStream = createReadStream();
        rStream.pipe(wStream);
        wStream.on('close', resolve);
      });
    } else if (beforePage === book.pages) {
      await new Promise((resolve) => {
        const wStream = createWriteStream(`${bookPath}/${beforePage.toString(10).padStart(pad, '0')}.jpg`, { flags: 'w' });
        const rStream = createReadStream();
        rStream.pipe(wStream);
        wStream.on('close', resolve);
      });
    } else {
      await renameFile(
        `${bookPath}/${beforePage.toString(10).padStart(pad, '0')}.jpg`,
        `${bookPath}/${beforePage.toString(10).padStart(pad, '0')}-0.jpg`,
      );

      await new Promise((resolve) => {
        const wStream = createWriteStream(`${bookPath}/${beforePage.toString(10).padStart(pad, '0')}-1.jpg`, { flags: 'w' });
        const rStream = createReadStream();
        rStream.pipe(wStream);
        wStream.on('close', resolve);
      });
    }

    if (beforePage !== book.pages) {
      const files = orderBy((await fs.readdir(bookPath)), [
        (v) => Number(v.match(/\d+/g)[0]),
        (v) => Number(v.match(/\d+/g)[1]) + 1 || 0,
      ], ['asc', 'asc']);
      await GQLUtil.numberingFiles(bookPath, (book.pages + 1).toString(10).length, files, true);
      await fs.rm(`storage/cache/book/${book.id}`, { recursive: true, force: true });
      purgeImageCache();
    }

    await BookModel.update({
      pages: book.pages + 1,
    }, {
      where: {
        id: bookId,
      },
    });

    return {
      success: true,
    };
  },
  cropPages: async (parent, {
    id: bookId, pages, left, width,
  }) => {
    const numbers = flatRange(pages);
    const book = await BookModel.findOne({ where: { id: bookId } });
    if (!book) {
      return {
        success: false,
        code: 'QL0004',
        message: Errors.QL0004,
      };
    }
    const minNum = Math.min(...numbers);
    const maxNum = Math.max(...numbers);
    if (book.pages < maxNum || minNum < 0) {
      return {
        success: false,
        code: 'QL0007',
        message: Errors.QL0007,
      };
    }

    const bookPath = `storage/book/${bookId}`;
    const files = await fs.readdir(bookPath);
    await asyncForEach(orderBy(files), async (f, i) => {
      if (!numbers.includes(i)) {
        return;
      }

      await cropImage(`${bookPath}/${f}`, left, width);
    });
    await fs.rm(`storage/cache/book/${book.id}`, { recursive: true, force: true });
    purgeImageCache();

    return {
      success: true,
    };
  },
};

const hasPageCountEffectMap = {
  [EditType.Crop]: false,
  [EditType.Replace]: false,
  [EditType.Delete]: true,
  [EditType.Put]: true,
  [EditType.Split]: true,
};

type CropValue = {
  top: number,
  bottom: number,
  left: number,
  right: number,
};

type TransformFn = (width: number, height: number) => CropValue;

/**
 * A model class that represents image processing information. Priority is given to the property
 * at the upper end of the list.
 */
type ImageEditAction = {
  pageIndex: number,
  willDelete: boolean;
  image?: Scalars['Upload'],
  cropTransforms?: TransformFn[],
};

const createImageEditAction = (pageIndex: number): ImageEditAction => ({
  pageIndex, willDelete: false, image: undefined, cropTransforms: undefined,
});

const validateEditActions = (actions: EditAction[]): StrictEditAction[] | undefined => {
  const isVaild = actions.every((action, index, arr) => {
    const hasPageCountEffect = hasPageCountEffectMap[action.editType];
    if (hasPageCountEffect === undefined) {
      return false;
    }
    const isLast = index === arr.length - 1;
    if (hasPageCountEffect && !isLast) {
      return false;
    }

    switch (action.editType) {
      case EditType.Crop:
        return !['top', 'bottom', 'left', 'right'].every((k) => !action.crop[k]);
      case EditType.Delete:
      case EditType.Put:
      case EditType.Replace:
      case EditType.Split:
        return !!action[action.editType.toLowerCase()];
    }
  });
  return isVaild ? actions as StrictEditAction[] : undefined;
};

const calculateEditActions = (
  actions: StrictEditAction[],
  initImageEditActions: ImageEditAction[],
): ImageEditAction[] => {
  let imageEditActions = [...initImageEditActions];
  actions.forEach((action) => {
    switch (action.editType) {
      case EditType.Crop: {
        const pageRange = flatRange(action.crop.pageRange);
        imageEditActions.forEach((imageEditAction, i) => {
          if (pageRange.includes(i)) {
            imageEditAction.cropTransforms = [
              ...(imageEditAction.cropTransforms ?? []),
              (w, h) => ({
                left: action.crop.left ?? 0,
                right: action.crop.right ?? w,
                top: action.crop.top ?? 0,
                bottom: action.crop.bottom ?? h,
              }),
            ];
          }
        });
        break;
      }
      case EditType.Delete: {
        const pageRange = flatRange(action.delete.pageRange);
        imageEditActions.forEach((imageEditAction, i) => {
          imageEditAction.willDelete = imageEditAction.willDelete || pageRange.includes(i);
        });
        break;
      }
      case EditType.Put: {
        createImageEditAction(-1);
        const newImageEditAction: ImageEditAction = createImageEditAction(-1);
        newImageEditAction.image = action.put.image;
        imageEditActions.splice(action.put.pageIndex + 1, 0, newImageEditAction);
        break;
      }
      case EditType.Split: {
        const pageRange = flatRange(action.split.pageRange);
        const { splitCount } = action.split;
        imageEditActions = imageEditActions.flatMap((imageEditAction, pageIndex) => {
          if (!pageRange.includes(pageIndex)) {
            return imageEditAction;
          }
          switch (action.split.splitType) {
            case SplitType.Vertical:
              return [...Array(splitCount).keys()].reverse().map((i): ImageEditAction => ({
                ...imageEditAction,
                pageIndex: imageEditAction.pageIndex ?? pageIndex,
                cropTransforms: [
                  ...(imageEditAction.cropTransforms ?? []),
                  (width, height) => {
                    const widthPerPage = width / splitCount;
                    const left = Math.round(widthPerPage * i);
                    return {
                      left,
                      right: Math.min(width, Math.round(widthPerPage * (i + 1))),
                      top: 0,
                      bottom: height,
                    };
                  },
                ],
              }));
            case SplitType.Horizontal:
              return [...Array(splitCount).keys()].map((i): ImageEditAction => ({
                ...imageEditAction,
                pageIndex: imageEditAction.pageIndex ?? pageIndex,
                cropTransforms: [
                  ...(imageEditAction.cropTransforms ?? []),
                  (width, height) => {
                    const heightPerPage = height / splitCount;
                    const top = Math.round(heightPerPage * i);
                    return {
                      left: 0,
                      right: width,
                      top,
                      bottom: Math.min(height, Math.round(heightPerPage * (i + 1))),
                    };
                  },
                ],
              }));
          }
        });
        break;
      }
      case EditType.Replace:
        imageEditActions[action.replace.pageIndex].image = action.replace.image;
        imageEditActions[action.replace.pageIndex].cropTransforms = undefined;
        break;
    }
  });
  return imageEditActions;
};

const calculateCropTranforms = (transforms: TransformFn[], imageWidth: number, imageHeight: number): CropValue => transforms.reduce((prev, transformFn) => {
  const w = prev.right - prev.left;
  const h = prev.bottom - prev.top;
  const croppedValue = transformFn(w, h);
  return {
    top: prev.top + croppedValue.top,
    left: prev.left + croppedValue.left,
    right: prev.right - (w - croppedValue.right),
    bottom: prev.bottom - (h - croppedValue.bottom),
  };
}, {
  top: 0,
  left: 0,
  right: imageWidth,
  bottom: imageHeight,
} as CropValue);

const executeEditActions = async (editActions: ImageEditAction[], editFolderPath: string, bookId: string, bookPages: number): Promise<Result> => {
  const bookFolderPath = createBookFolderPath(bookId);
  const promises = editActions
    .filter(({ willDelete }) => !willDelete)
    .map(async ({ pageIndex, image, cropTransforms }, index, arr): Promise<Result> => {
      const srcFileName = `${pageIndex.toString(10).padStart(bookPages.toString(10).length, '0')}.jpg`;
      const srcFilePath = `${bookFolderPath}/${srcFileName}`;
      const distFileName = `${index.toString(10).padStart(arr.length.toString(10).length, '0')}.jpg`;
      const distFilePath = `${editFolderPath}/${distFileName}`;
      try {
        if (image) {
          await GQLUtil.writeFile(distFilePath, (await image).createReadStream());
        } else if (cropTransforms) {
          const size = await getImageSize(srcFilePath);
          const cropValue = calculateCropTranforms(cropTransforms, size.width, size.height);
          await sharp(srcFilePath)
            .extract({
              top: cropValue.top,
              left: cropValue.left,
              width: cropValue.right - cropValue.left,
              height: cropValue.bottom - cropValue.top,
            })
            .toFile(distFilePath);
        } else {
          await fs.copyFile(srcFilePath, distFilePath);
        }
        return { success: true };
      } catch (e) {
        return {
          success: false,
          code: 'QL0013',
          message: Errors.QL0013,
        };
      }
    });
  try {
    await Promise.all(promises);
    return { success: true };
  } catch (e) {
    return e;
  }
};

class Page extends GQLMiddleware {
  // eslint-disable-next-line class-methods-use-this
  Mutation(): MutationResolvers {
    return {
      ...pageMutationResolvers,
      bulkEditPage: async (_, { id, actions }): Promise<Result> => {
        const book = await BookModel.findOne({ where: { id } });
        if (!book) {
          return {
            success: false,
            code: 'QL0004',
            message: Errors.QL0004,
          };
        }
        const strictEditActions = validateEditActions(actions);
        if (strictEditActions === undefined) {
          return {
            success: false,
            code: 'QL0012',
            message: Errors.QL0012,
          };
        }
        const editActions = calculateEditActions(
          strictEditActions,
          [...Array(book.pages).keys()].map(createImageEditAction),
        ).filter(({ willDelete }) => !willDelete);

        return withPageEditFolder(id, async (folderPath, replaceNewFiles) => {
          const result = await executeEditActions(editActions, folderPath, id, book.pages);
          if (!result.success) {
            return result;
          }

          const transaction = await Database.sequelize.transaction();
          try {
            await BookModel.update(
              { pages: editActions.length },
              {
                where: { id },
                transaction,
              },
            );
            await removeBookCache(id).catch(() => { /* ignored */ });
            purgeImageCache();
            await replaceNewFiles();
            await transaction.commit();
          } catch (e) {
            await transaction.rollback();
            return {
              success: false,
              code: 'QL0013',
              message: Errors.QL0013,
            };
          }
          return { success: true };
        });
      },
    };
  }
}

// noinspection JSUnusedGlobalSymbols
export default Page;
