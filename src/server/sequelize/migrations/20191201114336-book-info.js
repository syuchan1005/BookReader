module.exports = {
  up: (queryInterface) => queryInterface.sequelize.transaction(async (transaction) => {
    const dialect = queryInterface.sequelize.getDialect();
    if (dialect !== 'sqlite') {
      throw new Error(`${dialect} do not support.`);
    }
    const infoGenresTable = await queryInterface.describeTable('infoGenres');
    await queryInterface.createTable('new_infoGenres', infoGenresTable, { transaction });
    await queryInterface.sequelize.query('INSERT INTO new_infoGenres SELECT * FROM infoGenres;', { transaction });
    await queryInterface.dropTable('infoGenres', { transaction });

    const table = await queryInterface.describeTable('bookInfos');
    await queryInterface.createTable('new_bookInfos', table, { transaction });
    await queryInterface.sequelize.query('INSERT INTO new_bookInfos SELECT * FROM bookInfos;', { transaction });
    await queryInterface.dropTable('bookInfos', { transaction });
    await queryInterface.renameTable('new_bookInfos', 'bookInfos', { transaction });

    await queryInterface.addConstraint('bookInfos', ['name'], {
      type: 'unique',
      name: 'unique_name',
      transaction,
    });

    await queryInterface.renameTable('new_infoGenres', 'infoGenres', { transaction });

    await queryInterface.addConstraint('infoGenres', ['infoId'], {
      type: 'foreign key',
      name: 'fk_infoId',
      references: {
        table: 'bookInfos',
        field: 'id',
      },
      onUpdate: 'cascade',
      transaction,
    });
    await queryInterface.addConstraint('infoGenres', ['genreId'], {
      type: 'foreign key',
      name: 'fk_genreId',
      references: {
        table: 'genres',
        field: 'id',
      },
      onUpdate: 'cascade',
      transaction,
    });
    await queryInterface.addConstraint('infoGenres', ['infoId', 'genreId'], {
      type: 'unique',
      name: 'unique_infoId_genreId',
      transaction,
    });
  }),
  down: (queryInterface) => queryInterface.removeConstraint('bookInfos', 'unique_name'),
};
