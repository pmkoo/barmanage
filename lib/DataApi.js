const co = require('co')
const models = require('../models')
const moment = require('moment')
const {Bar, User, Message} = models
const toPlain = o => o.get({plain: true})
const svrconf = require('../config/svrconf.json')

// 通用数据接口
const DataApi = {

  m2exp: svrconf['m2exp'],

  /*
   * 获取全部酒吧列表
   * */
  getAllBars() {
    return new Promise((resolve, reject) => {
      models.Bar.findAll()
        .then(bars => resolve(bars.map(toPlain)))
        .catch(err => reject(err))
    })
  },

  /*
   * 获取某个酒吧最新的消息列表
   * @param obj {Object} 参数对象
   * @param obj.barId {string} 酒吧id
   * @param obj.lastMessageId {string} 客户端最后一条消息id
   * @return {Promise} 返回请求的promise对象
   * */
  getLatestMessages({barId, lastUpdated}) {
    return this.getMessages({
      BarId: barId,
      isPayed: true,
      updatedAt: {
        $gt: lastUpdated
      }
    })
  },

  /*
   * 获取某个酒吧的全部消息列表
   * @param barId {string} 酒吧id
   * @return {Promise} 返回请求的promise对象
   * */
  getAllMessages(barId) {
    return this.getMessages({
      BarId: barId,
      isPayed: true,
      createdAt: {
        $gt: moment().subtract('3', 'days')
      }
    })
  },

  /*
   * 根据条件获取消息列表
   * @param where {object} sequelize查询的where对象
   * @return {Promise} 返回请求的promise对象
   * */
  getMessages(where) {
    let me = this
    return co(function*() {
      var messages = yield Message.findAll({
        where: where
      })

      messages = messages.map(toPlain)

      if (messages.length < 1) {
        return messages
      }

      // 查询用户信息,合并返回
      var userIds = new Set()
      messages.forEach(message => userIds.add(message.UserId))

      // 去重
      var users = yield User.findAll({
        where: {
          id: Array.from(userIds)
        }
      })

      users = users.map(toPlain)

      var hash = {}
      users.forEach(user => hash[user.id] = user)
      messages.forEach(message => {
        var user = hash[message.UserId]
        message.UserAvatar = user.avatar
        message.UserName = user.name
        message.gender = user.gender
        let _lv = me.getLv(parseFloat(user.exp * parseFloat(svrconf['m2exp'])))
        message['lv'] = _lv['lv'] || 0
      })

      return messages
    })
  },

  /*
   * 获取某个酒吧的全部用户数据
   * @param barId {string} 酒吧id
   * @return {Promise} 返回请求的promise对象
   * */
  getAllUsersByBarId(barId) {
    return co(function*() {
      var messages = yield Message.findAll({
        where: {BarId: barId}
      })

      messages = messages.map(toPlain)

      var userIds = messages.map(o => o.UserId)
      var users = yield User.findAll({
        where: {
          id: userIds
        }
      })

      users = users.map(toPlain)

      return users
    })
  },

  /*
   * 向某酒吧发送一条消息
   * @param obj {Object} 参数对象
   * @param obj.barId {string} 酒吧id
   * @param obj.userId {string} 发消息的用户id
   * @param obj.message {string} 消息内容 可能是文字或者图片路径
   * @param obj.isPhoto {number} 是否图片类型
   * @return {Promise} 返回请求的promise对象
   * */
  addMessage({barId, userId, message, isPhoto}) {
    return Message.create({
      message: message,
      photo: isPhoto,
      UserId: userId,
      BarId: barId,
      time: new Date()
    })
  },

  /*
   * 批量删除消息
   * @param ids {array} 消息id数组
   * @return {Promise} 返回请求的promise对象
   * */
  delMessages(ids) {
    return new Promise((resolve, reject) => {
      Message
        .destroy({
          where: {id: ids}
        })
        .then(count => resolve(count))
        .catch(err => reject(err))
    })
  },

  //等级从0开始
  getLv: function (score) {
    let lvlist = svrconf['lvlist'] || [0]
    let lv = {}

    if (lvlist.length == 1 || score >= lvlist[lvlist.length - 1]) {
      lv['lv'] = lvlist.length - 1
      lv['down'] = 'Max'
      lv['up'] = 'Max'
      lv['cur'] = score
    }

    for (let i = 0; i < lvlist.length; i++) {
      if (score >= lvlist[i] && score < lvlist[i + 1]) {
        lv['lv'] = i
        lv['down'] = lvlist[i]
        lv['up'] = lvlist[i + 1]
        lv['cur'] = score
        break
      }
    }

    return lv
  }
}

// co(function*() {
// var bars = yield DataApi.getAllBars()
//
// console.log(bars)
//
// var users = yield DataApi.getAllUsersByBarId(2)
//
// console.log(users)
//
// var messages = yield DataApi.getAllMessagesByBarId(2)
//
// console.log(messages)
//
// var result = yield DataApi.addMessage({
//   barId: 4,
//   userId: 2,
//   message: 'FUCK YOU THIRD',
//   isPhoto: 0
// })
//
// console.log(result)

// var count = yield DataApi.delMessages([204, 205])
// console.log(count)
// })

module.exports = DataApi
