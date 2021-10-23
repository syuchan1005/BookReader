/* eslint no-underscore-dangle: ["error", { "allow": ["_count"] }] */
import { PrismaClient, BookInfo as PBookInfo, Book as PBook } from '@prisma/client';

import { IBookDataManager, RequireAtLeastOne, SortKey } from '@server/database/BookDataManager';
import {
  Book, BookEditableValue, BookId, InputBook, SortableBookProperties,
} from '@server/database/models/Book';
import {
  BookInfo, BookInfoEditableValue,
  BookInfoThumbnail,
  InfoId, InfoType, InputBookHistory,
  InputBookInfo, SortableBookInfoProperties,
} from '@server/database/models/BookInfo';
import {
  DeleteGenreError,
  Genre,
  GenreEditableValue,
  GenreName,
} from '@server/database/models/Genre';
import { defaultGenres } from '@syuchan1005/book-reader-common';
import { generateId } from '@server/database/models/Id';
import { FeatureFlag } from '@server/FeatureFlag.js';
import {
  BatchLoading,
  BatchLoadingClear,
  BatchLoadingClearAll,
} from '@server/database/BatchLoading';

type IsNullable<T, K> = undefined extends T ? K : never;
type NullableKeys<T> = { [K in keyof T]-?: IsNullable<T[K], K> }[keyof T];

function removeNullableEntries<T extends {}>(obj: T): Omit<T, NullableKeys<T>> {
  const entries = Object.entries(obj)
    .filter(([_, value]) => value !== undefined && value !== null);
  return Object.fromEntries(entries) as Omit<T, NullableKeys<T>>;
}

// Same as scripts/prisma-migrate.js
const env = (process.argv[2] || process.env.NODE_ENV) === 'production'
  ? 'production'
  : 'development';

const PrismaErrorCode = {
  UniqueConstraintFailed: 'P2002',
} as const;

export class PrismaBookDataManager implements IBookDataManager {
  private prismaClient: PrismaClient;

  async init(databaseUrl?: string): Promise<void> {
    const url = databaseUrl ?? `file:../${env}${FeatureFlag.prisma.dbFileSuffix}.sqlite`;
    this.prismaClient = new PrismaClient({
      datasources: {
        db: { url },
      },
      log: [{
        level: 'query',
        emit: 'event',
      }],
    });
    // this.prismaClient.$on('query', console.log);
    // The `prismaClient` has the`.$connect(): Promise` method. But, It'll be called automatically.
  }

  async getBook(bookId: BookId): Promise<Book | undefined> {
    const book = await this.prismaClient.book.findUnique({
      where: { id: bookId },
    });
    if (book) {
      delete book.thumbnailById;
    }
    return book;
  }

  @BatchLoadingClear<[InputBook]>(
    'getBookInfoThumbnail',
    (args) => args[0].infoId,
  )
  async addBook({
    id,
    infoId,
    ...book
  }: InputBook): Promise<BookId> {
    const bookId = id || generateId();
    await this.prismaClient.$transaction(async (transactionalPrismaClient) => {
      await transactionalPrismaClient.book.create({
        data: {
          id: bookId,
          infoId,
          ...book,
        },
      });
      await transactionalPrismaClient.bookInfo.updateMany({
        where: { id: infoId },
        data: {
          historyBookCount: null,
          updatedAt: new Date(),
        },
      });
      try {
        await transactionalPrismaClient.book.update({
          where: { id: bookId },
          data: { thumbnailById: infoId },
        });
      } catch (e) {
        if (e.code !== PrismaErrorCode.UniqueConstraintFailed) {
          throw e;
        }
      }
    });
    return bookId;
  }

  @BatchLoadingClearAll('getBookInfoThumbnail')
  async editBook(bookId: BookId, value: RequireAtLeastOne<BookEditableValue>): Promise<void> {
    await this.prismaClient.book.update({
      where: { id: bookId },
      data: removeNullableEntries(value),
    });
  }

