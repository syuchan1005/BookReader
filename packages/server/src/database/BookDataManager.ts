import { SequelizeBookDataManager } from './sequelize/index';
import { Book, BookEditableValue, BookId } from './models/Book';
import {
  BookInfo,
  BookInfoThumbnail,
  InfoId,
  InputBookInfo,
} from './models/BookInfo';
import { Genre } from './models/Genre';

export interface IBookDataManager {
  init(): Promise<void>

  getBook(bookId: BookId): Promise<Book | undefined>
  editBook(bookId: BookId, value: BookEditableValue): Promise<void>
  /**
   * Deletes book specified with {bookIds}.
   * If {bookIds} contains a book that it's not related to {infoId}, an error will occur.
   */
  deleteBooks(infoId: InfoId, bookIds: Array<BookId>): Promise<void>
  moveBooks(bookIds: Array<BookId>, destinationInfoId: InfoId): Promise<void>

  getBookInfo(infoId: InfoId): Promise<BookInfo | undefined>
  getBookInfoFromBookId(bookId: BookId): Promise<BookInfo | undefined>
  getBookInfoThumbnail(infoId: InfoId): Promise<BookInfoThumbnail | undefined>
  getBookInfoGenres(infoId: InfoId): Promise<Array<Genre> | undefined>
  addBookInfo(bookInfo: InputBookInfo): Promise<InfoId>
}

export const BookDataManager: IBookDataManager = new SequelizeBookDataManager();
