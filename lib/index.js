(function() {
  var EOL, fs, glob, gutil, path, through;

  fs = require('fs');

  path = require('path');

  glob = require('glob');

  gutil = require('gulp-util');

  through = require('through2');

  EOL = '\n';

  module.exports = function(opt) {
    var inputFiles, targetDir;
    if (opt == null) {
      opt = {};
    }
    targetDir = opt.targetDir;
    if (!targetDir) {
      throw new gutil.PluginError('gulp-backtrace', 'Please specify targetDir');
    }
    inputFiles = [];
    return through.obj(function(file, enc, next) {
      if (file.isNull()) {
        return this.emit('error', new gutil.PluginError('gulp-backtrace', 'File can\'t be null'));
      }
      if (file.isStream()) {
        return this.emit('error', new gutil.PluginError('gulp-backtrace', 'Streams not supported'));
      }
      inputFiles.push(path.relative(process.cwd(), file.path));
      return next();
    }, function(cb) {
      var outputCount;
      if (opt.log) {
        console.log('Input files:');
        inputFiles.forEach(function(inputFile, i) {
          return console.log((i + 1) + '.\t' + inputFile);
        });
        console.log('Output files:');
        outputCount = 0;
      }
      return glob(targetDir.replace(/\/$/, '') + '/**/**', (function(_this) {
        return function(err, files) {
          if (err) {
            return _this.emit('error', new gutil.PluginError('gulp-backtrace', err));
          }
          files.forEach(function(filePath) {
            var filePathRelative;
            filePathRelative = path.relative(targetDir, filePath);
            if (!fs.statSync(filePath).isDirectory()) {
              return inputFiles.forEach(function(inputFile) {
                var content, extname, newFile;
                if (inputFile === filePathRelative || path.extname(inputFile) === '.less' && gutil.replaceExtension(inputFile, '.css') === filePathRelative) {
                  newFile = new gutil.File({
                    base: targetDir,
                    cwd: process.cwd(),
                    path: filePath,
                    contents: fs.readFileSync(filePath)
                  });
                  _this.push(newFile);
                  if (opt.log) {
                    return console.log(++outputCount + '.\t' + filePathRelative);
                  }
                } else {
                  extname = path.extname(filePath);
                  if (extname === '.html' || extname === '.js' || extname === '.css') {
                    content = fs.readFileSync(filePath).toString();
                    if (content.indexOf('trace:' + inputFile) !== -1) {
                      newFile = new gutil.File({
                        base: targetDir,
                        cwd: process.cwd(),
                        path: filePath,
                        contents: new Buffer(content)
                      });
                      _this.push(newFile);
                      if (opt.log) {
                        return console.log(++outputCount + '.\t' + filePathRelative);
                      }
                    }
                  }
                }
              });
            }
          });
          return cb();
        };
      })(this));
    });
  };

}).call(this);
