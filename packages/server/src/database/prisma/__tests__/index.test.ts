import { PrismaBookDataManager } from '../index';

describe('PrismaBookDataManager', () => {
  const target = new PrismaBookDataManager();

  function getClient() {
    // eslint-disable-next-line dot-notation
    return target['prismaClient'];
  }

  beforeAll(async () => {
    await target.init(':memory:');
  });

  beforeEach(async () => {
    const client = getClient();
    // reset database
    await client.$disconnect();
    await client.$connect();
  });

  it('getBook', async () => {
    const createdAt = new Date();
    const updatedAt = new Date();
    await getClient().book.create({
      data: {
        id: 'bookId',
        thumbnailPage: 0,
        number: 'number',
        pageCount: 10,
        createdAt,
        updatedAt,
        bookInfo: {
          create: {
            id: 'infoId',
            name: 'info',
          },
        },
      },
    });
    await expect(target.getBook('bookId')).resolves.toBe({
      id: 'bookId',
      thumbnailPage: 0,
      number: 'number',
      pageCount: 10,
      infoId: 'infoId',
      createdAt,
      updatedAt,
    });
    await expect(target.getBook('bookId-not-exist')).resolves.toBe(undefined);
  });
});
