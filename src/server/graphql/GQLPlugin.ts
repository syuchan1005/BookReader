import { ITypeDefinitions } from 'graphql-tools';

import BookModel from '@server/sequelize/models/book';
import BookInfoModel from '@server/sequelize/models/bookInfo';

import GQLMiddleware from './GQLMiddleware';

export interface GQLPlugin {
  typeDefs: ITypeDefinitions;
  middleware: GQLMiddleware;

  init(models: {
    BookModel: typeof BookModel,
    BookInfoModel: typeof BookInfoModel,
  }): void;
}

export interface InternalGQLPlugin extends GQLPlugin {
  info: { name: string, version: string };
  queries: {
    add: {
      name: string;
      args: string[];
    },
  };
}

// eslint-disable-next-line import/prefer-default-export
export const loadPlugins = (init = true): InternalGQLPlugin[] => {
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
        try {
          // eslint-disable-next-line no-eval
          const req = eval('require')(moduleName);
          const module: GQLPlugin = req.default || req;
          // eslint-disable-next-line no-eval
          const { name, version, bookReader } = eval('require')(`${moduleName}/package.json`);

          if (init) {
            module.init({ BookModel, BookInfoModel });
          }

          return {
            info: {
              name,
              version,
            },
            // eslint-disable-next-line no-undef
            queries: bookReader?.queries || {
              add: {
                name: `add${moduleName[0].toUpperCase()}${moduleName.substring(1)}`,
                args: ['number', 'url'],
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
