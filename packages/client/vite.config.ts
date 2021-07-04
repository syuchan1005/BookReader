import { resolve } from 'path';
import fs from 'fs';

import { defineConfig, Plugin } from 'vite';
import reactRefresh from '@vitejs/plugin-react-refresh';
import graphqlPlugin from '@rollup/plugin-graphql';
import { VitePWA } from 'vite-plugin-pwa';

const serviceWorkerFileName = 'service-worker.ts';
const RemoveObsolateServiceWorkerPlugin = (): Plugin => {
  let outDir;
  return {
    name: 'remove service-worker.ts',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir || 'dist';
    },
    closeBundle() {
      if (serviceWorkerFileName) {
        try {
          fs.unlinkSync(`${outDir}/${serviceWorkerFileName}`);
          console.log(`Remove: ${outDir}/${serviceWorkerFileName}`);
        } catch (ignored) {}
      }
    },
  };
};

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
      filename: serviceWorkerFileName,
      injectRegister: false,
      manifest: false,
    }),
    RemoveObsolateServiceWorkerPlugin(),
  ],
  server: {
    port: 8080,
    proxy: {
      '^/book/.*.(jpg|webp)[^/]*$': {
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
