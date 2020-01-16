/* eslint-disable arrow-body-style */
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('bookInfos', 'finished', {
      allowNull: false,
      defaultValue: false,
      type: Sequelize.BOOLEAN,
      after: 'history',
    }).catch(() => { /* ignored */ });
  },
  down: (queryInterface) => {
    return queryInterface.removeColumn('bookInfos', 'finished');
  },
};
