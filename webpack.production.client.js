const { resolve } = require('path');
const merge = require('webpack-merge');

const commonConfig = require('./webpack.common.client');

module.exports = merge(commonConfig, {
  mode: 'production',
  entry: './index.tsx',
  output: {
    filename: 'js/bundle.[hash].min.js',
    path: resolve('dist/client'),
    publicPath: '/',
  },
  devtool: 'source-map',
  plugins: [],
});
