var webpack = require('webpack')
var path = require('path')

const outputPath = path.join(__dirname, 'release')

module.exports = function(env) {
  return {
    entry: {
      main: './public/js/index.js',
      form: './public/js/form.js',
      occupy: './public/js/occupy.js'
    },
    output: {
      filename: '[name].bundle.js',
      path: outputPath,
      publicPath: '/assets',
      chunkFilename: '[id].chunk.js'
    },
    module: {
      loaders: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          loader: 'babel-loader',
          query: { "presets": ["es2015"] }
        },
        {
          test: /\.css$/,
          exclude: /node_modules/,
          loader: 'style-loader!css-loader'
        }
      ]
    },
    resolve: {
      alias: {
        'vue$': 'vue/dist/vue.common.js'
      }
    },
    plugins: [
      /*
        处理多个入口文件中公共引用的代码，使用Commons中间件,
        例如，main和form两个入口文件里面公共引用的部分，会被合并到init.js里面
      */
      new webpack.optimize.CommonsChunkPlugin('init.js')
    ]
  }
}()

