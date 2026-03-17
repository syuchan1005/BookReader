import { mergeResolvers } from '@graphql-tools/merge';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { resolvers } from '@server/graphql/resolvers';
import { schemaString } from '@syuchan1005/book-reader-graphql';
import { GraphQLScalarType, type GraphQLSchema } from 'graphql';
import { createYoga } from 'graphql-yoga';
import BigIntScalar from './scalar/BigIntScalar';
import IntRangeScalar from './scalar/IntRange';

export const SubscriptionKeys = {
  ADD_BOOKS: 'ADD_BOOKS',
  BULK_EDIT_PAGE: 'BULK_EDIT_PAGE',
};

const FileScalar = new GraphQLScalarType({
  name: 'File',
  description: 'File upload scalar type (handled natively by GraphQL Yoga)',
  parseValue: (value) => value,
  parseLiteral() {
    throw new Error('Upload literal is not supported');
  },
  serialize() {
    throw new Error('Upload serialization is not supported');
  },
});

export default class GraphQL {
  public readonly yoga: ReturnType<typeof createYoga>;

  private readonly schema: GraphQLSchema;

  constructor() {
    this.schema = makeExecutableSchema({
      typeDefs: schemaString,
      resolvers: mergeResolvers([
        {
          BigInt: BigIntScalar,
          IntRange: IntRangeScalar,
          File: FileScalar,
        },
        resolvers,
      ]),
    });

    this.yoga = createYoga({
      schema: this.schema,
      graphqlEndpoint: '/graphql',
      maskedErrors: false,
      landingPage: false,
    });
  }

  applyMiddleware(app, preMiddleware) {
    app.use(this.yoga.graphqlEndpoint, preMiddleware, this.yoga);
  }
}
