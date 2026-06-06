const VERSION = 8;

export interface BookRead {
  bookId: string;
  page: number;

  updatedAt?: Date;
}

export interface Read {
  infoId: string /* index */;
  bookId: string /* keyPath */;
  page: number;

  updatedAt: Date /* index */;
}

export interface BookInfoFavorite {
  infoId: string;
  createdAt: Date;
}

export interface Revision {
  count: number /* id */;
  localSyncedAt: Date;
  serverSyncedAt: Date;
}

export interface DownloadedBook {
  infoId: string /* index */;
  bookId: string /* keyPath */;
  infoName: string;
  bookName: string;
  totalPageCount: number;
  thumbnail: Blob;
  bookZipArchive: Blob;
  createdAt: Date /* index */;
  serverUpdatedAt: Date;
}

export class StoreWrapper<T> {
  private readonly storeName: string;

  private readonly keyPath: string;

  private readonly db: IDBDatabase;

  constructor(storeName: string, keyPath: string, db: IDBDatabase) {
    this.storeName = storeName;
    this.keyPath = keyPath;
    this.db = db;
  }

  existStore(): boolean {
    return this.db.objectStoreNames.contains(this.storeName);
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

  getAll<K extends keyof T & string, R = T>(
    limit: number,
    sort?: { key: K; direction?: 'next' | 'prev'; after?: T[K] },
    indexValue?: T[K] | undefined,
    valueMapper?: (value: T) => R,
  ): Promise<R[]> {
    if (limit <= 0) {
      return Promise.resolve([]);
    }

    return new Promise<R[]>((resolve, reject) => {
      const tx = this.db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      if (sort) {
        let q: IDBKeyRange | null = null;
        if (sort.after) {
          if (sort.direction === 'next') {
            q = IDBKeyRange.lowerBound(sort.after, true);
          } else if (sort.direction === 'prev') {
            q = IDBKeyRange.upperBound(sort.after, true);
          }
        }
        const query = q || (indexValue ? IDBKeyRange.only(indexValue) : null);
        let request: IDBRequest;
        if (this.keyPath === sort.key) {
          request = store.openCursor(query, sort.direction);
        } else {
          request = store.index(sort.key).openCursor(query, sort.direction);
        }
        const results: R[] = [];
        request.onsuccess = (event) => {
          const cursor: IDBCursorWithValue = (event.target as IDBRequest)
            .result;
          if (!cursor || results.length >= limit) {
            resolve(results);
            return;
          }

          results.push(valueMapper ? valueMapper(cursor.value) : cursor.value);
          cursor.continue();
        };
        request.onerror = (e) => reject(e);
      } else {
        const request = store.getAll();
        tx.oncomplete = () => resolve(request.result);
        tx.onerror = (e) => reject(e);
      }
    });
  }

  getAllWithFilter(predicate: (t: T) => boolean): Promise<T[]> {
    return new Promise<T[]>((resolve, _reject) => {
      const tx = this.db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const request = store.openCursor();
      const results: T[] = [];
      request.onsuccess = (event) => {
        const cursor: IDBCursorWithValue = (event.target as IDBRequest).result;
        if (!cursor) {
          resolve(results);
          return;
        }

        const value = cursor.value;
        if (predicate(value)) {
          results.push(value);
        }
        cursor.continue();
      };
    });
  }

  put(
    value: T,
    options: { replace: boolean } = { replace: true },
  ): Promise<IDBValidKey> {
    return new Promise<IDBValidKey>((resolve, reject) => {
      const tx = this.db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const request = options.replace ? store.put(value) : store.add(value);
      tx.oncomplete = () => resolve(request.result);
      tx.onerror = (e) => reject(e);
    });
  }

  bulkUpdate(transform: (current: T) => T): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const tx = this.db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const request = store.openCursor();
      request.onsuccess = (event) => {
        const cursor: IDBCursorWithValue = (event.target as IDBRequest).result;
        if (!cursor) {
          resolve();
          return;
        }

        cursor.update(transform(cursor.value));
        cursor.continue();
      };
      request.onerror = (e) => reject(e);
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

  deleteByIndex<K extends keyof T & string>(
    index: K,
    value: string,
  ): Promise<IDBValidKey> {
    return new Promise<IDBValidKey>((resolve) => {
      const tx = this.db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const storeIndex = store.index(index);
      const request = storeIndex.openCursor(IDBKeyRange.only(value));
      request.onsuccess = (event) => {
        const cursor: IDBCursorWithValue = (event.target as IDBRequest).result;
        if (!cursor) {
          resolve(undefined);
          return;
        }
        store.delete(cursor.primaryKey);
        cursor.continue();
      };
    });
  }

  bulkDelete(keyPathValues: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(this.storeName, 'readwrite');

      const store = tx.objectStore(this.storeName);
      for (const keyPathValue of keyPathValues) {
        store.delete(keyPathValue);
      }

      tx.onerror = (e) => reject(e);
      tx.oncomplete = () => resolve();
    });
  }

  clear(): Promise<void> {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      store.clear();
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
  (_db: IDBDatabase, request: IDBOpenDBRequest) => {
    request.transaction
      .objectStore('bookReads')
      .createIndex('updatedAt', 'updatedAt');
  },
  (db: IDBDatabase) => {
    const bookInfoFavoriteStore = db.createObjectStore('bookInfoFavorite', {
      keyPath: 'infoId',
    });
    bookInfoFavoriteStore.createIndex('createdAt', 'createdAt');
  },
  (db: IDBDatabase) => {
    const readStore = db.createObjectStore('read', { keyPath: 'bookId' });
    readStore.createIndex('infoId', 'infoId');
    readStore.createIndex('updatedAt', 'updatedAt');
    /* Remove bookReads and infoReads if migrated */
  },
  (db: IDBDatabase, request: IDBOpenDBRequest) => {
    db.createObjectStore('revision', { keyPath: 'count' });
    const readStore = request.transaction.objectStore('read');
    const cursorRequest = readStore.openCursor();
    cursorRequest.onsuccess = (event) => {
      const cursor: IDBCursorWithValue = (event.target as IDBRequest).result;
      if (!cursor) {
        return;
      }
      cursor.update({
        ...cursor.value,
        isDirty: true,
      });
      cursor.continue();
    };
  },
  (db: IDBDatabase) => {
    db.deleteObjectStore('infoReads');
    db.deleteObjectStore('bookReads');
  },
  (db: IDBDatabase, request: IDBOpenDBRequest) => {
    db.deleteObjectStore('revision');
    const readStore = request.transaction.objectStore('read');
    const cursorRequest = readStore.openCursor();
    cursorRequest.onsuccess = (event) => {
      const cursor: IDBCursorWithValue = (event.target as IDBRequest).result;
      if (!cursor) {
        return;
      }
      const value = { ...cursor.value };
      delete value.isDirty;
      cursor.update(value);
      cursor.continue();
    };
  },
  (db: IDBDatabase) => {
    const downloadedBookStore = db.createObjectStore('downloadedBook', {
      keyPath: 'bookId',
    });
    downloadedBookStore.createIndex('infoId', 'infoId');
    downloadedBookStore.createIndex('createdAt', 'createdAt');
  },
];

