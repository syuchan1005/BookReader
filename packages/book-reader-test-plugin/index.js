/* eslint-disable-next-line import/no-extraneous-dependencies */
const { gql } = require('apollo-server-koa');

module.exports = {
  typeDefs: gql('type Mutation { addTest(id: ID! number: String! url: String!): Result!}'),
  middleware: {
    Mutation: (_, { util }) => ({
      addTest: () => ({ success: !!util.saveImage }),
    }),
  },
  init: () => {},
};
