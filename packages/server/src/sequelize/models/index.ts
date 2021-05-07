import { Sequelize, Model, Options } from 'sequelize';
import * as baseConfig from '../../../sequelize.config';

/* models */
import BookInfo from './BookInfo';
import Book from './Book';
import Genre from './Genre';
import InfoGenre from './InfoGenre';

const env = process.env.NODE_ENV || 'development';
const config: Options & { dialect?: string, use_env_variable?: string } = baseConfig[env];

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

export interface Database {
  sequelize: Sequelize;
  sync: () => Promise<unknown>,
  book: Model;
  bookInfo: Model;
  BookModel: typeof Book;
  BookInfoModel: typeof BookInfo;
}

const db: Database = {
  sequelize,
  sync: async () => {
    await modelList.reduce(
      (promise, model) => promise.then(() => model.sync()),
      Promise.resolve(),
    );
    await sequelize.sync();

    await modelList.reduce(
      // @ts-ignore
      (promise, model) => promise.then(() => (model.seed ? model.seed() : Promise.resolve())),
      Promise.resolve(),
    );
  },
  book: models.book,
  bookInfo: models.bookInfo,
  BookModel: Book,
  BookInfoModel: BookInfo,
};

export default db;
