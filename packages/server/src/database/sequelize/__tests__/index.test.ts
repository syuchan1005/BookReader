import { SequelizeBookDataManager } from '../index';
import Book from '../models/Book';
import BookInfo from '../models/BookInfo';

describe('SequelizeBookDataManager', () => {
  const target = new SequelizeBookDataManager();

  beforeAll(() => target.init({
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
  }));

  it('getBook', async () => {
    await BookInfo.create({
      id: 'infoId',
      name: 'name',
      thumbnail: undefined,
      count: 1,
      history: false,
      createdAt: 1,
      updatedAt: 2,
    });
    const createdAt = new Date();
    const updatedAt = new Date();
    await Book.create({
      id: 'bookId',
      thumbnail: 0,
      number: 'number',
      pages: 10,
      infoId: 'infoId',
      createdAt,
      updatedAt,
    });
    // @ts-ignore
    await expect(target.getBook('bookId'))
      .resolves
      .toStrictEqual({
        id: 'bookId',
        thumbnailPage: 0,
        number: 'number',
        pageCount: 10,
        infoId: 'infoId',
        createdAt,
        updatedAt,
      });
    await expect(target.getBook('bookId-not-exist'))
      .resolves
      .toBe(undefined);
  });
});
