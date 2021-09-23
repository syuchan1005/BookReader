import { SequelizeBookDataManager } from '../index';
import Book from '../models/Book';
import BookInfo from '../models/BookInfo';
import { IBookDataManager } from '../../BookDataManager';

describe('SequelizeBookDataManager', () => {
  const target: IBookDataManager = new SequelizeBookDataManager();

  // @ts-ignore
  beforeAll(() => target.init({
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
  }));

  beforeEach(async () => {
    // @ts-ignore
    await target.sequelize.dropAllSchemas();
    // @ts-ignore
    await target.initModels();
  });

  it('getBook', async () => {
    await BookInfo.create({
      id: 'infoId',
      name: 'name',
      thumbnail: undefined,
      count: 1,
      history: false,
      createdAt: 1,
    });
    const createdAt = new Date('2021-12-31T12:00:00.000Z');
    await Book.create({
      id: 'bookId',
      thumbnail: 0,
      number: 'number',
      pages: 10,
      infoId: 'infoId',
      createdAt,
    });
    await expect(target.getBook('bookId'))
      .resolves
      .toStrictEqual({
        id: 'bookId',
        thumbnailPage: 0,
        number: 'number',
        pageCount: 10,
        infoId: 'infoId',
        createdAt,
        updatedAt: expect.anything(),
      });
    await expect(target.getBook('bookId-not-exist'))
      .resolves
      .toBe(undefined);
  });

  it('addBook', async () => {
    await BookInfo.create({
      id: 'infoId',
      name: 'name',
      thumbnail: undefined,
      count: 1,
      history: false,
      createdAt: 1,
    });
    const createdAt = new Date('2021-12-31T12:00:00.000Z');
    await target.addBook({
      id: 'bookId',
      thumbnailPage: 0,
      number: 'number',
      pageCount: 10,
      infoId: 'infoId',
      createdAt,
    });
    await expect(target.getBook('bookId'))
      .resolves
      .toStrictEqual({
        id: 'bookId',
        thumbnailPage: 0,
        number: 'number',
        pageCount: 10,
        infoId: 'infoId',
        createdAt,
        updatedAt: expect.anything(),
      });
  });
});
