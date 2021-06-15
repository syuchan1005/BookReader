const { build } = require('esbuild');
const graphqlPlugin = require('@luckycatfactory/esbuild-graphql-loader').default;
const NodeResolve = require('@esbuild-plugins/node-resolve').default;


const argEnv = process.argv[2] || 'development';

const config = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  outbase: './src',
  outdir: './dist',
  platform: 'node',
  plugins: [
    graphqlPlugin(),
    NodeResolve({
      extensions: ['.ts', '.js'],
      onResolved: (resolved) => {
          if (resolved.includes('node_modules') && !resolved.includes('@syuchan1005')) {
              return {
                  external: true,
              }
          }
          return resolved
      },
  }),
  ],
  watch: false,
  minify: process.env.NODE_ENV === 'production',
};

if (argEnv !== 'development') {
  config.define = {
    'process.env.NODE_ENV': `"${process.env.NODE_ENV}"`,
  };
}

build(config);
