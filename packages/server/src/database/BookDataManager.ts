import { SequelizeBookDataManager } from './sequelize/index';
import { Book, BookEditableValue, BookId } from './models/Book';
import {
  BookInfo,
  BookInfoThumbnail,
  InfoId,
  InputBookInfo,
} from './models/BookInfo';
import { Genre } from './models/Genre';

export type RequireAtLeastOne<ObjectType,
  KeysType extends keyof ObjectType = keyof ObjectType,
  > = {
  [Key in KeysType]-?: Required<Pick<ObjectType, Key>> &
  Partial<Pick<ObjectType, Exclude<KeysType, Key>>>;
}[KeysType] & Pick<ObjectType, Exclude<keyof ObjectType, KeysType>>;

export function maybeRequireAtLeastOne<T extends {}>(obj: T): RequireAtLeastOne<T> | undefined {
  const hasValue = Object.keys(obj).some((key) => obj[key] !== undefined && obj !== null);
  return !hasValue ? undefined : (obj as RequireAtLeastOne<T>);
}

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

  addBookInfo(bookInfo: InputBookInfo): Promise<InfoId>;
}

export const BookDataManager: IBookDataManager = new SequelizeBookDataManager();
