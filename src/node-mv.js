#! /usr/bin/env node

var _ = require('lodash');
var esprima = require('esprima');
var fs = require('fs');
var parseArgs = require('minimist');
var path = require('path');
var util = require('util');

var extractRequires = require('./extractRequires');
var findJSFiles = require('./findJSFiles');
var nthLine = require('./nthLine');
var RequireDecl = require('./RequireDecl');
var spliceStr = require('./spliceStr');


function usage() {
  var doc =
    'Usage: node-mv file targetDir rootDir [--dry]\n\n' +
    '  file: the path corresponding to the JS module being moved\n' +
    '  targetDir: directory that file should be moved to\n' + 
    '  rootDir: directory to search for files in. Both file and targetDir\n' + 
    '      should be inside of rootDir\n' + 
    '  --dry: dry-run mode (default=false) If dry-run mode is activated, the transformation\n' +
    '      will be simulated, but no files will be written\n' +
    '  --no-backup: (default=false) If true, no .backup files will be created for those that\n' +
    '      are being deleted\n\n' +
    'NOTE: It is a very good idea to have a clean state in source control before using this tool in case something goes wrong\n';

  console.log(doc);
  process.exit();
}

function argError(msg) {
  console.log('ERROR: ' + msg + '\n');
  usage();
}


var args = parseArgs(
  process.argv.slice(2), 
  {boolean: ['dry', 'no-backup']}
);
if (args._.length !== 3) {
  usage();
}
var filePath = args._[0];
var targetDir = args._[1];
var rootDir = args._[2];
if (!fs.statSync(filePath).isFile()) {
  argError(util.format('File \'%s\' must be a file', filePath));
}
if (!fs.statSync(targetDir).isDirectory()) {
  argError(util.format('targetDir \'%s\' must be a directory', targetDir));
}
if (!fs.statSync(rootDir).isDirectory()) {
  argError(util.format('rootDir \'%s\' must be a directory', targetDir));
}
var dryRun = args.dry;
var makeBackup = !args['no-backup'];



function printUpdate(file, update) {
  console.log(file + ':' + update.line);
  console.log(util.format('  %s -> %s\n', update.oldVal, update.newVal));
}

function applyUpdate(file, update) {
  var content = fs.readFileSync(file);

  if (makeBackup) {
    // Make a backup of the file
    fs.writeFileSync(file + '.backup', content);
  }

  var str = content.toString();
  var lineData = nthLine(str, update.line);

  var loc = update.decl.init.arguments[0].loc;
  lineData.line = spliceStr(lineData.line, loc.start.column, loc.end.column - loc.start.column, "'" + update.newVal + "'");

  str = spliceStr(str, lineData.start, lineData.end - lineData.start, lineData.line);

  fs.writeFileSync(file, str);
}

var moduleName = path.basename(filePath, '.js');
var srcDir = path.resolve(path.dirname(filePath));
var pathShift = path.relative(path.dirname(filePath), targetDir);

findJSFiles(rootDir, function(files) {
  var updateMap = {};
  files.forEach(function(file) {
    var parsed = esprima.parse(fs.readFileSync(file), {loc: true});

    extractRequires(parsed).forEach(function(decl) {
      var module = RequireDecl.getModule(decl);
      if (moduleName !== path.basename(module)) {
        // This is not the module we are looking for.
        return;
      }
      var thisDir = path.dirname(file);
      if (srcDir !== path.resolve(path.join(thisDir, path.dirname(module)))) {
        // We could have multiple modules with the same name. Make sure this actually
        // resolves to the source directory.
        return;
      }

      var requireArg = decl.init.arguments[0];
      var newVal = path.join(path.dirname(requireArg.value), pathShift, moduleName);
      if (newVal[0] !== '.') {
        newVal = './' + newVal; // Make sure path is relative
      }
      updateMap[file] = {
        decl: decl,
        line: requireArg.loc.start.line,
        oldVal: requireArg.value,
        newVal: newVal + path.extname(requireArg.value),
      };      
    });
  });

  _.each(updateMap, function(update, file) {
    printUpdate(file, update);

    if (!dryRun) {
      applyUpdate(file, update);
    }
  });
});
