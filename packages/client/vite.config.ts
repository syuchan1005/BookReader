/* eslint-disable no-console */
import { resolve } from 'path';
import fs from 'fs';

import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
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

const TimePlugin = (): Plugin => {
  const startTime = Date.now();

  let buildStartTime: number;
  let buildEndTime: number;
  let renderStartTime: number;

  const period = (s: number, e: number) => (Math.abs((e - s)) / 1000).toFixed(3);

  return {
    name: 'vite-plugin-build-time',
    apply: 'build',
    buildStart() {
      buildStartTime = Date.now();
    },
    buildEnd() {
      buildEndTime = Date.now();
    },
    renderStart() {
      renderStartTime = Date.now();
    },
    renderError() {
      renderStartTime = Date.now();
    },
    closeBundle() {
      const endTime = Date.now();
      // Catch potential render NPEs
      try {
        console.log(`build  ${period(buildStartTime, buildEndTime)}s`);
        console.log(`render ${period(renderStartTime, endTime)}s`);
        console.log(`full   ${period(startTime, endTime)}s`);
      } catch (error) {
        if (error instanceof Error) {
          this.warn(error);
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
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-router-dom', 'react-dom'],
          apollo: [
            'graphql',
            '@apollo/client',
            'apollo-upload-client',
            'apollo3-cache-persist',
            'graphql-ws',
          ],
          mui: [
            '@emotion/react',
            '@emotion/styled',
            '@mui/material',
            '@mui/styles',
          ],
        },
      },
    },
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
    TimePlugin(),
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
      '^(/(book|info)/[^/]+|)/image$': {
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
