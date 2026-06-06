import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    alias: {
      '@server': resolve(__dirname, './src'),
      'natural-orderby': resolve(__dirname, './src/sort'),
      '@syuchan1005/book-reader-graphql': resolve(
        __dirname,
        './generated/GQLResolvers.ts',
      ),
    },
  },
});
