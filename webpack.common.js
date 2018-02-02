const path = require('path');

module.exports = {
  entry: {
    polyfill: 'babel-polyfill',
    app: './src/index.js'
  },
  output: {
    path: path.resolve(__dirname, 'build')
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [ 'style-loader', 'css-loader' ]
      },
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['env'],
            plugins: [
              ['transform-runtime', {
                'polyfill': false,
                'regenerator': false
              }],
              'transform-object-rest-spread'
            ]
          }
        }
      }
    ]
  }
}