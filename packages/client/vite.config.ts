import { resolve } from 'path';
import fs from 'fs';

import { defineConfig, Plugin } from 'vite';
import reactRefresh from '@vitejs/plugin-react-refresh';
import { VitePWA } from 'vite-plugin-pwa';

const serviceWorkerFileName = 'service-worker.ts';
const RemoveObsoleteServiceWorkerPlugin = (): Plugin => {
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
        } catch (ignored) { /* ignored */ }
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
    VitePWA({
      strategies: 'injectManifest',
      filename: serviceWorkerFileName,
      injectRegister: false,
      manifest: false,
    }),
    RemoveObsoleteServiceWorkerPlugin(),
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