export const DB_NAME = 'BookReader--DB';

export class Database {
  public readonly dbName: string;

  private _db: IDBDatabase;

  private _bookInfoFavorite: StoreWrapper<BookInfoFavorite>;
  private _read: StoreWrapper<Read>;
  private _downloadedBook: StoreWrapper<DownloadedBook>;

  constructor(dbName = DB_NAME) {
    this.dbName = dbName;
  }

  get bookInfoFavorite() {
    return this._bookInfoFavorite;
  }

  get read() {
    return this._read;
  }

  get downloadedBook() {
    return this._downloadedBook;
  }

  connect(): Promise<IDBDatabase> {
    if (this._db) {
      return Promise.resolve(this._db);
    }
    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open(this.dbName, VERSION);
      request.onupgradeneeded = (event) => {
        this._db = (event.target as IDBRequest).result;
        for (const task of UpgradeTask.slice(
          event.oldVersion + 1,
          event.newVersion + 1,
        )) {
          task(this._db, request);
        }
      };
      request.onerror = (event) => {
        reject(event);
      };
      request.onsuccess = () => {
        this._db = request.result;
        this._bookInfoFavorite = new StoreWrapper<BookInfoFavorite>(
          'bookInfoFavorite',
          'infoId',
          this._db,
        );
        this._read = new StoreWrapper<Read>('read', 'bookId', this._db);
        this._downloadedBook = new StoreWrapper<DownloadedBook>(
          'downloadedBook',
          'bookId',
          this._db,
        );

        resolve(this._db);
      };
    });
  }
}

const db = new Database();
export default db;
