// @ts-check

'use strict'

const shortRecursiveOption = 'r'
const recursiveOption = {
  alias: 'recursive',
  describe: 'Enable search recursive',
  defaultValue: false
}

const shortStartPathOption = 's'
const startPathOption = {
  alias: 'startpath',
  describe: 'Start path to search in',
  defaultValue: '.'
}

const cli = require('cli').enable('status', 'version')
const packageJson = require('./package.json')

if (packageJson) {
  cli.setApp(packageJson.name, packageJson.version)
}

cli.parse({
  recursive: [shortRecursiveOption, recursiveOption.describe],
  startpath: [
    shortStartPathOption,
    startPathOption.describe,
    'string',
    startPathOption.defaultValue
  ]
})

cli.main((arguments_, options) => {
  const fs = require('node:fs')
  const path = require('node:path')
  const asyncQueue = require('async').queue

  const startPath = path.resolve(options.startpath)
  const directoryQueue = asyncQueue(directoryWorker, 32)

  function replaceFileContent (task) {
    cli.info(`Replacing:${task.filePath}`)

    const newFileName = task.filePath.replace(/\.url$/i, '.html')
    const fileContent = fs.readFileSync(task.filePath, 'utf8')
    const fileContentMatch = fileContent.match(/=(.*)/)

    if (fileContentMatch) {
      const newFileContent = `<HTML><HEAD><META HTTP-EQUIV="Refresh" CONTENT="0; URL=${fileContentMatch[1]}"></HEAD><BODY></BODY>`
      fs.writeFileSync(newFileName, newFileContent, 'utf8')
      fs.unlinkSync(task.filePath)
    } else {
      cli.error(`No match found: [${fileContent}]`)
    }
  }

  function directoryWorker (task, taskCallBack) {
    fs.stat(task.filePath, (statError, stats) => {
      if (statError) {
        return taskCallBack(statError)
      }

      if (stats.isDirectory()) {
        fs.readdir(task.filePath, (readDirError, readDirFiles) => {
          if (readDirError) {
            return taskCallBack(readDirError)
          }

          for (const fileName of readDirFiles) {
            directoryQueue.push({
              filePath: path.join(task.filePath, fileName)
            })
          }

          taskCallBack()
        })
      } else {
        if (stats.isFile() && /\.url$/i.test(task.filePath)) {
          replaceFileContent(task)
        }

        taskCallBack()
      }
    })
  }

  cli.info(`Working in: ${path.resolve(process.cwd())}`)
  cli.info(`Searching in: ${startPath}`)

  directoryQueue.drain(() => {
    cli.info('All done !!!')
  })

  directoryQueue.push({ filePath: startPath })
})
