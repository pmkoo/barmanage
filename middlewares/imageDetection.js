/**
 * Created by Administrator on 2017/4/15.
 */
const ALY = require('aliyun-sdk')
/*
* 参考 https://help.aliyun.com/document_detail/28428.html?spm=5176.doc50199.6.553.Dg1qil 创建key和secret
* */
const accessKeyId = 'LTAIBnvDolNCwnuw'
const AccessKeySevcret = 'lAvBOp5JoFeb5NjhxVshbrOC3xXXlg'

const green = new ALY.GREEN({
  accessKeyId: accessKeyId,
  secretAccessKey: AccessKeySevcret,
  endpoint: 'http://green.cn-hangzhou.aliyuncs.com',
  apiVersion: '2016-12-16'
})

const HOST = 'https://jufoinfo.com/'

const imageDetection = (urls) => {
  const scenes = ['porn', 'ocr', 'illegal']

  return new Promise((resolve, reject) => {
    green.imageDetection({
      Async: true,
      ImageUrl: JSON.stringify(urls),
      Scene: JSON.stringify(scenes)
    }, function(err, data) {
      if (err) {
        console.log('error:', err)
        reject(err)
        return
      }

      var imageResults = data.ImageResults.ImageResult
      var taskIds = imageResults.map(item => item.TaskId)

      resolve(taskIds)
    })
  })
}

const imageResults = (taskIds) => {
  return new Promise((resolve, reject) => {
    green.imageResults({
      TaskId: JSON.stringify(taskIds)
    }, (err, data) => {
      if (err) {
        console.log('error:', err)
        reject(err)
      }

      if (data.Code !== 'Success') {
        console.log(data.Code)
        console.log(data.Msg)

        reject(new Error(data.Msg))
      }

      var imageDetectResults = data.ImageDetectResults.ImageDetectResult;
      var imageDetectResultItem = imageDetectResults[0] // 只有一张图

      var imageResult = imageDetectResultItem.ImageResult;
      var status = imageDetectResultItem.Status;

      if ("TaskProcessSuccess" != status) {
        reject()
        return
      }

      var imageUrl = imageResult.ImageName;
      var taskId = imageResult.TaskId;
      //获取结果
      var pornResult = imageResult.PornResult;
      var illegalResult = imageResult.IllegalResult;

      if (pornResult.Label == 0 && illegalResult.Label == 0) {
        resolve()

        return
      }

      reject()
    })
  })
}

module.exports = (req, res, next) => {
  var url = HOST + req.file.filename
  var urls = [url]

  imageDetection(urls)
    .then(taskIds => {
      return imageResults(taskIds)
    })
    .then(next)
    .catch(err => {
      res.json({
        iRet: -1,
        data: '非法内容'
      })
    })
}
