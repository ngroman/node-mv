module.exports = function nthLine(str, n) {
  var start = 0;
  for (var i = 1; i < n; ++i) { // Indexed from 1
    start = str.indexOf('\n', start);
    start++;
  }
  var end = str.indexOf('\n', start);
  return {
  	start: start,
  	end: end,
  	line: str.substr(start, end - start),
  };
};
