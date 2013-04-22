'use strict';

var shortRecursive = 'r',
    optionsRecursive = {
        alias: 'recursive',
        describe: 'Enable search recursive',
        defaultValue: false
    },
    shortStartPath = 's',
    optionsStartPath = {
        alias: 'startpath',
        describe: 'Start path to search in',
        defaultValue: '.'
    },
    cli = require('cli').enable('status', 'version'),
    packageJson = require('./package.json');

if (packageJson) {
    cli.setApp(packageJson.name, packageJson.version);
}

cli.parse({
    recursive: [shortRecursive, optionsRecursive.describe],
    startpath: [shortStartPath, optionsStartPath.describe, 'string', optionsStartPath.defaultValue]
});

cli.main(function (aArgs, aOptions) {
    var fs = require('fs'),
        path = require('path'),
        async = require('async'),
        lStartPath = path.resolve(aOptions.startpath),
        lDirectoryQueue;

    function lDirectoryWorker(aTask, aTaskCallBack) {
        fs.stat(aTask.path, function (aStatError, aStats) {
            if (aStatError) {
                aTaskCallBack(aStatError);
            } else if (aStats.isDirectory()) {
                //cli.info('Processing :' + aTask.path);
                fs.readdir(aTask.path, function (aReadDirError, aReadDirFiles) {
                    if (!aReadDirError) {
                        aReadDirFiles.forEach(function (aReadDirFile) {
                            lDirectoryQueue.push({path: path.join(aTask.path, aReadDirFile)});
                        });
                    }
                    aTaskCallBack(aReadDirError);
                });
            } else {
                if (aStats.isFile() && aTask.path.match(/\.[uU][rR][lL]$/)) {
                    cli.info('Replacing:' + aTask.path);
                    var lNewFileName = aTask.path.match(/(.*)\.[uU][rR][lL]$/)[1] + '.html',
                        lURL = fs.readFileSync(aTask.path, 'utf8').match(/=(.*)/)[1],
                        lNewContent = '<HTML><HEAD><META HTTP-EQUIV="Refresh" CONTENT="0; URL=XXX"></HEAD><BODY></BODY>'.replace('XXX', lURL);
                    fs.writeFileSync(lNewFileName, lNewContent, 'utf8');
                    fs.unlinkSync(aTask.path);
                }
                aTaskCallBack();
            }
        });
    };

    cli.info('Working in: ' + path.resolve(process.cwd()));
    cli.info('Searching in: ' + lStartPath);
    lDirectoryQueue = async.queue(lDirectoryWorker, 32);
    lDirectoryQueue.push({path: lStartPath});
});
