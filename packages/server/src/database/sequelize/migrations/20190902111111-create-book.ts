/* eslint-disable no-console */
import { DataTypes, QueryInterface } from 'sequelize';

module.exports = {
  up: (
    queryInterface: QueryInterface,
    Sequelize: typeof DataTypes,
  ) => queryInterface.createTable('books', {
    id: {
      allowNull: false,
      primaryKey: true,
      type: Sequelize.UUID,
    },
    thumbnail: {
      type: Sequelize.STRING,
    },
    number: {
      allowNull: false,
      unique: 'info',
      type: Sequelize.STRING,
    },
    pages: {
      allowNull: false,
      type: Sequelize.INTEGER,
    },
    infoId: {
      allowNull: false,
      unique: 'info',
      type: Sequelize.UUID,
    },
    createdAt: {
      allowNull: false,
      type: Sequelize.DATE,
    },
    updatedAt: {
      allowNull: false,
      type: Sequelize.DATE,
    },
  }),
  down: (
    queryInterface: QueryInterface,
    // Sequelize: typeof DataTypes,
  ) => queryInterface.dropTable('books'),
};
