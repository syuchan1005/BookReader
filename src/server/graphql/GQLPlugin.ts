import { ITypeDefinitions } from 'graphql-tools';

import path from 'path';
import GQLMiddleware from './GQLMiddleware';

export interface GQLPlugin {
  typeDefs: ITypeDefinitions;
  middleware: GQLMiddleware;
}

export interface InternalGQLPlugin extends GQLPlugin {
  info: { name: string, version: string };
  queries: {
    add: {
      name: string;
      args: string[];
      subscription?: boolean;
    },
  };
}

// eslint-disable-next-line import/prefer-default-export
export const loadPlugins = (): InternalGQLPlugin[] => {
  const env = process.env.BOOKREADER_PLUGIN;
  if (env) {
    const modules = env.split(',')
      .filter((s) => s.length > 0)
      .map((s: string): InternalGQLPlugin => {
        let moduleName = s;
        if (moduleName[0] === '@') {
          const at = s.indexOf('@', 1);
          if (at === -1) {
            moduleName = s.substring(0, at);
          }
        } else {
          const strings = s.split('/');
          moduleName = strings[1] || strings[0];
        }
        if (s[0] === '.') {
          // eslint-disable-next-line no-eval
          moduleName = path.resolve(eval('require.main.filename'), `../../../${moduleName}`);
        }
        try {
          // eslint-disable-next-line no-eval
          const req = eval('require')(moduleName);
          const module: GQLPlugin = req.default || req;
          // eslint-disable-next-line no-eval
          const { name, version, bookReader } = eval('require')(`${moduleName}/package.json`);

          const queriesName = bookReader.name || moduleName;
          return {
            info: {
              name: bookReader.name || name,
              version,
            },
            // eslint-disable-next-line no-undef
            queries: bookReader?.queries || {
              add: {
                name: `add${queriesName[0].toUpperCase()}${queriesName.substring(1)}`,
                args: ['id', 'number', 'url'],
                subscription: false,
              },
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
