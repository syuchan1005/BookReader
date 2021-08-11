/* eslint-disable no-console */
import { DataTypes, QueryInterface, ModelAttributes } from 'sequelize';

module.exports = {
  up: (
    queryInterface: QueryInterface,
    Sequelize: typeof DataTypes,
  ) => queryInterface.sequelize.transaction(async (transaction) => {
    const dialect = queryInterface.sequelize.getDialect();
    if (dialect !== 'sqlite') {
      throw new Error(`${dialect} do not support.`);
    }
    const table = await queryInterface.describeTable('books') as ModelAttributes;
    table.thumbnail = {
      type: Sequelize.INTEGER,
      allowNull: true,
    };
    // table description dont have actual unique constraint.
    // @ts-ignore
    table.infoId.unique = false;
    // @ts-ignore
    delete table.infoId.references;
    // @ts-ignore
    table.number.unique = false;

    await queryInterface.createTable('new_books', table, { transaction });

    // noinspection SqlResolve
    await queryInterface.sequelize.query(
      `INSERT INTO new_books
         SELECT
          id,
          CAST(substr(thumbnail, 44) AS INTEGER) as thumbnail,
          number,
          pages, 
          infoId, 
          createdAt, 
          updatedAt
         FROM books;`,
      { transaction },
    );
    await queryInterface.dropTable('books', { transaction });
    await queryInterface.renameTable('new_books', 'books', { transaction });
    await queryInterface.addConstraint('books', {
      fields: ['number', 'infoId'],
      type: 'unique',
      name: 'unique_number_infoId',
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
  down: (
    queryInterface: QueryInterface,
    Sequelize: typeof DataTypes,
  ) => queryInterface.sequelize.transaction(async (transaction) => {
    const dialect = queryInterface.sequelize.getDialect();
    if (dialect !== 'sqlite') {
      throw new Error(`${dialect} do not support.`);
    }
    const table = await queryInterface.describeTable('books') as ModelAttributes;
    table.thumbnail = {
      type: Sequelize.STRING,
      allowNull: true,
    };
    // table description dont have actual unique constraint.
    // @ts-ignore
    table.infoId.unique = false;
    // @ts-ignore
    delete table.infoId.references;
    // @ts-ignore
    table.number.unique = false;

    await queryInterface.createTable('new_books', table, { transaction });

    // noinspection SqlResolve
    await queryInterface.sequelize.query(
      `INSERT INTO new_books
         SELECT
          id,
          '/book/' || id || '/' || substr('000000000000' || thumbnail, -1 * length(pages), length(pages)) || '.jpg' as thumbnail,
          number,
          pages, 
          infoId, 
          createdAt, 
          updatedAt
         FROM books;`,
      { transaction },
    );
    await queryInterface.dropTable('books', { transaction });
    await queryInterface.renameTable('new_books', 'books', { transaction });
    await queryInterface.addConstraint('books', {
      fields: ['number', 'infoId'],
      type: 'unique',
      name: 'unique_number_infoId',
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
