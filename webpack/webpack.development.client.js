/* eslint-disable import/no-extraneous-dependencies */
const { resolve } = require('path');

const webpack = require('webpack');
const merge = require('webpack-merge');
const commonConfig = require('./webpack.common.client');
const createNoopServiceWorkerMiddleware = require('./noopServiceWorkerMiddleware');

module.exports = merge(commonConfig, {
  mode: 'development',
  entry: [
    // 'react-hot-loader/patch', // activate HMR for React
    'webpack-dev-server/client?http://localhost:8080', // bundle the client for webpack-dev-server and connect to the provided endpoint
    'webpack/hot/only-dev-server', // bundle the client for hot reloading, only- means to only hot reload for successful updates
    './index.tsx', // the entry point of our app
  ],
  output: {
    publicPath: '/',
  },
  devServer: {
    disableHostCheck: true,
    host: '0.0.0.0',
    port: '8080',
    hot: true,
    watchContentBase: true,
    contentBase: resolve('public'),
    historyApiFallback: {
      historyApiFallback: true,
    },
    proxy: {
      '**/*.jpg': {
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
    before(app) {
      app.use(createNoopServiceWorkerMiddleware());
    },
  },
  devtool: 'cheap-module-eval-source-map',
  plugins: [
    // enable HMR globally
    new webpack.HotModuleReplacementPlugin(),
    // prints more readable module names in the browser console on HMR updates
    new webpack.NamedModulesPlugin(),
  ],
});
