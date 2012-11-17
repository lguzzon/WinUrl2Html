(function () {
	'use strict';

	var shortHelp = 'h',
		optionsHelp = {
			alias: 'help',
			describe: 'Show this help',
			defaultValue: false
		},
		shortRecursive = 'r',
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

	cli.main(function (args, options) {
		var shell = require('shelljs'),
			path = require('path'),
			lsOptions = options.recursive ? '-R' : null,
			lsStartPath = path.normalize(path.join(options.startpath, '*')),
			filenames = lsOptions ? shell.ls(lsOptions, lsStartPath) : shell.ls(lsStartPath),
			filteredFilenames = filenames.filter(function (file) {
				return file.match(/\.url$/);
			}),
			filename = "",
			filteredFilenamesLength = filteredFilenames.length;
		this.info('Working in: ' + shell.pwd());
		this.debug(lsOptions);
		this.info('Searching in: ' + lsStartPath);
		for (var i = filteredFilenamesLength - 1; i >= 0; i--) {
			cli.progress((filteredFilenamesLength - i) / filteredFilenamesLength);
			filename = filteredFilenames[i];
			this.info('Replacing:' + filename);
			var newHtmfilename = filename.match(/(.*)\.url$/)[1] + '.html',
				url = shell.cat(filename).match(/=(.*)/)[1];
			'<HTML><HEAD><META HTTP-EQUIV="Refresh" CONTENT="0; URL=XXX"></HEAD><BODY></BODY>'.replace('XXX', url).to(newHtmfilename);
			shell.rm(filename);
		};
	});
}());