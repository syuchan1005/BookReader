import { build } from 'esbuild';
import { NodeResolvePlugin } from '@esbuild-plugins/node-resolve';

const argEnv = process.argv[2] || 'development';

// noinspection JSIgnoredPromiseFromCall
build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  outbase: './src',
  outdir: './dist',
  platform: 'node',
  plugins: [
    NodeResolvePlugin({
      extensions: ['.ts', '.js'],
      onResolved: (resolved) => {
        if (resolved.includes('node_modules') && !resolved.includes('@syuchan1005')) {
          return {
            external: true,
          };
        }
        return resolved;
      },
    }),
  ],
  loader: {
    '.graphql': 'text',
  },
  minify: argEnv === 'production',
  define: argEnv !== 'development' ? {
    'process.env.NODE_ENV': `"${process.env.NODE_ENV}"`,
  } : undefined,
});
