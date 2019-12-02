module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.sequelize.transaction(async (transaction) => {
    const dialect = queryInterface.sequelize.getDialect();
    if (dialect !== 'sqlite') {
      throw new Error(`${dialect} do not support.`);
    }
    await queryInterface.createTable('genres', {
      id: {
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        type: Sequelize.INTEGER,
      },
      name: {
        allowNull: false,
        type: Sequelize.STRING,
        unique: true,
      },
    }, { transaction });
    await queryInterface.createTable('infoGenres', {
      id: {
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        type: Sequelize.INTEGER,
      },
      infoId: {
        allowNull: false,
        type: Sequelize.UUID,
      },
      genreId: {
        allowNull: false,
        type: Sequelize.INTEGER,
      },
    }, { transaction });
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
    await queryInterface.bulkInsert('genres', [
      { name: 'Invisible' },
      { name: 'Finished' },
    ], { transaction }).catch(() => { /* ignore */ });
    const genres = (await queryInterface.rawSelect('genres', {
      raw: false,
      plain: false,
      transaction,
    }, '')).reduce((o, v) => {
      // eslint-disable-next-line no-param-reassign
      o[v.name] = v.id;
      return o;
    }, {});
    const finishedInfos = (await queryInterface.rawSelect('bookInfos', {
      raw: false,
      plain: false,
      where: {
        finished: true,
      },
      transaction,
    }, 'id')).map(({ id }) => id);
    const invisibleInfos = (await queryInterface.rawSelect('bookInfos', {
      raw: false,
      plain: false,
      where: {
        invisible: true,
      },
      transaction,
    }, 'id')).map(({ id }) => id);
    if (invisibleInfos.length > 0 || finishedInfos.length > 0) {
      await queryInterface.bulkInsert('infoGenres', [
        ...(invisibleInfos.map((id) => ({
          infoId: id,
          genreId: genres.Invisible,
        }))),
        ...(finishedInfos.map((id) => ({
          infoId: id,
          genreId: genres.Finished,
        }))),
      ], { transaction });
    }
    const table = await queryInterface.describeTable('books');
    await queryInterface.createTable('new_books', table, { transaction });
    await queryInterface.sequelize.query('INSERT INTO new_books SELECT * FROM books;', { transaction });
    await queryInterface.dropTable('books', { transaction });
    await queryInterface.renameTable('new_books', 'books', { transaction });
    await queryInterface.removeColumn('bookInfos', 'finished', { transaction });
    await queryInterface.removeColumn('bookInfos', 'invisible', { transaction });
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
  }),
  down: (queryInterface, Sequelize) => queryInterface.sequelize.transaction(async (transaction) => {
    await queryInterface.addColumn('bookInfos', 'finished', {
      allowNull: false,
      defaultValue: false,
      type: Sequelize.BOOLEAN,
      after: 'history',
    }, { transaction });
    await queryInterface.addColumn('bookInfos', 'invisible', {
      allowNull: false,
      defaultValue: false,
      type: Sequelize.BOOLEAN,
      after: 'finished',
    }, { transaction });
    const genres = (await queryInterface.rawSelect('genres', {
      raw: false,
      plain: false,
      transaction,
    }, '')).reduce((o, v) => {
      // eslint-disable-next-line no-param-reassign
      o[v.name] = v.id;
      return o;
    }, {});
    const finishedInfoIds = (await queryInterface.rawSelect('infoGenres', {
      raw: false,
      plain: false,
      transaction,
      where: {
        genreId: genres.Finished,
      },
    }, 'infoId')).map(({ infoId }) => infoId);
    if (finishedInfoIds.length > 0) {
      await queryInterface.bulkUpdate('bookInfos', {
        finished: 1,
      }, {
        id: finishedInfoIds,
      }, { transaction });
    }
    const invisibleInfoIds = (await queryInterface.rawSelect('infoGenres', {
      raw: false,
      plain: false,
      transaction,
      where: {
        genreId: genres.Invisible,
      },
    }, 'infoId')).map(({ infoId }) => infoId);
    if (invisibleInfoIds.length > 0) {
      await queryInterface.bulkUpdate('bookInfos', {
        invisible: 1,
      }, {
        id: invisibleInfoIds,
      }, { transaction });
    }
    await queryInterface.dropTable('genres', { transaction });
    await queryInterface.dropTable('infoGenres', { transaction });
  }),
};

/*
    const table = (await queryInterface.describeTable('bookInfos'));
    delete table.finished;
    delete table.invisible;
    await queryInterface.createTable('new_bookInfos', table, { transaction });
    console.log('9.1');
    await queryInterface.sequelize.query(`INSERT INTO new_bookInfos SELECT
    ${Object.keys(table).join(',')} FROM bookInfos;`, { transaction });
    console.log('9.2');
    await queryInterface.dropTable('bookInfos', { transaction, force: true });
    console.log('9.3');
    await queryInterface.renameTable('new_bookInfos', 'bookInfos', { transaction });
    console.log('10');
 */
