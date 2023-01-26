import sharp from 'sharp';
import throttle from 'lodash.throttle';
import { PubSub, withFilter } from 'graphql-subscriptions';
import lodashChunk from 'lodash.chunk';

import { defaultStoredImageExtension } from '@syuchan1005/book-reader-common';
import {
  Maybe,
  Result,
  SplitType,
  EditAction,
  Scalars,
  EditType,
  Resolvers,
} from '@syuchan1005/book-reader-graphql';
import { SubscriptionKeys } from '@server/graphql';
import Errors from '@server/Errors';
import { BookDataManager } from '@server/database/BookDataManager';
import {
  StorageDataManager,
  withPageEditFolder,
  writeFile,
} from '@server/storage/StorageDataManager';
import { chunkedRange, flatRange } from '../scalar/IntRange';
import {
  purgeImageCache,
  getImageSize,
  joinImagesAndSaveImage,
} from '../../ImageUtil';

const throttleMs = 500;

type Clean<T> = T;

type Merge<L, R> = Clean<{
  [K in keyof L | keyof R]: (K extends keyof L ? L[K] : never) | (K extends keyof R ? R[K] : never);
}>;

export type StrictEditAction = {
  [T in EditType]:
  Merge<{ editType: T },
    {
      [L in Lowercase<T> & keyof EditAction]:
      EditAction[L] extends Maybe<infer A> | undefined
        ? A
        : never
    }>
}[EditType];

const editTypeConstraint: {
  [key in EditType]: [/* is terminal operation */ boolean, /* is single operation */ boolean]
} = {
  [EditType.Crop]: [false, false],
  [EditType.Replace]: [false, false],
  [EditType.Delete]: [true, false],
  [EditType.Put]: [true, false],
  [EditType.Split]: [true, false],
  [EditType.HStack]: [true, true],
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
  compositePages?: number[],
};

const createImageEditAction = (pageIndex: number): ImageEditAction => ({
  pageIndex,
  willDelete: false,
  image: undefined,
  cropTransforms: undefined,
  compositePages: undefined,
});

const validateEditActions = (actions: EditAction[]): StrictEditAction[] | undefined => {
  const isValid = actions.every((action, index, arr) => {
    const constraint = editTypeConstraint[action.editType];
    if (!constraint) {
      return false;
    }
    if (constraint[1] && arr.length !== 1) {
      return false;
    }
    const isLast = index === arr.length - 1;
    if (constraint[0] && !isLast) {
      return false;
    }

    switch (action.editType) {
      case EditType.Crop:
        return !['top', 'bottom', 'left', 'right'].every((k) => !action.crop[k]);
      case EditType.Delete:
      case EditType.Put:
      case EditType.Replace:
      case EditType.Split:
      case EditType.HStack:
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
              return [...Array(splitCount)
                .keys()].reverse()
                .map((i): ImageEditAction => ({
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
              return [...Array(splitCount)
                .keys()].map((i): ImageEditAction => ({
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
      case EditType.HStack: {
        const inputChunkedPageRange = chunkedRange(action.hstack.pageRange);
        const pageRange = inputChunkedPageRange.flat();
        if (pageRange.length !== new Set(pageRange).size) {
          throw new Error('has duplicate range');
        }
        const chunkedPageRange: [number, number][] = inputChunkedPageRange
          .map((pages) => lodashChunk(pages, 2))
          .flat(1)
          .filter((arr) => arr.length === 2);
        chunkedPageRange.forEach((pages) => {
          imageEditActions[pages[0]].compositePages = [...pages].reverse();
          imageEditActions[pages[1]].willDelete = true;
        });
        break;
      }
      default:
        throw new Error(`Unknown EditAction ${action}`);
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
    .map(async ({
      pageIndex,
      image,
      cropTransforms,
      compositePages,
    }, index, arr): Promise<Result> => {
      const srcFileData = await StorageDataManager.getOriginalPageData({
        bookId,
        pageNumber: {
          pageIndex,
          totalPageCount: bookPages,
        },
      });
      const distFileName = `${index.toString(10)
        .padStart(arr.length.toString(10).length, '0')}.${defaultStoredImageExtension}`;
      const distFilePath = `${editFolderPath}/${distFileName}`;
      try {
        if (image) {
          const buffer = await image
            .then(({ createReadStream }) => createReadStream())
            .then(streamToBuffer);
          await sharp(buffer)
            .toFile(distFilePath);
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
        } else if (compositePages) {
          const pageDataList = await Promise.all(
            compositePages.map((i) => StorageDataManager.getOriginalPageData({
              bookId,
              pageNumber: {
                pageIndex: i,
                totalPageCount: bookPages,
              },
            })),
          );
          await joinImagesAndSaveImage(pageDataList.map((p) => p.data), distFilePath);
        } else if (srcFileData.contentExtension === defaultStoredImageExtension) {
          await writeFile(distFilePath, srcFileData.data);
        } else {
          await sharp(srcFileData.data).toFile(distFilePath);
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

const pubsub = new PubSub();

export const resolvers: Resolvers = {
  Mutation: {
    bulkEditPage: async (_, {
      id: bookId,
      actions,
    }) => {
      const book = await BookDataManager.getBook(bookId);
      if (!book) {
        return {
          success: false,
          code: 'QL0004',
          message: Errors.QL0004,
        };
      }

      const log = throttle(
        (message: string) => pubsub.publish(SubscriptionKeys.BULK_EDIT_PAGE, {
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
        [...Array(book.pageCount)
          .keys()].map(createImageEditAction),
      )
        .filter(({ willDelete }) => !willDelete);

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
          await StorageDataManager.removeBook(bookId, true)
            .catch(() => { /* ignored */
            });
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
  },
  Subscription: {
    bulkEditPage: {
      // Ref: https://github.com/apollographql/graphql-subscriptions/pull/250#issuecomment-1351898681
      subscribe: withFilter(
        () => pubsub.asyncIterator([SubscriptionKeys.BULK_EDIT_PAGE]),
        (payload, variables) => payload.id === variables.id,
      ) as any,
    },
  },
};
