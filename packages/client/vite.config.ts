import { resolve } from 'path';

import { defineConfig } from 'vite';
import reactRefresh from '@vitejs/plugin-react-refresh';
import graphqlPlugin from '@rollup/plugin-graphql';
import { VitePWA } from 'vite-plugin-pwa';

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
    VitePWA({
      strategies: 'injectManifest',
      filename: 'service-worker.js',
      injectRegister: false,
    }),
  ],
  server: {
    port: 8080,
    proxy: {
      '**/*.jpg': {
        target: {
          host: 'localhost',
          port: 8081,
        },
      },
      '**/*.webp': {
        target: {
          host: 'localhost',
          port: 8081,
        },
      },
      '/graphql': {
        target: {
          host: 'localhost',
          port: 8081,
        },
        ws: true,
      },
    },
  },
});
