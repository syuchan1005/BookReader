import { BookInfo, Book, Genre } from '@syuchan1005/book-reader-graphql';
import BookInfoModel from './sequelize/models/BookInfo';
import BookModel from './sequelize/models/Book';

const util = {
  bookInfo(model: BookInfoModel, convertBook: boolean = true): BookInfo {
    return {
      id: model.id,
      name: model.name,
      thumbnail: model.thumbnail,
      count: model.count,
      history: model.history,
      genres: model.genres as unknown as Genre[] ?? [],
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
