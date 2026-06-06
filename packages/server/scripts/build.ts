import type {} from 'bun';

const argEnv = process.argv[2] || 'development';

console.log(`Building server in ${argEnv} mode...`);

const result = await Bun.build({
  entrypoints: ['src/index.ts'],
  outdir: './dist',
  target: 'node',
  packages: 'external',
  tsconfig: './tsconfig.json',
  loader: {
    '.graphql': 'text',
  },
  minify: argEnv === 'production',
  // Only inject process.env.NODE_ENV during production/non-development builds.
  // In development, keep it undefined so it can be dynamically read from the runtime environment.
  define:
    argEnv !== 'development'
      ? {
          'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
        }
      : undefined,
});

if (!result.success) {
  console.error('Build failed');
  for (const message of result.logs) {
    console.error(message);
  }
  process.exit(1);
}

console.log('Build completed successfully.');
