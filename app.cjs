// @ts-check
'use strict'

const fs = require('node:fs').promises
const path = require('node:path')
const { queue } = require('async')
const cli = require('cli').enable('status', 'version')
const packageJson = require('./package.json')

const OPTIONS = new Map([
  [
    'recursive',
    {
      alias: 'r',
      describe: 'Enable search recursive',
      defaultValue: false
    }
  ],
  [
    'startpath',
    {
      alias: 's',
      describe: 'Start path to search in',
      defaultValue: '.'
    }
  ]
])

if (packageJson) {
  cli.setApp(packageJson.name, packageJson.version)
}

cli.parse({
  recursive: [
    OPTIONS.get('recursive').alias,
    OPTIONS.get('recursive').describe
  ],
  startpath: [
    OPTIONS.get('startpath').alias,
    OPTIONS.get('startpath').describe,
    'string',
    OPTIONS.get('startpath').defaultValue
  ]
})

cli.main(async (arguments_, options) => {
  const startPath = path.resolve(options.startpath)
  const directoryQueue = queue(directoryWorker, 32)
  const urlRegex = /\.url$/i
  const contentRegex = /=(.*)/

  async function replaceFileContent (filePath) {
    cli.info(`Replacing: ${filePath}`)

    const fileContent = await fs.readFile(filePath, 'utf8')
    const fileContentMatch = fileContent.match(contentRegex)

    if (fileContentMatch) {
      const newFileName = filePath.replace(urlRegex, '.html')
      const newFileContent = `<HTML><HEAD><META HTTP-EQUIV="Refresh" CONTENT="0; URL=${fileContentMatch[1]}"></HEAD><BODY></BODY>`
      await Promise.all([
        fs.writeFile(newFileName, newFileContent, 'utf8'),
        fs.unlink(filePath)
      ])
    } else {
      cli.error(`No match found: [${fileContent}]`)
    }
  }

  async function directoryWorker (task) {
    try {
      const stats = await fs.stat(task.filePath)

      if (stats.isDirectory() && options.recursive) {
        const files = await fs.readdir(task.filePath)
        for (const fileName of files) {
          directoryQueue.push({
            filePath: path.join(task.filePath, fileName)
          })
        }
      } else if (stats.isFile() && urlRegex.test(task.filePath)) {
        await replaceFileContent(task.filePath)
      }
    } catch (error) {
      cli.error(`Error processing ${task.filePath}: ${error.message}`)
    }
  }

  cli.info(`Working in: ${process.cwd()}`)
  cli.info(`Searching in: ${startPath}`)

  directoryQueue.drain(() => {
    cli.info('All done !!!')
  })

  directoryQueue.push({ filePath: startPath })
})
