/* eslint-disable no-console */
import { DataTypes, QueryInterface, ModelAttributes } from 'sequelize';

const t = async (
  queryInterface: QueryInterface,
  func: (execQuery: (sql: string) => Promise<void>) => Promise<void>,
): Promise<void> => {
  const execQuery = queryInterface.sequelize.query.bind(queryInterface.sequelize);
  await execQuery('PRAGMA foreign_keys = OFF;');
  try {
    await queryInterface.sequelize.query('BEGIN TRANSACTION;');
    await func(execQuery);
    await execQuery('COMMIT;');
    await execQuery('PRAGMA foreign_keys = ON;');
  } catch (e) {
    await execQuery('ROLLBACK;');
    await execQuery('PRAGMA foreign_keys = ON;');
    throw e;
  }
};

module.exports = {
  up: (
    queryInterface: QueryInterface,
    Sequelize: typeof DataTypes,
  ) => t(queryInterface, async (execQuery) => {
    const dialect = queryInterface.sequelize.getDialect();
    if (dialect !== 'sqlite') {
      throw new Error(`${dialect} do not support.`);
    }
    const table = await queryInterface.describeTable('bookInfos') as ModelAttributes;
    table.thumbnail = {
      type: Sequelize.UUIDV4,
      allowNull: true,
    };
    // table description dont have actual unique constraint.
    // @ts-ignore
    table.name.unique = false;

    await queryInterface.createTable('new_bookInfos', table);
    // noinspection SqlResolve
    await execQuery(
      `INSERT INTO new_bookInfos
         SELECT 
          id,
          name, 
          substr(thumbnail, 7, instr(substr(thumbnail, 7), '/') - 1) as thumbnail, 
          count, 
          createdAt, 
          updatedAt, 
          history
         FROM bookInfos;`,
    );

    await queryInterface.dropTable('bookInfos');
    await queryInterface.renameTable('new_bookInfos', 'bookInfos');
    await queryInterface.addConstraint('bookInfos', {
      fields: ['name'],
      type: 'unique',
      name: 'unique_name',
    });
  }),
  down: (
    queryInterface: QueryInterface,
    Sequelize: typeof DataTypes,
  ) => t(queryInterface, async (execQuery) => {
    const dialect = queryInterface.sequelize.getDialect();
    if (dialect !== 'sqlite') {
      throw new Error(`${dialect} do not support.`);
    }
    const table = await queryInterface.describeTable('bookInfos') as ModelAttributes;
    table.thumbnail = {
      type: Sequelize.STRING,
      allowNull: true,
    };
    // table description dont have actual unique constraint.
    // @ts-ignore
    table.name.unique = false;

    await queryInterface.createTable('new_bookInfos', table);
    // noinspection SqlResolve
    await execQuery(
      `INSERT INTO new_bookInfos
        SELECT 
          bookInfos.id,
          name, 
          '/book/' || bookInfos.thumbnail || '/' || substr('000000000000' || books.thumbnail, -1 * length(books.pages), length(books.pages)) || '.jpg' as thumbnail,
          count, 
          bookInfos.createdAt, 
          bookInfos.updatedAt, 
          history
        FROM bookInfos LEFT OUTER JOIN books ON bookInfos.thumbnail = books.id;`,
    );

    await queryInterface.dropTable('bookInfos');
    await queryInterface.renameTable('new_bookInfos', 'bookInfos');
    await queryInterface.addConstraint('bookInfos', {
      fields: ['name'],
      type: 'unique',
      name: 'unique_name',
    });
  }),
};