  @BatchLoadingClearAll('getBookInfoThumbnail')
  async deleteBooks(infoId: InfoId, bookIds: Array<BookId>): Promise<void> {
    await this.prismaClient.$transaction([
      this.prismaClient.book.deleteMany({
        where: {
          infoId,
          id: {
            in: bookIds,
          },
        },
      }),
      this.prismaClient.bookInfo.update({
        where: { id: infoId },
        data: { updatedAt: new Date() },
      }),
    ]);
  }

  @BatchLoadingClearAll('getBookInfoThumbnail')
  async moveBooks(bookIds: Array<BookId>, destinationInfoId: InfoId): Promise<void> {
    if (bookIds.length === 0) {
      return;
    }

    await this.prismaClient.$transaction([
      this.prismaClient.book.updateMany({
        where: {
          id: {
            in: bookIds,
          },
        },
        data: {
          infoId: destinationInfoId,
          thumbnailById: null,
        },
      }),
      this.prismaClient.bookInfo.update({
        where: { id: destinationInfoId },
        data: { historyBookCount: null },
      }),
    ]);
  }

  async getBookInfo(infoId: InfoId): Promise<BookInfo | undefined> {
    const bookInfo = await this.prismaClient.bookInfo.findUnique({
      where: { id: infoId },
      include: {
        _count: {
          select: {
            books: true,
          },
        },
      },
    });
    return PrismaBookDataManager.convertBookInfo(bookInfo);
  }

  async getBookInfoFromBookId(bookId: BookId): Promise<BookInfo | undefined> {
    const book = await this.prismaClient.book.findUnique({
      where: { id: bookId },
      include: {
        bookInfo: {
          include: {
            _count: {
              select: {
                books: true,
              },
            },
          },
        },
      },
    });
    return PrismaBookDataManager.convertBookInfo(book?.bookInfo);
  }

  private static convertBookInfo(
    bookInfo: PBookInfo & { _count: { books: number } },
  ): BookInfo | undefined {
    if (!bookInfo) {
      return undefined;
    }
    const bookCount = bookInfo._count.books;
    const isHistory = bookInfo.historyBookCount !== null && bookCount === 0;
    return {
      id: bookInfo.id,
      name: bookInfo.name,
      isHistory,
      bookCount: isHistory ? bookInfo.historyBookCount : bookCount,
      createdAt: bookInfo.createdAt,
      updatedAt: bookInfo.updatedAt,
    };
  }

  @BatchLoading<InfoId, BookInfoThumbnail>(
    'getBookInfoThumbnail',
    async (infoIds) => {
      const bookMap = await INSTANCE.prismaClient.book.findMany({
        where: {
          thumbnailById: {
            in: infoIds,
          },
        },
      }).then((books) => {
        const result = {};
        books.forEach((info) => {
          result[info.thumbnailById] = info;
        });
        return result;
      });
      return infoIds
        .map((id) => PrismaBookDataManager.convertBookInfoThumbnail(bookMap[id]));
    },
  )
  async getBookInfoThumbnail(infoId: InfoId): Promise<BookInfoThumbnail | undefined> {
    const thumbnailBook = await this.prismaClient.book.findFirst({
      where: { thumbnailById: infoId },
    });
    return PrismaBookDataManager.convertBookInfoThumbnail(thumbnailBook);
  }

  private static convertBookInfoThumbnail(
    thumbnailBook?: PBook,
  ): BookInfoThumbnail | undefined {
    return thumbnailBook ? {
      bookId: thumbnailBook.id,
      pageCount: thumbnailBook.pageCount,
      thumbnailPage: thumbnailBook.thumbnailPage,
    } : undefined;
  }

  async getBookInfoGenres(infoId: InfoId): Promise<Array<Genre>> {
    const bookInfo = await this.prismaClient.bookInfo.findUnique({
      where: {
        id: infoId,
      },
      include: {
        genres: {
          include: {
            genre: true,
          },
        },
      },
    });
    return bookInfo?.genres?.map(({ genre }) => genre) ?? [];
  }

