/* eslint-disable arrow-body-style */
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('bookInfos', 'invisible', {
      allowNull: false,
      defaultValue: false,
      type: Sequelize.BOOLEAN,
      after: 'finished',
    }).catch(() => { /* ignored */ });
  },
  down: (queryInterface) => {
    return queryInterface.removeColumn('bookInfos', 'invisible');
  },
};
