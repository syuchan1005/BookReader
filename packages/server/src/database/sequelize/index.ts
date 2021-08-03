import { IBookDataManager } from '../BookDataManager';
import Database from './models';

export class SequelizeBookDataManager implements IBookDataManager {
  async init() {
    await Database.sync();
  }
}
