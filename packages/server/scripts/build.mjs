import { readFileSync } from 'node:fs';
import { build } from 'esbuild';

const argEnv = process.argv[2] || 'development';

// Read tsconfig path aliases so we can bundle them instead of marking as external.
const tsconfig = JSON.parse(readFileSync('./tsconfig.json', 'utf-8'));
const tsconfigPathPrefixes = Object.keys(
  tsconfig.compilerOptions?.paths ?? {},
).map((p) => (p.endsWith('/*') ? p.slice(0, -2) : p));

// Mark all bare module imports (node_modules) as external by their package name.
// Excludes @syuchan1005/* packages and any tsconfig path aliases, which should be bundled.
const externalNodeModulesPlugin = {
  name: 'external-node-modules',
  setup(build) {
    build.onResolve({ filter: /^[^./]/ }, (args) => {
      const isLocalAlias = tsconfigPathPrefixes.some(
        (prefix) => args.path === prefix || args.path.startsWith(`${prefix}/`),
      );
      const isLocalPackage = args.path.startsWith('@syuchan1005/');
      if (!isLocalAlias && !isLocalPackage) {
        return { external: true };
      }
    });
  },
};

// noinspection JSIgnoredPromiseFromCall
build({
  tsconfig: 'tsconfig.json',
  entryPoints: ['src/index.ts'],
  bundle: true,
  outbase: './src',
  outdir: './dist',
  platform: 'node',
  plugins: [externalNodeModulesPlugin],
  loader: {
    '.graphql': 'text',
  },
  minify: argEnv === 'production',
  define:
    argEnv !== 'development'
      ? {
          'process.env.NODE_ENV': `"${process.env.NODE_ENV}"`,
        }
      : undefined,
});
