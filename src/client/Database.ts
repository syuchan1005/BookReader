import Dexie from 'dexie';

export class Database extends Dexie {
  infoReads: Dexie.Table<InfoRead, string>;

  bookReads: Dexie.Table<BookRead, string>;

  constructor() {
    super('BookReader--DB');

    this.version(1).stores({
      infoReads: 'infoId, bookId',
      bookReads: 'bookId, page',
    });

    this.infoReads = this.table('infoReads');
    this.bookReads = this.table('bookReads');
  }
}

export interface InfoRead {
  infoId: string;
  bookId: string;
}

export interface BookRead {
  bookId: string;
  page: number;
}

const db = new Database();
export default db;
