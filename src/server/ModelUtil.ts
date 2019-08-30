import { BookInfo, Book } from '../common/GraphqlTypes';
import { bookInfo as BookInfoModel } from './sequelize/models/bookInfo';
import { book as BookModel } from './sequelize/models/book';

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
