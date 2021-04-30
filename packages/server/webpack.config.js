/* eslint-disable import/no-extraneous-dependencies */
const { resolve } = require('path');
const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HardSourceWebpackPlugin = require('hard-source-webpack-plugin');

module.exports = {
  mode: 'development',
  context: resolve('src'),
  resolve: {
    // Add '.ts' and '.tsx' as resolvable extensions.
    extensions: ['.ts', '.tsx', '.js', '.json'],
    alias: {
      '@server': resolve(__dirname, 'src'),
    },
  },
  module: {
    rules: [
      {
        test: /\.(graphql|gql)$/,
        exclude: /node_modules/,
        loader: 'graphql-tag/loader',
      },
      {
        test: /\.(ts|tsx)?$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
            },
          },
        ],
        exclude: [resolve('node_modules')],
      },
      {
        enforce: 'pre',
        test: /\.js$/,
        loader: 'source-map-loader',
      },
    ],
  },
  plugins: [
    new HardSourceWebpackPlugin(),
    new CleanWebpackPlugin(),
    new webpack.ProgressPlugin(),
  ],
  target: 'node',
  externals: [nodeExternals({
     allowlist: [/@syuchan1005\/(.+)/],
     modulesDir: resolve(__dirname, '../../node_modules'),
  })],
  entry: './index.ts',
  output: {
    filename: 'index.js',
    path: resolve('dist'),
  },
  devtool: 'source-map',
};
