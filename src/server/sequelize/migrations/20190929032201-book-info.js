/* eslint-disable arrow-body-style */
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('bookInfos', 'history', {
      allowNull: false,
      defaultValue: false,
      type: Sequelize.BOOLEAN,
      after: 'count',
    });
  },
  down: (queryInterface) => {
    return queryInterface.removeColumn('bookInfos', 'history');
  },
};
