module.exports = {
  up: (queryInterface) => queryInterface.bulkUpdate('genres', {
    name: 'Completed',
  }, {
    name: 'Finished',
  }),
  down: (queryInterface) => queryInterface.bulkUpdate('genres', {
    name: 'Finished',
  }, {
    name: 'Completed',
  }),
};
