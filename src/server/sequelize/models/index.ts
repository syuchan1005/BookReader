import { Sequelize, Model } from 'sequelize';
import baseConfig from '../config';

/* models */
import * as bookInfo from './bookInfo';
import * as book from './book';

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
[bookInfo, book].forEach((module) => {
  // @ts-ignore
  const modelName = module.init(sequelize, config);
  models[modelName] = module[modelName];
});

Object.keys(models).forEach((modelName) => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
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
