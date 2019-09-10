/* eslint-disable import/no-extraneous-dependencies */
const { resolve } = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const WorkboxWebpackPlugin = require('workbox-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const dist = resolve('dist/client');

module.exports = {
  context: resolve(__dirname, 'src/client'),
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
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
      {
        test: /\.png$/,
        loader: 'url-loader?limit=100000',
      },
      {
        test: /\.jpg$/,
        loader: 'file-loader',
      },
      {
        test: /\.(woff|woff2)(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'url-loader?limit=10000&mimetype=application/font-woff',
      },
      {
        test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'url-loader?limit=10000&mimetype=application/octet-stream',
      },
      {
        test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'file-loader',
      },
      {
        test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'url-loader?limit=10000&mimetype=image/svg+xml',
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new webpack.ProgressPlugin(),
    // inject <script> in html file.
    new MiniCssExtractPlugin({
      filename: 'style.css',
      chunkFilename: '[id].css',
    }),
    new HtmlWebpackPlugin({
      template: resolve(__dirname, 'public/index.html'),
    }),
    new CopyWebpackPlugin(
      [
        {
          from: resolve(__dirname, 'public'),
          to: resolve(__dirname, 'dist/client'),
          ignore: [
            'index.html',
            '.DS_Store',
          ],
        },
      ],
    ),
    new WorkboxWebpackPlugin.InjectManifest({
      swSrc: './src/client/service-worker.js',
      swDest: `${dist}/service-worker.js`,
      globDirectory: dist,
      globPatterns: ['*.{html,js}'],
      exclude: [
        /\.map$/,
        /icons\//,
        /favicon\.ico$/,
        /manifest\.json$/,
      ],
    }),
  ],
};
