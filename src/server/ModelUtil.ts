import { BookInfo, Book } from '../common/GraphqlTypes';
import BookInfoModel from './sequelize/models/bookInfo';
import BookModel from './sequelize/models/book';

const util = {
  bookInfo(model: BookInfoModel, convertBook: boolean = true): BookInfo {
    return {
      id: model.id,
      name: model.name,
      thumbnail: model.thumbnail,
      count: model.count,
      books: convertBook && model.books ? model.books.map((b) => util.book(b, false)) : [],
    };
  },
  book(model: BookModel, convertInfo = true): Book {
    return {
      id: model.id,
      pages: model.pages,
      number: model.number,
      thumbnail: model.thumbnail,
      info: convertInfo ? util.bookInfo(model.info, false) : null,
    };
  },
};

export default util;
