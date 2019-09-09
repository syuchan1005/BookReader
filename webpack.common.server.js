const { resolve } = require('path');
const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  context: resolve(__dirname, 'src/server'),
  resolve: {
    // Add '.ts' and '.tsx' as resolvable extensions.
    extensions: ['.ts', '.tsx', '.js', '.json'],
  },
  module: {
    rules: [
      /*
      {
        enforce: 'pre',
        test: /\.(ts|tsx)?$/,
        loader: 'tslint-loader',
        exclude: [resolve(__dirname, 'node_modules')],
      },
      */
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
        exclude: [resolve(__dirname, 'node_modules')],
      },

      {
        enforce: 'pre',
        test: /\.js$/,
        loader: 'source-map-loader',
      },
    ],
  },
  plugins: [
    new webpack.ProgressPlugin(),
  ],
  target: 'node',
  externals: [nodeExternals()],
  entry: './index.ts',
  output: {
    filename: 'index.js',
    path: resolve('dist/server'),
  },
  devtool: 'source-map',
};