module.exports = {
  up: (queryInterface) => queryInterface.sequelize.transaction(async (transaction) => {
    const dialect = queryInterface.sequelize.getDialect();
    if (dialect !== 'sqlite') {
      throw new Error(`${dialect} do not support.`);
    }
    const table = await queryInterface.describeTable('books');
    await queryInterface.createTable('new_books', table, { transaction });
    await queryInterface.sequelize.query('INSERT INTO new_books SELECT * FROM books;', { transaction });
    await queryInterface.dropTable('books', { transaction });
    await queryInterface.renameTable('new_books', 'books', { transaction });
    await queryInterface.addConstraint('books', ['number', 'infoId'], {
      type: 'unique',
      name: 'unique_number_infoId',
      transaction,
    });
    await queryInterface.addConstraint('books', ['infoId'], {
      type: 'foreign key',
      name: 'fk_infoId',
      references: {
        table: 'bookInfos',
        field: 'id',
      },
      onUpdate: 'cascade',
      transaction,
    });
  }),
  down: (queryInterface) => queryInterface.removeConstraint('books', 'unique_number_infoId'),
};
