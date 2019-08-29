module.exports = {
  type: 'sqlite',
  database: `${process.env.NODE_ENV || 'development'}.sqlite`,
  synchronize: false,
  logging: false,
  entities: [
    'src/server/models/**/*.ts',
  ],
  migrations: [
    'src/server/db/migrations/**/*.ts',
  ],
  subscribers: [
    'src/server/db/subscriber/**/*.ts',
  ],
  cli: {
    entitiesDir: 'src/server/models',
    migrationsDir: 'src/server/db/migrations',
    subscribersDir: 'src/server/db/subscriber',
  },
};
