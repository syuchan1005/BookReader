import path from 'path';
import GQLMiddleware from './GQLMiddleware';
type ITypeDefinitions = any;

export { default as GQLMiddleware } from './GQLMiddleware';
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

const runtimeRequire = require;

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
          moduleName = path.resolve(runtimeRequire.main.filename, `../../../${moduleName}`);
        }
        try {
          const req = runtimeRequire(moduleName);
          const module: GQLPlugin = req.default || req;
          const { name, version, bookReader } = runtimeRequire(`${moduleName}/package.json`);

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
