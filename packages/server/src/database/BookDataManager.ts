import { SequelizeBookDataManager } from './sequelize/index';

export interface IBookDataManager {
  init(): Promise<void>
}

export const BookDataManager: IBookDataManager = new SequelizeBookDataManager();
