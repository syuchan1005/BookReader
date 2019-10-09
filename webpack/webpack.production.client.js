/* eslint-disable import/no-extraneous-dependencies */
const { resolve } = require('path');
const merge = require('webpack-merge');

const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

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
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      openAnalyzer: false,
    }),
  ],
});
