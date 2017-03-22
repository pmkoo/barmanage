var routes = require('./index')
var occupy = require('./occupy')
var login = require('./login')
var order = require('./order')
var show = require('./show')
var admin = require('./admin')
var ajax = require('./ajax')
var wx = require('./wx')

module.exports = function (app) {
  app.use('/', routes)
  app.use('/login', login)
  app.use('/occupy', occupy)
  app.use('/order', order)
  app.use('/show', show)
  app.use('/admin', admin)
  app.use('/ajax', ajax)
  app.use('/wx', wx)
}