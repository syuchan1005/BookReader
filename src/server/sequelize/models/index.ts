import { Sequelize, Model } from 'sequelize';
import * as baseConfig from '../config';

/* models */
import BookInfo from './BookInfo';
import Book from './Book';
import Genre from './Genre';
import InfoGenre from './InfoGenre';

const env = process.env.NODE_ENV || 'development';
const config = baseConfig[env];

let sequelize;
if (config.dialect === 'sqlite') {
  sequelize = new Sequelize(config);
} else if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

const models = {
  book: undefined,
  bookInfo: undefined,
  genre: undefined,
  infoGenre: undefined,
};

const modelList = [Book, BookInfo, Genre, InfoGenre];
modelList.forEach((module) => {
  // @ts-ignore
  const modelName = module.initModel(sequelize, config);
  models[modelName] = module[modelName];
});

modelList.forEach((module) => {
  // @ts-ignore
  if (module.associate) module.associate();
});

modelList.forEach((module) => {
  // @ts-ignore
  if (module.seed) module.seed();
});

export interface Database {
  sequelize: Sequelize;
  book: Model;
  bookInfo: Model;
  BookModel: typeof Book;
  BookInfoModel: typeof BookInfo;
}

const db: Database = {
  sequelize,
  book: models.book,
  bookInfo: models.bookInfo,
  BookModel: Book,
  BookInfoModel: BookInfo,
};

export default db;
