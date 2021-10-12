import {
  Op,
  Transaction,
  literal,
  Sequelize,
  Options,
} from 'sequelize';

import { defaultGenres } from '@syuchan1005/book-reader-common';
import {
  Book, BookEditableValue, BookId, InputBook, SortableBookProperties,
} from '@server/database/models/Book';
import {
  BookInfo, BookInfoEditableValue,
  BookInfoThumbnail,
  InfoId, InfoType, InputBookHistory,
  InputBookInfo, SortableBookInfoProperties,
} from '@server/database/models/BookInfo';
import {
  DeleteGenreError,
  Genre,
  GenreEditableValue,
  GenreName,
  InputGenre,
} from '@server/database/models/Genre';
import BookModel from '@server/database/sequelize/models/Book';
import BookInfoModel from '@server/database/sequelize/models/BookInfo';
import GenreModel from '@server/database/sequelize/models/Genre';
import InfoGenreModel from '@server/database/sequelize/models/InfoGenre';
import { generateId } from '@server/database/models/Id';
import { IBookDataManager, RequireAtLeastOne, SortKey } from '../BookDataManager';

import * as baseConfig from '../../../sequelize.config';

type IsNullable<T, K> = undefined extends T ? K : never;
type NullableKeys<T> = { [K in keyof T]-?: IsNullable<T[K], K> }[keyof T];

function removeNullableEntries<T extends {}>(obj: T): Omit<T, NullableKeys<T>> {
  const entries = Object.entries(obj)
    .filter(([_, value]) => value !== undefined && value !== null);
  return Object.fromEntries(entries) as Omit<T, NullableKeys<T>>;
}

export class SequelizeBookDataManager implements IBookDataManager {
  private sequelize: Sequelize;

  async init(options: Options = undefined) {
    const env = process.env.NODE_ENV || 'development';
    const config: Options = baseConfig[env];
    this.sequelize = SequelizeBookDataManager.createSequelize(options || config);
    await this.initModels();
  }

  private static createSequelize(
    // eslint-disable-next-line camelcase
    config: Options & { dialect?: string, use_env_variable?: string },
  ) {
    let sequelize;
    if (config.dialect === 'sqlite') {
      sequelize = new Sequelize(config);
    } else if (config.use_env_variable) {
      sequelize = new Sequelize(process.env[config.use_env_variable], config);
    } else {
      sequelize = new Sequelize(config.database, config.username, config.password, config);
    }
    return sequelize;
  }

  private async initModels() {
    const modelList = [BookModel, BookInfoModel, GenreModel, InfoGenreModel];
    modelList.forEach((module) => {
      module.initModel(this.sequelize);
    });
    modelList.forEach((module) => {
      // @ts-ignore
      if (module.associate) module.associate();
    });
    await this.sequelize.sync();
    await modelList.reduce(
      // @ts-ignore
      (promise, model) => promise.then(() => (model.seed ? model.seed() : Promise.resolve())),
      Promise.resolve(),
    );
  }

  async getBook(bookId: BookId): Promise<Book | undefined> {
    return BookModel.findOne({
      where: { id: bookId },
    }).then(SequelizeBookDataManager.createBook);
  }

  private static createBook(bookModel?: BookModel): Book | undefined {
    if (!bookModel) {
      return undefined;
    }
    return {
      id: bookModel.id,
      thumbnailPage: bookModel.thumbnail,
      number: bookModel.number,
      pageCount: bookModel.pages,
      infoId: bookModel.infoId,
      createdAt: bookModel.createdAt,
      updatedAt: bookModel.updatedAt,
    };
  }

  async addBook({
    id,
    infoId,
    ...book
  }: InputBook): Promise<BookId> {
    const bookId = id || generateId();
    await this.sequelize.transaction(async (transaction) => {
      await BookModel.create({
        ...book,
        id: bookId,
        infoId,
        pages: book.pageCount,
        thumbnail: book.thumbnailPage,
      }, {
        transaction,
      });
      await BookInfoModel.update({
        count: literal('count + 1'),
      }, {
        where: {
          id: infoId,
        },
        transaction,
      });
      await BookInfoModel.update({
        history: false,
        count: 1,
      }, {
        where: {
          id: infoId,
          history: true,
        },
        transaction,
      });
      await BookInfoModel.update({
        thumbnail: bookId,
      }, {
        where: {
          id: infoId,
          thumbnail: null,
        },
        transaction,
      });
    });
    return bookId;
  }

