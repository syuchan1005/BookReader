import { Sequelize, Model } from 'sequelize';
import * as baseConfig from '../config';

/* models */
import bookInfo from './bookInfo';
import book from './book';

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
};
const modelList = [book, bookInfo];
modelList.forEach((module) => {
  // @ts-ignore
  const modelName = module.initModel(sequelize, config);
  models[modelName] = module[modelName];
});

modelList.forEach((module) => {
  if (module.associate) {
    module.associate();
  }
});

interface Database {
  sequelize: Sequelize;
  book: Model;
  bookInfo: Model;
}

const db: Database = {
  sequelize,
  book: models.book,
  bookInfo: models.bookInfo,
};

export default db;
