fs = require 'fs'
path = require 'path'
glob = require 'glob'
gutil = require 'gulp-util'
through = require 'through2'

EOL = '\n'

module.exports = (opt = {}) ->
	targetDir = opt.targetDir
	throw new gutil.PluginError('gulp-backtrace', 'Please specify targetDir') if not targetDir
	inputFiles = []
	through.obj(
		(file, enc, next) ->
			return @emit 'error', new gutil.PluginError('gulp-backtrace', 'File can\'t be null') if file.isNull()
			return @emit 'error', new gutil.PluginError('gulp-backtrace', 'Streams not supported') if file.isStream()
			inputFiles.push path.relative(process.cwd(), file.path)
			next()
		(cb) ->
			if opt.log
				console.log 'Input files:'
				inputFiles.forEach (inputFile, i) ->
					console.log (i + 1) + '.\t' + inputFile
				console.log 'Output files:'
				outputCount = 0
			glob targetDir.replace(/\/$/, '') + '/**/**', (err, files) =>
				return @emit 'error', new gutil.PluginError('gulp-backtrace', err) if err
				files.forEach (filePath) =>
					filePathRelative = path.relative(targetDir, filePath)
					if not fs.statSync(filePath).isDirectory()
						inputFiles.forEach (inputFile) =>
							if inputFile is filePathRelative or path.extname(inputFile) is '.less' and gutil.replaceExtension(inputFile, '.css') is filePathRelative
								newFile = new gutil.File
									base: targetDir
									cwd: process.cwd()
									path: filePath
									contents: fs.readFileSync filePath
								@push newFile
								if opt.log
									console.log ++outputCount + '.\t' + filePathRelative
							else
								extname = path.extname filePath
								if extname in ['.html', '.js', '.css']
									content = fs.readFileSync(filePath).toString()
									if content.indexOf('trace:' + inputFile) isnt -1
										newFile = new gutil.File
											base: targetDir
											cwd: process.cwd()
											path: filePath
											contents: new Buffer content
										@push newFile
										if opt.log
											console.log ++outputCount + '.\t' + filePathRelative
				cb()
	)