  async editBook(
    bookId: BookId,
    { number, thumbnailPage, pageCount }: RequireAtLeastOne<BookEditableValue>,
  ): Promise<void> {
    await BookModel.update(removeNullableEntries({
      number,
      thumbnail: thumbnailPage,
      pages: pageCount,
    }), {
      where: { id: bookId },
    });
  }

  deleteBooks(infoId: InfoId, bookIds: Array<BookId>): Promise<void> {
    return this.sequelize.transaction(async (transaction) => {
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
        count: literal(`count - ${deleteCount}`),
      }, {
        where: { id: infoId },
        transaction,
      });
    });
  }

  async moveBooks(bookIds: Array<BookId>, destinationInfoId: InfoId): Promise<void> {
    const books = await BookModel.findAll({
      where: {
        id: { [Op.in]: bookIds },
      },
    });
    const infoToBooks: { [infoId: string]: string[] } = {};
    books.forEach(({ id, infoId }) => {
      infoToBooks[infoId] = [...(infoToBooks[infoId] || []), id];
    });

    await this.sequelize.transaction(async (transaction) => {
      await BookModel.update({ infoId: destinationInfoId }, {
        where: {
          id: { [Op.in]: bookIds },
        },
        transaction,
      });
      await BookInfoModel.update({
        count: literal(`count + ${bookIds.length}`),
      }, {
        where: { id: destinationInfoId },
        transaction,
      });
      await Promise.all(
        Object.entries(infoToBooks)
          .map(([infoId, ids]) => BookInfoModel.update({
            count: literal(`count - ${ids.length}`),
          }, {
            where: { id: infoId },
            transaction,
          })),
      );
    });
  }

  async getBookInfo(infoId: InfoId): Promise<BookInfo | undefined> {
    return BookInfoModel.findOne({
      where: { id: infoId },
    }).then(SequelizeBookDataManager.createBookInfo);
  }

  private static createBookInfo(bookInfoModel?: BookInfoModel): BookInfo | undefined {
    if (!bookInfoModel) {
      return undefined;
    }
    return {
      id: bookInfoModel.id,
      name: bookInfoModel.name,
      bookCount: bookInfoModel.count,
      isHistory: bookInfoModel.history,
      createdAt: bookInfoModel.createdAt,
      updatedAt: bookInfoModel.updatedAt,
    };
  }

  async getBookInfoFromBookId(bookId: BookId): Promise<BookInfo | undefined> {
    const book = await BookModel.findOne({
      where: { id: bookId },
      include: [{
        model: BookInfoModel,
        as: 'info',
      }],
    });
    return SequelizeBookDataManager.createBookInfo(book?.info);
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
      pageCount: thumbnail.pages,
      thumbnailPage: thumbnail.thumbnail,
    };
  }

  async getBookInfoGenres(infoId: InfoId): Promise<Array<Genre>> {
    const bookInfo = await BookInfoModel.findOne({
      where: { id: infoId },
      include: [
        {
          model: GenreModel,
          as: 'genres',
        },
      ],
    });
    return bookInfo?.genres?.map(SequelizeBookDataManager.createGenre);
  }

  private static createGenre(genreModel?: GenreModel): Genre | undefined {
    if (!genreModel) {
      return undefined;
    }
    return {
      name: genreModel.name,
      isInvisible: genreModel.invisible,
    };
  }

  getBookInfoBooks(
    infoId: InfoId,
    sort: Array<[SortableBookProperties, SortKey]>,
  ): Promise<Array<Book>> {
    return BookModel.findAll({
      where: { infoId },
      order: sort.length === 0 ? [['updatedAt', 'asc']] : sort,
    }).then((books) => books.map(SequelizeBookDataManager.createBook));
  }

  getBookInfos(option: {
    limit?: number,
    filter: {
      infoType?: InfoType,
      genres?: Array<GenreName>,
      name: {
        include?: string,
        between?: [string | undefined, string | undefined],
      },
      createdAt?: [number | undefined, number | undefined],
      updatedAt?: [number | undefined, number | undefined],
    },
    sort?: Array<[SortableBookInfoProperties, SortKey]>,
  }): Promise<Array<BookInfo>> {
    const {
      limit,
      filter: {
        infoType,
        genres,
        name: {
          include,
          between,
        },
        createdAt,
        updatedAt,
      },
      sort,
    } = option;
    const invisibleGenreInfoIdWhere = genres.length === 0
      ? {
        [Op.notIn]: literal('('
          + 'SELECT DISTINCT infoId FROM infoGenres INNER JOIN genres g on infoGenres.genreId = g.id WHERE invisible == 1'
          + ')'),
      }
      : {
        [Op.in]: literal('('
          // @ts-ignore
          + `SELECT DISTINCT infoId FROM infoGenres INNER JOIN genres g on infoGenres.genreId = g.id WHERE name in (${genres.map((g) => `'${g}'`).join(', ')})` // TODO: escape
          + ')'),
      };
    let nameWhere: {} | undefined;
    if (include) {
      nameWhere = {
        ...nameWhere,
        [Op.like]: `%${include}%`,
      };
    }
    const nameRange = SequelizeBookDataManager.transformOperation(between);
    if (nameRange) {
      nameWhere = {
        ...nameWhere,
        nameRange,
      };
    }
    const where = {
      history: infoType ? infoType === 'History' : undefined,
      id: invisibleGenreInfoIdWhere,
      name: nameWhere,
      createdAt: SequelizeBookDataManager.transformOperation(createdAt),
      updatedAt: SequelizeBookDataManager.transformOperation(updatedAt),
    };
    Object.keys(where).forEach((k) => {
      if (where[k] === undefined) {
        delete where[k];
      }
    });
    return BookInfoModel.findAll({
      limit,
      order: sort,
      where,
    }).then((bookInfos) => bookInfos.map(SequelizeBookDataManager.createBookInfo));
  }

  private static transformOperation<T>(value?: [T | undefined, T | undefined]): {} | undefined {
    const [a, b] = value || [];
    if (a !== undefined && b !== undefined) {
      return { [Op.gt]: a, [Op.lt]: b };
    }
    if (a !== undefined) {
      return { [Op.gt]: a };
    }
    if (b !== undefined) {
      return { [Op.lt]: b };
    }
    return undefined;
  }

  async addBookInfo({
    id,
    genres = [],
    ...bookInfo
  }: InputBookInfo): Promise<InfoId> {
    const infoId = id || generateId();
    await this.sequelize.transaction(async (transaction) => {
      await BookInfoModel.create({
        ...bookInfo,
        id: infoId,
        count: bookInfo.bookCount,
        history: bookInfo.isHistory,
        thumbnail: bookInfo.thumbnail,
      }, { transaction });
      await SequelizeBookDataManager.linkGenres(infoId, genres, transaction);
    });
    return infoId;
  }

  async addBookHistories(bookHistories: Array<InputBookHistory>): Promise<void> {
    await BookInfoModel.bulkCreate(
      bookHistories.map(({
        name,
        bookCount,
      }) => ({
        id: generateId(),
        history: true,
        name,
        count: bookCount,
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
    await this.sequelize.transaction(async (transaction) => {
      if (Object.keys(editBookInfo).length !== 0) {
        await BookInfoModel.update(editBookInfo, {
          where: { id: infoId },
          transaction,
        });
      }
      if (genres) {
        await SequelizeBookDataManager.linkGenres(infoId, genres, transaction);
      }
    });
  }

  private static async linkGenres(
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
    return this.sequelize.transaction(async (transaction) => {
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

  getGenre(genreName: GenreName): Promise<Genre | undefined> {
    return GenreModel.findOne({
      where: { name: genreName },
    }).then(SequelizeBookDataManager.createGenre);
  }

  getGenres(): Promise<Array<Genre>> {
    return GenreModel.findAll()
      .then((genres) => genres.map(SequelizeBookDataManager.createGenre));
  }

  async editGenre(
    genreName: GenreName,
    genre: RequireAtLeastOne<GenreEditableValue>,
  ): Promise<DeleteGenreError> {
    if (defaultGenres.includes(genreName)) {
      return 'DELETE_DEFAULT';
    }
    await GenreModel.update(removeNullableEntries({
      name: genre.name,
      invisible: genre.isInvisible,
    }), {
      where: { name: genreName },
    });
    return undefined;
  }

  async deleteGenre(genreName: GenreName): Promise<DeleteGenreError | undefined> {
    if (defaultGenres.includes(genreName)) {
      return 'DELETE_DEFAULT';
    }
    const genreModel = await GenreModel.findOne({
      where: { name: genreName },
    });
    if (genreModel) {
      await this.sequelize.transaction(async (transaction) => {
        await InfoGenreModel.destroy({
          where: { genreId: genreModel.id },
          transaction,
        });
        await GenreModel.destroy({
          where: { id: genreModel.id },
          transaction,
        });
      });
    }
    return undefined;
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
