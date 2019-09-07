import { BookInfo, Book, SimpleBookInfo } from '../common/GraphqlTypes';
import BookInfoModel from './sequelize/models/bookInfo';
import BookModel from './sequelize/models/book';

const util = {
  bookInfo(model: BookInfoModel, convertBook: boolean = true): BookInfo {
    return {
      infoId: model.id,
      name: model.name,
      thumbnail: model.thumbnail,
      count: model.count,
      books: convertBook && model.books ? model.books.map((b) => util.book(b, false)) : [],
    };
  },
  book(model: BookModel, convertInfo = true): Book {
    return {
      bookId: model.id,
      pages: model.pages,
      number: model.number,
      thumbnail: model.thumbnail,
      info: convertInfo ? <SimpleBookInfo>util.bookInfo(model.info, false) : null,
    };
  },
};

export default util;
