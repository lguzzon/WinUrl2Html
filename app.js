// @ts-check

'use strict'

const shortRecursive = 'r'
const optionsRecursive = {
  alias: 'recursive',
  describe: 'Enable search recursive',
  defaultValue: false
}
const shortStartPath = 's'
const optionsStartPath = {
  alias: 'startpath',
  describe: 'Start path to search in',
  defaultValue: '.'
}
const cli = require('cli')
  .enable('status', 'version')
// @ts-ignore
const packageJson = require('./package.json')
if (packageJson) {
  cli.setApp(packageJson.name, packageJson.version)
}
cli.parse({
  recursive: [shortRecursive, optionsRecursive.describe],
  startpath: [shortStartPath, optionsStartPath.describe, 'string', optionsStartPath.defaultValue]
})
cli.main(function (aArgs, aOptions) {
  const lFs = require('fs')
  const lPath = require('path')
  const lAsync = require('async')
  const lStartPath = lPath.resolve(aOptions.startpath)
  const lDirectoryQueue = lAsync.queue(lDirectoryWorker, 32)

  function lReplaceFileContent (aTask) {
    cli.info('Replacing:' + aTask.path)
    const lNewFileName = aTask.path.match(/(.*)\.[uU][rR][lL]$/)[1] + '.html'
    const lFileContent = lFs.readFileSync(aTask.path, 'utf8')
    const lFileContentMatch = lFileContent.match(/=(.*)/)
    const lNewFileContentTemplate = '<HTML><HEAD><META HTTP-EQUIV="Refresh" CONTENT="0; URL=XXX"></HEAD><BODY></BODY>'
    let lNewFileContent = ''
    if (lFileContentMatch) {
      lNewFileContent = lNewFileContentTemplate.replace('XXX', lFileContentMatch[1])
      lFs.writeFileSync(lNewFileName, lNewFileContent, 'utf8')
      lFs.unlinkSync(aTask.path)
    } else {
      cli.error('No match found: [' + lFileContent + ']')
    }
  }

  function lDirectoryWorker (aTask, aTaskCallBack) {
    lFs.stat(aTask.path, function (aStatError, aStats) {
      if (aStatError) {
        aTaskCallBack(aStatError)
      } else if (aStats.isDirectory()) {
        // cli.info('Processing :' + aTask.path);
        lFs.readdir(aTask.path, function (aReadDirError, aReadDirFiles) {
          if (!aReadDirError) {
            aReadDirFiles.forEach(function (aReadDirFile) {
              lDirectoryQueue.push({
                path: lPath.join(aTask.path, aReadDirFile)
              })
            })
          }
          aTaskCallBack(aReadDirError)
        })
      } else {
        if (aStats.isFile() && aTask.path.match(/\.[uU][rR][lL]$/)) {
          lReplaceFileContent(aTask)
        }
        aTaskCallBack()
      }
    })
  }
  cli.info('Working in: ' + lPath.resolve(process.cwd()))
  cli.info('Searching in: ' + lStartPath)
  lDirectoryQueue.drain(function () {
    cli.info('All done !!!')
  })
  lDirectoryQueue.push({
    path: lStartPath
  })
})
