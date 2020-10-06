'use strict'
var shortRecursive = 'r'
var optionsRecursive = {
  alias: 'recursive',
  describe: 'Enable search recursive',
  defaultValue: false
}
var shortStartPath = 's'
var optionsStartPath = {
  alias: 'startpath',
  describe: 'Start path to search in',
  defaultValue: '.'
}
var cli = require('cli')
  .enable('status', 'version')
var packageJson = require('./package.json')
if (packageJson) {
  cli.setApp(packageJson.name, packageJson.version)
}
cli.parse({
  recursive: [shortRecursive, optionsRecursive.describe],
  startpath: [shortStartPath, optionsStartPath.describe, 'string', optionsStartPath.defaultValue]
})
cli.main(function (aArgs, aOptions) {
  var fs = require('fs')
  var path = require('path')
  var async = require('async')
  var lStartPath = path.resolve(aOptions.startpath)
  var lDirectoryQueue

  function lDirectoryWorker (aTask, aTaskCallBack) {
    fs.stat(aTask.path, function (aStatError, aStats) {
      if (aStatError) {
        aTaskCallBack(aStatError)
      } else if (aStats.isDirectory()) {
        // cli.info('Processing :' + aTask.path);
        fs.readdir(aTask.path, function (aReadDirError, aReadDirFiles) {
          if (!aReadDirError) {
            aReadDirFiles.forEach(function (aReadDirFile) {
              lDirectoryQueue.push({
                path: path.join(aTask.path, aReadDirFile)
              })
            })
          }
          aTaskCallBack(aReadDirError)
        })
      } else {
        if (aStats.isFile() && aTask.path.match(/\.[uU][rR][lL]$/)) {
          cli.info('Replacing:' + aTask.path)
          var lNewFileName = aTask.path.match(/(.*)\.[uU][rR][lL]$/)[1] + '.html'
          var lFileContent = fs.readFileSync(aTask.path, 'utf8')
          var lFileContentMatch = lFileContent.match(/=(.*)/)
          var lNewFileContentTemplate = '<HTML><HEAD><META HTTP-EQUIV="Refresh" CONTENT="0; URL=XXX"></HEAD><BODY></BODY>'
          var lNewFileContent = ''
          if (lFileContentMatch) {
            lNewFileContent = lNewFileContentTemplate.replace('XXX', lFileContentMatch[1])
            fs.writeFileSync(lNewFileName, lNewFileContent, 'utf8')
            fs.unlinkSync(aTask.path)
          } else {
            cli.error('No match found: [' + lFileContent + ']')
          }
        }
        aTaskCallBack()
      }
    })
  }
  cli.info('Working in: ' + path.resolve(process.cwd()))
  cli.info('Searching in: ' + lStartPath)
  lDirectoryQueue = async.queue(lDirectoryWorker, 32)
  lDirectoryQueue.drain(function () {
    cli.info('All done !!!')
  })
  lDirectoryQueue.push({
    path: lStartPath
  })
})
