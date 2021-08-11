/* eslint-disable no-console */
import { DataTypes, QueryInterface } from 'sequelize';

module.exports = {
  up: (
    queryInterface: QueryInterface,
    Sequelize: typeof DataTypes,
  ) => queryInterface.sequelize.transaction(async (transaction) => {
    await queryInterface.addColumn('genres', 'invisible', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    }, { transaction });
    await queryInterface.bulkUpdate('genres', {
      invisible: true,
    }, {
      name: 'Invisible',
    }, { transaction });
  }),
  down: (
    queryInterface: QueryInterface,
    // Sequelize: typeof DataTypes,
  ) => queryInterface.removeColumn('genres', 'invisible'),
};
