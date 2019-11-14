import { ITypeDefinitions } from 'graphql-tools';

import GQLMiddleware from './GQLMiddleware';

export interface GQLPlugin {
  typeDefs: ITypeDefinitions;
  middleware: GQLMiddleware;
}

export interface InternalGQLPlugin extends GQLPlugin {
  info: { name: string, version: string };
}

// eslint-disable-next-line import/prefer-default-export
export const loadPlugins = (): InternalGQLPlugin[] => {
  const env = process.env.BOOKREADER_PLUGIN;
  if (env) {
    const modules = env.split(',')
      .filter((s) => s.length > 0)
      .map((s): InternalGQLPlugin => {
        const moduleName = s[0] === '@' ? s : s.split('/')[1];
        try {
          // eslint-disable-next-line no-eval
          const req = eval('require')(moduleName);
          const module: GQLPlugin = req.default || req;
          // eslint-disable-next-line no-eval
          const { name, version } = eval('require')(`${moduleName}/package.json`);
          return {
            info: {
              name,
              version,
            },
            ...module,
          };
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error(`Cannot find plugin: '${moduleName} (${s})'`);
          return undefined;
        }
      });
    return modules.filter((m) => m);
  }
  return [];
};
