/* eslint-disable */

interface InfoRead {
  infoId: string;
  bookId: string;
}

interface BookRead {
  bookId: string;
  page: number;
}

export class StoreWrapper<T> {
  private readonly storeName: string;

  private readonly db: IDBDatabase;

  constructor(storeName: string, db: IDBDatabase) {
    this.storeName = storeName;
    this.db = db;
  }

  get(keyPathValue: string): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const tx = this.db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const request = store.get(keyPathValue);
      tx.oncomplete = () => resolve(request.result);
      tx.onerror = (e) => reject(e);
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
    })
  }
}

export class Database {
  public readonly dbName: string;

  private _db: IDBDatabase;

  private _infoReads: StoreWrapper<InfoRead>;
  private _bookReads: StoreWrapper<BookRead>;

  constructor(dbName = 'BookReader--DB') {
    this.dbName = dbName;
  }

  get infoReads() { return this._infoReads; }
  get bookReads() { return this._bookReads; }

  connect(): Promise<IDBDatabase> {
    if (this._db) {
      return Promise.resolve(this._db);
    }
    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open(this.dbName);
      request.onupgradeneeded = () => {
        this._db.createObjectStore('infoReads', { keyPath: 'infoId' });
        this._db.createObjectStore('bookReads', { keyPath: 'bookId' });
      };
      request.onerror = (event) => {
        reject(event);
      };
      request.onsuccess = (event) => {
        // @ts-ignore
        this._db = event.target.result;
        this._infoReads = new StoreWrapper<InfoRead>('infoReads', this._db);
        this._bookReads = new StoreWrapper<BookRead>('bookReads', this._db);

        resolve(this._db);
      };
    });
  }
}

const db = new Database();
export default db;
