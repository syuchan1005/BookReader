import debug from 'debug';

module.exports = {
  development: {
    dialect: 'sqlite',
    storage: 'development.sqlite',
    logging: debug('db'),
  },
  test: {
    dialect: 'sqlite',
    storage: 'test.sqlite',
  },
  production: {
    dialect: 'sqlite',
    storage: 'production.sqlite',
    logging: false,
  },
};
