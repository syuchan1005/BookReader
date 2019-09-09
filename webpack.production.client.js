const { resolve } = require('path');
const WorkboxWebpackPlugin = require('workbox-webpack-plugin');
const merge = require('webpack-merge');

const commonConfig = require('./webpack.common.client');

const dist = resolve('dist/client');

module.exports = merge(commonConfig, {
  mode: 'production',
  entry: './index.tsx',
  output: {
    filename: 'js/bundle.[hash].min.js',
    path: dist,
    publicPath: '/',
  },
  devtool: 'source-map',
  plugins: [
    new WorkboxWebpackPlugin.GenerateSW({
      globDirectory: dist,
      globPatterns: ['*.{html,js}'],
      swDest: `${dist}/service-worker.js`,
      clientsClaim: true,
      skipWaiting: true,
      cacheId: 'bookReader',
      exclude: [
        /\.map$/,
        /icons\//,
        /favicon\.ico$/,
        /manifest\.json$/,
      ],
    }),
  ],
});
