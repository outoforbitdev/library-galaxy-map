const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const NpmDtsPlugin = require('npm-dts-webpack-plugin');

module.exports = {
  mode: "production",
  entry: './src/index.ts',
  devtool: "inline-source-map",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          'ts-loader',
        ],
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: [
          // MiniCssExtractPlugin.loader,
          "style-loader",
          "css-loader",
        ]
      }
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist'),
    library: "galaxy-map",
    libraryTarget: "umd"
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css',
    }),
    new NpmDtsPlugin({
      output: "./dist/index.d.ts",
      entry: "./src/index.ts",
    })
  ]
};