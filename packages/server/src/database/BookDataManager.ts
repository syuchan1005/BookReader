import assert from 'assert';
import { SequelizeBookDataManager } from './sequelize/index';
import { PrismaBookDataManager } from './prisma';
import {
  Book,
  BookEditableValue,
  BookId,
  InputBook, SortableBookProperties,
} from './models/Book';
import {
  BookInfo, BookInfoEditableValue,
  BookInfoThumbnail,
  InfoId, InfoType, InputBookHistory,
  InputBookInfo, SortableBookInfoProperties,
} from './models/BookInfo';
import {
  Genre,
  GenreName,
  DeleteGenreError,
  GenreEditableValue,
} from './models/Genre';

export type RequireAtLeastOne<ObjectType,
  KeysType extends keyof ObjectType = keyof ObjectType,
  > = {
  [Key in KeysType]-?: Required<Pick<ObjectType, Key>> &
  Partial<Pick<ObjectType, Exclude<KeysType, Key>>>;
}[KeysType] & Pick<ObjectType, Exclude<keyof ObjectType, KeysType>>;

export function maybeRequireAtLeastOne<T extends {}>(obj: T): RequireAtLeastOne<T> | undefined {
  const hasValue = Object.keys(obj)
    .some((key) => obj[key] !== undefined && obj !== null);
  return !hasValue ? undefined : (obj as RequireAtLeastOne<T>);
}

export type SortKey = 'asc' | 'desc';

export interface IBookDataManager {
  init(): Promise<void>;

  getBook(bookId: BookId): Promise<Book | undefined>;

  addBook(book: InputBook): Promise<BookId>;

  editBook(bookId: BookId, value: RequireAtLeastOne<BookEditableValue>): Promise<void>;

  deleteBooks(infoId: InfoId, bookIds: Array<BookId>): Promise<void>;

  moveBooks(bookIds: Array<BookId>, destinationInfoId: InfoId): Promise<void>;

  getBookInfo(infoId: InfoId): Promise<BookInfo | undefined>;

  getBookInfoFromBookId(bookId: BookId): Promise<BookInfo | undefined>;

  getBookInfoThumbnail(infoId: InfoId): Promise<BookInfoThumbnail | undefined>;

  getBookInfoGenres(infoId: InfoId): Promise<Array<Genre> | undefined>;

  getBookInfoBooks(
    infoId: InfoId,
    sort?: Array<[SortableBookProperties, SortKey]>,
  ): Promise<Array<Book>>;

  getBookInfos(option: {
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
  }): Promise<Array<BookInfo>>;

  addBookInfo(bookInfo: InputBookInfo): Promise<InfoId>;

  addBookHistories(bookHistories: Array<InputBookHistory>): Promise<void>;

  editBookInfo(infoId: InfoId, bookInfo: RequireAtLeastOne<BookInfoEditableValue>): Promise<void>;

  deleteBookInfo(infoId: InfoId): Promise<void>;

  getGenre(genreName: GenreName): Promise<Genre | undefined>;

  getGenres(): Promise<Array<Genre>>;

  editGenre(
    genreName: GenreName,
    genre: RequireAtLeastOne<GenreEditableValue>,
  ): Promise<DeleteGenreError>;

  deleteGenre(genreName: GenreName): Promise<DeleteGenreError | undefined>;

  Debug: {
    getBookIds(): Promise<Array<BookId>>;
    getBookInfoCount(): Promise<number>;
  };
}

const prisma = new PrismaBookDataManager();
const sequelize = new SequelizeBookDataManager();

const removeDate = <T>(obj: T): T | undefined => {
  if (!obj) {
    return obj;
  }

  // @ts-ignore
  return JSON.parse(
    JSON.stringify(obj).replace(/,?"(createdAt|updatedAt)":".+Z"/g, ''),
  );
};

export const BookDataManager: IBookDataManager = new Proxy(sequelize, {
  get(target, prop, receiver) {
    const result = Reflect.get(target, prop, receiver);
    if (typeof prop === 'string' && !['sequelize', 'initModels', 'Debug'].includes(prop)) {
      const result2 = Reflect.get(prisma, prop, receiver);
      return async (...args) => {
        const r = await result.bind(target)(...args);
        let r2;
        try {
          r2 = await result2.bind(prisma)(...args);
        } catch (e) {
          r2 = e;
        }
        try {
          assert.deepEqual(removeDate(r), removeDate(r2));
        } catch (e) {
          console.error(prop, e);
        }
        return r;
      };
    }
    return result;
  },
});