  async getBookInfoBooks(
    infoId: InfoId,
    sort: Array<[SortableBookProperties, SortKey]>,
  ): Promise<Array<Book>> {
    const bookInfo = await this.prismaClient.bookInfo.findUnique({
      where: { id: infoId },
      include: {
        books: {
          orderBy: (sort.length === 0 ? [['updatedAt', 'asc']] : sort)
            .map(([key, order]) => ({ [key]: order })),
        },
      },
    });
    return bookInfo?.books?.map((b) => {
      // eslint-disable-next-line no-param-reassign
      delete b.thumbnailById;
      return b;
    });
  }

  async getBookInfos(option: {
    limit?: number,
    filter: {
      infoType?: InfoType,
      genres?: Array<GenreName>,
      name: {
        include?: string,
        between?: [string | undefined, string | undefined],
      },
      createdAt?: [number | undefined, number | undefined],
      updatedAt?: [number | undefined, number | undefined],
    },
    sort?: Array<[SortableBookInfoProperties, SortKey]>,
  }): Promise<Array<BookInfo>> {
    const {
      limit,
      filter: {
        infoType,
        genres,
        name: {
          include,
          between,
        },
        createdAt,
        updatedAt,
      },
      sort,
    } = option;

    const genreFilter = genres.length === 0
      ? {
        where: {
          NOT: {
            genres: {
              some: {
                genre: {
                  isInvisible: true,
                },
              },
            },
          },
        },
        include: {
          genres: {
            include: {
              genre: true,
            },
          },
        },
      }
      : {
        where: {
          genres: {
            some: {
              genreName: {
                in: genres,
              },
            },
          },
        },
      };

    let historyFilter: {} | undefined;
    if (infoType === 'Normal') {
      historyFilter = {
        historyBookCount: null,
      };
    } else if (infoType === 'History') {
      historyFilter = {
        historyBookCount: {
          not: null,
        },
      };
    }

    const bookInfos = await this.prismaClient.bookInfo.findMany({
      take: limit,
      where: {
        ...historyFilter,
        name: {
          contains: include,
          gt: between?.[0],
          lt: between?.[1],
        },
        createdAt: {
          gt: createdAt?.[0] ? new Date(createdAt[0]) : undefined,
          lt: createdAt?.[1] ? new Date(createdAt[1]) : undefined,
        },
        updatedAt: {
          gt: updatedAt?.[0] ? new Date(updatedAt[0]) : undefined,
          lt: updatedAt?.[1] ? new Date(updatedAt[1]) : undefined,
        },
        ...genreFilter.where,
      },
      orderBy: sort.map(([key, order]) => ({ [key]: order })),
      include: {
        ...genreFilter.include,
        _count: {
          select: {
            books: true,
          },
        },
      },
    });
    return bookInfos.map(({
      genres: _,
      ...bookInfo
    }) => PrismaBookDataManager.convertBookInfo(bookInfo));
  }

  async addBookInfo({
    id,
    genres = [],
    ...bookInfo
  }: InputBookInfo): Promise<InfoId> {
    const infoId = id || generateId();
    await this.prismaClient.bookInfo.create({
      data: {
        id: infoId,
        genres: {
          create: genres.map(({
            name,
            isInvisible,
          }) => ({
            genre: {
              connectOrCreate: {
                where: { name },
                create: {
                  name,
                  isInvisible,
                },
              },
            },
          })),
        },
        ...bookInfo,
      },
    });
    return infoId;
  }

  async addBookHistories(bookHistories: Array<InputBookHistory>): Promise<void> {
    const createMany = bookHistories
      .map(({
        name,
        bookCount,
      }) => this.prismaClient.bookInfo.create({
        data: {
          id: generateId(),
          name,
          historyBookCount: bookCount,
        },
      }));
    await this.prismaClient.$transaction(createMany);
  }

