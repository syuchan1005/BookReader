/* eslint-disable */

const VERSION = 4;

interface InfoRead {
  infoId: string;
  bookId: string;
}

export interface BookRead {
  bookId: string;
  page: number;

  updatedAt?: Date;
}

interface Read {
  infoId: string; /* index */
  bookId: string; /* keyPath */
  page: number;

  updatedAt: Date; /* index */
}

export interface BookInfoFavorite {
  infoId: string;
  createdAt: Date;
}

export class StoreWrapper<T> {
  private readonly storeName: string;

  private readonly db: IDBDatabase;

  constructor(storeName: string, db: IDBDatabase) {
    this.storeName = storeName;
    this.db = db;
  }

  get(keyPathValue: string): Promise<T | undefined> {
    return new Promise<T>((resolve, reject) => {
      const tx = this.db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const request = store.get(keyPathValue);
      tx.oncomplete = () => resolve(request.result);
      tx.onerror = (e) => reject(e);
    });
  }

  getAll<K extends (keyof T & string)>(
    limit: number,
    sort: { key: K, direction: 'next' | 'prev' },
    after?: T[K],
  ): Promise<T[]> {
    if (limit <= 0) {
      return Promise.resolve([]);
    }

    return new Promise<T[]>((resolve, reject) => {
      const tx = this.db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const request = store.index(sort.key).openCursor(null, sort.direction);
      const results: T[] = [];
      request.onsuccess = (event) => {
        // @ts-ignore
        const cursor = event.target.result;
        if (!cursor || results.length >= limit) {
          resolve(results);
          return;
        }

        if (after) {
          if (sort.direction === 'next' && cursor.value[sort.key] > after) {
            results.push(cursor.value);
          } else if (sort.direction === 'prev' && cursor.value[sort.key] < after) {
            results.push(cursor.value);
          }
        } else {
          results.push(cursor.value);
        }

        cursor.continue();
      };
      request.onerror = (e) => reject(e);
    });
  }

  put(value: T): Promise<IDBValidKey> {
    return new Promise<IDBValidKey>((resolve, reject) => {
      const tx = this.db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const request = store.put(value);
      tx.oncomplete = () => resolve(request.result);
      tx.onerror = (e) => reject(e);
    });
  }

  delete(keyPathValue: string): Promise<IDBValidKey> {
    return new Promise<IDBValidKey>((resolve, reject) => {
      const tx = this.db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const request = store.delete(keyPathValue);
      tx.oncomplete = () => resolve(request.result);
      tx.onerror = (e) => reject(e);
    });
  }

  bulkDelete(keyPathValues: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(this.storeName, 'readwrite');

      const store = tx.objectStore(this.storeName);
      keyPathValues.forEach((keyPathValue) => {
        store.delete(keyPathValue);
      });

      tx.onerror = (e) => reject(e);
      tx.oncomplete = () => resolve();
    });
  }
}

const UpgradeTask = [
  () => {},
  (db: IDBDatabase) => {
    db.createObjectStore('infoReads', { keyPath: 'infoId' });
    db.createObjectStore('bookReads', { keyPath: 'bookId' });
  },
  (db: IDBDatabase, request: IDBOpenDBRequest) => {
    request.transaction
      .objectStore('bookReads')
      .createIndex('updatedAt', 'updatedAt');
  },
  (db: IDBDatabase) => {
    const bookInfoFavoriteStore = db.createObjectStore('bookInfoFavorite', { keyPath: 'infoId' });
    bookInfoFavoriteStore.createIndex('createdAt', 'createdAt');
  },
  (db: IDBDatabase) => {
    const readStore = db.createObjectStore('read', { keyPath: 'bookId' });
    readStore.createIndex('infoId', 'infoId');
    readStore.createIndex('updatedAt', 'updatedAt');
    /* Remove bookReads and infoReads if migrated */
  },
];

export class Database {
  public readonly dbName: string;

  private _db: IDBDatabase;

  private _infoReads: StoreWrapper<InfoRead>;
  private _bookReads: StoreWrapper<BookRead>;
  private _bookInfoFavorite: StoreWrapper<BookInfoFavorite>;
  private _read: StoreWrapper<Read>;

  constructor(dbName = 'BookReader--DB') {
    this.dbName = dbName;
  }

  get infoReads() {
    return this._infoReads;
  }

  get bookReads() {
    return this._bookReads;
  }

  get bookInfoFavorite() {
    return this._bookInfoFavorite;
  }

  get read() {
    return this._read;
  }

  connect(): Promise<IDBDatabase> {
    if (this._db) {
      return Promise.resolve(this._db);
    }
    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open(this.dbName, VERSION);
      request.onupgradeneeded = (event) => {
        // @ts-ignore
        this._db = event.target.result;
        UpgradeTask.slice(event.oldVersion + 1, event.newVersion + 1)
          .forEach((task) => task(this._db, request));
      };
      request.onerror = (event) => {
        reject(event);
      };
      request.onsuccess = () => {
        // @ts-ignore
        this._db = request.result;
        this._infoReads = new StoreWrapper<InfoRead>('infoReads', this._db);
        this._bookReads = new StoreWrapper<BookRead>('bookReads', this._db);
        this._bookInfoFavorite = new StoreWrapper<BookInfoFavorite>('bookInfoFavorite', this._db);
        this._read = new StoreWrapper<Read>('read', this._db);

        resolve(this._db);
      };
    });
  }
}

const db = new Database();
export default db;
