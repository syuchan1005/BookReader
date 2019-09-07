import { DataTypes } from 'sequelize';

module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.createTable('bookInfos', {
    id: {
      allowNull: false,
      primaryKey: true,
      type: Sequelize.UUID,
    },
    name: {
      allowNull: false,
      unique: true,
      type: Sequelize.STRING,
    },
    thumbnail: {
      type: Sequelize.STRING,
    },
    count: {
      allowNull: false,
      defaultValue: 0,
      type: DataTypes.INTEGER,
    },
    createdAt: {
      allowNull: false,
      type: Sequelize.DATE,
    },
    updatedAt: {
      allowNull: false,
      type: Sequelize.DATE,
    },
    deletedAt: {
      type: Sequelize.DATE,
    },
  }),
  down: (queryInterface) => queryInterface.dropTable('bookInfos'),
};
