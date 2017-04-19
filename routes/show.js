/**
 * Created by shinan on 2017/1/23.
 * 霸屏路由
 */
const express = require('express')
const models = require('../models')
const sha1 = require('../lib/sha1')
const Token = require('../lib/Token')
const auth = require('../middlewares/auth')
const co = require('co')
const moment = require('moment')
const router = express.Router();
const {Message, User, LandInfo, sequelize} = models
const DataApi = require('../lib/DataApi')

global._bapingStatus = global._bapingStatus || {}

router.get('/', auth, (req, res, next) => {
  co(function*() {
    var barId = req.session.barInfo.id
    // var messages = yield Message.findAll({
    //   where: {
    //     BarId: req.session.barInfo.id,
    //     createdAt: {
    //       $gt: moment().subtract('3', 'days')
    //     }
    //   }
    // })

    // var set = new Set()
    // messages.forEach(message => set.add(message.UserId))

    // var users = yield User.findAll({
    //   where: {id: Array.from(set)}
    // })

    // var usersHash = {}

    // users.forEach(function(user) {
    //   usersHash[user.id] = user.get({plain: true})
    // })

    // messages.forEach(function(message) {
    //   message = message.get({plain: true})

    //   message.createdAt = moment(message.createdAt).format('MM-DD HH:mm')

    //   const user = usersHash[message.UserId]
    //   message.userName = user.name
    //   message.userAvatar = user.avatar
    // })

    var messages = yield DataApi.getAllMessages(barId)

    messages.forEach(msg => msg.createdAt = moment(msg.createdAt).format('HH:mm'))

    global._bapingStatus[barId] = 'open'

    res.render('show', {
      messages: messages
    })
  }).catch(next)
})

// 获取未播放的霸屏
router.get('/getPendingBaping', (req, res, next) => {
  co(function*() {
    // var messages = yield Message.findAll({
    //   where: {
    //     BarId: req.session.barInfo.id,
    //     isDisplay: false,
    //     isPayed: true,
    //     msgType: 2
    //   }
    // })

    // var msg = messages.length > 0 ? messages[0].get({plain:true}) : null

    // if (msg) {
    //   var user = yield User.findOne({
    //     where: {
    //       id: msg.UserId
    //     }
    //   })

    //   msg.UserAvatar = user.avatar
    //   msg.UserName = user.name
    // }

    var messages = yield DataApi.getMessages({
      BarId: req.session.barInfo.id,
      isDisplay: false,
      isPayed: true,
      msgType: 2
    })

    var msg = messages.length > 0 ? messages[0] : null

    res.json({
      iRet: 0,
      data: msg
    })
  }).catch(err => {
    res.json({
      iRet: -1
    })
  })
})

// 播放完毕后，更新霸屏消息状态
router.post('/setMessageDisplay', (req, res, next) => {
  co(function*() {
    yield Message.update({
      isDisplay: true
    }, {
      where: {
        id: req.body.id
      }
    })

    res.json({
      iRet: 0
    })
  }).catch(err => {
    res.json({
      iRet: -1
    })
  })
})

// 获取最新消息
router.get('/getNewMessages', (req, res, next) => {
  const barId = req.session.barInfo.id
  const lastMessageId = req.query.lastMessageId

  DataApi.getLatestMessages({
    barId,
    lastMessageId
  }).then(messages => {
    messages.forEach(msg => msg.createdAt = moment(msg.createdAt).format('HH:mm'))

    res.json({
      iRet: 0,
      data: messages
    })
  }).catch(err => {
    res.json({
      iRet: -1
    })
  })
})

router.get('/getNewLamp', (req, res, next) => {
  //const barId = req.session.barInfo.id

  let barId = 1
  co(function *() {

    //登录上次显示时间和目前大于1小时就显示
    let _sql = `SELECT id, name, avatar, exp, gender FROM Users u WHERE u.id IN (SELECT userid FROM LandInfos l WHERE \
    l.BarId = ${barId} AND (l.displayAt IS NULL \
    OR l.displayAt < DATE_SUB(NOW(), INTERVAL 1 HOUR))) \
    GROUP BY u.id;`

    // let _secondspan = 3600
    // let _sql = `SELECT u.id, u.name, u.avatar, u.exp, u.gender\
    //   FROM Users u WHERE\
    //     u.id IN (SELECT DISTINCT userid\
    //       FROM weizhong.landinfos l\
    //       WHERE\
    //         l.barid = ${barId}\
    //           AND TIMESTAMPDIFF(SECOND,\
    //           l.displayAt,\
    //           l.updatedAt) > ${_secondspan})\
    //   GROUP BY u.id;`

    let _result = yield sequelize.query(_sql)

    if (_result && _result[0] && _result[0].length > 0) {
      let _ret = _result[0].map((obj) => {
        let _lv = DataApi.getLv(parseFloat(obj['exp']) * DataApi.m2exp)
        return {
          lv: _lv['lv'],
          id: obj['id'],
          name: obj['name'],
          gender: obj['gender'],
          avatar: obj['avatar'],
          exp: obj['exp']
        }
      }).filter((obj) => {  //过滤等级大于5级的用户
        return obj['lv'] >= 5
      })

      let updateUserIds = _ret.map((obj) => {
        return obj['id']
      })
      let _ret_up = yield LandInfo.update({displayAt: new Date()}, {
        where: {userid: {$in: updateUserIds}},
        barid: barId
      })

      res.json({iRet: 0, data: _ret})
    } else {
      res.json({iRet: 0, data: null})
    }
  }).catch((err) => {
    res.json({iRet: -1, msg: err})
  })
})

// 获取最新消息
router.get('/close', (req, res, next) => {
  const barId = req.session.barInfo.id
  if (!/\d+/.test(barId)) {
    res.json({iRet: -1, msg: "参数错误"})
    return
  }
  global._bapingStatus[barId] = 'close'
  res.json({iRet: 0})
})

module.exports = router
