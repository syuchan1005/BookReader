/* eslint-disable no-console */
import { ModelAttributes, QueryInterface } from 'sequelize';

module.exports = {
  up: (
    queryInterface: QueryInterface,
    // Sequelize: typeof DataTypes,
  ) => queryInterface.sequelize.transaction(async (transaction) => {
    const dialect = queryInterface.sequelize.getDialect();
    if (dialect !== 'sqlite') {
      throw new Error(`${dialect} do not support.`);
    }
    const infoGenresTable = await queryInterface.describeTable('infoGenres') as ModelAttributes;
    await queryInterface.createTable('new_infoGenres', infoGenresTable, { transaction });
    // noinspection SqlResolve
    await queryInterface.sequelize.query('INSERT INTO new_infoGenres SELECT * FROM infoGenres;', { transaction });
    await queryInterface.dropTable('infoGenres', { transaction });

    const table = await queryInterface.describeTable('bookInfos') as ModelAttributes;
    await queryInterface.createTable('new_bookInfos', table, { transaction });
    // noinspection SqlResolve
    await queryInterface.sequelize.query('INSERT INTO new_bookInfos SELECT * FROM bookInfos;', { transaction });
    await queryInterface.dropTable('bookInfos', { transaction });
    await queryInterface.renameTable('new_bookInfos', 'bookInfos', { transaction });

    await queryInterface.addConstraint('bookInfos', {
      fields: ['name'],
      type: 'unique',
      name: 'unique_name',
      transaction,
    });

    await queryInterface.renameTable('new_infoGenres', 'infoGenres', { transaction });

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
    await queryInterface.addConstraint('infoGenres', {
      fields: ['genreId'],
      type: 'foreign key',
      name: 'fk_genreId',
      references: {
        table: 'genres',
        field: 'id',
      },
      onUpdate: 'cascade',
      onDelete: 'no action',
      transaction,
    });
    await queryInterface.addConstraint('infoGenres', {
      fields: ['infoId', 'genreId'],
      type: 'unique',
      name: 'unique_infoId_genreId',
      transaction,
    });
  }),
  down: (
    queryInterface: QueryInterface,
    // Sequelize: typeof DataTypes,
  ) => queryInterface.removeConstraint('bookInfos', 'unique_name'),
};
