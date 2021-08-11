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
    const distincts = await queryInterface.sequelize.query('SELECT DISTINCT books.infoId, books.number FROM books inner join (select number, infoId from books group by number, infoId having count(*) >= 2) TMP ON books.number = TMP.number AND books.infoId = TMP.infoId;', {
      transaction,
    });
    if (distincts[0].length >= 1) {
      throw new Error(`books table has duplicate number and infoId\n${distincts[0].map((a: { infoId: string, number: string }) => `${a.infoId} : ${a.number}`).join('\n')}`);
    }
    const table = await queryInterface.describeTable('books') as ModelAttributes;
    await queryInterface.createTable('new_books', table, { transaction });
    // noinspection SqlResolve
    await queryInterface.sequelize.query('INSERT INTO new_books SELECT * FROM books;', { transaction });
    await queryInterface.dropTable('books', { transaction });
    await queryInterface.addConstraint('new_books', {
      fields: ['number', 'infoId'],
      type: 'unique',
      name: 'unique_number_infoId',
      transaction,
    });
    await queryInterface.addConstraint('new_books', {
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
    await queryInterface.renameTable('new_books', 'books', { transaction });
  }),
  down: (
    queryInterface: QueryInterface,
    // Sequelize: typeof DataTypes,
  ) => queryInterface.removeConstraint('books', 'unique_number_infoId'),
};
