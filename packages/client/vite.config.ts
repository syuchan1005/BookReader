import { resolve } from 'path';
import fs from 'fs';

import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa';
import bundleVisualizer from 'rollup-plugin-visualizer';

const serviceWorkerFileName = 'service-worker.ts';
const RemoveServiceWorkerTsFilePlugin = (): Plugin => {
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
        } catch (ignored) {
          /* ignored */
        }
      }
    },
  };
};

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    dedupe: ['@apollo/client'],
    alias: {
      '@client': resolve(__dirname, 'src'),
    },
  },
  build: {
    brotliSize: false,
  },
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      filename: serviceWorkerFileName,
      injectRegister: false,
      manifest: false,
    }),
    RemoveServiceWorkerTsFilePlugin(),
    bundleVisualizer({
      template: 'treemap',
      gzipSize: true,
      filename: 'dist/stats.html',
    }),
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
