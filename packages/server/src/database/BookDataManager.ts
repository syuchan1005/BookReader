import { SequelizeBookDataManager } from './sequelize/index';
import { Book, BookEditableValue, BookId } from './models/Book';
import {
  BookInfo, BookInfoEditableValue,
  BookInfoThumbnail,
  InfoId, InputBookHistory,
  InputBookInfo, SortableBookInfoProperties,
} from './models/BookInfo';
import { DeleteGenreError, Genre, GenreEditableValue } from './models/Genre';

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

  editBook(bookId: BookId, value: RequireAtLeastOne<BookEditableValue>): Promise<void>;

  /**
   * Deletes book specified with {bookIds}.
   * If {bookIds} contains a book that it's not related to {infoId}, an error will occur.
   */
  deleteBooks(infoId: InfoId, bookIds: Array<BookId>): Promise<void>;

  moveBooks(bookIds: Array<BookId>, destinationInfoId: InfoId): Promise<void>;

  getBookInfo(infoId: InfoId): Promise<BookInfo | undefined>;

  getBookInfoFromBookId(bookId: BookId): Promise<BookInfo | undefined>;

  getBookInfoThumbnail(infoId: InfoId): Promise<BookInfoThumbnail | undefined>;

  getBookInfoGenres(infoId: InfoId): Promise<Array<Genre> | undefined>;

  getBookInfoBooks(
    infoId: InfoId,
    sort?: Array<[SortableBookInfoProperties, SortKey]>,
  ): Promise<Array<Book>>;

  addBookInfo(bookInfo: InputBookInfo): Promise<InfoId>;

  addBookHistories(bookHistories: Array<InputBookHistory>): Promise<void>;

  editBookInfo(infoId: InfoId, bookInfo: RequireAtLeastOne<BookInfoEditableValue>): Promise<void>;

  deleteBookInfo(infoId: InfoId): Promise<void>;

  getGenre(genreName: Genre['name']): Promise<Genre | undefined>;

  getGenres(): Promise<Array<Genre>>;

  editGenre(
    genreName: Genre['name'],
    genre: RequireAtLeastOne<GenreEditableValue>,
  ): Promise<DeleteGenreError>;

  deleteGenre(genreName: Genre['name']): Promise<DeleteGenreError | undefined>;

  Debug: {
    getBookIds(): Promise<Array<BookId>>;
    getBookInfoCount(): Promise<number>;
  };
}

export const BookDataManager: IBookDataManager = new SequelizeBookDataManager();
