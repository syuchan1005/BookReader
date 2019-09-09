const { resolve } = require('path');

const webpack = require('webpack');
const merge = require('webpack-merge');
const commonConfig = require('./webpack.common.client');

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
    port: '8080',
    hot: true,
    watchContentBase: true,
    contentBase: resolve(__dirname, 'public'),
    historyApiFallback: {
      historyApiFallback: true,
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
