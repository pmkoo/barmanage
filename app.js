var express = require('express')
var path = require('path')
var favicon = require('serve-favicon')
var logger = require('morgan')
var cookieParser = require('cookie-parser')
var session = require('express-session')
var RedisStore = require('connect-redis')(session)
var bodyParser = require('body-parser')

var app = express()

/******************* webpack-dev-middleware *************************/
if (process.env.NODE_ENV != 'production') {
  const webpackConfig = require('./webpack.dev.config')
  const webpackDevMiddleware = require('webpack-dev-middleware')
  const webpack = require('webpack')
  const compiler = webpack(webpackConfig)
  app.use(webpackDevMiddleware(compiler, {
    publicPath: webpackConfig.output.publicPath
  }))
}
/*********************** webpack-dev-middleware end ******************/

app.use(require('./middlewares/helper'))
app.use(function(req, res, next) {
  app.locals.active = req.path.split('/')[1]
  next()
})

// 使用session中间件
app.use(session({
  store: new RedisStore({
    host: 'localhost',
    port: 6379,
    logErrors: true
  }),
  saveUninitialized: true,
  secret: 'weizhong_shinan_wangshaojun',
  resave: false
}))

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public'), { maxAge: 86400000 }));
app.use(express.static(path.join(__dirname, 'release'), { maxAge: 86400000 }));
app.use(express.static(path.join(__dirname, 'uploads'),{ maxAge: 86400000 }));

var initRouters = require('./routes/init')
initRouters(app)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = app;