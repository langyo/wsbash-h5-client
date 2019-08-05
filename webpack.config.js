var path = require('path');

module.exports = {
  mode: 'development',

  entry: './demo/index.js',

  output: {
    path: path.resolve(__dirname, 'demo'),
    filename: 'bundle.js'
  },

  devtool: 'source-map',

  module: {
    rules: [
      {
        test: /\.(js)$/,
        exclude: /node_modules/,
        use: 'babel-loader'
      }
    ]
  },

  devServer: {
    inline: true,
    hot: true,
    filename: 'bundle.js',
    publicPath: '/demo/',
    port: 16000
  }
};
