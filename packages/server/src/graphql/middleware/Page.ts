import GQLMiddleware from '@server/graphql/GQLMiddleware';

import { promises as fs } from 'fs';
import sharp from 'sharp';

import {
  MutationResolvers, Result, SplitType, EditAction, Scalars, EditType,
} from '@syuchan1005/book-reader-graphql/generated/GQLTypes';
import { StrictEditAction } from '@syuchan1005/book-reader-graphql/GQLTypesEx';
import {
  withPageEditFolder,
  createBookFolderPath,
  removeBookCache,
} from '@server/StorageUtil';
import Errors from '@server/Errors';
import { BookDataManager } from '@server/database/BookDataManager';
import GQLUtil from '../GQLUtil';
import { flatRange } from '../scalar/IntRange';
import {
  purgeImageCache,
  getImageSize,
} from '../../ImageUtil';

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
  const isValid = actions.every((action, index, arr) => {
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
      default:
        return false;
    }
  });
  return isValid ? actions as StrictEditAction[] : undefined;
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
            // eslint-disable-next-line no-param-reassign
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
          // eslint-disable-next-line no-param-reassign
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
            default:
              throw new Error(`Unknown SplitType ${action.split.splitType}`);
          }
        });
        break;
      }
      case EditType.Replace:
        imageEditActions[action.replace.pageIndex].image = action.replace.image;
        imageEditActions[action.replace.pageIndex].cropTransforms = undefined;
        break;
      default:
        // @ts-ignore
        throw new Error(`Unknown EditType ${action.editType}`);
    }
  });
  return imageEditActions;
};

const calculateCropTransforms = (
  transforms: TransformFn[],
  imageWidth: number,
  imageHeight: number,
): CropValue => transforms.reduce((prev, transformFn) => {
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

const executeEditActions = async (
  editActions: ImageEditAction[],
  editFolderPath: string,
  bookId: string,
  bookPages: number,
): Promise<Result> => {
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
          const cropValue = calculateCropTransforms(cropTransforms, size.width, size.height);
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
      bulkEditPage: async (_, { id: bookId, actions }): Promise<Result> => {
        const book = await BookDataManager.getBook(bookId);
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

        return withPageEditFolder(bookId, async (folderPath, replaceNewFiles) => {
          const result = await executeEditActions(editActions, folderPath, bookId, book.pages);
          if (!result.success) {
            return result;
          }

          try {
            await removeBookCache(bookId).catch(() => { /* ignored */ });
            purgeImageCache();
            await replaceNewFiles();
          } catch (e) {
            return {
              success: false,
              code: 'QL0013',
              message: Errors.QL0013,
            };
          }
          await BookDataManager.editBook(bookId, {
            pages: editActions.length,
          });
          return { success: true };
        });
      },
    };
  }
}

// noinspection JSUnusedGlobalSymbols
export default Page;
