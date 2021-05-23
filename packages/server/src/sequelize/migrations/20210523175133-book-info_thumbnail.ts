/* eslint-disable no-console */
import { DataTypes, QueryInterface, ModelAttributes } from 'sequelize';

module.exports = {
  up: async (
    queryInterface: QueryInterface,
    Sequelize: typeof DataTypes,
  ) => queryInterface.sequelize.transaction(async (transaction) => {
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

    await queryInterface.createTable('new_bookInfos', table, { transaction });
    // noinspection SqlResolve
    await queryInterface.sequelize.query(
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
      { transaction }
    );

    await queryInterface.removeConstraint('infoGenres', 'fk_infoId', { transaction });
    await queryInterface.removeConstraint('books', 'fk_infoId', { transaction });
    await queryInterface.dropTable('bookInfos', { transaction });
    await queryInterface.renameTable('new_bookInfos', 'bookInfos', { transaction });
    await queryInterface.addConstraint('bookInfos', {
      fields: ['name'],
      type: 'unique',
      name: 'unique_name',
      transaction,
    });
    await queryInterface.addConstraint('infoGenres', {
      fields: ['infoId'],
      type: 'foreign key',
      name: 'fk_infoId',
      references: {
        table: 'bookInfos',
        field: 'id',
      },
      onUpdate: 'cascade',
      onDelete: 'no action',
      transaction,
    });
    await queryInterface.addConstraint('books', {
      fields: ['infoId'],
      type: 'foreign key',
      name: 'fk_infoId',
      references: {
        table: 'bookInfos',
        field: 'id',
      },
      onUpdate: 'cascade',
      onDelete: 'no action',
      transaction,
    });
    await queryInterface.addConstraint('bookInfos', {
      fields: ['thumbnail'],
      type: 'foreign key',
      name: 'fk_thumbnail',
      references: {
        table: 'books',
        field: 'id',
      },
      onUpdate: 'cascade',
      onDelete: 'no action',
      transaction,
    });
  }),
  down: (
    queryInterface: QueryInterface,
    Sequelize: typeof DataTypes,
  ) => queryInterface.sequelize.transaction(async (transaction) => {
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

    await queryInterface.createTable('new_bookInfos', table, { transaction });
    // noinspection SqlResolve
    await queryInterface.sequelize.query(
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
      { transaction }
    );

    await queryInterface.removeConstraint('infoGenres', 'fk_infoId', { transaction });
    await queryInterface.removeConstraint('books', 'fk_infoId', { transaction });
    await queryInterface.dropTable('bookInfos', { transaction });
    await queryInterface.renameTable('new_bookInfos', 'bookInfos', { transaction });
    await queryInterface.addConstraint('bookInfos', {
      fields: ['name'],
      type: 'unique',
      name: 'unique_name',
      transaction,
    });
    await queryInterface.addConstraint('infoGenres', {
      fields: ['infoId'],
      type: 'foreign key',
      name: 'fk_infoId',
      references: {
        table: 'bookInfos',
        field: 'id',
      },
      onUpdate: 'cascade',
      onDelete: 'no action',
      transaction,
    });
    await queryInterface.addConstraint('books', {
      fields: ['infoId'],
      type: 'foreign key',
      name: 'fk_infoId',
      references: {
        table: 'bookInfos',
        field: 'id',
      },
      onUpdate: 'cascade',
      onDelete: 'no action',
      transaction,
    });
  }),
};
