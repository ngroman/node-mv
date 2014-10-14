var findit = require('findit');

module.exports = function findJSFiles(rootDir, callback) {
  var res = [];
  var finder = findit(rootDir);

  finder.on('directory', function(dir, stat, stop) {
    if (dir.indexOf('node_modules') !== -1) {
      // Do not traverse into any node_modules directories. This is a recipe for pain.
      stop();
    }
  });

  finder.on('file', function(file, state) {
    if (!file.match(/\.js$/)) {
      return;
    }
    res.push(file);
  });

  finder.on('end', function() {
    callback(res);
  });
};
