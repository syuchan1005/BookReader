import { BookInfo, Book } from '../common/GraphqlTypes';
import { BookInfo as BookInfoModel } from './models/BookInfo';
import { Book as BookModel } from './models/Book';

const util = {
  bookInfo(model: BookInfoModel, convertBook: boolean = true): BookInfo {
    return {
      infoId: model.id,
      name: model.name,
      thumbnail: model.thumbnail,
      count: model.books.length,
      books: convertBook ? model.books.map(util.book) : [],
    };
  },
  book(model: BookModel): Book {
    return {
      bookId: model.id,
      info: util.bookInfo(model.info, false),
      pages: model.pages,
      number: model.number,
      thumbnail: model.thumbnail,
    };
  },
};

export default util;
