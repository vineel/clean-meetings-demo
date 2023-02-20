// Webpack uses this to work with directories
const path = require('path');

// This is the main configuration object.
// Here, you write different options and tell Webpack what to do
module.exports = env => {
  return {

    // Path to your entry point. From this file Webpack will begin its work
    entry: './src/index.ts',

    // Path and filename of your result bundle.
    // Webpack will bundle all JavaScript into this file
    output: {
      path: path.resolve(__dirname, 'dist'),
      publicPath: '',
      filename: 'bundle.js'
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js']
    },
    devtool: 'eval-source-map',
    module: {
      rules: [
        {
          test: /\.ts?$/,
          use: 'ts-loader',
          exclude: /(node_modules)/,
        },
        {
          test: /\.js$/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env']
            }
          },
          exclude: /(node_modules)/,
        }
      ]
    },

    // Default mode for Webpack is production.
    // Depending on mode Webpack will apply different things
    // on the final bundle. For now, we don't need production's JavaScript 
    // minifying and other things, so let's set mode to development
    mode: 'development'
  }
};
