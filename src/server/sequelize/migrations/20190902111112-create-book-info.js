// noinspection JSUnresolvedVariable
module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.createTable('bookInfos', {
    id: {
      allowNull: false,
      primaryKey: true,
      type: Sequelize.UUID,
    },
    name: {
      allowNull: false,
      unique: 'name',
      type: Sequelize.STRING,
    },
    thumbnail: {
      type: Sequelize.STRING,
    },
    count: {
      allowNull: false,
      defaultValue: 0,
      type: Sequelize.INTEGER,
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
  down: (queryInterface) => queryInterface.dropTable('bookInfos'),
};
