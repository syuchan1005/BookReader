import { resolve } from 'path';

import { defineConfig } from 'vite';
import reactRefresh from '@vitejs/plugin-react-refresh';
import graphqlPlugin from '@rollup/plugin-graphql';
import { injectManifest } from 'rollup-plugin-workbox';

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@client': resolve(__dirname, 'src'),
    },
  },
  build: {
    brotliSize: false,
  },
  plugins: [
    reactRefresh(),
    graphqlPlugin(),
    injectManifest({
      swSrc: 'src/service-worker.ts',
      swDest: 'dist/service-worker.js',
      globDirectory: resolve(__dirname, 'dist'),
    }),
  ],
  server: {
    port: 8080,
  },
});