  @BatchLoadingClear('getBookInfoThumbnail')
  async editBookInfo(
    infoId: InfoId,
    {
      name: bookName,
      genres,
      thumbnail,
    }: RequireAtLeastOne<BookInfoEditableValue>,
  ): Promise<void> {
    if (!bookName && !genres && !thumbnail) {
      return;
    }
    await this.prismaClient.$transaction(async (transactionalPrismaClient) => {
      if (bookName || genres) {
        await transactionalPrismaClient.bookInfo.update({
          where: { id: infoId },
          data: {
            id: infoId,
            name: bookName,
            genres: {
              connectOrCreate: (genres || []).map(({
                name,
                isInvisible,
              }) => ({
                where: {
                  infoId_genreName: {
                    infoId,
                    genreName: name,
                  },
                },
                create: {
                  genre: {
                    connectOrCreate: {
                      where: { name },
                      create: {
                        name,
                        isInvisible,
                      },
                    },
                  },
                },
              })),
            },
          },
        });
        await transactionalPrismaClient.bookInfosToGenres.deleteMany({
          where: {
            infoId,
            genreName: {
              notIn: (genres || []).map(({ name }) => name),
            },
          },
        });
      }
      if (thumbnail) {
        const oldThumbnailBook = await transactionalPrismaClient.book.findUnique({
          where: { thumbnailById: infoId },
          select: { updatedAt: true },
        });
        if (oldThumbnailBook) {
          await transactionalPrismaClient.book.updateMany({
            where: { thumbnailById: infoId },
            data: {
              thumbnailById: null,
              updatedAt: oldThumbnailBook.updatedAt,
            },
          });
        }
        const newThumbnailBook = await transactionalPrismaClient.book.findFirst({
          where: {
            id: thumbnail,
            infoId,
          },
          select: { updatedAt: true },
        });
        await transactionalPrismaClient.book.updateMany({
          where: {
            id: thumbnail,
            infoId,
          },
          data: {
            thumbnailById: infoId,
            updatedAt: newThumbnailBook.updatedAt,
          },
        });
        await transactionalPrismaClient.bookInfo.update({
          where: { id: infoId },
          data: { updatedAt: new Date() },
        });
      }
    });
  }

  @BatchLoadingClear('getBookInfoThumbnail')
  async deleteBookInfo(infoId: InfoId): Promise<void> {
    await this.prismaClient.bookInfo.delete({ where: { id: infoId } });
  }

  getGenre(genreName: GenreName): Promise<Genre | undefined> {
    return this.prismaClient.genre.findUnique({
      where: { name: genreName },
    });
  }

  getGenres(): Promise<Array<Genre>> {
    return this.prismaClient.genre.findMany();
  }

  async editGenre(
    genreName: GenreName,
    genre: RequireAtLeastOne<GenreEditableValue>,
  ): Promise<DeleteGenreError> {
    if (defaultGenres.includes(genreName)) {
      return 'DELETE_DEFAULT';
    }
    await this.prismaClient.genre.update({
      where: { name: genreName },
      data: removeNullableEntries(genre),
    });
    return undefined;
  }

  async deleteGenre(genreName: GenreName): Promise<DeleteGenreError | undefined> {
    if (defaultGenres.includes(genreName)) {
      return 'DELETE_DEFAULT';
    }
    await this.prismaClient.genre.delete({ where: { name: genreName } });
    return undefined;
  }

  get Debug() {
    return {
      getBookIds: (): Promise<Array<BookId>> => this.prismaClient.book.findMany({
        select: {
          id: true,
        },
      })
        .then((books) => books.map(({ id }) => id)),

      getBookInfoCount: (): Promise<number> => this.prismaClient.bookInfo.count(),
    };
  }
}

export const INSTANCE = new PrismaBookDataManager();
