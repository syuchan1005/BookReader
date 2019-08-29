import { getConnectionOptions, createConnection, BaseEntity } from 'typeorm';

export default class Database {
  private _connectionOption;

  private _connection;

  async init() {
    /* eslint-disable no-underscore-dangle */
    this._connectionOption = await getConnectionOptions();
    this._connection = await createConnection(this._connectionOption);

    BaseEntity.useConnection(this._connection);
  }
}
