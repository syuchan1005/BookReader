import { Op } from 'sequelize';

import { Book, BookEditableValue, BookId } from '@server/database/models/Book';
import { BookInfo, BookInfoThumbnail, InfoId } from '@server/database/models/BookInfo';
import { Genre } from '@server/database/models/Genre';
import BookModel from '@server/database/sequelize/models/Book';
import BookInfoModel from '@server/database/sequelize/models/BookInfo';
import GenreModel from '@server/database/sequelize/models/Genre';
import { IBookDataManager } from '../BookDataManager';
import Database from './models';

export class SequelizeBookDataManager implements IBookDataManager {
  async init() {
    await Database.sync();
  }

  async getBook(bookId: BookId): Promise<Book | undefined> {
    return BookModel.findOne({
      where: { id: bookId },
    });
  }

  async editBook(bookId: BookId, value: BookEditableValue): Promise<void> {
    await BookModel.update(value, {
      where: { id: bookId },
    });
  }

  deleteBooks(infoId: InfoId, bookIds: Array<BookId>): Promise<void> {
    return Database.sequelize.transaction(async (transaction) => {
      const deleteCount = await BookModel.destroy({
        where: {
          id: { [Op.in]: bookIds },
          infoId,
        },
        transaction,
      });
      if (bookIds.length !== deleteCount) {
        throw new Error();
      }
      await BookInfoModel.update({
        // @ts-ignore
        count: Database.sequelize.literal(`count - ${deleteCount}`),
      }, {
        where: { id: infoId },
        transaction,
      });
    });
  }

  async moveBooks(bookIds: Array<BookId>, destinationInfoId: InfoId): Promise<void> {
    await BookModel.update({ infoId: destinationInfoId }, {
      where: {
        id: { [Op.in]: bookIds },
      },
    });
  }

  async getBookInfo(infoId: InfoId): Promise<BookInfo | undefined> {
    return BookInfoModel.findOne({
      where: { id: infoId },
    });
  }

  async getBookInfoFromBookId(bookId: BookId): Promise<BookInfo | undefined> {
    const book = await BookModel.findOne({
      where: { id: bookId },
      include: [{
        model: BookInfoModel,
        as: 'info',
      }],
    });
    return book?.info;
  }

  async getBookInfoThumbnail(infoId: InfoId): Promise<BookInfoThumbnail | undefined> {
    const bookInfo = await BookInfoModel.findOne({
      where: { id: infoId },
      include: [
        {
          model: BookModel,
          as: 'thumbnailBook',
        },
      ],
    });
    const thumbnail = bookInfo?.thumbnailBook;
    if (!thumbnail) {
      return undefined;
    }
    return {
      bookId: thumbnail.id,
      pages: thumbnail.pages,
      thumbnail: thumbnail.thumbnail,
    };
  }

  async getBookInfoGenres(infoId: InfoId): Promise<Array<Genre> | undefined> {
    const bookInfo = await BookInfoModel.findOne({
      where: { id: infoId },
      include: [
        {
          model: GenreModel,
          as: 'genres',
        },
      ],
    });
    return bookInfo?.genres;
  }
}
