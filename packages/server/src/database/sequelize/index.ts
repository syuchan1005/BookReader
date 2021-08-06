import { Op, Transaction } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import { Book, BookEditableValue, BookId } from '@server/database/models/Book';
import {
  BookInfo, BookInfoEditableValue,
  BookInfoThumbnail,
  InfoId, InputBookHistory,
  InputBookInfo, SortableBookInfoProperties,
} from '@server/database/models/BookInfo';
import { Genre, InputGenre } from '@server/database/models/Genre';
import BookModel from '@server/database/sequelize/models/Book';
import BookInfoModel from '@server/database/sequelize/models/BookInfo';
import GenreModel from '@server/database/sequelize/models/Genre';
import InfoGenreModel from '@server/database/sequelize/models/InfoGenre';
import { IBookDataManager, RequireAtLeastOne, SortKey } from '../BookDataManager';
import Database from './models';

type IsNullable<T, K> = undefined extends T ? K : never;
type NullableKeys<T> = { [K in keyof T]-?: IsNullable<T[K], K> }[keyof T];

function removeNullableEntries<T extends {}>(obj: T): Omit<T, NullableKeys<T>> {
  const entries = Object.entries(obj)
    .filter(([_, value]) => value !== undefined && value !== null);
  return Object.fromEntries(entries) as Omit<T, NullableKeys<T>>;
}

export class SequelizeBookDataManager implements IBookDataManager {
  async init() {
    await Database.sync();
  }

  async getBook(bookId: BookId): Promise<Book | undefined> {
    return BookModel.findOne({
      where: { id: bookId },
    });
  }

  async editBook(bookId: BookId, value: RequireAtLeastOne<BookEditableValue>): Promise<void> {
    await BookModel.update(removeNullableEntries(value), {
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

  getBookInfoBooks(
    infoId: InfoId,
    sort?: Array<[SortableBookInfoProperties, SortKey]>,
  ): Promise<Array<Book>> {
    return BookModel.findAll({
      where: { infoId },
      order: sort,
    });
  }

  async addBookInfo({
    id,
    genres = [],
    ...bookInfo
  }: InputBookInfo): Promise<InfoId> {
    const infoId = id || uuidv4();
    await Database.sequelize.transaction(async (transaction) => {
      await BookInfoModel.create({
        id: infoId,
        ...bookInfo,
      }, { transaction });
      await this.#linkGenres(infoId, genres, transaction);
    });
    return infoId;
  }

  async addBookHistories(bookHistories: Array<InputBookHistory>): Promise<void> {
    await BookInfoModel.bulkCreate(
      bookHistories.map(({
        name,
        count
      }) => ({
        id: uuidv4(),
        history: true,
        name,
        count,
      })),
    );
  }

  async editBookInfo(
    infoId: InfoId,
    {
      genres,
      ...bookInfo
    }: RequireAtLeastOne<BookInfoEditableValue>,
  ): Promise<void> {
    const editBookInfo = removeNullableEntries(bookInfo);
    await Database.sequelize.transaction(async (transaction) => {
      if (Object.keys(editBookInfo).length !== 0) {
        await BookInfoModel.update(editBookInfo, {
          where: { id: infoId },
          transaction,
        });
      }
      if (genres) {
        await this.#linkGenres(infoId, genres, transaction);
      }
    });
  }

  async #linkGenres(
    infoId: string,
    genres: Array<InputGenre>,
    transaction?: Transaction,
  ) {
    const dbGenres = (await InfoGenreModel.findAll({
      where: { infoId },
      include: [{
        model: GenreModel,
        as: 'genre',
      }],
      transaction,
    })).map((g) => g.genre);

    const genreNames = genres.map(({ name }) => name);
    const rmGenres = dbGenres.filter((g) => !genreNames.includes(g.name));
    const addGenres = genreNames.filter((g) => !dbGenres.find((v) => v.name === g));

    await InfoGenreModel.destroy({
      where: {
        infoId,
        genreId: rmGenres.map((g) => g.id),
      },
      transaction,
    });

    await GenreModel.bulkCreate(addGenres.map((name) => ({
      name,
    })), {
      ignoreDuplicates: true,
      transaction,
    });

    const addedGenres = await GenreModel.findAll({
      attributes: ['id'],
      where: {
        name: addGenres,
      },
      transaction,
    });

    await InfoGenreModel.bulkCreate(addedGenres.map((a) => ({
      infoId,
      genreId: a.id,
    })), { transaction });
  }

  deleteBookInfo(infoId: InfoId): Promise<void> {
    return Database.sequelize.transaction(async (transaction) => {
      await BookModel.destroy({
        where: {
          infoId,
        },
        transaction,
      });
      await InfoGenreModel.destroy({
        where: {
          infoId,
        },
        transaction,
      });
      await BookInfoModel.destroy({
        where: {
          id: infoId,
        },
        transaction,
      });
    });
  }

  get Debug() {
    return {
      getBookIds: (): Promise<Array<BookId>> => BookModel.findAll({
        attributes: ['id'],
      })
        .then((books) => books.map(({ id }) => id)),

      getBookInfoCount: (): Promise<number> => BookInfoModel.count(),
    };
  }
}
