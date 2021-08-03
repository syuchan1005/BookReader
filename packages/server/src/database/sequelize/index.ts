/* eslint-disable import/prefer-default-export, class-methods-use-this */
import { IBookDataManager } from '../BookDataManager';
import Database from './models';

export class SequelizeBookDataManager implements IBookDataManager {
  async init() {
    await Database.sync();
  }
}
