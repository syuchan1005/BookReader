import GQLMiddleware from '@server/graphql/GQLMiddleware';

import sharp from 'sharp';
import throttle from 'lodash.throttle';
import { withFilter } from 'graphql-subscriptions';

import {
  MutationResolvers, Result, SplitType, EditAction, Scalars, EditType, SubscriptionResolvers,
} from '@syuchan1005/book-reader-graphql/generated/GQLTypes';
import { StrictEditAction } from '@syuchan1005/book-reader-graphql/GQLTypesEx';
import { SubscriptionKeys } from '@server/graphql';
import Errors from '@server/Errors';
import { BookDataManager } from '@server/database/BookDataManager';
import {
  StorageDataManager,
  withPageEditFolder,
  writeFile,
} from '@server/storage/StorageDataManager';
import { flatRange } from '../scalar/IntRange';
import {
  purgeImageCache,
  getImageSize,
} from '../../ImageUtil';

const throttleMs = 500;

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

const streamToBuffer = (
  stream: NodeJS.ReadableStream,
): Promise<Buffer> => new Promise((resolve, reject) => {
  const buffer = [];
  stream.on('data', (chunk) => buffer.push(chunk));
  stream.on('end', () => resolve(Buffer.concat(buffer)));
  stream.on('error', (err) => reject(err));
});

const executeEditActions = async (
  editActions: ImageEditAction[],
  editFolderPath: string,
  bookId: string,
  bookPages: number,
  log: (string) => void,
): Promise<Result> => {
  const executableEditActions = editActions.filter(({ willDelete }) => !willDelete);

  let count = 0;
  const promises = executableEditActions
    .map(async ({ pageIndex, image, cropTransforms }, index, arr): Promise<Result> => {
      const srcFileData = await StorageDataManager.getOriginalPageData({
        bookId,
        pageNumber: {
          pageIndex,
          totalPageCount: bookPages,
        },
      });
      const distFileName = `${index.toString(10).padStart(arr.length.toString(10).length, '0')}.jpg`;
      const distFilePath = `${editFolderPath}/${distFileName}`;
      try {
        if (image) {
          const buffer = await image
            .then(({ createReadStream }) => createReadStream())
            .then(streamToBuffer);
          await sharp(buffer).toFile(distFilePath);
        } else if (cropTransforms) {
          const size = await getImageSize(srcFileData.data);
          const cropValue = calculateCropTransforms(cropTransforms, size.width, size.height);
          await sharp(srcFileData.data)
            .extract({
              top: cropValue.top,
              left: cropValue.left,
              width: cropValue.right - cropValue.left,
              height: cropValue.bottom - cropValue.top,
            })
            .toFile(distFilePath);
        } else {
          await writeFile(distFilePath, srcFileData.data);
        }
        return { success: true };
      } catch (e) {
        return {
          success: false,
          code: 'QL0013',
          message: Errors.QL0013,
        };
      } finally {
        count += 1;
        log(`${count} / ${executableEditActions.length}`);
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

        const log = throttle(
          (message: string) => this.pubsub.publish(SubscriptionKeys.BULK_EDIT_PAGE, {
            id: bookId,
            bulkEditPage: message,
          }),
          throttleMs,
        );

        log('Validate edit actions');
        const strictEditActions = validateEditActions(actions);
        if (strictEditActions === undefined) {
          return {
            success: false,
            code: 'QL0012',
            message: Errors.QL0012,
          };
        }
        log('Calculate edit actions');
        const editActions = calculateEditActions(
          strictEditActions,
          [...Array(book.pageCount).keys()].map(createImageEditAction),
        ).filter(({ willDelete }) => !willDelete);

        return withPageEditFolder(bookId, async (folderPath, replaceNewFiles) => {
          log('Processing edit actions');
          const result = await executeEditActions(
            editActions,
            folderPath,
            bookId,
            book.pageCount,
            (str) => log(`Processing ${str}`),
          );
          if (!result.success) {
            return result;
          }

          log('Move processed images');
          try {
            await StorageDataManager.removeBook(bookId, true).catch(() => { /* ignored */ });
            purgeImageCache();
            await replaceNewFiles();
          } catch (e) {
            return {
              success: false,
              code: 'QL0013',
              message: Errors.QL0013,
            };
          }
          log('Update database');
          await BookDataManager.editBook(bookId, {
            pageCount: editActions.length,
          });
          return { success: true };
        });
      },
    };
  }

  Subscription(): SubscriptionResolvers {
    return {
      bulkEditPage: {
        // @ts-ignore
        subscribe: withFilter(
          () => this.pubsub.asyncIterator([SubscriptionKeys.BULK_EDIT_PAGE]),
          (payload, variables) => payload.id === variables.id,
        ),
      },
    };
  }
}

// noinspection JSUnusedGlobalSymbols
export default Page;
