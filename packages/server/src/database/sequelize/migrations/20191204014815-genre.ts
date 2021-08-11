/* eslint-disable no-console */
import { QueryInterface } from 'sequelize';

module.exports = {
  up: (
    queryInterface: QueryInterface,
    // Sequelize: typeof DataTypes,
  ) => queryInterface.bulkUpdate('genres', {
    name: 'Completed',
  }, {
    name: 'Finished',
  }),
  down: (
    queryInterface: QueryInterface,
    // Sequelize: typeof DataTypes,
  ) => queryInterface.bulkUpdate('genres', {
    name: 'Finished',
  }, {
    name: 'Completed',
  }),
};
