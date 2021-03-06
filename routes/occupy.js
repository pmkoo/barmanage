/**
 * Created by 99171 on 2017/1/17.
 */
const express = require('express')
const router = express.Router()
const models = require('../models')
const auth = require('../middlewares/auth')
const co = require('co')

global._bapingStatus = global._bapingStatus || {}

router.get('/', auth, (req, res, next) => {
  co(function*() {
    var BarId = res.locals.barInfo.id
    var data = yield models.BarPrice.findAll({
      where: {
        BarId
      }
    })

    data = data.map(row => row.get({ plain: true }))

    res.render('occupy', {
      rows: data,
      barInfo: res.locals.barInfo,
      screeStatus: global._bapingStatus[BarId] || "close"
    })
  })
})


//关闭大屏幕
router.get('/closeScreen', auth, (req, res, next) => {
  var BarId = res.locals.barInfo.id
  co(function*() {
    var BarId = res.locals.barInfo.id
    var barCount = yield models.BarPrice.count({
      where: {
        BarId
      }
    })

    if (barCount > 0) {
      global._bapingStatus[BarId] = "close"
      res.json({iRet:0})
    } else{
      res.json({iRet:-1, msg:`酒吧Id:${BarId}不存在`})
    }
  })
})

router.post('/deleteOccupy', (req, res) => {
  console.log('id:', req.body.id)

  models.BarPrice.destroy({
    where: {
      id: req.body.id
    }
  }).then(deleteCount => {
    res.json({
      iRet: 0,
      deleteCount: deleteCount
    })
  })
})

router.post('/addRow', (req, res) => {
  const { seconds, price, BarId } = req.body

  co(function*() {
    var created = yield models.BarPrice.create({
      seconds, price, BarId
    })

    var created = created.get({plain: true})

    // console.log('create success', created)

    res.json({
      iRet: 0,
      created
    })
  })
})

router.post('/updateRow', (req, res) => {
  const { seconds, price, id } = req.body

  models.BarPrice.update({
    seconds,
    price
  }, {
    where: {
      id: id
    }
  }).then(result => {
    console.log(result)

    res.json({
      iRet: 0,
      result
    })
  })
})

module.exports = router
