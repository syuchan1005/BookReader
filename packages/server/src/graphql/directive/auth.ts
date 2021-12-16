import { defaultFieldResolver, GraphQLSchema } from 'graphql';
import { getDirective, MapperKind, mapSchema } from '@graphql-tools/utils';
import { AuthDirectiveArgs } from '@syuchan1005/book-reader-graphql';

export default (schema: GraphQLSchema, directiveName: string) => mapSchema(schema, {
  // @ts-ignore
  [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
    const authDirective = getDirective(
      schema,
      fieldConfig,
      directiveName,
    )
      ?.[0] as AuthDirectiveArgs;

    if (!authDirective) {
      return;
    }
    const { resolve = defaultFieldResolver } = fieldConfig;
    // eslint-disable-next-line no-param-reassign
    fieldConfig.resolve = (source, args, context, info) => {
      const { state } = context.ctx;
      if (!state?.user) {
        throw new Error('Unauthorized');
      }
      const requiredPermissions = authDirective.permissions
        .filter((permission) => !state.user.permissions.includes(permission));
      if (requiredPermissions.length > 0) {
        throw new Error(`Unauthorized permission requested: ${requiredPermissions}`);
      }
      return resolve(source, args, context, info);
    };
  },
});
