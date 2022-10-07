import { INSTANCE } from './prisma';
import {
  Book,
  BookEditableValue,
  BookId,
  InputBook,
  SortableBookProperties,
} from './models/Book';
import {
  BookInfo,
  BookInfoEditableValue,
  BookInfoThumbnail,
  InfoId,
  InputBookInfo,
  SortableBookInfoProperties,
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

  getBooks(bookIds: BookId[]): Promise<Book[]>;

  addBook(book: InputBook): Promise<BookId>;

  editBook(bookId: BookId, value: RequireAtLeastOne<BookEditableValue>): Promise<void>;

  deleteBooks(infoId: InfoId, bookIds: Array<BookId>): Promise<void>;

  moveBooks(bookIds: Array<BookId>, destinationInfoId: InfoId): Promise<void>;

  getBookInfo(infoId: InfoId): Promise<BookInfo | undefined>;

  getBookInfosFromIds(infoIds: InfoId[]): Promise<BookInfo[]>;

  getBookInfoFromBookId(bookId: BookId): Promise<BookInfo | undefined>;

  getBookInfoThumbnail(infoId: InfoId): Promise<BookInfoThumbnail | undefined>;

  getBookInfoGenres(infoId: InfoId): Promise<Array<Genre>>;

  getBookInfoBooks(
    infoId: InfoId,
    sort: Array<[SortableBookProperties, SortKey]>, /* = [['updatedAt', 'asc']] */
  ): Promise<Array<Book>>;

  getBookInfos(option: {
    limit?: number,
    filter: {
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
    getBookInfos(): Promise<(BookInfo & { genres: Genre[] })[]>;
    getBookInfo(infoId: string): Promise<(BookInfo & { genres: Genre[] }) | undefined>;
  };
}

export const BookDataManager: IBookDataManager = INSTANCE;
