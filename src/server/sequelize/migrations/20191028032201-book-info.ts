/* eslint-disable no-console */
import { DataTypes, QueryInterface } from 'sequelize';

module.exports = {
  up: (
    queryInterface: QueryInterface,
    Sequelize: typeof DataTypes,
  ) => queryInterface.addColumn('bookInfos', 'finished', {
    allowNull: false,
    defaultValue: false,
    type: Sequelize.BOOLEAN,
    // @ts-ignore
    after: 'history',
  }).catch(() => { /* ignored */ }),
  down: (
    queryInterface: QueryInterface,
    // Sequelize: typeof DataTypes,
  ) => queryInterface.removeColumn('bookInfos', 'finished'),
};
