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
      books: convertBook && model.books
        ? model.books.map((b) => util.book(b, false, model.id))
        : [],
    };
  },
  book(model: BookModel, convertInfo = true, infoId?): Book {
    let info = convertInfo
      ? util.bookInfo(model.info, false)
      : null;
    if (!info && infoId) info = <BookInfo>{ id: infoId };
    return {
      id: model.id,
      pages: model.pages,
      number: model.number,
      thumbnail: model.thumbnail,
      info,
    };
  },
};

export default util;
