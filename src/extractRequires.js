var _ = require('lodash');

function isRequireVariableDeclarator(node) {
  if (node.type !== 'VariableDeclarator') {
    throw new Error('Invariant violation: must be type VariableDeclarator');
  }
  return node.init.type === 'CallExpression' &&
    node.init.callee.name === 'require' &&
    node.init.arguments.length === 1 &&
    node.init.arguments[0].type === 'Literal';
}

function isRequirePathDependent(node) {
  return node.init.arguments[0] && node.init.arguments[0].value[0] === '.';
}

function extractRequires(parsed) {
  return _.chain(parsed.body)
    .filter(function(node) { return node.type === 'VariableDeclaration' && node.kind === 'var'; })
    .map(_.property('declarations'))
    .flatten(/*shallow*/ true)
    .filter(isRequireVariableDeclarator)
    .filter(isRequirePathDependent)
    .value();
}

module.exports = extractRequires;
